import {
  DraggableId,
  FluidDragActions,
  PreDragActions,
  SensorAPI,
} from "@hello-pangea/dnd";
import { Position } from "css-box-model";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

const supportedPageVisibilityEventName: string = ((): string => {
  const base = "visibilitychange";

  if (typeof document === "undefined") {
    return base;
  }

  const candidates: string[] = [
    base,
    `ms${base}`,
    `webkit${base}`,
    `moz${base}`,
    `o${base}`,
  ];

  const supported: string | undefined = find(
    candidates,
    (eventName: string): boolean => `on${eventName}` in document,
  );

  return supported || base;
})();

function getWindowBindings({
  cancel,
  getPhase,
}: GetBindingArgs): EventBinding[] {
  return [
    {
      eventName: "orientationchange" as keyof HTMLElementEventMap,
      fn: cancel,
    },
    {
      eventName: "resize",
      fn: cancel,
    },
    {
      eventName: "contextmenu",
      fn: (event: Event) => {
        event.preventDefault();
      },
    },
    {
      eventName: "keydown",
      fn: (event: KeyboardEvent) => {
        if (getPhase().type !== "DRAGGING") {
          cancel();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
        }
        cancel();
      },
    },
    {
      eventName: supportedPageVisibilityEventName as keyof HTMLElementEventMap,
      fn: cancel,
    },
  ];
}

type PredicateFn<T> = (value: T) => boolean;

function findIndex<T>(list: T[], predicate: PredicateFn<T>): number {
  if (list.findIndex) {
    return list.findIndex(predicate);
  }

  // Using a for loop so that we can exit early
  for (let i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return i;
    }
  }
  return -1;
}

function find<T>(list: T[], predicate: PredicateFn<T>): T | undefined {
  if (list.find) {
    return list.find(predicate);
  }
  const index: number = findIndex(list, predicate);
  if (index !== -1) {
    return list[index];
  }
  return undefined;
}

type TouchWithForce = Touch & {
  force: number;
};

function getHandleBindings({
  cancel,
  completed,
  getPhase,
}: GetBindingArgs): EventBinding[] {
  return [
    {
      eventName: "touchmove",
      options: { capture: false },
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        if (phase.type !== "DRAGGING") {
          cancel();
          return;
        }

        phase.hasMoved = true;

        const { clientX, clientY } = event.touches[0];

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        event.preventDefault();
        phase.actions.move(point);
      },
    },
    {
      eventName: "touchend",
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();
        if (phase.type !== "DRAGGING") {
          cancel();
          return;
        }
        event.preventDefault();
        phase.actions.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: "touchcancel",
      fn: (event: TouchEvent) => {
        if (getPhase().type !== "DRAGGING") {
          cancel();
          return;
        }
        event.preventDefault();
        cancel();
      },
    },
    {
      eventName: "touchforcechange" as keyof HTMLElementEventMap,
      fn: (event: TouchEvent) => {
        const phase: Phase = getPhase();

        if (phase.type === "IDLE") {
          throw Error("invariant");
        }

        const touch: TouchWithForce = event.touches[0] as TouchWithForce;

        if (!touch) {
          return;
        }

        const isForcePress: boolean = touch.force >= forcePressThreshold;

        if (!isForcePress) {
          return;
        }

        const shouldRespect: boolean = phase.actions.shouldRespectForcePress();

        if (phase.type === "PENDING") {
          if (shouldRespect) {
            cancel();
          }
          return;
        }
        if (shouldRespect) {
          if (phase.hasMoved) {
            event.preventDefault();
            return;
          }
          cancel();
          return;
        }
        event.preventDefault();
      },
    },
    {
      eventName: supportedPageVisibilityEventName as keyof HTMLElementEventMap,
      fn: cancel,
    },
  ];
}

type NewType = (
  event: KeyboardEvent & TouchEvent & EventListenerOrEventListenerObject,
) => void;

type EventBinding = {
  eventName: keyof HTMLElementEventMap;
  fn: NewType;
  options?: EventOptions;
};

type EventOptions = {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
};

type UnbindFn = () => void;

function getOptions(
  shared?: EventOptions,
  fromBinding?: EventOptions,
): EventOptions {
  return {
    ...shared,
    ...fromBinding,
  };
}

function bindEvents(
  el: HTMLElement | Window,
  bindings: EventBinding[],
  sharedOptions?: EventOptions,
) {
  const unbindings: UnbindFn[] = bindings.map(
    (binding: EventBinding): UnbindFn => {
      const options = getOptions(sharedOptions, binding.options);

      el.addEventListener(
        binding.eventName,
        binding.fn as EventListenerOrEventListenerObject,
        options,
      );

      return function unbind() {
        el.removeEventListener(
          binding.eventName,
          binding.fn as EventListenerOrEventListenerObject,
          options,
        );
      };
    },
  );

  return function unbindAll() {
    unbindings.forEach((unbind: UnbindFn) => {
      unbind();
    });
  };
}

type Idle = {
  type: "IDLE";
};

type Pending = {
  type: "PENDING";
  point: Position;
  actions: PreDragActions;
  longPressTimerId: NodeJS.Timeout;
};

type Dragging = {
  type: "DRAGGING";
  actions: FluidDragActions;
  hasMoved: boolean;
};

type GetBindingArgs = {
  cancel: () => void;
  completed: () => void;
  getPhase: () => Phase;
};

const idle: Idle = { type: "IDLE" };
type Phase = Idle | Pending | Dragging;

export const timeForLongPress = 120;
export const forcePressThreshold = 0.15;

export const useCustomTouchSensor = (api: SensorAPI) => {
  const phaseRef = useRef<Phase>(idle);
  const unbindEventsRef = useRef<() => void>(() => null);

  const getPhase = useCallback(function getPhase(): Phase {
    return phaseRef.current;
  }, []);

  const setPhase = useCallback(function setPhase(phase: Phase) {
    phaseRef.current = phase;
  }, []);

  const startCaptureBinding = useMemo(
    () => ({
      eventName: "touchstart" as keyof HTMLElementEventMap,
      fn: function onTouchStart(event: TouchEvent) {
        if (event.defaultPrevented) {
          return;
        }

        const draggableId: DraggableId | null =
          api.findClosestDraggableId(event);
        if (!draggableId) {
          return;
        }

        const actions: PreDragActions | null = api.tryGetLock(
          draggableId,
          // eslint-disable-next-line no-use-before-define
          stop,
          { sourceEvent: event },
        );
        if (!actions) {
          return;
        }

        const touch: Touch = event.touches[0];
        const { clientX, clientY } = touch;
        const point: Position = {
          x: clientX,
          y: clientY,
        };

        const dragHandleId = api.findClosestDraggableId(event);
        if (!dragHandleId) {
          throw Error("Custom sensor unable to find drag dragHandleId");
        }
        const handle: HTMLElement | null = document.querySelector(
          `[data-rfd-drag-handle-draggable-id='${dragHandleId}']`,
        );
        if (!handle) {
          throw Error("Touch sensor unable to find drag handle");
        }

        unbindEventsRef.current();
        startPendingDrag(actions, point, handle);
      },
    }),
    [api],
  );

  const listenForCapture = useCallback(
    function listenForCapture() {
      const options = {
        capture: true,
        passive: false,
      };

      unbindEventsRef.current = bindEvents(
        window,
        [startCaptureBinding],
        options,
      );
    },
    [startCaptureBinding],
  );

  const stop = useCallback(() => {
    const { current } = phaseRef;
    if (current.type === "IDLE") {
      return;
    }

    if (current.type === "PENDING") {
      clearTimeout(current.longPressTimerId);
    }

    setPhase(idle);
    unbindEventsRef.current();

    listenForCapture();
  }, [listenForCapture, setPhase]);

  const cancel = useCallback(() => {
    const phase: Phase = phaseRef.current;
    stop();
    if (phase.type === "DRAGGING") {
      phase.actions.cancel({ shouldBlockNextClick: true });
    }
    if (phase.type === "PENDING") {
      phase.actions.abort();
    }
  }, [stop]);

  const bindCapturingEvents = useCallback(
    (target: HTMLElement) => {
      const options = { capture: true, passive: false };
      const args: GetBindingArgs = {
        cancel,
        completed: stop,
        getPhase,
      };

      const unbindTarget = bindEvents(target, getHandleBindings(args), options);
      const unbindTargetWindow = bindEvents(
        window,
        getHandleBindings(args),
        options,
      );
      const unbindWindow = bindEvents(window, getWindowBindings(args), options);

      unbindEventsRef.current = function unbindAll() {
        unbindTarget();
        unbindTargetWindow();
        unbindWindow();
      };
    },
    [cancel, getPhase, stop],
  );

  const startDragging = useCallback(() => {
    const phase: Phase = getPhase();
    if (phase.type !== "PENDING") {
      throw Error(`Cannot start dragging from phase ${phase.type}`);
    }

    const actions: FluidDragActions = phase.actions.fluidLift(phase.point);
    setPhase({
      type: "DRAGGING",
      actions,
      hasMoved: false,
    });
  }, [getPhase, setPhase]);

  const startPendingDrag = useCallback(
    (actions: PreDragActions, point: Position, target: HTMLElement) => {
      if (getPhase().type !== "IDLE") {
        throw Error("Expected to move from IDLE to PENDING drag");
      }

      const longPressTimerId = setTimeout(startDragging, timeForLongPress);
      setPhase({
        type: "PENDING",
        point,
        actions,
        longPressTimerId,
      });

      bindCapturingEvents(target);
    },
    [bindCapturingEvents, getPhase, setPhase, startDragging],
  );

  useLayoutEffect(
    function mount() {
      listenForCapture();

      return function unmount() {
        unbindEventsRef.current();
        const phase: Phase = getPhase();
        if (phase.type === "PENDING") {
          clearTimeout(phase.longPressTimerId);
          setPhase(idle);
        }
      };
    },
    [getPhase, listenForCapture, setPhase],
  );

  useLayoutEffect(function webkitHack() {
    const unbind = bindEvents(window, [
      {
        eventName: "touchmove",
        fn: () => {
          return;
        },
        options: { capture: false, passive: false },
      },
    ]);

    return unbind;
  }, []);
};
