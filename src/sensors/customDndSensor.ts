import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  DraggableId,
  FluidDragActions,
  PreDragActions,
  SensorAPI,
} from "@hello-pangea/dnd";
import { Position } from "css-box-model";
import {
  AnyEventBinding,
  EventBinding,
  EventOptions,
  MouseEventBinding,
} from "./event-types";
import * as keyCodes from './key-codes';
import invariant from "tiny-invariant";

interface Idle {
  type: "IDLE";
}

interface Pending {
  type: "PENDING";
  point: Position;
  actions: PreDragActions;
}

interface Dragging {
  type: "DRAGGING";
  actions: FluidDragActions;
}

type Phase = Idle | Pending | Dragging;

const idle: Idle = { type: "IDLE" };

interface GetCaptureArgs {
  cancel: () => void;
  completed: () => void;
  getPhase: () => Phase;
  setPhase: (phase: Phase) => void;
}

function isSloppyClickThresholdExceeded(
  original: Position,
  current: Position,
): boolean {
  return (
    Math.abs(current.x - original.x) >= sloppyClickThreshold ||
    Math.abs(current.y - original.y) >= sloppyClickThreshold
  );
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
export const primaryButton = 0;
export const sloppyClickThreshold = 5;

function getCaptureBindings({
  cancel,
  completed,
  getPhase,
  setPhase,
}: GetCaptureArgs): AnyEventBinding[] {
  return [
    {
      eventName: "pointermove" as keyof HTMLElementEventMap,
      fn: (event: PointerEvent) => {
        const { button, clientX, clientY } = event;
        if (button !== primaryButton) {
          return;
        }

        const point: Position = {
          x: clientX,
          y: clientY,
        };

        const phase: Phase = getPhase();

        // Already dragging
        if (phase.type === "DRAGGING") {
          // preventing default as we are using this event
          event.preventDefault();
          phase.actions.move(point);
          return;
        }

        // There should be a pending drag at this point
        invariant(phase.type === "PENDING", "Cannot be IDLE");
        const pending: Position = phase.point;

        // threshold not yet exceeded
        if (!isSloppyClickThresholdExceeded(pending, point)) {
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();

        // Lifting at the current point to prevent the draggable item from
        // jumping by the sloppyClickThreshold
        const actions: FluidDragActions = phase.actions.fluidLift(point);

        setPhase({
          type: "DRAGGING",
          actions,
        });
      },
    },
    {
      eventName: "mouseup",
      fn: (event: MouseEvent) => {
        const phase: Phase = getPhase();

        if (phase.type !== "DRAGGING") {
          cancel();
          return;
        }

        // preventing default as we are using this event
        event.preventDefault();
        phase.actions.drop({ shouldBlockNextClick: true });
        completed();
      },
    },
    {
      eventName: "mousedown",
      fn: (event: MouseEvent) => {
        // this can happen during a drag when the user clicks a button
        // other than the primary mouse button
        if (getPhase().type === "DRAGGING") {
          event.preventDefault();
        }

        cancel();
      },
    },
    {
      eventName: "keydown",
      fn: (event: KeyboardEvent) => {
        const phase: Phase = getPhase();
        // Abort if any keystrokes while a drag is pending
        if (phase.type === "PENDING") {
          cancel();
          return;
        }

        // cancelling a drag
        if (event.keyCode === keyCodes.escape) {
          event.preventDefault();
          cancel();
          return;
        }

        preventStandardKeyEvents(event);
      },
    },
    {
      eventName: "resize",
      fn: cancel,
    },
    {
      eventName: "scroll",
      // kill a pending drag if there is a window scroll
      options: { passive: true, capture: false },
      fn: () => {
        if (getPhase().type === "PENDING") {
          cancel();
        }
      },
    },

    // Need to opt out of dragging if the user is a force press
    // Only for safari which has decided to introduce its own custom way of doing things
    // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
    {
      eventName: "webkitmouseforcedown",
      // it is considered a indirect cancel so we do not
      // prevent default in any situation.
      fn: (event: Event) => {
        const phase: Phase = getPhase();
        invariant(phase.type !== "IDLE", "Unexpected phase");

        if (phase.actions.shouldRespectForcePress()) {
          cancel();
          return;
        }

        // This technically doesn't do anything.
        // It won't do anything if `webkitmouseforcewillbegin` is prevented.
        // But it is a good signal that we want to opt out of this

        event.preventDefault();
      },
    },
    // Cancel on page visibility change
    {
      eventName: supportedPageVisibilityEventName,
      fn: cancel,
    },
  ];
}

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
