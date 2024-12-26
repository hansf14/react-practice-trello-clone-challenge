import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  DraggableId,
  FluidDragActions,
  PreDragActions,
  SensorAPI,
} from "@hello-pangea/dnd";
import { Position } from "css-box-model";
import invariant from "tiny-invariant";
import {
  AnyEventBinding,
  EventBinding,
  EventOptions,
  PointerEventBinding,
} from "./event-types";
import * as keyCodes from "./key-codes";
import preventStandardKeyEvents from "./prevent-standard-key-events";
import { supportedEventName as supportedPageVisibilityEventName } from "./supported-page-visibility-event-name";
import { DraggableOptions } from "./types";
import bindEvents from "./bind-events";
import { useDeviceDetector } from "@/hooks/useDeviceDetector";
import { CurrentActiveCustomAttributesKvMapping } from "@/components/BoardContext";

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

export const useCustomDndSensor = (api: SensorAPI) => {
  const phaseRef = useRef<Phase>(idle);
  const unbindEventsRef = useRef<() => void>(() => null);

  const { getDeviceDetector } = useDeviceDetector();
  const { getIsTouchDevice } = getDeviceDetector();

  const startCaptureBinding: PointerEventBinding = useMemo(
    () => ({
      eventName: "pointerdown" as keyof HTMLElementEventMap,
      fn: function onPointerDown(event: PointerEvent) {
        // Event already used
        if (event.defaultPrevented) {
          return;
        }

        // TODO: touch device
        // only starting a drag if dragging with the primary mouse button
        // if (!getIsTouchDevice() && event.button !== primaryButton) {
        //   return;
        // }

        // Do not start a drag if any modifier key is pressed
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          return;
        }

        const draggableId: DraggableId | null =
          api.findClosestDraggableId(event);

        if (!draggableId) {
          return;
        }

        const actions: PreDragActions | null = api.tryGetLock(
          draggableId,
          // stop is defined later
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          stop,
          { sourceEvent: event },
        );

        if (!actions) {
          return;
        }

        // consuming the event
        event.preventDefault();

        const point: Position = {
          x: event.clientX,
          y: event.clientY,
        };

        // unbind this listener
        unbindEventsRef.current();
        // using this function before it is defined as their is a circular usage pattern
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        startPendingDrag(actions, point);
      },
    }),
    // not including startPendingDrag as it is not defined initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api],
  );

  const getCaptureBindings = useCallback(
    ({
      cancel,
      completed,
      getPhase,
      setPhase,
    }: GetCaptureArgs): AnyEventBinding[] => {
      return [
        {
          eventName: "pointermove" as keyof HTMLElementEventMap,
          fn: (event: PointerEvent) => {
            const { button, clientX, clientY } = event;
            // TODO: touch device
            // if (!getIsTouchDevice() && button !== primaryButton) {
            //   return;
            // }

            const point: Position = {
              x: clientX,
              y: clientY,
            };

            const phase: Phase = getPhase();

            // Already dragging
            if (phase.type === "DRAGGING") {
              // preventing default as we are using this event
              event.preventDefault();

              // const attrIsCurrentActiveScrollContainer =
              //   CurrentActiveCustomAttributesKvMapping[
              //     "data-active-scroll-container"
              //   ];
              // const scrollContainer = document.querySelector(
              //   `[${attrIsCurrentActiveScrollContainer}="true"]`,
              // );
              // if (!scrollContainer) {
              //   // fallback
              //   phase.actions.move(point);
              //   return;
              // }

              // Option A: Convert the pointer to "container local" coords, then add scroll offset
              // So: (relative pointer) + (container scroll)
              // This is one pattern:
              // const rect = scrollContainer.getBoundingClientRect();
              // const offsetX = clientX - rect.left + scrollContainer.scrollLeft;
              // const offsetY = clientY - rect.top + scrollContainer.scrollTop;

              // const offsetX = clientX; //+ scrollContainer.scrollLeft;
              // const offsetY = clientY; //+ scrollContainer.scrollTop;


              const offsetX = event.pageX;
              const offsetY = event.pageY;

              // Now pass that offset to the library
              phase.actions.move({ x: offsetX, y: offsetY });
              
              return;
            }

            // Must be PENDING
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
          eventName: "pointerup" as keyof HTMLElementEventMap,
          fn: (event: PointerEvent) => {
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
          eventName: "pointerdown" as keyof HTMLElementEventMap,
          fn: (event: PointerEvent) => {
            // this can happen during a drag when the user clicks a button
            // other than the primary mouse button
            if (getPhase().type === "DRAGGING") {
              event.preventDefault();
            }

            cancel();
          },
        },
        {
          eventName: "keydown" as keyof HTMLElementEventMap,
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
          eventName: "resize" as keyof HTMLElementEventMap,
          fn: cancel,
        },
        {
          eventName: "scroll" as keyof HTMLElementEventMap,
          // kill a pending drag if there is a window scroll
          options: { passive: true, capture: false },
          // options: { passive: true, capture: false },
          fn: (event: UIEvent) => {
            // const target = event.target as HTMLElement;
            // console.log(target.scrollTop, target.scrollLeft);
            // console.log(target);

            if (getPhase().type === "PENDING") {
              cancel();
            }
          },
        },

        // Need to opt out of dragging if the user is a force press
        // Only for safari which has decided to introduce its own custom way of doing things
        // https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/SafariJSProgTopics/RespondingtoForceTouchEventsfromJavaScript.html
        {
          eventName: "webkitmouseforcedown" as keyof HTMLElementEventMap,
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
    },
    [getIsTouchDevice],
  );

  const preventForcePressBinding: EventBinding = useMemo(
    () => ({
      eventName: "webkitmouseforcewillbegin",
      fn: (event: Event) => {
        if (event.defaultPrevented) {
          return;
        }

        const id: DraggableId | null = api.findClosestDraggableId(event);

        if (!id) {
          return;
        }

        const options: DraggableOptions | null =
          api.findOptionsForDraggable(id);

        if (!options) {
          return;
        }

        if (options.shouldRespectForcePress) {
          return;
        }

        if (!api.canGetLock(id)) {
          return;
        }

        event.preventDefault();
      },
    }),
    [api],
  );

  const listenForCapture = useCallback(
    function listenForCapture() {
      const options: EventOptions = {
        passive: false,
        capture: true,
      };

      unbindEventsRef.current = bindEvents(
        window,
        [preventForcePressBinding, startCaptureBinding],
        options,
      );
    },
    [preventForcePressBinding, startCaptureBinding],
  );

  const stop = useCallback(() => {
    const current: Phase = phaseRef.current;
    if (current.type === "IDLE") {
      return;
    }

    phaseRef.current = idle;
    unbindEventsRef.current();

    listenForCapture();
  }, [listenForCapture]);

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
    function bindCapturingEvents() {
      const options = { capture: true, passive: false };
      const bindings: AnyEventBinding[] = getCaptureBindings({
        cancel,
        completed: stop,
        getPhase: () => phaseRef.current,
        setPhase: (phase: Phase) => {
          phaseRef.current = phase;
        },
      });

      unbindEventsRef.current = bindEvents(window, bindings, options);
    },
    [cancel, stop],
  );

  const startPendingDrag = useCallback(
    function startPendingDrag(actions: PreDragActions, point: Position) {
      invariant(
        phaseRef.current.type === "IDLE",
        "Expected to move from IDLE to PENDING drag",
      );
      phaseRef.current = {
        type: "PENDING",
        point,
        actions,
      };
      bindCapturingEvents();
    },
    [bindCapturingEvents],
  );

  useLayoutEffect(
    function mount() {
      listenForCapture();

      // kill any pending window events when unmounting
      return function unmount() {
        unbindEventsRef.current();
      };
    },
    [listenForCapture],
  );
};

// The @hello-pangea/dnd sensors prop expects an array of sensor creators (functions). It will call each creator once, passing in sensorAPI, and that creator should return either:

// 1. A cleanup function (for older versions), or
// 2. A React component / null (for the newer approach).
// If you directly pass useCustomDndSensor into sensors, nothing happens. You must wrap your hook in a sensor-creator function.

export const CustomDndSensor = (api: SensorAPI) => {
  // Use your custom hook
  useCustomDndSensor(api);

  // Return null so that the DragDropContext knows we have no special UI
  return null;
};
