import React, { useCallback, useRef, useState } from "react";
import parse from "html-react-parser";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import {
  memoizeCallback,
  observeUserAgentChange,
  ObserveUserAgentChangeCb,
} from "@/utils";
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

class UseDndLocalState {
  public pressStartTime: number;
  public timerId: number;
  public rafId: number;

  public isPointerDown: boolean;
  public isDragging: boolean;
  public isDragMoving: boolean;

  public curPointerEvent: PointerEvent | null;
  public curPointerDelta: { x: number; y: number };
  public curDragOverlayPos: { x: number; y: number };

  public dragOverlay: HTMLElement | null;
  public curActiveDraggableCandidate: HTMLElement | null;
  // // ㄴ We need this because pointerEvent.target is the drag handle, not the actual `Draggable` target. We need to store the active candidate `Draggable` temporarily in here.
  public curActiveDraggableForNoContextId: HTMLElement | null;

  constructor() {
    this.pressStartTime = 0;
    this.timerId = 0;
    this.rafId = 0;

    this.isPointerDown = false;
    this.isDragging = false;
    this.isDragMoving = false;

    this.curPointerEvent = null;
    this.curPointerDelta = {
      x: 0,
      y: 0,
    };
    this.curDragOverlayPos = {
      x: 0,
      y: 0,
    };

    this.dragOverlay = null;
    this.curActiveDraggableCandidate = null;
    this.curActiveDraggableForNoContextId = null;
  }
}

export const useDnd = ({ dndRootHandle, contextId }: UseDndParams) => {
  const refLocalState = useRef<UseDndLocalState>(new UseDndLocalState());
  const [stateDragOverlay, setStateDragOverlay] =
    useState<React.ReactNode | null>(null);

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

    const { curPointerEvent } = refLocalState.current;
    if (
      dndState.dndRootDragCursorArea &&
      dndState.dndRootChildrenWrapper &&
      curPointerEvent
    ) {
      const { offsetWidth, offsetHeight } = dndState.dndRootDragCursorArea;
      const x = curPointerEvent.clientX - offsetWidth / 2;
      const y = curPointerEvent.clientY - offsetHeight / 2;
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

    const { curPointerEvent } = refLocalState.current;
    if (!dndState.curActiveDraggable || !curPointerEvent) {
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
      curPointerEvent.clientX,
      curPointerEvent.clientY,
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
    const {
      isDragMoving,
      curPointerEvent,
      curPointerDelta,
      curDragOverlayPos,
      dragOverlay,
      curActiveDraggableForNoContextId,
    } = refLocalState.current;
    if (!curPointerEvent) {
      return;
    }

    let curActiveDraggable: HTMLElement | null = null;
    if (!contextId) {
      curActiveDraggable = curActiveDraggableForNoContextId;
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
    if (!isDragMoving) {
      // refCurActiveDraggableForNoContextId.
      const draggableRect = curActiveDraggable.getBoundingClientRect();
      width = draggableRect.width;
      height = draggableRect.height;

      x = draggableRect.x;
      y = draggableRect.y;
      curDragOverlayPos.x = x;
      curDragOverlayPos.y = y;
    } else {
      width = curActiveDraggable.offsetWidth;
      height = curActiveDraggable.offsetHeight;

      x = curDragOverlayPos.x += curPointerDelta.x;
      y = curDragOverlayPos.y += curPointerDelta.y;
    }

    const dragOverlayStyleToInject = {
      position: "fixed",
      width,
      height,
      top: "0",
      left: "0",
      backfaceVisibility: "hidden", // For performance and visually smoother 3D transforms
      transform: `translate3d(${x}px, ${y}px, 0)`,
      pointerEvents: "none",
    } satisfies React.CSSProperties;

    if (dragOverlay) {
      Object.assign(dragOverlay.style, dragOverlayStyleToInject);
    } else {
      let dragOverlayTmp = parse(curActiveDraggable.outerHTML);
      if (typeof dragOverlayTmp === "string" || Array.isArray(dragOverlayTmp)) {
        dragOverlayTmp = React.createElement("div", {
          ref: (el: HTMLElement | null): void => {
            refLocalState.current = {
              ...refLocalState.current,
              dragOverlay: el,
            };
          },
          dangerouslySetInnerHTML: {
            __html: curActiveDraggable.outerHTML,
          },
          style: dragOverlayStyleToInject,
        });
      } else {
        dragOverlayTmp = React.cloneElement(
          dragOverlayTmp,
          {
            ref: (el: HTMLElement | null): void => {
              refLocalState.current = {
                ...refLocalState.current,
                dragOverlay: el,
              };
            },
            style: dragOverlayStyleToInject,
          },
          // Uncaught Error: Can only set one of `children` or `props.dangerouslySetInnerHTML`.
        );
      }

      setStateDragOverlay(dragOverlayTmp);
    }
  }, [contextId]);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      // console.log("[onPointerMove]");

      const { isDragging } = refLocalState.current;
      refLocalState.current.isDragMoving = isDragging;
      refLocalState.current.curPointerEvent = event;
      const { isDragMoving, curPointerDelta } = refLocalState.current;

      if (isDragMoving && curPointerDelta) {
        refLocalState.current.rafId = requestAnimationFrame(() => {
          curPointerDelta.x += event.movementX;
          curPointerDelta.y += event.movementY;

          moveDragCursorAreaAndChildrenWrapper();
          setDragOverlay();
          setCurActiveDroppable();

          curPointerDelta.x = 0;
          curPointerDelta.y = 0;
        });
      }
    },
    [
      moveDragCursorAreaAndChildrenWrapper,
      setDragOverlay,
      setCurActiveDroppable,
    ],
  );

  const onCustomDragStart = useCallback(
    (event: Event) => {
      console.log("[onCustomDragStart]");

      const { curActiveDraggableCandidate } = refLocalState.current;
      if (!curActiveDraggableCandidate) {
        console.warn(
          "[onCustomDragStart] !refCurActiveDraggableCandidate.current",
        );
        return;
      }

      const customDragEvent = event as CustomDragStartEvent;
      const { pointerEvent } = customDragEvent.detail;

      refLocalState.current = {
        ...refLocalState.current,
        isDragging: true,
        curPointerEvent: pointerEvent,
        curActiveDraggableForNoContextId: curActiveDraggableCandidate,
      };

      if (contextId) {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[onCustomDragStart] !dndState");
          return;
        }
        dndState.curActiveDraggable = curActiveDraggableCandidate;
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

  const updateDuration = useCallback(() => {
    const { pressStartTime, timerId, isDragging, curPointerEvent } =
      refLocalState.current;

    if (isDragging || !curPointerEvent) {
      return;
    }
    if (curPointerEvent.target) {
      const target = curPointerEvent.target as HTMLElement;
      const dataDraggableHandleId = target.getAttribute(
        "data-draggable-handle-id",
      );
      if (!dataDraggableHandleId) {
        return;
      }
    }

    clearTimeout(timerId);
    refLocalState.current = {
      ...refLocalState.current,
      timerId: setTimeout(() => updateDuration(), 500) as unknown as number,
    };

    const currentDuration = Date.now() - pressStartTime;
    console.log(`Held down for ${currentDuration} ms so far.`);

    if (!isDragging && currentDuration >= 2000) {
      const customDragStartEvent: CustomDragStartEvent = new CustomEvent(
        "custom-drag-start",
        {
          detail: {
            pointerEvent: curPointerEvent,
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

      const { timerId } = refLocalState.current;
      clearInterval(timerId);
      refLocalState.current = {
        pressStartTime: Date.now(),
        timerId: 0,
        rafId: 0,
        isPointerDown: true,
        isDragging: false,
        isDragMoving: false,
        curPointerEvent: event,
        curPointerDelta: { x: 0, y: 0 },
        curDragOverlayPos: {
          x: 0,
          y: 0,
        },
        dragOverlay: null,
        curActiveDraggableCandidate: null,
        curActiveDraggableForNoContextId: null,
      };

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
                `[data-draggable="true"][data-draggable-id="${dataDraggableHandleId}"]`,
              ) as HTMLElement | null)
            : (document.querySelector(
                `[data-draggable="true"][data-context-id="${dataDraggableContextId}"][data-draggable-id="${dataDraggableHandleId}"]`,
              ) as HTMLElement | null);

          console.log(draggable);
          if (draggable) {
            refLocalState.current = {
              ...refLocalState.current,
              curActiveDraggableCandidate: draggable,
            };
          }
        }
      }
    },
    [contextId, updateDuration],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      console.log("[onPointerUp]");

      const { timerId, curActiveDraggableCandidate } = refLocalState.current;
      clearInterval(timerId);
      curActiveDraggableCandidate?.classList.remove("drag-placeholder");
      refLocalState.current = {
        pressStartTime: 0,
        timerId: 0,
        rafId: 0,
        isPointerDown: false,
        isDragging: false,
        isDragMoving: false,
        curPointerEvent: event,
        curPointerDelta: { x: 0, y: 0 },
        curDragOverlayPos: {
          x: 0,
          y: 0,
        },
        dragOverlay: null,
        curActiveDraggableCandidate: null,
        curActiveDraggableForNoContextId: null,
      };
      setStateDragOverlay(null);

      if (contextId) {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[onPointerUp] !dndState");
          return;
        }
        dndState.curActiveDraggable = null;
        dndState.curActiveDroppable = null;

        hideDragCursorArea();
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
  const [stateUserAgentChanged, setStateUserAgentChanged] =
    useState<boolean>(false);
  const preventContextMenuOnDrag = useCallback(
    (event: MouseEvent) => {
      const isTouchDevice = getIsTouchDevice();
      if (isTouchDevice) {
        event.preventDefault();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateUserAgentChanged, getIsTouchDevice],
  );

  const userAgentChangeCb = useCallback<ObserveUserAgentChangeCb>(() => {
    setStateUserAgentChanged(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const disconnect = observeUserAgentChange({ cb: userAgentChangeCb });
    return () => {
      disconnect();
    };
  }, [userAgentChangeCb]);

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
    const { dragOverlay, curActiveDraggableForNoContextId } =
      refLocalState.current;
    dragOverlay?.classList.add("drag-overlay");
    dragOverlay?.classList.remove("drag-placeholder");

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
      curActiveDraggableForNoContextId?.classList.add("drag-placeholder");
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
