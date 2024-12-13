import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import parse from "html-react-parser";
import { css, styled } from "styled-components";
import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { useUniqueRandomIds } from "@/hooks/useUniqueRandomIds";
import { memoizeCallback, withMemoAndRef } from "@/utils";
import { atomFamily } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { MultiMap } from "@/multimap";
import { useDeviceDetector } from "@/hooks/useDeviceDetector";

let lastUserAgent = navigator.userAgent;
export function detectSwitchingFromOrToEmulator({ cb }: { cb: Function }) {
  setInterval(() => {
    if (navigator.userAgent !== lastUserAgent) {
      // console.log("userAgent changed:", navigator.userAgent);
      cb();
      lastUserAgent = navigator.userAgent;
    }
  }, 1000);
}

export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      }
      // else if (ref && typeof ref === "object") {
      //   (ref as React.MutableRefObject<T | null>).current = value;
      // }
    });
  };
}

export function isReactPortal(node: React.ReactNode) {
  return (
    node != null &&
    typeof node === "object" &&
    (node as any).$$typeof === Symbol.for("react.portal")
  );
}

export function getAllNodesAtSameHierarchy(
  element: HTMLElement,
): HTMLElement[] {
  if (!element) {
    return [];
  }
  if (!element.parentNode) {
    // <html>
    return [document.documentElement];
  }
  return Array.from(element.parentNode.children) as HTMLElement[];
}

const UseDndRootBase = styled.div`
  width: 100%;
  height: 100%;
  flex-grow: 1;
  container-type: size;
  container-name: root;
`;

export type DragCursorAreaProps = {
  width: string | number;
  height: string | number;
};

const DragCursorArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["width", "height"].includes(prop),
})<DragCursorAreaProps>`
  position: fixed;
  width: ${({ width }) => (typeof width === "number" ? width + "px" : width)};
  height: ${({ height }) =>
    typeof height === "number" ? height + "px" : height};

  ${({ width, height }) => {
    const widthStr = typeof width === "number" ? width + "px" : width;
    const heightStr = typeof height === "number" ? height + "px" : height;
    return css`
      transform: translate3d(${widthStr}, ${heightStr}, 0);
    `;
  }}
`;

export type UseDndRootChildrenWrapper = {
  dragCursorAreaWidth: string | number;
  dragCursorAreaHeight: string | number;
};

const UseDndRootChildrenWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["dragCursorAreaWidth", "dragCursorAreaHeight"].includes(prop),
})<UseDndRootChildrenWrapper>`
  width: 100cqw;
  height: 100cqh;

  ${({ dragCursorAreaWidth, dragCursorAreaHeight }) => {
    const dragCursorAreaWidthStr =
      typeof dragCursorAreaWidth === "number"
        ? dragCursorAreaWidth + "px"
        : dragCursorAreaWidth;
    const dragCursorAreaHeightStr =
      typeof dragCursorAreaHeight === "number"
        ? dragCursorAreaHeight + "px"
        : dragCursorAreaHeight;
    return css`
      transform: translate3d(
        -${dragCursorAreaWidthStr},
        -${dragCursorAreaHeightStr},
        0
      );
    `;
  }}
`;

export type Groups = { [groupKey: string]: GroupHandle };

export type UseDndRootHandle = {
  baseElement: HTMLDivElement | null;
  dragCursorArea: HTMLDivElement | null;
  childrenWrapper: HTMLDivElement | null;
};

export type UseDndRootProps = {
  children?: React.ReactNode;
  dragCollisionDetectionSensitivity?: Partial<DragCursorAreaProps>;
};

// TODO: add those states into one piece of state
// the state gets stored as key value in MultiMap. (key: contextId)
let dndRootIntersectionObserver: IntersectionObserver | null = null;
const dndRootElementsPendingToBeObserved = new Map<HTMLElement, HTMLElement>();

let dndRootDragCursorArea: HTMLDivElement | null = null;
let dndRootChildrenWrapper: HTMLDivElement | null = null;

let curActiveDroppable: HTMLElement | null = null;
let curActiveDraggable: HTMLElement | null = null;
const groups = new MultiMap<string[], GroupHandle>();

// Should be used at the topmost position as possible, and should exist only one.
export const UseDndRoot = withMemoAndRef<
  "div",
  UseDndRootHandle,
  UseDndRootProps
>({
  displayName: "UseDndRoot",
  Component: ({ children, dragCollisionDetectionSensitivity }, ref) => {
    const {
      width: dragCursorAreaWidth = 10,
      height: dragCursorAreaHeight = 10,
    } = dragCollisionDetectionSensitivity ?? {};

    const refBase = useRef<HTMLDivElement | null>(null);
    const refDragCursorArea = useRef<HTMLDivElement | null>(null);
    // useRefForElementWithOptionalCb<HTMLDivElement | null>({
    //   cb: cbInitial,
    // });
    const refChildrenWrapper = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      baseElement: refBase.current,
      dragCursorArea: refDragCursorArea.current,
      childrenWrapper: refChildrenWrapper.current,
    }));

    useIsomorphicLayoutEffect(() => {
      const elementsToBeObserved = [
        ...dndRootElementsPendingToBeObserved.values(),
      ];
      elementsToBeObserved.forEach((element) => {
        dndRootIntersectionObserver?.observe(element);
        dndRootElementsPendingToBeObserved.delete(element);
      });
    });

    const intersectionObserverCb = useCallback<IntersectionObserverCallback>(
      (entries, observer) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            curActiveDroppable &&
            curActiveDraggable
          ) {
            const dataDroppableContextId =
              curActiveDroppable.getAttribute("data-context-id");
            const dataDroppableId =
              curActiveDroppable.getAttribute("data-droppable-id");

            const dataActiveDraggableContextId =
              curActiveDraggable.getAttribute("data-context-id");
            const dataActiveDraggableId =
              curActiveDraggable.getAttribute("data-draggable-id");
            const dataActiveDraggableTagKey = curActiveDraggable.getAttribute(
              "data-draggable-tag-key",
            );

            if (
              !dataDroppableContextId ||
              !dataDroppableId ||
              !dataActiveDraggableContextId ||
              !dataActiveDraggableId ||
              !dataActiveDraggableTagKey
            ) {
              continue;
            }

            const groupsForActiveDroppable = groups.get({
              keys: [dataDroppableContextId, dataDroppableId],
            });
            if (!groupsForActiveDroppable) {
              continue;
            }
            const curOverDraggable = entry.target as HTMLElement;
            for (const group of groupsForActiveDroppable) {
              if (group.elements.includes(curOverDraggable)) {
                console.log(true);
              }
            }

            // console.log(entry);
            // const curOverDraggable;
          }
        }
      },
      [],
    );

    const dragAreaCallbackRef = useCallback(
      (el: HTMLDivElement) => {
        if (!refDragCursorArea.current && !dndRootIntersectionObserver) {
          dndRootIntersectionObserver = new IntersectionObserver(
            intersectionObserverCb,
            {
              root: el,
            },
          );
        }
        refDragCursorArea.current = el;
        dndRootDragCursorArea = el;
      },
      [intersectionObserverCb],
    );

    const childWrapperCallbackRef = useCallback((el: HTMLDivElement) => {
      refChildrenWrapper.current = el;
      dndRootChildrenWrapper = el;
    }, []);

    return (
      <UseDndRootBase ref={refBase}>
        <DragCursorArea
          ref={dragAreaCallbackRef}
          width={dragCursorAreaWidth}
          height={dragCursorAreaHeight}
        >
          <UseDndRootChildrenWrapper
            ref={childWrapperCallbackRef}
            dragCursorAreaWidth={dragCursorAreaWidth}
            dragCursorAreaHeight={dragCursorAreaHeight}
          >
            {children}
          </UseDndRootChildrenWrapper>
        </DragCursorArea>
      </UseDndRootBase>
    );
  },
});

export type GroupHandle = {
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
  groupKey: string;
  setGroupKey: ({ groupKey }: { groupKey: string }) => void;
  elements: (HTMLElement | null)[];
  baseElement: HTMLElement | null;
};

export type GroupProps = {
  children: React.ReactNode;
  contextId: string;
  droppableId: string;
  tagKeysAcceptable: string[];
};

export type DroppableProps<P> = GroupProps & P;

export function withDroppable<
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref extends GroupHandle = GroupHandle,
  BaseProps extends object = {},
  Props extends DroppableProps<BaseProps> = DroppableProps<BaseProps>,
>({
  displayName,
  BaseComponent,
}: {
  displayName?: string;
  BaseComponent: React.ForwardRefRenderFunction<
    Ref,
    React.PropsWithoutRef<React.PropsWithChildren<Props>>
  >;
}) {
  return withMemoAndRef<E, Ref, Props>({
    displayName,
    Component: (
      { children, contextId, droppableId, tagKeysAcceptable, ...otherProps },
      ref,
    ) => {
      const refGroupKey = useRef<string>("");
      const refItems = useRef<(HTMLElement | null)[]>([]);
      const refHandle = useRef<Ref | null>(null);
      const refBase = useRef<HTMLElement | null>(null);

      const setBaseElementAttributes = useCallback(() => {
        if (!refBase.current) {
          return;
        }
        refBase.current.classList.add("droppable");
        refBase.current.setAttribute("data-context-id", contextId);
        refBase.current.setAttribute("data-droppable-id", droppableId);
        refBase.current.setAttribute(
          "data-droppable-tag-keys-acceptable",
          JSON.stringify(tagKeysAcceptable).replaceAll(/"/g, "'"),
        );
        dndRootElementsPendingToBeObserved.set(
          refBase.current,
          refBase.current,
        );
      }, [contextId, droppableId, tagKeysAcceptable]);

      const copyChildrenAndInjectRefs = useCallback(
        ({ children }: { children: React.ReactNode }) => {
          return (
            React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                if ((child as any).ref) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    // ref: mergeRefs(
                    //   (el: HTMLElement | null) => {
                    //     refItems.current[index] = el;
                    //   },
                    //   (child as any).ref, // Preserve the previously given ref
                    // ),
                    ref: (el: HTMLElement | null) => {
                      refItems.current[index] = el;

                      if (typeof (child as any).ref === "function") {
                        (child as any).ref(el);
                      }
                    },
                  });
                }
                return child;
              }
              return child; // Return other valid elements (like strings or portals) as-is
            }) ?? []
          );
        },
        [],
      );

      const [stateChildren, setStateChildren] = useState<React.ReactNode[]>(
        () => copyChildrenAndInjectRefs({ children }),
      );
      useIsomorphicLayoutEffect(() => {
        setStateChildren(copyChildrenAndInjectRefs({ children }));
      }, [children, copyChildrenAndInjectRefs]);

      useImperativeHandle(ref, () => {
        refHandle.current = {
          remove: ({ index }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              newItems.splice(index, 1);
              return newItems;
            });

            refItems.current.splice(index, 1);
          },
          add: ({ index, newItem }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              newItems.splice(
                index,
                0,
                // TODO: ref : just like `copyChildrenAndInjectRefs`
                // TODO: extract out as mergeRefs
                React.isValidElement(newItem)
                  ? (newItem as any).ref
                    ? React.cloneElement(newItem as React.ReactElement<any>, {
                        ref: (el: HTMLElement | null) => {
                          refItems.current[index] = el;

                          if (typeof (newItem as any).ref === "function") {
                            (newItem as any).ref(el);
                          }
                        },
                        key: index,
                      })
                    : newItem
                  : newItem,
              );
              return newItems;
            });
          },
          move: ({ indexOld, indexNew }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              const [target] = newItems.splice(indexOld, 1);
              newItems.splice(indexNew, 0, target);
              return newItems;
            });

            const [targetElement] = refItems.current.splice(indexOld, 1);
            refItems.current.splice(indexNew, 0, targetElement);
          },
          groupKey: refGroupKey.current,
          setGroupKey: ({ groupKey }) => {
            refGroupKey.current = groupKey;
          },
          elements: refItems.current,
          baseElement: refBase.current,
        } as Ref;
        // console.log(refHandle.current);
        return refHandle.current;
      });

      useIsomorphicLayoutEffect(() => {
        setBaseElementAttributes();
      }, [setBaseElementAttributes]);

      const memoizedChildren = useMemo(
        () => copyChildrenAndInjectRefs({ children: stateChildren }),
        [stateChildren, copyChildrenAndInjectRefs],
      );

      return (
        <BaseComponent
          ref={refBase}
          {...(otherProps as React.PropsWithoutRef<
            React.PropsWithChildren<Props>
          >)}
        >
          {memoizedChildren}
        </BaseComponent>
      );
    },
  });
}

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

  let { ids: draggableIds, keepOrExpandIds: keepOrExpandDraggableIds } =
    useUniqueRandomIds({ count: draggableCount });
  const refDraggableIds = useRef<string[]>(draggableIds);
  useBeforeRender(() => {
    refDraggableIds.current = keepOrExpandDraggableIds({
      newCount: draggableCount,
    });
  }, [draggableCount, keepOrExpandDraggableIds]);

  ////////////////////////////////////////////

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

  const refCurActiveDraggableCandidate = useRef<HTMLElement | null>(null);
  const refDragOverlay = useRef<HTMLElement | null>(null);
  const [stateDragOverlay, setStateDragOverlay] =
    useState<React.ReactNode | null>(null);

  ////////////////////////////////////////////

  const hideDragCursorArea = useCallback(() => {
    if (dndRootDragCursorArea && dndRootChildrenWrapper) {
      const { offsetWidth, offsetHeight } = dndRootDragCursorArea;
      const x = -offsetWidth;
      const y = -offsetHeight;
      dndRootDragCursorArea.style.setProperty(
        "transform",
        `translate3d(${x}px, ${y}px, 0)`,
      );
      dndRootChildrenWrapper.style.setProperty(
        "transform",
        `translate3d(${-x}px, ${-y}px, 0)`,
      );
    }
  }, []);

  const moveDragCursorAreaAndChildrenWrapper = useCallback(() => {
    if (
      dndRootDragCursorArea &&
      dndRootChildrenWrapper &&
      curPointerEvent.current
    ) {
      const { offsetWidth, offsetHeight } = dndRootDragCursorArea;
      const x = curPointerEvent.current.clientX - offsetWidth / 2;
      const y = curPointerEvent.current.clientY - offsetHeight / 2;
      dndRootDragCursorArea.style.setProperty(
        "transform",
        `translate3d(${x}px, ${y}px, 0)`,
      );
      dndRootChildrenWrapper.style.setProperty(
        "transform",
        `translate3d(${-x}px, ${-y}px, 0)`,
      );
    }
  }, []);

  const setCurActiveDroppable = useCallback(() => {
    if (!curActiveDraggable || !curPointerEvent.current) {
      console.warn("[onPointerMove] !curActiveDraggable");
      return;
    }

    const dataActiveDraggableContextId =
      curActiveDraggable.getAttribute("data-context-id");
    const dataActiveDraggableId =
      curActiveDraggable.getAttribute("data-draggable-id");
    const dataActiveDraggableTagKey = curActiveDraggable.getAttribute(
      "data-draggable-tag-key",
    );

    if (
      !(
        dataActiveDraggableContextId &&
        dataActiveDraggableId &&
        dataActiveDraggableTagKey
      )
    ) {
      console.warn(
        "[onPointerMove] !(dataContextId && dataDraggableId && dataDraggableTagKey)",
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
      const dataDroppableContextId =
        underlyingElement.getAttribute("data-context-id");
      const dataDroppableId =
        underlyingElement.getAttribute("data-droppable-id");

      if (!(dataDroppableContextId && dataDroppableId)) {
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

      curActiveDroppable = droppable;
      return;
    }
  }, []);

  const setDragOverlay = useCallback(() => {
    if (!refCurActiveDraggableCandidate.current || !curPointerEvent.current) {
      return;
    }

    let width = 0;
    let height = 0;
    let x = 0;
    let y = 0;
    if (!isDragMoving.current) {
      const draggableRect =
        refCurActiveDraggableCandidate.current.getBoundingClientRect();
      width = draggableRect.width;
      height = draggableRect.height;
      x = draggableRect.x;
      y = draggableRect.y;

      curDragOverlayPos.current = {
        x,
        y,
      };
    } else {
      width = refCurActiveDraggableCandidate.current.offsetWidth;
      height = refCurActiveDraggableCandidate.current.offsetHeight;
      x = curDragOverlayPos.current.x += curPointerDelta.current.x;
      y = curDragOverlayPos.current.y += curPointerDelta.current.y;
    }

    const cloneOfActiveDraggable =
      refCurActiveDraggableCandidate.current.cloneNode(true) as HTMLElement;

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
    console.log(refDragOverlay.current);

    let dragOverlay: React.ReactNode = null;
    if (refDragOverlay.current) {
      Object.assign(refDragOverlay.current.style, dragOverlayStyleToInject);
    } else {
      const dragOverlayTmp = parse(cloneOfActiveDraggable.outerHTML);
      if (typeof dragOverlayTmp === "string" || Array.isArray(dragOverlayTmp)) {
        dragOverlay = React.createElement(
          "div",
          // refCurActiveDraggableCandidate.current.tagName.toLowerCase(),
          // Any tag name, it doesn't matter, because this is the wrapper element since we're going to use `outerHTML`.
          {
            ref: (el: HTMLElement | null): void => {
              refDragOverlay.current = el;
            },
            dangerouslySetInnerHTML: {
              __html: refCurActiveDraggableCandidate.current.outerHTML,
            },
            style: dragOverlayStyleToInject,
          },
        );
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
  }, [setDragOverlay]);

  ////////////////////////////////////////////

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      // console.log("[onPointerMove]");
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

  const onCustomDragStart = useCallback(
    (event: Event) => {
      console.log("[onCustomDragStart]");

      setDragOverlay(); // Initial pos
      isDragging.current = true;
      isDragMoving.current = true;

      const customDragEvent = event as CustomDragStartEvent;
      const { pointerEvent } = customDragEvent.detail;
      curPointerEvent.current = pointerEvent;

      if (refCurActiveDraggableCandidate.current) {
        curActiveDraggable = refCurActiveDraggableCandidate.current;
        curActiveDraggable.classList.add("drag-placeholder");
      }

      moveDragCursorAreaAndChildrenWrapper();
      setDragOverlay();
      setCurActiveDroppable();
    },
    [
      setDragOverlay,
      moveDragCursorAreaAndChildrenWrapper,
      setCurActiveDroppable,
    ],
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

      // console.log(event.target);
      // console.log(event.currentTarget);
      // console.log(event.relatedTarget);
      if (event.target) {
        const target = event.target as HTMLElement;
        const dataDraggableContextId = target.getAttribute("data-context-id");
        const dataDraggableHandleId = target.getAttribute(
          "data-draggable-handle-id",
        );
        const dataDraggableId = dataDraggableHandleId;

        if (
          dataDraggableContextId &&
          dataDraggableHandleId &&
          dataDraggableId
        ) {
          const draggable: HTMLElement | null = document.querySelector(
            `[data-context-id="${dataDraggableContextId}"][data-draggable-id="${dataDraggableId}"]`,
          );
          // console.log("dataContextId:", dataContextId);
          // console.log("dataDraggableHandleId:", dataDraggableHandleId);
          // console.log("dataDraggableId:", dataDraggableId);
          // console.log("draggable:", draggable);

          if (draggable) {
            refCurActiveDraggableCandidate.current = draggable;
            curActiveDraggable = event.currentTarget as HTMLElement;
          }
        }
      }
    },
    [updateDuration],
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

      refCurActiveDraggableCandidate.current?.classList.remove(
        "drag-placeholder",
      );
      refCurActiveDraggableCandidate.current = null;
      curActiveDraggable = null;
      curActiveDroppable = null;
      hideDragCursorArea();
      refDragOverlay.current = null;
      setStateDragOverlay(null);
    },
    [hideDragCursorArea],
  );

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
    document.body.addEventListener("touchmove", enableTouDeviceSupport, {
      passive: false,
    });

    document.body.addEventListener("contextmenu", preventContextMenuOnDrag, {
      passive: false,
    });

    return () => {
      document.body.removeEventListener("touchmove", enableTouDeviceSupport);
      document.body.removeEventListener(
        "contextmenu",
        preventContextMenuOnDrag,
      );
    };
  }, [enableTouDeviceSupport, preventContextMenuOnDrag]);

  useIsomorphicLayoutEffect(() => {
    refDragOverlay.current?.classList.add("drag-overlay");
    refDragOverlay.current?.classList.remove("drag-placeholder");
    curActiveDraggable?.classList.add("drag-placeholder");
  }, [stateDragOverlay]);

  ////////////////////////////////////////////

  // const idSetDroppableRef = useMemoizeCallbackId();
  // const setDroppableRef = useCallback(
  //   ({
  //     droppableId,
  //     tagKeysAcceptable,
  //   }: {
  //     droppableId: string;
  //     tagKeysAcceptable: string[];
  //   }) =>
  //     memoizeCallback({
  //       id: idSetDroppableRef,
  //       fn: (el: HTMLElement | null) => {
  //         console.log(el);
  //         if (el) {
  //           // el.baseElement.classList.add("droppable");
  //           // el.baseElement.setAttribute("data-context-id", contextId);
  //           // el.baseElement.setAttribute("data-droppable-id", droppableId);
  //           // el.baseElement.setAttribute(
  //           //   "data-droppable-tag-keys-acceptable",
  //           //   JSON.stringify(tagKeysAcceptable).replaceAll(/"/g, "'"),
  //           // );
  //           // dndRootElementsPendingToBeObserved.set(
  //           //   el.baseElement,
  //           //   el.baseElement,
  //           // );
  //         }
  //       },
  //       deps: [
  //         droppableId,
  //         tagKeysAcceptable,
  //         idSetDroppableRef,
  //         contextId,
  //         droppableIds,
  //       ],
  //     }),
  //   [idSetDroppableRef, contextId, droppableIds],
  // );

  const idSetGroupsRef = useMemoizeCallbackId();
  const setGroupsRef = useCallback(
    ({ droppableId }: { droppableId: string }) =>
      memoizeCallback({
        id: idSetGroupsRef,
        fn: (ref: GroupHandle | null) => {
          if (ref) {
            ref.setGroupKey({ groupKey: droppableId });
            groups.set({
              keys: [contextId, droppableId],
              value: [ref],
            });
          }
        },
        deps: [droppableId, idSetGroupsRef, contextId],
      }),
    [idSetGroupsRef, contextId],
  );

  const idSetDraggableRef = useMemoizeCallbackId();
  const setDraggableRef = useCallback(
    ({ draggableId, tagKey }: { draggableId: string; tagKey: string }) =>
      memoizeCallback({
        id: idSetDraggableRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.classList.add("draggable");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-id", draggableId);
            el.setAttribute("data-draggable-tag-key", tagKey);

            dndRootElementsPendingToBeObserved.set(el, el);
          }
        },
        deps: [draggableId, tagKey, idSetDraggableRef, contextId, draggableIds],
      }),
    [idSetDraggableRef, contextId, draggableIds],
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

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-handle-id", draggableId);
          }
        },
        deps: [draggableId, idSetDraggableHandleRef, contextId, draggableIds],
      }),
    [idSetDraggableHandleRef, contextId, draggableIds],
  );

  return {
    DragOverlay: stateDragOverlay,
    onDragStart,
    setGroupsRef,
    setDraggableRef,
    setDraggableHandleRef,
  };
};
