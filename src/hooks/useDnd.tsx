import React, { useCallback, useMemo, useRef, useState } from "react";
import parse from "html-react-parser";
import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { useUniqueRandomIds } from "@/hooks/useUniqueRandomIds";
import { emptyArray, memoizeCallback } from "@/utils";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { useDeviceDetector } from "@/hooks/useDeviceDetector";
import { dndGlobalState, UseDndRootHandle } from "@/components/UseDndRoot";

// export type DndAtomState = {
//   [contextId: string]: {
//     droppables: {
//       [droppableId: string]: {};
//     };
//     draggables: {
//       [draggableId: string]: {};
//     };
//   };
// };
// export type DndAtomParams = { contextId: string };

// export const dndAtom = atomFamily<DndAtomState, DndAtomParams>({
//   key: "dndAtom",
//   default: ({ contextId }) => {
//     return {
//       [contextId]: {
//         droppables: {},
//         draggables: {},
//       },
//     };
//   },
// });

export type CustomDragStartEvent = CustomEvent<{
  pointerEvent: PointerEvent | null;
}>;

export type UseDndParams = {
  dndRootHandle: UseDndRootHandle | null;
  contextId?: string;
};

export const useDnd = ({ dndRootHandle, contextId }: UseDndParams) => {
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
  const curDragOverlayPos = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const refDragOverlay = useRef<HTMLElement | null>(null);
  const [stateDragOverlay, setStateDragOverlay] =
    useState<React.ReactNode | null>(null);
  const refCurActiveDraggableCandidate = useRef<HTMLElement | null>(null);
  // ㄴ We need this because pointerEvent.target is the drag handle, not the actual `Draggable` target. We need to store the active candidate `Draggable` temporarily in here.
  const refCurActiveDraggableForNoContextId = useRef<HTMLElement | null>(null);

  ////////////////////////////////////////////

  const hideDragCursorArea = useCallback(() => {
    if (!contextId) {
      console.warn("[hideDragCursorArea] !contextId");
      return;
    }

    const dndState = dndGlobalState.getDndContext({ contextId });
    if (!dndState) {
      console.warn("[hideDragCursorArea] !dndState");
      return;
    }

    if (dndState.dndRootDragCursorArea && dndState.dndRootChildrenWrapper) {
      const { offsetWidth, offsetHeight } = dndState.dndRootDragCursorArea;
      const x = -offsetWidth;
      const y = -offsetHeight;
      dndState.dndRootDragCursorArea.style.setProperty(
        "transform",
        `translate3d(${x}px, ${y}px, 0)`,
      );
      dndState.dndRootChildrenWrapper.style.setProperty(
        "transform",
        `translate3d(${-x}px, ${-y}px, 0)`,
      );
    }
  }, [contextId]);

  const moveDragCursorAreaAndChildrenWrapper = useCallback(() => {
    if (!contextId) {
      console.warn("[moveDragCursorAreaAndChildrenWrapper] !contextId");
      return;
    }

    const dndState = dndGlobalState.getDndContext({ contextId });
    if (!dndState) {
      console.warn("[moveDragCursorAreaAndChildrenWrapper] !dndState");
      return;
    }

    if (
      dndState.dndRootDragCursorArea &&
      dndState.dndRootChildrenWrapper &&
      curPointerEvent.current
    ) {
      const { offsetWidth, offsetHeight } = dndState.dndRootDragCursorArea;
      const x = curPointerEvent.current.clientX - offsetWidth / 2;
      const y = curPointerEvent.current.clientY - offsetHeight / 2;
      dndState.dndRootDragCursorArea.style.setProperty(
        "transform",
        `translate3d(${x}px, ${y}px, 0)`,
      );
      dndState.dndRootChildrenWrapper.style.setProperty(
        "transform",
        `translate3d(${-x}px, ${-y}px, 0)`,
      );
    }
  }, [contextId]);

  const setCurActiveDroppable = useCallback(() => {
    if (!contextId) {
      console.warn("[setCurActiveDroppable] !contextId");
      return;
    }

    const dndState = dndGlobalState.getDndContext({ contextId });
    if (!dndState) {
      console.warn("[setCurActiveDroppable] !dndState");
      return;
    }

    if (!dndState.curActiveDraggable || !curPointerEvent.current) {
      console.warn("[setCurActiveDroppable] !curActiveDraggable");
      return;
    }

    const dataActiveDraggableContextId =
      dndState.curActiveDraggable.getAttribute("data-context-id");
    const dataActiveDraggableId =
      dndState.curActiveDraggable.getAttribute("data-draggable-id");
    const dataActiveDraggableTagKey = dndState.curActiveDraggable.getAttribute(
      "data-draggable-tag-key",
    );

    if (
      !dataActiveDraggableContextId ||
      !dataActiveDraggableId ||
      !dataActiveDraggableTagKey
    ) {
      console.warn(
        "[setCurActiveDroppable] !dataContextId || !dataDraggableId || !dataDraggableTagKey)",
      );
      return;
    }

    // Result: topmost -> bottommost in viewport
    const underlyingElements = document.elementsFromPoint(
      curPointerEvent.current.clientX,
      curPointerEvent.current.clientY,
    );
    // console.log(underlyingElements);

    for (let i = 0; i < underlyingElements.length; i++) {
      const underlyingElement = underlyingElements[i];
      const dataDroppable = underlyingElement.getAttribute("data-droppable");
      const dataDroppableContextId =
        underlyingElement.getAttribute("data-context-id");
      const dataDroppableId =
        underlyingElement.getAttribute("data-droppable-id");

      if (!dataDroppable || !dataDroppableContextId || !dataDroppableId) {
        continue;
      }
      const droppable = underlyingElement as HTMLElement;

      const dataTagKeysAcceptableStr = droppable.getAttribute(
        "data-droppable-tag-keys-acceptable",
      );
      if (!dataTagKeysAcceptableStr) {
        continue;
      }
      const dataDroppableTagKeysAcceptable: string[] = JSON.parse(
        dataTagKeysAcceptableStr.replaceAll(/'/g, '"'),
      );

      if (
        !(
          dataActiveDraggableContextId === dataDroppableContextId &&
          dataDroppableTagKeysAcceptable.includes(dataActiveDraggableTagKey)
        )
      ) {
        continue;
      }

      dndState.curActiveDroppable = droppable;
      return;
    }
  }, [contextId]);

  const setDragOverlay = useCallback(() => {
    if (!curPointerEvent.current) {
      return;
    }

    let curActiveDraggable: HTMLElement | null = null;
    if (!contextId) {
      curActiveDraggable = refCurActiveDraggableForNoContextId.current;
    } else {
      const dndState = dndGlobalState.getDndContext({ contextId });
      if (!dndState) {
        console.warn("[setDragOverlay] !dndState");
        return;
      }
      curActiveDraggable = dndState.curActiveDraggable;
    }
    if (!curActiveDraggable) {
      console.warn("[setDragOverlay] !curActiveDraggable");
      return;
    }

    let width = 0;
    let height = 0;
    let x = 0;
    let y = 0;
    if (!isDragMoving.current) {
      // refCurActiveDraggableForNoContextId.
      const draggableRect = curActiveDraggable.getBoundingClientRect();
      width = draggableRect.width;
      height = draggableRect.height;
      x = draggableRect.x;
      y = draggableRect.y;

      curDragOverlayPos.current = {
        x,
        y,
      };
    } else {
      width = curActiveDraggable.offsetWidth;
      height = curActiveDraggable.offsetHeight;
      x = curDragOverlayPos.current.x += curPointerDelta.current.x;
      y = curDragOverlayPos.current.y += curPointerDelta.current.y;
    }

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

    let dragOverlay: React.ReactNode = null;
    if (refDragOverlay.current) {
      Object.assign(refDragOverlay.current.style, dragOverlayStyleToInject);
    } else {
      const dragOverlayTmp = parse(curActiveDraggable.outerHTML);
      if (typeof dragOverlayTmp === "string" || Array.isArray(dragOverlayTmp)) {
        dragOverlay = React.createElement("div", {
          ref: (el: HTMLElement | null): void => {
            refDragOverlay.current = el;
          },
          dangerouslySetInnerHTML: {
            __html: curActiveDraggable.outerHTML,
          },
          style: dragOverlayStyleToInject,
        });
      } else {
        dragOverlay = React.cloneElement(
          dragOverlayTmp,
          {
            ref: (el: HTMLElement | null): void => {
              refDragOverlay.current = el;
            },
            style: dragOverlayStyleToInject,
          },
          // Uncaught Error: Can only set one of `children` or `props.dangerouslySetInnerHTML`.
        );
      }

      setStateDragOverlay(dragOverlay);
    }
  }, [contextId]);

  const onCustomDragStart = useCallback(
    (event: Event) => {
      console.log("[onCustomDragStart]");

      if (!refCurActiveDraggableCandidate.current) {
        console.warn(
          "[onCustomDragStart] !refCurActiveDraggableCandidate.current",
        );
        return;
      }

      isDragging.current = true;

      const customDragEvent = event as CustomDragStartEvent;
      const { pointerEvent } = customDragEvent.detail;
      curPointerEvent.current = pointerEvent;

      if (!contextId) {
        refCurActiveDraggableForNoContextId.current =
          refCurActiveDraggableCandidate.current;
      } else {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[onCustomDragStart] !dndState");
          return;
        }
        dndState.curActiveDraggable = refCurActiveDraggableCandidate.current;
        dndState.curActiveDraggable.classList.add("drag-placeholder");
      }

      moveDragCursorAreaAndChildrenWrapper();
      setDragOverlay();
      setCurActiveDroppable();
    },
    [
      contextId,
      setDragOverlay,
      moveDragCursorAreaAndChildrenWrapper,
      setCurActiveDroppable,
    ],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      // console.log("[onPointerMove]");

      isDragMoving.current = isDragging.current;
      curPointerEvent.current = event;
      
      if (isDragMoving.current) {
        curPointerDelta.current.x += event.movementX;
        curPointerDelta.current.y += event.movementY;

        moveDragCursorAreaAndChildrenWrapper();
        setDragOverlay();
        setCurActiveDroppable();

        curPointerDelta.current.x = 0;
        curPointerDelta.current.y = 0;
      }
    },
    [
      moveDragCursorAreaAndChildrenWrapper,
      setDragOverlay,
      setCurActiveDroppable,
    ],
  );

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

      if (!dndRootHandle?.baseElement) {
        console.warn("[updateDuration] !refDndRoot.current?.baseElement");
        return;
      }
      dndRootHandle.baseElement.addEventListener(
        "custom-drag-start",
        onCustomDragStart,
        {
          once: true,
        },
      );
      dndRootHandle.baseElement.dispatchEvent(customDragStartEvent);
    }
  }, [dndRootHandle?.baseElement, onCustomDragStart]);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      console.log("[onPointerDown]");

      isPointerDown.current = true;
      pressStartTime.current = Date.now();
      clearInterval(intervalId.current);
      isDragging.current = false;

      curPointerEvent.current = event;

      // console.log(event.target);
      // console.log(event.currentTarget);
      // console.log(event.relatedTarget);

      updateDuration();

      if (event.target) {
        // ㄴ DragHandle
        const target = event.target as HTMLElement;

        const dataDraggableContextId = target.getAttribute("data-context-id");
        const dataDraggableHandleId = target.getAttribute(
          "data-draggable-handle-id",
        );

        console.log("dataDraggableContextId:", dataDraggableContextId);
        console.log("dataDraggableHandleId:", dataDraggableHandleId);

        if (dataDraggableContextId && dataDraggableHandleId) {
          const draggable = !contextId
            ? (document.querySelector(
                `[data-draggable="true"][data-draggable-id="${dataDraggableHandleId}"]`, // TODO: add condition: no data-context-id key value pair
              ) as HTMLElement | null)
            : (document.querySelector(
                `[data-draggable="true"][data-context-id="${dataDraggableContextId}"][data-draggable-id="${dataDraggableHandleId}"]`,
              ) as HTMLElement | null);

          console.log(draggable);
          if (draggable) {
            refCurActiveDraggableCandidate.current = draggable;
          }
        }
      }
    },
    [contextId, updateDuration],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      console.log("[onPointerUp]");

      isPointerDown.current = false;
      pressStartTime.current = 0;
      clearInterval(intervalId.current);
      isDragging.current = false;
      isDragMoving.current = false;

      curPointerEvent.current = event;
      curPointerDelta.current = {
        x: 0,
        y: 0,
      };
      curDragOverlayPos.current = {
        x: 0,
        y: 0,
      };

      refDragOverlay.current = null;
      setStateDragOverlay(null);

      refCurActiveDraggableCandidate.current?.classList.remove(
        "drag-placeholder",
      );
      refCurActiveDraggableCandidate.current = null;

      if (contextId) {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[onPointerUp] !dndState");
          return;
        }
        dndState.curActiveDraggable = null;
        dndState.curActiveDroppable = null;

        hideDragCursorArea();
      } else {
        refCurActiveDraggableForNoContextId.current = null;
      }
    },
    [contextId, hideDragCursorArea],
  );

  const onDragStart = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!dndRootHandle?.baseElement) {
      return;
    } else {
      dndRootHandle.baseElement.addEventListener("pointerdown", onPointerDown);
      dndRootHandle.baseElement.addEventListener("pointermove", onPointerMove);
      dndRootHandle.baseElement.addEventListener("pointerup", onPointerUp);
    }

    // The ref value 'refDndRoot.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'refDndRoot.current' to a variable inside the effect, and use that variable in the cleanup function.
    return () => {
      if (!dndRootHandle?.baseElement) {
        console.warn("[useIsomorphicLayoutEffect] !dndRootHandle?.baseElement");
        return;
      }
      dndRootHandle.baseElement.addEventListener("pointerdown", onPointerDown);
      dndRootHandle.baseElement.removeEventListener(
        "pointermove",
        onPointerMove,
      );
      dndRootHandle.baseElement.removeEventListener("pointerup", onPointerUp);
    };
  }, [dndRootHandle?.baseElement, onPointerDown, onPointerMove, onPointerUp]);

  const enableTouDeviceSupport = useCallback((event: TouchEvent) => {
    event.preventDefault();
  }, []);

  const { getDeviceDetector } = useDeviceDetector();
  const { getIsTouchDevice } = getDeviceDetector();
  const preventContextMenuOnDrag = useCallback(
    (event: MouseEvent) => {
      const isTouchDevice = getIsTouchDevice();
      if (isTouchDevice && !isDragging.current) {
        event.preventDefault();
      }
    },
    [getIsTouchDevice],
  );

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

    if (dndRootHandle?.baseElement) {
      dndRootHandle.baseElement.addEventListener(
        "touchmove",
        enableTouDeviceSupport,
        {
          passive: false,
        },
      );

      dndRootHandle.baseElement.addEventListener(
        "contextmenu",
        preventContextMenuOnDrag,
        {
          passive: false,
        },
      );
    }

    return () => {
      if (!dndRootHandle?.baseElement) {
        return;
      }
      dndRootHandle.baseElement.removeEventListener(
        "touchmove",
        enableTouDeviceSupport,
      );
      dndRootHandle.baseElement.removeEventListener(
        "contextmenu",
        preventContextMenuOnDrag,
      );
    };
  }, [
    dndRootHandle?.baseElement,
    enableTouDeviceSupport,
    preventContextMenuOnDrag,
  ]);

  useIsomorphicLayoutEffect(() => {
    refDragOverlay.current?.classList.add("drag-overlay");
    refDragOverlay.current?.classList.remove("drag-placeholder");

    if (contextId) {
      const dndState = dndGlobalState.getDndContext({
        contextId,
      });
      if (!dndState) {
        console.warn("[useIsomorphicLayoutEffect] !dndState");
      } else {
        dndState.curActiveDraggable?.classList.add("drag-placeholder");
      }
    } else {
      refCurActiveDraggableForNoContextId.current?.classList.add(
        "drag-placeholder",
      );
    }
  }, [stateDragOverlay, contextId]);

  ////////////////////////////////////////////

  const idSetDraggableRef = useMemoizeCallbackId();
  const setDraggableRef = useCallback(
    ({ draggableId, tagKey }: { draggableId: string; tagKey: string }) =>
      memoizeCallback({
        id: idSetDraggableRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("draggable");

            // TODO:
            el.setAttribute("data-draggable", "true");

            if (contextId) {
              el.setAttribute("data-draggable-id", draggableId);
              el.setAttribute("data-context-id", contextId);
              el.setAttribute("data-draggable-tag-key", tagKey);

              const dndState = dndGlobalState.getDndContext({
                contextId,
              });
              if (!dndState) {
                console.warn("[setDraggableRef] !dndState");
                return;
              }
              dndState.dndRootElementsPendingToBeObserved.set(el, el);
            }
          }
        },
        deps: [draggableId, tagKey, idSetDraggableRef, contextId],
      }),
    [idSetDraggableRef, contextId],
  );

  const idSetDraggableHandleRef = useMemoizeCallbackId();
  const setDraggableHandleRef = useCallback(
    ({ draggableId }: { draggableId: string }) =>
      memoizeCallback({
        id: idSetDraggableHandleRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("drag-handle");

            el.setAttribute("draggable", "true"); // 드래그로 텍스트 블록 처리 되는거 방지용도로만 적용시킴
            el.setAttribute("tabindex", "0");

            if (contextId) {
              el.setAttribute("data-context-id", contextId);
            }

            el.setAttribute("data-draggable-handle-id", draggableId);
          }
        },
        deps: [draggableId, idSetDraggableHandleRef, contextId],
      }),
    [idSetDraggableHandleRef, contextId],
  );

  return {
    DragOverlay: stateDragOverlay,
    onDragStart,
    // setGroupsRef,
    setDraggableRef,
    setDraggableHandleRef,
  };
};
