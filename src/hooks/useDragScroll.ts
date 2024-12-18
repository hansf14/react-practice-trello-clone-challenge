import { SmartMerge, SmartPick } from "@/utils";
import {
  DragAbortEvent,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragPendingEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useRef } from "react";

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

export type DragScrollParams = {
  isDragging: boolean;
  elementScrollContainer: HTMLElement | null;
  active: SmartPick<DragScrollRelatedEvent, "active">["active"];
  scrollBufferZone?: {
    // Distance from the edge to trigger scrolling
    topBufferLength?: number;
    leftBufferLength?: number;
    bottomBufferLength?: number;
    rightBufferLength?: number;
  };
  scrollSpeed?: {
    // Adjust scroll speed
    // 0 or positive number should be given.
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  };
};

export type StartDragScrollParams = SmartMerge<
  SmartPick<DragScrollParams, "elementScrollContainer" | "scrollSpeed"> & {
    scrollDirection: { x: 1 | 0 | -1; y: 1 | 0 | -1 };
    desiredFps?: number;
  }
>;

export const useDragScroll = () => {
  const refScrollIntervalId = useRef<number | NodeJS.Timeout>(0);

  const startDragScroll = useCallback(
    ({
      elementScrollContainer,
      scrollSpeed,
      scrollDirection,
      desiredFps = 60,
    }: StartDragScrollParams) => {
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

      if (elementScrollContainer && !refScrollIntervalId.current) {
        refScrollIntervalId.current = setInterval(() => {
          console.log("DOH");
          const verticalSpeed =
            scrollDirectionX === -1 ? scrollSpeedTop : scrollSpeedBottom;
          const horizontalSpeed =
            scrollDirectionY === -1 ? scrollSpeedLeft : scrollSpeedRight;

          elementScrollContainer.scrollTop += verticalSpeed * scrollDirectionY;
          elementScrollContainer.scrollLeft +=
            horizontalSpeed * scrollDirectionX;
        }, 1000 / desiredFps);

        return () => {
          clearInterval(refScrollIntervalId.current);
          refScrollIntervalId.current = 0;
        };
      }
    },
    [],
  );

  const endDragScroll = useCallback(() => {
    clearInterval(refScrollIntervalId.current);
    refScrollIntervalId.current = 0;
  }, []);

  const dragScroll = useCallback(
    ({
      isDragging,
      elementScrollContainer,
      active,
      scrollBufferZone,
      scrollSpeed,
    }: DragScrollParams) => {
      if (
        !isDragging ||
        !elementScrollContainer ||
        !active.rect.current?.translated
      ) {
        return;
      }

      const {
        offsetTop: top,
        offsetLeft: left,
        offsetHeight,
        offsetWidth,
      } = elementScrollContainer;
      const bottom = top + offsetHeight;
      const right = left + offsetWidth;

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

      const scrollDirection: StartDragScrollParams["scrollDirection"] = {
        x: 0,
        y: 0,
      };
      let shouldTriggerScroll = false;

      // Vertical scrolling
      if (active.rect.current.translated.top < top + topBufferLength) {
        // Scroll up
        shouldTriggerScroll = true;
        scrollDirection.y = -1;
      } else if (
        active.rect.current.translated.bottom >
        bottom - bottomBufferLength
      ) {
        // Scroll down
        shouldTriggerScroll = true;
        scrollDirection.y = 1;
      }

      // Horizontal scrolling
      if (active.rect.current.translated.left < left + leftBufferLength) {
        // Scroll left
        shouldTriggerScroll = true;
        scrollDirection.x = -1;
      } else if (
        active.rect.current.translated.right >
        right - rightBufferLength
      ) {
        // Scroll right
        shouldTriggerScroll = true;
        scrollDirection.x = 1;
      }

      shouldTriggerScroll
        ? startDragScroll({
            elementScrollContainer,
            scrollSpeed,
            scrollDirection,
          })
        : endDragScroll();
    },
    [startDragScroll, endDragScroll],
  );

  return {
    startDragScroll,
    endDragScroll,
    dragScroll,
  };
};
