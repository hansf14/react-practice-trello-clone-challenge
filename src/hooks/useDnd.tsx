import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import parse from "html-react-parser";
import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { useUniqueRandomIds } from "@/hooks/useUniqueRandomIds";
import { memoizeCallback, withMemoAndRef } from "@/utils";
import { atomFamily, useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { getDeviceDetector } from "@/hooks/useDeviceDetector";

type GroupHandle = {
  remove: ({ index }: { index: number }) => void;
  add: ({
    index,
    newItem,
  }: {
    index: number;
    newItem: React.ReactNode;
  }) => void;
  move: ({
    indexOld,
    indexNew,
  }: {
    indexOld: number;
    indexNew: number;
  }) => void;
  items: React.ReactNode[];
  groupKey: string;
  setGroupKey: ({ groupKey }: { groupKey: string }) => void;
};

type GroupProps = {
  children: React.ReactNode;
};

export const Group = withMemoAndRef<"template", GroupHandle, GroupProps>({
  displayName: "Group",
  Component: ({ children }, ref) => {
    const [stateItems, setStateItems] = useState<React.ReactNode[]>(
      React.Children.toArray(children ?? []),
    );
    const refGroupKey = useRef<string>("");

    useImperativeHandle(ref, () => {
      return {
        remove: ({ index }) => {
          setStateItems((curItems) => {
            const newItems = [...curItems];
            newItems.splice(index, 1);
            return newItems;
          });
        },
        add: ({ index, newItem }) => {
          setStateItems((curItems) => {
            const newItems = [...curItems];
            newItems.splice(index, 0, newItem);
            return newItems;
          });
        },
        move: ({ indexOld, indexNew }) => {
          setStateItems((curItems) => {
            const newItems = [...curItems];
            const [target] = newItems.splice(indexOld, 1);
            newItems.splice(indexNew, 0, target);
            return newItems;
          });
        },
        items: stateItems,
        groupKey: refGroupKey.current,
        setGroupKey: ({ groupKey }) => {
          refGroupKey.current = groupKey;
        },
      };
    });

    return <>{stateItems}</>;
  },
});

export type DndAtomState = {
  [contextId: string]: {
    droppables: {
      [droppableId: string]: {};
    };
    draggables: {
      [draggableId: string]: {};
    };
  };
};
export type DndAtomParams = { contextId: string };

export const dndAtom = atomFamily<DndAtomState, DndAtomParams>({
  key: "dndAtom",
  default: ({ contextId }) => {
    return {
      [contextId]: {
        droppables: {},
        draggables: {},
      },
    };
  },
});

export type CustomDragStartEvent = CustomEvent<{
  pointerEvent: PointerEvent | null;
}>;

export type UseDndParams = {
  contextId: string;
  droppableCount: number;
  draggableCount: number;
};

export const useDnd = (params: UseDndParams) => {
  const { contextId, droppableCount, draggableCount } = params;

  let { ids: droppableIds, keepOrExpandIds: keepOrExpandDroppableIds } =
    useUniqueRandomIds({ count: droppableCount });
  const refDroppableIds = useRef<string[]>(droppableIds);
  useBeforeRender(() => {
    refDroppableIds.current = keepOrExpandDroppableIds({
      newCount: droppableCount,
    });
  }, [droppableCount, keepOrExpandDroppableIds]);

  let { ids: draggableIds, keepOrExpandIds: keepOrExpandDraggableIds } =
    useUniqueRandomIds({ count: draggableCount });
  const refDraggableIds = useRef<string[]>(draggableIds);
  useBeforeRender(() => {
    refDraggableIds.current = keepOrExpandDraggableIds({
      newCount: draggableCount,
    });
  }, [draggableCount, keepOrExpandDraggableIds]);

  const [stateDnd, setStateDnd] = useRecoilState(dndAtom({ contextId }));

  ////////////////////////////////////////////

  const { getIsTouchDevice } = getDeviceDetector();
  const isTouchDevice = getIsTouchDevice();

  const isPointerDown = useRef<boolean>(false);
  const pressStartTime = useRef<number>(0);
  const intervalId = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isDragMoving = useRef<boolean>(false);
  const curPointerEvent = useRef<PointerEvent | null>(null);
  const curPointerDelta = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const relativePosOfHandleToDraggable = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // const curActiveDraggableCandidateRect = useRef<DOMRect | null>(null);
  const curDragOverlayPos = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const curDraggableHandle = useRef<HTMLElement | null>(null);
  const curActiveDraggableCandidate = useRef<HTMLElement | null>(null);
  const [curActiveDraggable, setCurActiveDraggable] =
    useState<HTMLElement | null>(null);
  const [stateDragOverlay, setStateDragOverlay] =
    useState<React.ReactNode | null>(null);
  const refDragOverlay = useRef<HTMLElement | null>(null);

  ////////////////////////////////////////////

  const createDragOverlay = useCallback(() => {
    if (!curActiveDraggableCandidate.current || !curPointerEvent.current) {
      return;
    }

    let width = 0;
    let height = 0;
    let x = 0;
    let y = 0;
    if (!isDragMoving.current) {
      const draggableRect =
        curActiveDraggableCandidate.current.getBoundingClientRect();
      width = draggableRect.width;
      height = draggableRect.height;
      x = draggableRect.x;
      y = draggableRect.y;

      curDragOverlayPos.current = {
        x,
        y,
      };

      // curActiveDraggableCandidateRect.current = draggableRect;

      // if (curDraggableHandle.current) {
      //   const { x: handleX, y: handleY } =
      //     curDraggableHandle.current.getBoundingClientRect();
      //   relativePosOfHandleToDraggable.current.x = handleX - x;
      //   relativePosOfHandleToDraggable.current.y = handleY - y;
      // }
    } else {
      width = curActiveDraggableCandidate.current.offsetWidth;
      height = curActiveDraggableCandidate.current.offsetHeight;
      x = curDragOverlayPos.current.x += curPointerDelta.current.x;
      y = curDragOverlayPos.current.y += curPointerDelta.current.y;

      // if (curActiveDraggableCandidateRect.current) {
      //   const { clientX, clientY } = curPointerEvent.current;
      //   width = curActiveDraggableCandidate.current.offsetWidth;
      //   height = curActiveDraggableCandidate.current.offsetHeight;
      //   const pointerToDraggablePos = {
      //     x: clientX - curActiveDraggableCandidateRect.current.x,
      //     y: clientY - curActiveDraggableCandidateRect.current.y,
      //   };
      //   x = clientX + curPointerDelta.current.x + pointerToDraggablePos.x; //-
      //   // relativePosOfHandleToDraggable.current.x;
      //   y = clientY + curPointerDelta.current.y + pointerToDraggablePos.y; //-
      //   // relativePosOfHandleToDraggable.current.y;
      // }
    }
    // console.log(width, height, x, y);

    // * Method 1.
    // const { width, height, x, y } =
    //   curActiveDraggableCandidate.current.getBoundingClientRect();

    // * Method 2.
    // const {
    //   offsetWidth: width,
    //   offsetHeight: height,
    //   offsetTop,
    //   offsetLeft,
    // } = curActiveDraggableCandidate.current;
    // let curElement: HTMLElement | null = curActiveDraggableCandidate.current;
    // let x = 0;
    // let y = 0;
    // let xOffset = 0;
    // let yOffset = 0;
    // while (curElement) {
    //   xOffset += curElement.offsetLeft;
    //   yOffset += curElement.offsetTop;
    //   curElement = curElement.offsetParent as HTMLElement | null;
    // }
    // // Now totalX, totalY should represent the element’s top-left corner relative to the document.
    // // Add window scroll to get viewport-based coordinates if needed:
    // xOffset -= window.scrollX;
    // yOffset -= window.scrollY;
    // x = xOffset;
    // y = yOffset;

    const cloneOfActiveDraggable =
      curActiveDraggableCandidate.current.cloneNode(true) as HTMLElement;

    const dragOverlayStyleToInject = {
      position: "fixed",
      width,
      height,
      top: "0",
      left: "0",
      // backfaceVisibility: "hidden", // For performance and visually smoother 3D transforms
      transform: `translate3d(${x}px, ${y}px, 0)`,
      pointerEvents: "none",
    } satisfies React.CSSProperties;

    ////////////////////////////////////////////

    const dragOverlayTmp = parse(cloneOfActiveDraggable.outerHTML);
    let dragOverlay: React.ReactNode = null;
    if (typeof dragOverlayTmp === "string" || Array.isArray(dragOverlayTmp)) {
      dragOverlay = React.createElement(
        "div",
        // refCurActiveDraggableCandidate.current.tagName.toLowerCase(),
        // Any tag name, it doesn't matter, because this is the wrapper element since we're going to use `outerHTML`.
        {
          ref: refDragOverlay,
          dangerouslySetInnerHTML: {
            __html: curActiveDraggableCandidate.current.outerHTML,
          },
          style: dragOverlayStyleToInject,
        },
      );
    } else {
      dragOverlay = React.cloneElement(
        dragOverlayTmp,
        {
          ref: refDragOverlay,
          style: dragOverlayStyleToInject,
        },
        // Uncaught Error: Can only set one of `children` or `props.dangerouslySetInnerHTML`.
      );
    }

    // console.log(dragOverlay);
    setStateDragOverlay(dragOverlay);
    // dragOverlay &&
    //   dragOverlay.setPointerCapture(curPointerEvent.current.pointerId);
  }, []);

  const updateDuration = useCallback(() => {
    if (isDragging.current || !curPointerEvent.current) {
      // if (!isPointerDown.current || isDragging.current) {
      return;
    }
    if (curPointerEvent.current.target) {
      const target = curPointerEvent.current.target as HTMLElement;
      const dataDraggableHandleId = target.getAttribute(
        "data-draggable-handle-id",
      );
      if (!dataDraggableHandleId) {
        return;
      }
    }

    // console.log("isPointerDown.current:", isPointerDown.current);
    // console.log("isDragging.current:", isDragging.current);

    clearTimeout(intervalId.current);
    intervalId.current = setTimeout(
      () => updateDuration(),
      500,
    ) as unknown as number;

    const currentDuration = Date.now() - pressStartTime.current;
    console.log(`Held down for ${currentDuration} ms so far.`);

    if (!isDragging.current && currentDuration >= 2000) {
      const customDragStartEvent: CustomDragStartEvent = new CustomEvent(
        "custom-drag-start",
        {
          detail: {
            pointerEvent: curPointerEvent.current,
          },
        },
      );
      document.body.addEventListener("custom-drag-start", onCustomDragStart, {
        once: true,
      });
      document.body.dispatchEvent(customDragStartEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createDragOverlay]);

  ////////////////////////////////////////////

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      // console.log("[onPointerMove]");
      curPointerEvent.current = event;
      if (isDragMoving.current) {
        curPointerDelta.current.x += event.movementX;
        curPointerDelta.current.y += event.movementY;

        createDragOverlay();

        curPointerDelta.current.x = 0;
        curPointerDelta.current.y = 0;

        const underlyingElement = document.elementFromPoint(
          event.clientX,
          event.clientY,
        );
        // console.log(underlyingElement);
        // underlyingElement.dispatchEvent(new PointerEvent(event.type, event));

        const {
          element: droppable,
          dataContextId: droppableDataContextId,
          dataDroppableId,
        } = findDroppable({
          curElement: underlyingElement as HTMLElement | null,
        }) ?? {};

        // console.log(droppable);
        if (droppable) {
          const keysAcceptable = droppable.getAttribute(
            "data-droppable-tag-keys-acceptable",
          );
          if (keysAcceptable) {
            const _keysAcceptable: string[] = JSON.parse(
              keysAcceptable.replaceAll(/'/g, '"'),
            );
            // console.log(_keysAcceptable);
            // console.log(curActiveDraggable);

            if (curActiveDraggable) {
              const dataContextId =
                curActiveDraggable.getAttribute("data-context-id");
              const dataDraggableId =
                curActiveDraggable.getAttribute("data-draggable-id");
              const dataDraggableTagKey = curActiveDraggable.getAttribute(
                "data-draggable-tag-key",
              );

              if (
                dataContextId &&
                dataDraggableId &&
                dataDraggableTagKey &&
                dataContextId === droppableDataContextId &&
                _keysAcceptable.includes(dataDraggableTagKey) &&
                dataDroppableId
              ) {
                console.log(refGroups.current[dataDroppableId]);
                // TODO:
              }
            }
          }
        }

        function findDroppable({
          curElement,
        }: {
          curElement: HTMLElement | null;
        }) {
          if (curElement) {
            const dataContextId = curElement.getAttribute("data-context-id");
            const dataDroppableId =
              curElement.getAttribute("data-droppable-id");

            if (dataContextId && dataDroppableId) {
              const droppable = document.querySelector(
                `[data-context-id="${dataContextId}"][data-droppable-id="${dataDroppableId}"]`,
              ) as HTMLElement | null;
              if (droppable) {
                return { element: droppable, dataContextId, dataDroppableId };
              }
            } else {
              return findDroppable({
                curElement: curElement.parentElement,
              });
            }
          }
          return null;
        }
      }
    },
    [curActiveDraggable, createDragOverlay],
  );

  const onCustomDragStart = useCallback(
    (event: Event) => {
      console.log("[onCustomDragStart]");

      createDragOverlay(); // Initial pos
      isDragging.current = true;
      isDragMoving.current = true;

      const customDragEvent = event as CustomDragStartEvent;
      // const {
      //   //  pointerEvent
      // } = customDragEvent.detail;

      if (curActiveDraggableCandidate.current) {
        setCurActiveDraggable(curActiveDraggableCandidate.current);
        curActiveDraggableCandidate.current.classList.add("drag-placeholder");
      }

      createDragOverlay(); // Update pos
    },
    [createDragOverlay],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      console.log("[onPointerDown]");
      isPointerDown.current = true;
      pressStartTime.current = Date.now();
      clearInterval(intervalId.current);
      isDragging.current = false;

      curPointerEvent.current = event;

      updateDuration();

      // console.log(event.currentTarget);
      if (event.target) {
        const target = event.target as HTMLElement;
        const dataContextId = target.getAttribute("data-context-id");
        const dataDraggableHandleId = target.getAttribute(
          "data-draggable-handle-id",
        );
        const dataDraggableId = dataDraggableHandleId;

        if (dataContextId && dataDraggableHandleId && dataDraggableId) {
          const draggable: HTMLElement | null = document.querySelector(
            `[data-context-id="${dataContextId}"][data-draggable-id="${dataDraggableId}"]`,
          );
          // console.log("dataContextId:", dataContextId);
          // console.log("dataDraggableHandleId:", dataDraggableHandleId);
          // console.log("dataDraggableId:", dataDraggableId);
          // console.log("draggable:", draggable);

          if (draggable) {
            curActiveDraggableCandidate.current = draggable;
            curDraggableHandle.current = event.currentTarget as HTMLElement;
          }
        }
      }
    },
    [updateDuration],
  );

  const onPointerUp = useCallback(() => {
    console.log("[onPointerUp]");
    isPointerDown.current = false;
    pressStartTime.current = 0;
    clearInterval(intervalId.current);
    isDragging.current = false;
    isDragMoving.current = false;

    curActiveDraggableCandidate.current?.classList.remove("drag-placeholder");
    curActiveDraggableCandidate.current = null;
    setCurActiveDraggable(null);

    refDragOverlay.current = null;
    setStateDragOverlay(null);
  }, []);

  const onDragStart = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  useIsomorphicLayoutEffect(() => {
    document.body.addEventListener("pointerdown", onPointerDown);
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerup", onPointerUp);

    return () => {
      document.body.addEventListener("pointerdown", onPointerDown);
      document.body.removeEventListener("pointermove", onPointerMove);
      document.body.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  // Touch device dragging support
  useIsomorphicLayoutEffect(() => {
    // document.body.addEventListener(
    //   "touchstart",
    //   (event: TouchEvent) => {
    //     event.preventDefault();
    //   },
    //   { passive: false },
    // );
    // ㄴ onClick event will not trigger
    // https://stackoverflow.com/a/13720649/11941803
    document.body.addEventListener(
      "touchmove",
      (event: TouchEvent) => {
        event.preventDefault();
      },
      { passive: false },
    );
  }, [stateDragOverlay, isTouchDevice]);

  useIsomorphicLayoutEffect(() => {
    refDragOverlay.current?.classList.add("drag-overlay");
    refDragOverlay.current?.classList.remove("drag-placeholder");
    curActiveDraggable?.classList.add("drag-placeholder");
  }, [stateDragOverlay, curActiveDraggable]);

  ////////////////////////////////////////////

  const idSetDroppableRef = useMemoizeCallbackId();
  const setDroppableRef = useCallback(
    ({
      contextId,
      index,
      tagKeysAcceptable,
    }: {
      contextId: string;
      index: number;
      tagKeysAcceptable: string[];
    }) =>
      memoizeCallback({
        id: idSetDroppableRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("droppable");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-droppable-id", droppableIds[index]);
            el.setAttribute(
              "data-droppable-tag-keys-acceptable",
              JSON.stringify(tagKeysAcceptable).replaceAll(/"/g, "'"),
            );
          }
        },
        deps: [contextId, index, idSetDroppableRef, droppableIds],
      }),
    [idSetDroppableRef, droppableIds],
  );

  const idSetDraggableRef = useMemoizeCallbackId();
  const setDraggableRef = useCallback(
    ({
      contextId,
      index,
      tagKey,
    }: {
      contextId: string;
      index: number;
      tagKey: string;
    }) =>
      memoizeCallback({
        id: idSetDraggableRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("draggable");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-id", draggableIds[index]);
            el.setAttribute("data-draggable-tag-key", tagKey);
          }
        },
        deps: [contextId, index, , idSetDraggableRef, draggableIds],
      }),
    [idSetDraggableRef, draggableIds],
  );

  const idSetDraggableHandleRef = useMemoizeCallbackId();
  const setDraggableHandleRef = useCallback(
    ({ contextId, index }: { contextId: string; index: number }) =>
      memoizeCallback({
        id: idSetDraggableHandleRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("drag-handle");

            el.setAttribute("draggable", "true"); // 드래그로 텍스트 블록 처리 되는거 방지용도로만 적용시킴
            el.setAttribute("tabindex", "0");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-handle-id", draggableIds[index]);
          }
        },
        deps: [contextId, index, idSetDraggableHandleRef, draggableIds],
      }),
    [idSetDraggableHandleRef, draggableIds],
  );

  const refGroups = useRef<{ [groupKey: string]: GroupHandle }>({});
  const idSetGroupsRef = useMemoizeCallbackId();
  const setGroupsRef = useCallback(
    ({ index }: { index: number }) =>
      memoizeCallback({
        id: idSetGroupsRef,
        fn: (el: GroupHandle | null) => {
          if (el) {
            el.setGroupKey({ groupKey: droppableIds[index] });
            refGroups.current[droppableIds[index]] = el;
          }
        },
        deps: [index, idSetGroupsRef, droppableIds],
      }),
    [idSetGroupsRef, droppableIds],
  );

  return {
    DragOverlay: stateDragOverlay,
    onDragStart,
    setGroupsRef,
    setDroppableRef,
    setDraggableRef,
    setDraggableHandleRef,
  };
};
