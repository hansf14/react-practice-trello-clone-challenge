import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import {
  checkHasScrollbar,
  getCursorScrollOffsetOnElement,
  memoizeCallback,
  SmartMerge,
  SmartPick,
} from "@/utils";
import {
  DragAbortEvent,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragPendingEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { throttle } from "lodash-es";
import { createRef, useCallback, useEffect, useRef } from "react";

export type DragEvent =
  | DragPendingEvent
  | DragStartEvent
  | DragMoveEvent
  | DragOverEvent
  | DragEndEvent
  | DragCancelEvent
  | DragAbortEvent;

export type DragScrollRelatedEvent =
  | DragStartEvent
  | DragMoveEvent
  | DragOverEvent
  | DragEndEvent
  | DragCancelEvent;

export type DragScrollBufferZone = {
  // Distance from the edge to trigger scrolling
  topBufferLength?: number;
  leftBufferLength?: number;
  bottomBufferLength?: number;
  rightBufferLength?: number;
};

export type DragScrollSpeed = {
  // Adjust scroll speed
  // 0 or positive number should be given.
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
};

export type DragScrollParams = {
  scrollContainer: HTMLElement | null;
  scrollBufferZone?: DragScrollBufferZone;
  scrollSpeed?: DragScrollSpeed;
  desiredFps?: number;
};

export type StartDragScrollParams = SmartMerge<
  SmartPick<
    DragScrollParams,
    "scrollContainer" | "scrollSpeed" | "desiredFps"
  > & {
    scrollDirection: { x: 1 | 0 | -1; y: 1 | 0 | -1 };
  }
>;

export type EndDragScrollParams = SmartPick<
  DragScrollParams,
  "scrollContainer"
>;

let isOnPointerDownAttached = false;
let isOnPointerMoveAttached = false;
let isOnPointerUpAttached = false;
let curPointerEvent: React.MutableRefObject<PointerEvent | null> = createRef();
curPointerEvent.current = null;
let isDragScrollAllowed: boolean = false;

export const useDragScroll = () => {
  const refScrollIntervalIdMap = useRef<
    Map<HTMLElement, number | NodeJS.Timeout>
  >(new Map());
  const refScrollRafIdMap = useRef<Map<HTMLElement, number>>(new Map());

  const onPointerDown = useCallback(() => {
    isDragScrollAllowed = true;
  }, []);
  const onPointerMove = useCallback((event: PointerEvent) => {
    curPointerEvent.current = event;
    // console.log(isDragScrollAllowed);
  }, []);
  const onPointerUp = useCallback(() => {
    isDragScrollAllowed = false;
  }, []);

  useEffect(() => {
    if (!isOnPointerDownAttached) {
      document.body.addEventListener("pointerdown", onPointerDown);
      isOnPointerDownAttached = true;
    }
    if (!isOnPointerMoveAttached) {
      document.body.addEventListener("pointermove", onPointerMove);
      isOnPointerMoveAttached = true;
    }
    if (!isOnPointerUpAttached) {
      document.body.addEventListener("pointerup", onPointerUp);
      isOnPointerUpAttached = true;
    }
    return () => {
      if (isOnPointerDownAttached) {
        document.body.removeEventListener("pointerdown", onPointerDown);
        isOnPointerDownAttached = false;
      }
      if (isOnPointerMoveAttached) {
        document.body.removeEventListener("pointermove", onPointerMove);
        isOnPointerMoveAttached = false;
      }
      if (isOnPointerUpAttached) {
        document.body.removeEventListener("pointerup", onPointerUp);
        isOnPointerUpAttached = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnPointerDownAttached,
    isOnPointerMoveAttached,
    isOnPointerUpAttached,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  ]);

  const endDragScroll = useCallback(
    ({ scrollContainer }: EndDragScrollParams) => {
      if (!scrollContainer) {
        return;
      }
      const intervalId = refScrollIntervalIdMap.current.get(scrollContainer);
      typeof intervalId !== "undefined" && clearInterval(intervalId);
      refScrollIntervalIdMap.current.set(scrollContainer, 0);

      const rafId = refScrollRafIdMap.current.get(scrollContainer);
      typeof rafId !== "undefined" && cancelAnimationFrame(rafId);
      refScrollRafIdMap.current.set(scrollContainer, 0);
    },
    [],
  );

  const startDragScroll = useCallback(
    ({
      scrollContainer,
      scrollSpeed,
      scrollDirection,
      desiredFps = 60,
    }: StartDragScrollParams) => {
      if (!isDragScrollAllowed || !scrollContainer) {
        endDragScroll({ scrollContainer });
        return;
      }
      if (
        refScrollIntervalIdMap.current.get(scrollContainer) ||
        refScrollRafIdMap.current.get(scrollContainer)
      ) {
        // endDragScroll({ scrollContainer });
        // ㄴ 여기에도 이거 놓으면 스크롤이 툭툭 끊긴다.
        return;
      }

      const DEFAULT_SCROLL_SPEED_TOP = 3;
      const DEFAULT_SCROLL_SPEED_LEFT = 3;
      const DEFAULT_SCROLL_SPEED_BOTTOM = 3;
      const DEFAULT_SCROLL_SPEED_RIGHT = 3;
      const {
        top: scrollSpeedTop = DEFAULT_SCROLL_SPEED_TOP,
        left: scrollSpeedLeft = DEFAULT_SCROLL_SPEED_LEFT,
        bottom: scrollSpeedBottom = DEFAULT_SCROLL_SPEED_BOTTOM,
        right: scrollSpeedRight = DEFAULT_SCROLL_SPEED_RIGHT,
      } = scrollSpeed ?? {};

      const { x: scrollDirectionX, y: scrollDirectionY } = scrollDirection;

      const intervalId = setInterval(() => {
        const rafId = requestAnimationFrame(() => {
          const verticalSpeed =
            scrollDirectionX === -1 ? scrollSpeedTop : scrollSpeedBottom;
          const horizontalSpeed =
            scrollDirectionY === -1 ? scrollSpeedLeft : scrollSpeedRight;

          scrollContainer.scrollTop += verticalSpeed * scrollDirectionY;
          scrollContainer.scrollLeft += horizontalSpeed * scrollDirectionX;

          if (!isDragScrollAllowed) {
            endDragScroll({ scrollContainer });
          }
        });
        refScrollRafIdMap.current.set(scrollContainer, rafId);
      }, 1000 / desiredFps);

      refScrollIntervalIdMap.current.set(scrollContainer, intervalId);
    },
    [endDragScroll],
  );

  const idDragScroll = useMemoizeCallbackId();
  const dragScroll = useCallback(
    ({
      scrollContainer,
      scrollBufferZone,
      scrollSpeed,
      desiredFps = 60,
    }: DragScrollParams) =>
      memoizeCallback({
        id: idDragScroll,
        fn: throttle(() => {
          return new Promise<boolean>((resolve) => {
            requestAnimationFrame(() => {
              if (!isDragScrollAllowed || !scrollContainer) {
                endDragScroll({ scrollContainer });
                resolve(false);
                return;
              }
              // console.log("[dragScroll]");

              const top = 0;
              const left = 0;
              const { offsetHeight: bottom, offsetWidth: right } =
                scrollContainer;

              const DEFAULT_TOP_BUFFER_LENGTH = 50;
              const DEFAULT_LEFT_BUFFER_LENGTH = 50;
              const DEFAULT_BOTTOm_BUFFER_LENGTH = 50;
              const DEFAULT_RIGHT_BUFFER_LENGTH = 50;
              const {
                topBufferLength = DEFAULT_TOP_BUFFER_LENGTH,
                bottomBufferLength = DEFAULT_LEFT_BUFFER_LENGTH,
                leftBufferLength = DEFAULT_BOTTOm_BUFFER_LENGTH,
                rightBufferLength = DEFAULT_RIGHT_BUFFER_LENGTH,
              } = scrollBufferZone ?? {};

              if (!curPointerEvent.current) {
                resolve(false);
                return;
              }
              const offsetOnElementOfCursor = getCursorScrollOffsetOnElement({
                element: scrollContainer,
                event: curPointerEvent.current,
                offsetType: "no-scroll",
              });
              if (!offsetOnElementOfCursor) {
                resolve(false);
                return;
              }

              console.group();
              console.log(offsetOnElementOfCursor);
              console.log([left, top]);
              console.log([right, bottom]);
              console.groupEnd();

              const { x, y } = offsetOnElementOfCursor;
              let shouldTriggerScroll = false;
              const scrollDirection: StartDragScrollParams["scrollDirection"] =
                {
                  x: 0,
                  y: 0,
                };

              if (
                checkHasScrollbar({
                  element: scrollContainer,
                  condition: "vertical",
                })
              ) {
                // Vertical scrolling
                if (y < top + topBufferLength && y > top) {
                  // Scroll up
                  shouldTriggerScroll = true;
                  scrollDirection.y = -1;
                } else if (y > bottom - bottomBufferLength && y < bottom) {
                  // Scroll down
                  shouldTriggerScroll = true;
                  scrollDirection.y = 1;
                }
              }

              if (
                checkHasScrollbar({
                  element: scrollContainer,
                  condition: "horizontal",
                })
              ) {
                // Horizontal scrolling
                if (x < left + leftBufferLength && x > left) {
                  // Scroll left
                  shouldTriggerScroll = true;
                  scrollDirection.x = -1;
                } else if (x > right - rightBufferLength && x < right) {
                  // Scroll right
                  shouldTriggerScroll = true;
                  scrollDirection.x = 1;
                }
              }

              if (shouldTriggerScroll) {
                startDragScroll({
                  scrollContainer,
                  scrollSpeed,
                  scrollDirection,
                  desiredFps,
                });
                resolve(true);
                return;
              } else {
                endDragScroll({ scrollContainer });
                resolve(false);
                return;
              }
            });
          });
        }, 1000 / desiredFps),
        deps: [
          scrollContainer,
          scrollBufferZone,
          scrollSpeed,
          desiredFps,
          idDragScroll,
          startDragScroll,
          endDragScroll,
        ],
      })(),
    [idDragScroll, startDragScroll, endDragScroll],
  );

  const getCurPointerEvent = useCallback(() => curPointerEvent.current, []);

  return {
    startDragScroll,
    endDragScroll,
    dragScroll,
    getCurPointerEvent,
  };
};
