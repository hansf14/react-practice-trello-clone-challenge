import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useForceRenderWithOptionalCb } from "@/hooks/useForceRenderWithOptionalCb";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { Indexer } from "@/indexer";
import {
  getCursorRelativePosToElement,
  getElementRelativePos,
  memoizeCallback,
} from "@/utils";
import { throttle } from "lodash-es";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { atom, useRecoilState } from "recoil";

////////////////////////////////////

// Desktop Events (Mouse)
// Event	Description
// onDragStart	Triggered when dragging starts (mouse down).
// onDrag	Triggered continuously while dragging.
// onDragEnd	Triggered when dragging ends (mouse up).
// onMouseDown	Triggered when the mouse is pressed.
// onMouseMove	Continuously triggered as the mouse moves.
// onMouseUp	Triggered when the mouse is released.

// Touch Events
// Event	Description
// onTouchStart	Triggered when a touch gesture starts (finger touch).
// onTouchMove	Continuously triggered as the finger moves across the screen.
// onTouchEnd	Triggered when the finger is lifted, ending the touch.
// onDragStart	Framer Motion provides this cross-device event (works for touch as well).
// onDrag	Works for both mouse and touch events.
// onDragEnd	Works for both mouse and touch events.

////////////////////////////////////

// On the Draggable Element:
// Event	Occurs When
// ondrag	An element is being dragged
// ondragstart	The user starts to drag an element
// ondragend	The user has finished dragging an element
// Note: While dragging an element, the ondrag event fires every 350 milliseconds.

// On the Drop Target:
// Event	Occurs When
// ondragenter	A dragged element enters the drop target
// ondragleave	A dragged element leaves the drop target
// ondragover	A dragged element is over the drop target
// ondrop	A dragged element is dropped on the target

////////////////////////////////////

// export interface UseDraggableConfig {
//   effectAllowed: DataTransfer["effectAllowed"];
//   dropEffect: DataTransfer["dropEffect"];
// }

export type DraggableElement = {
  element: HTMLElement | undefined;
  elementHandle: HTMLElement | undefined;
};

export type DroppableElement = HTMLElement | undefined;

export type UseDraggableSetDraggableRef = (node: HTMLElement | null) => void;

export type UseDraggableSetDraggableHandleRef = (
  node: HTMLElement | null,
) => void;

export type UseDraggableItemBaseSpec = { id: string };

export type UseDroppableItemBaseSpec = UseDraggableItemBaseSpec;

export type UseDraggableItemSpec<T extends UseDraggableItemBaseSpec> = {
  type: string;
  index: number;
  data: T;
};

export type UseDroppableItemSpec<T extends UseDraggableItemBaseSpec> = {
  acceptableTypes: string[];
  index: number;
  data: T;
};

export type UseDraggableOnDragStartCb<
  DraggableItemSpec extends UseDraggableItemBaseSpec,
> = NonNullable<UseDraggableParams<DraggableItemSpec>["onDragStartCb"]>;

export type UseDraggableOnDragMoveCb<
  DraggableItemSpec extends UseDraggableItemBaseSpec,
> = NonNullable<UseDraggableParams<DraggableItemSpec>["onDragMoveCb"]>;

export type UseDraggableOnDragEndCb<
  DraggableItemSpec extends UseDraggableItemBaseSpec,
> = NonNullable<UseDraggableParams<DraggableItemSpec>["onDragEndCb"]>;

export interface UseDraggableParams<
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
> {
  items: UseDraggableItemSpec<DraggableItemSpec>[];
  dragSensitivity?: number;
  onDragStartCb?: ({
    active,
  }: {
    active: UseDraggableItemSpec<DraggableItemSpec>;
  }) => void;
  onDragMoveCb?: ({
    active,
  }: {
    active: UseDraggableItemSpec<DraggableItemSpec>;
  }) => void;
  onDragEndCb?: ({
    active,
  }: {
    active: UseDraggableItemSpec<DraggableItemSpec>;
  }) => void;
}

export type UseDraggableListeners = ReturnType<
  ReturnType<typeof useDraggable>["listeners"]
>;

export interface UseDroppableParams<
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
  DroppableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
> {
  items: UseDroppableItemSpec<DroppableItemSpec>[];
}

const isDraggingAtom = atom<boolean>({
  key: "isDraggingAtom",
  default: false,
});

const activeItemAtom =
  atom<UseDraggableItemSpec<UseDraggableItemBaseSpec> | null>({
    key: "activeItemAtom",
    default: null,
  });

const indexerDraggable = atom<Indexer<UseDraggableItemBaseSpec>>({
  key: "indexerDraggable",
  default: new Indexer({
    itemKeyName: "Draggable",
  }),
});

const indexerDroppable = atom<Indexer<UseDraggableItemBaseSpec>>({
  key: "indexerDroppable",
  default: new Indexer({
    itemKeyName: "Droppable",
  }),
});

const dndRefsAtom = atom<{
  draggableElements: DraggableElement[];
  droppableElements: DroppableElement[];
}>({
  key: "draggableRefsAtom",
  default: {
    draggableElements: [],
    droppableElements: [],
  },
  dangerouslyAllowMutability: true,
});

export interface DroppableEventHandlers {
  onDragEnter: (event: MouseEvent) => void;
  onDragLeave: (event: MouseEvent) => void;
}

const droppableEventHandlersAtom = atom<DroppableEventHandlers>({
  key: "droppableEventHandlersAtom",
  default: {
    onDragEnter: () => {},
    onDragLeave: () => {},
  },
});

// export interface DragIndicatorProps {
//   index: number;
// }

// const DragIndicator = styled.div<DragIndicatorProps>``;

// export interface DraggablesProps {
//   children: React.ReactNode;
//   grid?: {
//     rowTotal?: number;
//     columnTotal?: number;
//   };
// }

// const Draggables = React.memo(({ children }: DraggablesProps) => {
//   // Convert children to an array
//   const childrenArray = React.Children.toArray(children);

//   // Injected elements in children
//   const childrenWithInjection = childrenArray.flatMap(
//     (child, index) =>
//       index < childrenArray.length - 1
//         ? [<DragIndicator index={index}>hello</DragIndicator>, child]
//         : [
//             <DragIndicator index={index}>hello</DragIndicator>,
//             child,
//             <DragIndicator index={index + 1}>hello</DragIndicator>,
//           ], // Add the last child without injecting
//   );
//   return <>{childrenWithInjection}</>;
// });

export type CustomDragStartEvent = CustomEvent<{
  mouseEvent: MouseEvent;
  index: number;
}>;

export const useDraggable = <
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
>(
  props: UseDraggableParams<DraggableItemSpec>,
) => {
  const {
    items,
    dragSensitivity = 3,
    onDragStartCb,
    onDragMoveCb,
    onDragEndCb,
  } = props;

  const [stateDroppableEventHandlers, setStateDroppableEventHandlers] =
    useRecoilState(droppableEventHandlersAtom);

  const { forceRender } = useForceRenderWithOptionalCb();

  // const [stateIndexerDraggable, setStateIndexerDraggable] =
  //   useRecoilState(indexerDraggable);
  // const [stateIndexerDroppable, setStateIndexerDroppable] =
  //   useRecoilState(indexerDroppable);

  const [stateDndRefs, setStateDndRefs] = useRecoilState(dndRefsAtom);

  const [stateIsDragging, setStateIsDragging] = useRecoilState(isDraggingAtom);
  const [stateActiveItem, setStateActiveItem] = useRecoilState(activeItemAtom);

  const [stateIsDraggedOver, setStateIsDraggedOver] = useState<boolean>(false);

  // const [stateIsDragging, setStateIsDragging] = useState<boolean>(false);
  // Need immediate update
  const refIsDragging = useRef<boolean>(false);
  const refActiveDomStyle = useRef<Record<string, string> | null>();
  const refActiveDragHandle = useRef<HTMLElement>();
  const refActiveDrag = useRef<HTMLElement>();

  const refIsMouseDown = useRef<boolean>(false);
  const refMouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const refMouseUpPos = useRef<{ x: number; y: number } | null>(null);
  const refCursorDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const refDragGhostPos = useRef<{ x: number; y: number } | null>(null);

  const refDraggables = useRef<DraggableElement[]>(
    items.map(() => ({
      element: undefined,
      elementHandle: undefined,
    })),
  );
  // useEffect(() => {
  //   setStateDndRefs((cur) => ({
  //     ...cur,
  //     draggableElements: [...refDraggables.current],
  //   }));
  // }, [setStateDndRefs]);
  // useBeforeRender(() => {
  //   if (refDraggables.current.length < items.length) {
  //     refDraggables.current.concat(
  //       Array(items.length - refDraggables.current.length),
  //     );
  //     setStateDndRefs((cur) => ({
  //       ...cur,
  //       draggableElements: [...refDraggables.current],
  //     }));
  //   }
  // }, [items]);
  useEffect(() => {
    if (refDraggables.current.length < items.length) {
      refDraggables.current.concat(
        Array(items.length - refDraggables.current.length),
      );
      setStateDndRefs((cur) => ({
        ...cur,
        draggableElements: [...refDraggables.current],
      }));
    }
  }, [items.length, setStateDndRefs]);

  const refDragGhost = useRef<HTMLElement>();
  // const refDragGhostRelativePos = useRef<{ x: number; y: number }>({
  //   x: 0,
  //   y: 0,
  // });
  // useBeforeRender(() => {
  //   if (!refDragGhost.current) {
  //     return;
  //   }
  //   // Mandatory
  //   refDragGhost.current.style.setProperty("position", "fixed");
  //   refDragGhost.current.style.setProperty("left", "0");
  //   refDragGhost.current.style.setProperty("top", "0");
  //   !stateIsDragging
  //     ? refDragGhost.current.style.setProperty("display", "none")
  //     : refDragGhost.current.style.removeProperty("display");
  //   refDragGhost.current.style.setProperty("pointer-events", "none");

  //   // console.log("refActiveDomStyle.current:", refActiveDomStyle.current);
  //   if (refActiveDomStyle.current) {
  //     refDragGhost.current.style.setProperty(
  //       "width",
  //       refActiveDomStyle.current["width"],
  //     );
  //     refDragGhost.current.style.setProperty(
  //       "height",
  //       refActiveDomStyle.current["height"],
  //     );
  //   }

  //   // Custom
  //   // ...
  // }, [refDragGhost.current]);

  // const [stateEffectAllowed, setStateEffectAllowed] =
  //   useState<UseDndConfig["effectAllowed"]>("move");
  // const [stateDropEffect, setStateDropEffect] =
  //   useState<UseDndConfig["dropEffect"]>("move");

  // const setConfig = useCallback((config: UseDndConfig) => {
  //   setStateEffectAllowed(config.effectAllowed);
  //   setStateDropEffect(config.dropEffect);
  // }, []);

  /////////////////////////////////////////////////////

  const setDragGhostStyle = useCallback(
    ({ node }: { node: HTMLElement }) => {
      // Mandatory
      node.style.setProperty("position", "fixed");
      node.style.setProperty("left", "0");
      node.style.setProperty("top", "0");
      !stateIsDragging
        ? node.style.setProperty("display", "none")
        : node.style.removeProperty("display");
      node.style.setProperty("pointer-events", "none");

      // console.log("refActiveDomStyle.current:", refActiveDomStyle.current);
      if (refActiveDomStyle.current) {
        node.style.setProperty("width", refActiveDomStyle.current["width"]);
        node.style.setProperty("height", refActiveDomStyle.current["height"]);
      }

      // const { x, y } = refDragGhostRelativePos.current;
      // const { x, y } = refCursorPos.current;
      // const { x: relativeX, y: relativeY } = refDragGhostRelativePos.current;
      // const { x: cursorX, y: cursorY } = refCursorPos.current;
      // const x = relativeX + cursorX;
      // const y = relativeY + cursorY;

      if (!!refActiveDrag.current && !!refActiveDragHandle.current) {
        // const { x: cursorX, y: cursorY } = refCursorPos.current;
        // const { x: cursorToHandleX, y: cursorToHandleY } =
        //   getCursorRelativePosToElement({
        //     cursorPos: refCursorPos.current,
        //     element: refActiveDragHandle.current,
        //   });
        // const { x: activeToHandleX, y: activeToHandleY } =
        //   getElementRelativePos({
        //     fromElement: refActiveDrag.current,
        //     toElement: refActiveDragHandle.current,
        //   });
        // const { x: cursorToActiveX, y: cursorToActiveY } =
        //   getCursorRelativePosToElement({
        //     cursorPos: refCursorPos.current,
        //     element: refActiveDrag.current,
        //   });
        // console.log(`[${cursorToActiveX},${cursorToActiveY}]`);
        // console.log(`[${cursorX},${cursorY}]`);
        // console.log(`[${activeToHandleX},${activeToHandleY}]`);
        // console.log(`[${cursorToHandleX},${cursorToHandleY}]`);

        // const x = cursorX - cursorToHandleX - activeToHandleX + a;
        // const y = cursorY - cursorToHandleY - activeToHandleY + b;
        // console.log(`[${x},${y}]`);

        if (!refDragGhostPos.current) {
          const { x: activeX, y: activeY } =
            refActiveDrag.current.getBoundingClientRect();
          refDragGhostPos.current = { x: activeX, y: activeY };
        }
        const { x: dragGhostX, y: dragGhostY } = refDragGhostPos.current;
        const { x: cursorDeltaX, y: cursorDeltaY } = refCursorDelta.current;
        const x = dragGhostX + cursorDeltaX;
        const y = dragGhostY + cursorDeltaY;
        refDragGhostPos.current = { x, y };
        refCursorDelta.current = { x: 0, y: 0 };
        // const x = activeX + cursorToActiveX - activeToHandleX + cursorToHandleX;
        // const y = activeY + cursorToActiveY - activeToHandleY + cursorToHandleY;
        node.style.removeProperty("display");
        node.style.setProperty("transform", `translate3d(${x}px, ${y}px, 0)`);
      }
    },
    [stateIsDragging],
  );

  const refCursorPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const setDragGhostFollowCursor = useCallback(
    (event: MouseEvent | DragEvent) => {
      // console.log("refIsDragging.current:", refIsDragging.current);
      // console.log("refDragGhost.current:", refDragGhost.current);

      if (
        refIsDragging.current &&
        refDragGhost.current &&
        refDragGhost.current
      ) {
        // console.log("Follow!");
        // console.log(x, y);

        setDragGhostStyle({ node: refDragGhost.current });
      }
    },
    [setDragGhostStyle],
  );

  /////////////////////////////////////////////////////

  const onCustomDragStart = useCallback(
    (event: Event) => {
      console.log("[onCustomDragStart]");

      const customEvent = event as CustomDragStartEvent;
      const { mouseEvent, index } = customEvent.detail;

      refCursorPos.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };

      onDragStartCb?.({
        active: items[index],
      });

      // /////////////////////////////////////////////////////

      // console.log(
      //   "refDraggables.current[index].element:",
      //   refDraggables.current[index].element,
      // );
      if (refDraggables.current[index].element) {
        const originalElement = refDraggables.current[index]
          .element as HTMLElement;
        const { offsetWidth, offsetHeight } = originalElement;
        refActiveDomStyle.current ??= {};
        refActiveDomStyle.current["width"] = offsetWidth + "px";
        refActiveDomStyle.current["height"] = offsetHeight + "px";
      }

      // console.log(refDraggables.current[index].element);
      // console.log(refDraggables.current[index].elementHandle);
      // if (
      //   !!refDraggables.current[index].element &&
      //   !!refDraggables.current[index].elementHandle
      // ) {
      //   // const { x, y } = (
      //   //   event.target as HTMLElement
      //   // ).getBoundingClientRect(); // elementHandleRect
      //   const elementRect =
      //     refDraggables.current[index].element!.getBoundingClientRect();
      //   const elementHandleRect =
      //     refDraggables.current[index].elementHandle!.getBoundingClientRect();
      //   // console.log(elementRect);
      //   // console.log(elementHandleRect);

      //   // console.log(mouseEvent.pageX);
      //   // console.log(mouseEvent.clientX);
      //   // console.log(mouseEvent.screenX);
      //   // console.log(mouseEvent.movementX);

      //   refDragGhostRelativePos.current.x = elementRect.x - elementHandleRect.x;
      //   refDragGhostRelativePos.current.y = elementRect.y - elementHandleRect.y;

      //   // refDragGhostRelativePos.current.x = event.clientX - elementRect.x;
      //   // refDragGhostRelativePos.current.y =
      //   //   event.clientY - elementHandleRect.y;
      // }

      // console.log("refDragGhost.current:", refDragGhost.current);
      forceRender();
      setDragGhostFollowCursor(mouseEvent);
    },
    [items, onDragStartCb, forceRender, setDragGhostFollowCursor],
  );

  const onMouseMove = useCallback((event: MouseEvent) => {
    console.log("[onMouseMove]");
    refCursorPos.current = { x: event.clientX, y: event.clientY };
    refCursorDelta.current.x += event.movementX;
    refCursorDelta.current.y += event.movementY;
  }, []);

  const idOnMouseMoveThrottled = useMemoizeCallbackId();
  const onMouseMoveThrottled = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        fn: throttle((event: MouseEvent) => {
          console.log("[onMouseMoveThrottled]");

          // console.log("stateIsDragging:", stateIsDragging);

          // console.log("MouseMove event.clientX:", event.clientX);
          // console.log("MouseMove event.pageX:", event.pageX);
          if (
            !refIsDragging.current &&
            refMouseDownPos.current &&
            (Math.abs(refMouseDownPos.current.x - event.clientX) >=
              dragSensitivity ||
              Math.abs(refMouseDownPos.current.y - event.clientY) >=
                dragSensitivity)
          ) {
            refIsDragging.current = true;
            setStateIsDragging(true);
            setStateActiveItem(items[index]);

            refActiveDrag.current = refDraggables.current[index].element;
            refActiveDragHandle.current =
              refDraggables.current[index].elementHandle;

            // console.log("MouseDownPos:", refMouseDownPos.current);
            // console.log("MouseMove event.clientX:", event.clientX);
            // console.log("MouseMove event.pageX:", event.pageX);
            // console.log(
            //   "Computed difference X:",
            //   Math.abs(refMouseDownPos.current.x - event.clientX),
            // );

            // console.log("x:", refMouseDownPos.current?.x, event.pageX);
            // console.log("y:", refMouseDownPos.current?.y, event.pageY);

            document.addEventListener("custom-drag-start", onCustomDragStart, {
              once: true,
            });
            const customDragStartEvent: CustomDragStartEvent = new CustomEvent(
              "custom-drag-start",
              {
                detail: {
                  mouseEvent: event,
                  index,
                },
              },
            );
            document.dispatchEvent(customDragStartEvent);
          }

          if (refIsDragging.current) {
            setDragGhostFollowCursor(event);
          }

          onDragMoveCb?.({ active: items[index] });
        }, 17),
        id: idOnMouseMoveThrottled,
        deps: [
          index,
          idOnMouseMoveThrottled,
          items,
          onDragMoveCb,
          dragSensitivity,
          onCustomDragStart,
          setStateIsDragging,
          setStateActiveItem,
          setDragGhostFollowCursor,
          // onDragMoveCb,
        ],
      }),
    [
      idOnMouseMoveThrottled,
      items,
      onDragMoveCb,
      dragSensitivity,
      onCustomDragStart,
      setStateIsDragging,
      setStateActiveItem,
      setDragGhostFollowCursor,
      // onDragMoveCb,
    ],
  );

  const idOnMouseUp = useMemoizeCallbackId();
  const onMouseUp = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        fn: (event: MouseEvent) => {
          console.log("[onMouseUp]");

          refCursorPos.current = { x: event.clientX, y: event.clientY };

          if (refIsDragging.current && refDragGhost.current) {
            refDragGhost.current.style.setProperty("display", "none");
          }

          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener(
            "mousemove",
            onMouseMoveThrottled({ index }),
          );

          refIsDragging.current = false;
          setStateIsDragging(false);
          setStateActiveItem(null);
          refActiveDrag.current = undefined;
          refActiveDragHandle.current = undefined;

          refIsMouseDown.current = false;
          refMouseDownPos.current = null;

          refDragGhostPos.current = null;
          refCursorDelta.current = { x: 0, y: 0 };

          onDragEndCb?.({ active: items[index] });
        },
        id: idOnMouseUp,
        deps: [
          index,
          idOnMouseUp,
          items,
          setStateIsDragging,
          setStateActiveItem,
          onMouseMove,
          onMouseMoveThrottled,
          onDragEndCb,
        ],
      }),
    [
      items,
      idOnMouseUp,
      setStateIsDragging,
      setStateActiveItem,
      onMouseMove,
      onMouseMoveThrottled,
      onDragEndCb,
    ],
  );

  const idOnMouseDown = useMemoizeCallbackId();
  const onMouseDown = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        fn: (event: React.MouseEvent<HTMLElement>) => {
          console.log("[onMouseDown]");

          refCursorPos.current = { x: event.clientX, y: event.clientY };

          refIsMouseDown.current = true;
          refMouseDownPos.current = {
            x: event.clientX,
            y: event.clientY,
          };
          // console.log(refMouseDownPos.current);

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener(
            "mousemove",
            onMouseMoveThrottled({ index }),
          );
          document.addEventListener("mouseup", onMouseUp({ index }), {
            once: true,
          });
        },
        id: idOnMouseDown,
        deps: [index, idOnMouseDown, onMouseMove, onMouseMoveThrottled, onMouseUp],
      }),
    [idOnMouseDown, onMouseMove, onMouseMoveThrottled, onMouseUp],
  );

  /////////////////////////////////////////////////////
  // Draggable related

  // [1] Triggered: When the user starts dragging an element.
  // [2] Use case: Initialize any data transfer or visual feedback for the drag operation.
  // [3] Common Methods/Properties:
  // - e.dataTransfer.setData(type, data): Sets data to be transferred.
  // - e.dataTransfer.effectAllowed: Specifies the allowed operations (move, copy, etc.).
  //
  // element.addEventListener('dragstart', (e) => {
  //   e.dataTransfer.setData('text/plain', 'Dragged Item');
  //   e.dataTransfer.effectAllowed = 'move';
  //   console.log('Drag started');
  // });
  const idOnDragStart = useMemoizeCallbackId();
  const onDragStart = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        fn: (event: React.DragEvent<HTMLElement>) => {
          console.log("[onDragStart]");
          event.preventDefault();

          /////////////////////////////////////////////////////

          // event.dataTransfer.effectAllowed = stateEffectAllowed;
          // event.dataTransfer.setData(
          //   "application/json",
          //   JSON.stringify({
          //     index: 1,
          //   }),
          // );

          // // Prevent showing the default ghost preview by showing empty/transparent image (invisible 1x1 pixel image)
          // const img = new Image();
          // img.src =
          //   "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
          // // event.dataTransfer.setDragImage(
          // //   refDraggables.current[index].element!,
          // //   100,
          // //   100,
          // // );
          // event.dataTransfer.setDragImage(img, 0, 0);
        },
        id: idOnDragStart,
        deps: [index, idOnDragStart],
      }),
    [idOnDragStart],
  );

  // [1] Triggered: While the element is being dragged.
  // [2] Use case: Use sparingly to provide feedback (e.g., updating coordinates or highlighting targets).
  // [3] Common Methods/Properties:
  // You can monitor the clientX and clientY coordinates to track drag movement.
  //
  // element.addEventListener('drag', (e) => {
  //   console.log(`Dragging at ${e.clientX}, ${e.clientY}`);
  // });
  // const onDrag = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDrag]");

  //       // if (stateIsDragging && refDragGhost.current) {
  //       //   refDragGhost.current.style.setProperty("position", "fixed");
  //       //   refDragGhost.current.style.setProperty("background-color", "red");
  //       //   refDragGhost.current.style.setProperty("left", `${event.clientX}px`);
  //       //   refDragGhost.current.style.setProperty("top", `${event.clientY}px`);
  //       // }
  //     },
  //   [],
  // );

  // [1] Triggered: When the drag operation is completed (either dropped or cancelled).
  // [2] Use case: Clean up visual feedback or finalize state.
  // [3] Common Methods/Properties:
  // The e.dataTransfer.dropEffect indicates the final operation (none, copy, move).
  //
  // element.addEventListener('dragend', (e) => {
  //   console.log(`Drag ended with effect: ${e.dataTransfer.dropEffect}`);
  // });
  // const onDragEnd = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDragEnd]");
  //       // setStateIsDragging(false);
  //       event.dataTransfer.clearData();
  //     },
  //   [],
  // );

  /////////////////////////////////////////////////////
  const idSetDraggableHandleRef = useMemoizeCallbackId();
  const setDraggableHandleRef = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        fn: (node: HTMLElement | null) => {
          if (node) {
            console.log(node);
            node.setAttribute("draggable", "true"); // 드래그로 텍스트 블록 처리 되는거 방지용도로만 적용시킴
            node.setAttribute("tabindex", "0");

            refDraggables.current[index].elementHandle = node;
          }
        },
        id: idSetDraggableHandleRef,
        deps: [index, idSetDraggableHandleRef],
      }),
    [idSetDraggableHandleRef],
  );

  const idSetDraggableRef = useMemoizeCallbackId();
  const setDraggableRef = useCallback(
    ({
      index,
      shouldAttachHandleToThis,
    }: {
      index: number;
      shouldAttachHandleToThis?: boolean;
    }) =>
      memoizeCallback({
        fn: (node: HTMLElement | null) => {
          if (node) {
            // console.log(node);
            // node.setAttribute("data-draggable", "true");

            refDraggables.current[index].element = node;
            if (shouldAttachHandleToThis ?? true) {
              setDraggableHandleRef({ index });
            }
          }
        },
        id: idSetDraggableRef,
        deps: [
          index,
          idSetDraggableRef,
          shouldAttachHandleToThis,
          setDraggableHandleRef,
        ],
      }),
    [idSetDraggableRef, setDraggableHandleRef],
  );

  const setDragGhostRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        // console.log(node);
        refDragGhost.current = node;

        setDragGhostStyle({ node });

        // forceRender();
      }
    },
    [
      setDragGhostStyle,
      // forceRender
    ],
  );

  /////////////////////////////////////////////////////

  const listeners = useMemo(
    () =>
      ({ index }: { index: number }) => ({
        onMouseDown: onMouseDown({ index }),
        // onMouseMove: onMouseMove({ index }),
        // onMouseUp: onMouseUp,
        onDragStart: onDragStart({ index }),
        // onDrag: onDrag({ index }),
        // onDragEnd: onDragEnd({ index }),
      }),
    [
      onMouseDown,
      // onMouseMove,
      //  onMouseUp,
      onDragStart,
    ],
  );

  // console.log("stateIsDragging:", stateIsDragging);
  // console.log("refIsDragging.current:", refIsDragging.current);
  const ret = useMemo(
    () => ({
      // Draggables,
      isDragging: stateIsDragging,
      // setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      setDragGhostRef,
      listeners,
    }),
    [
      stateIsDragging,
      // setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      setDragGhostRef,
      listeners,
    ],
  );
  // console.log("ret.isDragging:", ret.isDragging);

  return ret;
};

export const useDroppable = <
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
  DroppableItemSpec extends UseDroppableItemBaseSpec = UseDroppableItemBaseSpec,
>(
  props: UseDroppableParams<DraggableItemSpec, DroppableItemSpec>,
) => {
  const [stateIsMouseOverThis, setStateIsMouseOverThis] =
    useState<boolean>(false);

  const {
    items,
    // onDragStartCb = () => {},
    // onDragMoveCb = () => {},
    // onDragEndCb = () => {},
  } = props;

  const [stateDroppableEventHandlers, setStateDroppableEventHandlers] =
    useRecoilState(droppableEventHandlersAtom);
  const [stateIsDragging, setStateIsDragging] = useRecoilState(isDraggingAtom);

  const [stateDndRefs, setStateDndRefs] = useRecoilState(dndRefsAtom);

  const refDroppables = useRef<DroppableElement[]>(items.map(() => undefined));
  // useEffect(() => {
  //   setStateDndRefs((cur) => ({
  //     ...cur,
  //     droppableElements: [...refDroppables.current],
  //   }));
  // }, [setStateDndRefs]);
  // useBeforeRender(() => {
  //   if (refDroppables.current.length < items.length) {
  //     refDroppables.current.concat(
  //       Array(items.length - refDroppables.current.length),
  //     );
  //     setStateDndRefs((cur) => ({
  //       ...cur,
  //       droppableElements: [...refDroppables.current],
  //     }));
  //   }
  // }, [items]);
  useEffect(() => {
    if (refDroppables.current.length < items.length) {
      refDroppables.current.concat(
        Array(items.length - refDroppables.current.length),
      );
      setStateDndRefs((cur) => ({
        ...cur,
        droppableElements: [...refDroppables.current],
      }));
    }
  }, [items.length, setStateDndRefs]);
  useBeforeRender(() => {}, [items]);

  const onMouseEnter = useCallback(
    ({ index }: { index: number }) =>
      (event: React.MouseEvent<HTMLElement>) => {
        // console.log("[onMouseEnter]", index);
        // setStateIsMouseOverThis(true);
        if (stateIsDragging) {
          // console.log("[Enter]:", index);
        }
      },
    [stateIsDragging],
  );

  const onMouseLeave = useCallback(
    ({ index }: { index: number }) =>
      (event: React.MouseEvent<HTMLElement>) => {
        // console.log("[onMouseLeave]", index);
        // setStateIsMouseOverThis(false);
        if (stateIsDragging) {
          // console.log("[Leave]:", index);
        }
      },
    [stateIsDragging],
  );

  // useEffect(() => {
  //   setStateDroppableEventHandlers({
  //     onDragEnter: onMouseEnter,
  //     onDragLeave: onMouseLeave,
  //   });
  // }, [setStateDroppableEventHandlers, onMouseEnter, onMouseLeave]);

  /////////////////////////////////////////////////////
  // Droppable related
  // [1] Triggered: Continuously while the dragged item is over a valid drop target.
  // [2] Use case: Prevent the default behavior (which disables dropping) and optionally update visuals dynamically.
  // [3] Common Methods/Properties:
  // e.preventDefault(): Allows the drop operation.
  // e.dataTransfer.dropEffect: Indicates the type of drag-and-drop operation (copy, move, etc.).
  // dropTarget.addEventListener('dragover', (e) => {
  //   e.preventDefault(); // Must call to allow drop
  //   e.dataTransfer.dropEffect = 'move';
  //   console.log('Drag over target');
  // });
  // const onDragOver = useCallback(
  //   ({ category }: { category: T }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDragOver]");
  //       event.preventDefault(); // Allow drop over
  //       // event.dataTransfer.dropEffect = stateDropEffect;
  //     },
  //   [],
  // );
  // [1] Triggered: When a dragged item enters a valid drop target.
  // [2] Use case: Highlight potential drop targets or provide visual feedback.
  // [3] Common Methods/Properties:
  // e.target: Refers to the potential drop zone.
  //
  // dropTarget.addEventListener('dragenter', (e) => {
  //   e.target.style.backgroundColor = 'lightblue';
  //   console.log('Drag entered target');
  // });
  // const onDragEnter = useCallback(() => {
  //   console.log("[onDragEnter]");
  //   setStateIsDraggedOver(true);
  // }, []);
  // [1] Triggered: When the dragged item leaves a valid drop target.
  // [2] Use case: Revert visual feedback or clean up styles.
  // [3] Common Methods/Properties:
  // Similar to dragenter.
  //
  // dropTarget.addEventListener('dragleave', (e) => {
  //   e.target.style.backgroundColor = '';
  //   console.log('Drag left target');
  // });
  // const onDragLeave = useCallback(() => {
  //   console.log("[onDragLeave]");
  //   setStateIsDraggedOver(false);
  // }, []);
  // [1] Triggered: When the dragged item is dropped on a valid target.
  // [2] Use case: Handle the drop logic, such as retrieving the transferred data or moving elements.
  // [3] Common Methods/Properties:
  //e.dataTransfer.getData(type): Retrieves the data set in dragstart.
  //e.preventDefault(): Stops default handling of the drop event.
  //
  // dropTarget.addEventListener('drop', (e) => {
  //   e.preventDefault();
  //   const data = e.dataTransfer.getData('text/plain');
  //   console.log(`Dropped data: ${data}`);
  // });
  // const onDrop = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDrop]");
  //       event.preventDefault();
  //       console.log(JSON.parse(event.dataTransfer.getData("application/json")));
  //     },
  //   [],
  // );
  /////////////////////////////////////////////////////

  const setDroppableRef = useMemo(
    () =>
      ({ index }: { index: number }) =>
      (node: HTMLElement | null) => {
        if (node) {
          refDroppables.current[index] = node;
        }
      },
    [],
  );

  /////////////////////////////////////////////////////

  const droppableProvided = useMemo(
    () =>
      ({ index }: { index: number }) => ({
        onMouseEnter: onMouseEnter({ index }),
        onMouseLeave: onMouseLeave({ index }),
        // onDragOver,
        // onDragEnter,
        // onDragLeave,
        // onDrop,
      }),
    [
      onMouseEnter,
      onMouseLeave,
      // onDragOver,
      // onDrop
    ],
  );

  const ret = useMemo(
    () => ({
      isDragging: stateIsDragging,
      setDroppableRef,
      droppableProvided,
    }),
    [setDroppableRef, stateIsDragging, , droppableProvided],
  );
  return ret;
};

export type UseDndParams<
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
  DroppableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
> = {
  useDraggableParams: UseDraggableParams<DraggableItemSpec>;
  useDroppableParams: UseDroppableParams<DraggableItemSpec, DroppableItemSpec>;
};

export const useDnd = <
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
  DroppableItemSpec extends UseDroppableItemBaseSpec = UseDroppableItemBaseSpec,
>(
  props: UseDndParams<DraggableItemSpec, DroppableItemSpec>,
) => {
  const retUseDraggable = useDraggable({ ...props.useDraggableParams });
  const retUseDroppable = useDroppable({ ...props.useDroppableParams });

  const idSetDraggableAndDroppableRef = useMemoizeCallbackId();
  const setDraggableAndDroppableRef = useCallback(
    ({
      index,
      shouldAttachHandleToThis,
    }: {
      index: number;
      shouldAttachHandleToThis?: boolean;
    }) =>
      memoizeCallback({
        fn: (node: HTMLElement | null) => {
          retUseDraggable.setDraggableRef({ index, shouldAttachHandleToThis })(
            node,
          );
          retUseDroppable.setDroppableRef({ index })(node);
        },
        id: idSetDraggableAndDroppableRef,
        deps: [
          index,
          idSetDraggableAndDroppableRef,
          shouldAttachHandleToThis,
          retUseDraggable,
          retUseDroppable,
        ],
      }),
    [idSetDraggableAndDroppableRef, retUseDraggable, retUseDroppable],
  );

  const ret = useMemo(
    () => ({
      setDraggableAndDroppableRef,
      retUseDraggable,
      retUseDroppable,
    }),
    [setDraggableAndDroppableRef, retUseDraggable, retUseDroppable],
  );

  return ret;
};