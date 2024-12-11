import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RecoilRoot, useRecoilState } from "recoil";
import { Board } from "@/components/Board";
import {
  BoardHeader,
  OnEditFinishParentItem,
  OnEditStartParentItem,
} from "@/components/BoardHeader";
import {
  BoardList,
  BoardListExtendProps,
  BoardListProps,
  BoardListPropsChildren,
} from "@/components/BoardList";
import { SmartOmit, withMemoAndRef } from "@/utils";
import { nestedIndexerAtom } from "@/components/BoardContext";
import { NestedIndexer } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { useDnd } from "@/hooks/useDnd";
import parse from "html-react-parser";
import { getDeviceDetector } from "@/hooks/useDeviceDetector";

const CategoryTaskBoardListInternalBase = styled(BoardList)<BoardListProps>`
  height: 100%;
  padding: 0 10px;
` as ReturnType<
  typeof React.forwardRef<React.ElementRef<typeof BoardList>, BoardListProps>
>; // <- Casting for `children` render props intellisense.

export type CategoryBoardListInternalProps = SmartOmit<
  BoardListExtendProps,
  "children"
>;

export const CategoryTaskBoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: ({ boardListId, ...otherProps }, ref) => {
    const [stateIndexer, setStateIndexer] = useRecoilState(nestedIndexerAtom);

    const onEditStartParentItem = useCallback<OnEditStartParentItem>(
      ({ elementTextArea, handlers: { editCancelHandler } }) => {
        alert("Press enter when the edit is finished.");

        elementTextArea.focus({ cursor: "all" });

        // Delay execution to prevent interference. For example, `focus` event.
        // Introduce a small delay before execution using a setTimeout.
        // cf> https://stackoverflow.com/a/53702815/11941803
        setTimeout(() =>
          elementTextArea.resizableTextArea?.textArea.addEventListener(
            "blur",
            editCancelHandler,
            {
              once: true,
            },
          ),
        );
      },
      [],
    );

    const onEditFinishParentItem = useCallback<OnEditFinishParentItem>(
      ({ oldParentItem, newParentItem }) => {
        setStateIndexer((cur) => {
          const newIndexer = new NestedIndexer(cur);
          newIndexer.updateParent({
            parentId: oldParentItem.id,
            parent: newParentItem,
          });
          return newIndexer;
        });
      },
      [setStateIndexer],
    );

    const onUpdateChildItem = useCallback<OnUpdateChildItem>(
      ({ event, oldChildItem, newChildItem }) => {
        // console.log(event.target.value);
        setStateIndexer((cur) => {
          const newIndexer = new NestedIndexer(cur);
          newIndexer.updateChild({
            childId: oldChildItem.id,
            child: newChildItem,
          });
          return newIndexer;
        });
      },
      [setStateIndexer],
    );

    const forEachChildItem = useCallback<ForEachChildItem>(
      ({ idx, item, items }) => {
        return (
          <Card
            // key={item.id}
            childItem={item}
            onUpdateChildItem={onUpdateChildItem}
          />
        );
        // return items.map((item) => {
        //   return (
        //     <Card
        //       // key={item.id}
        //       childItem={item}
        //       onUpdateChildItem={onUpdateChildItem}
        //     />
        //   );
        // });
      },
      [onUpdateChildItem],
    );

    // const forEachParentItem = useCallback<ForEachParentItem>(
    //   ({ idx, item, items, droppableProvided, droppableStateSnapshot }) => {
    //     return (
    //       // <Droppable droppableId={item.id}>
    //       //   {(droppableProvided, droppableStateSnapshot) => (
    //       <Board
    //         ref={droppableProvided.innerRef}
    //         {...droppableProvided.droppableProps}
    //         // key={item.id}
    //       >
    //         <BoardHeader
    //           parentItem={item}
    //           onEditStartParentItem={onEditStartParentItem}
    //           onEditFinishParentItem={onEditFinishParentItem}
    //         />
    //         <BoardMain
    //           boardListId={boardListId}
    //           parentItem={item}
    //           forEachChildItem={forEachChildItem}
    //         />
    //       </Board>
    //       //   )}
    //       // </Droppable>
    //     );

    //     // return items.map((item) => {
    //     //   return (
    //     //     <Board
    //     //     // key={item.id}
    //     //     >
    //     //       <BoardHeader
    //     //         parentItem={item}
    //     //         onEditStartParentItem={onEditStartParentItem}
    //     //         onEditFinishParentItem={onEditFinishParentItem}
    //     //       />
    //     //       <BoardMain
    //     //         boardListId={boardListId}
    //     //         parentItem={item}
    //     //         forEachChildItem={forEachChildItem}
    //     //       />
    //     //     </Board>
    //     //   );
    //     // });
    //   },
    //   [
    //     boardListId,
    //     forEachChildItem,
    //     onEditStartParentItem,
    //     onEditFinishParentItem,
    //   ],
    // );

    const refBase = useRef<React.ElementRef<
      typeof CategoryTaskBoardListInternalBase
    > | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as React.ElementRef<
        typeof CategoryTaskBoardListInternalBase
      >;
    });

    const {
      getIsEmulatorWebkit,
      getIsMobile,
      getIsTablet,
      getIsDesktop,
      getIsTouchDevice,
    } = getDeviceDetector();
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

    const setDragOverlay = useCallback(() => {
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
      cloneOfActiveDraggable.classList.add("drag-overlay");

      const dragOverlayStyleToInject = {
        position: "fixed",
        width,
        height,
        top: "0",
        left: "0",
        // backfaceVisibility: "hidden", // For performance and visually smoother 3D transforms
        transform: `translate3d(${x}px, ${y}px, 0)`,
      } satisfies React.CSSProperties;

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
            // onPointerMove,
            // onPointerUp,
          },
        );
      } else {
        dragOverlay = React.cloneElement(
          dragOverlayTmp,
          {
            ref: refDragOverlay,
            style: dragOverlayStyleToInject,
            // onTouchStart: (event: TouchEvent) => {
            //   event.preventDefault();
            // },
            // onPointerDown: (event: PointerEvent) => {
            //   console.log("[onPointerDown]");
            //   console.log(refDragOverlay.current);
            //   refDragOverlay.current?.setPointerCapture(event.pointerId);
            // },
            // onPointerMove,
            // onPointerUp,
            // onPointerCancel: () => console.log("[onPointerCancel]"),
            // onPointerCancelCapture: () =>
            //   console.log("[onPointerCancelCapture]"),
            // onPointerDownCapture: () => console.log("[onPointerDownCapture]"),
            // onPointerEnter: () => console.log("[onPointerEnter]"),
            // onPointerLeave: () => console.log("[onPointerLeave]"),
            // onPointerMoveCapture: () => console.log("[onPointerMoveCapture]"),
            // onPointerOut: () => console.log("[onPointerOut]"),
            // onPointerOutCapture: () => console.log("[onPointerOutCapture]"),
            // onPointerOver: () => console.log("[onPointerOver]"),
            // onPointerOverCapture: () => console.log("[onPointerOverCapture]"),
            // onPointerUpCapture: () => console.log("[onPointerUpCapture]"),
            // onGotPointerCapture: () => console.log("[onGotPointerCapture]"),
            // onGotPointerCaptureCapture: () =>
            //   console.log("[onGotPointerCaptureCapture]"),
            // onLostPointerCapture: () => console.log("[onLostPointerCapture]"),
            // onLostPointerCaptureCapture: () =>
            //   console.log("[onLostPointerCaptureCapture]"),
          },
          // Uncaught Error: Can only set one of `children` or `props.dangerouslySetInnerHTML`.
        );
      }

      // console.log(dragOverlay);
      setStateDragOverlay(dragOverlay);
      // dragOverlay &&
      //   dragOverlay.setPointerCapture(curPointerEvent.current.pointerId);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      // if (refDragOverlay.current && curPointerEvent.current) {
      //   const event = new PointerEvent("pointerdown", {
      //     bubbles: true,
      //     cancelable: true,
      //     pointerId: 1,
      //     pointerType: isTouchDevice ? "touch" : "mouse", // Also has a valid value "pen"
      //     clientX: curPointerEvent.current.clientX, // optional coordinates
      //     clientY: curPointerEvent.current.clientY, // optional coordinates
      //   });
      //   refDragOverlay.current.dispatchEvent(event);
      // }
      document.body.addEventListener(
        "touchstart",
        (event: TouchEvent) => {
          event.preventDefault();
        },
        { passive: false },
      );
      document.body.addEventListener(
        "touchmove",
        (event: TouchEvent) => {
          event.preventDefault();
        },
        { passive: false },
      );
    }, [stateDragOverlay, isTouchDevice]);

    const onPointerMove = useCallback(
      (event: PointerEvent) => {
        console.log("[onPointerMove]");
        curPointerEvent.current = event;
        if (isDragMoving.current) {
          curPointerDelta.current.x += event.movementX;
          curPointerDelta.current.y += event.movementY;

          setDragOverlay();

          curPointerDelta.current.x = 0;
          curPointerDelta.current.y = 0;
        }
      },
      [setDragOverlay],
    );

    const onCustomDragStart = useCallback(
      (event: Event) => {
        console.log("[onCustomDragStart]");
        isDragging.current = true;

        const customDragEvent = event as CustomDragStartEvent;
        // const {
        //   //  pointerEvent
        // } = customDragEvent.detail;

        if (curActiveDraggableCandidate.current) {
          setCurActiveDraggable(curActiveDraggableCandidate.current);
        }
        setDragOverlay();

        isDragMoving.current = true;
      },
      [setDragOverlay],
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
            // detail: {
            //   //  pointerEvent: event
            // },
          },
        );
        document.body.addEventListener("custom-drag-start", onCustomDragStart, {
          once: true,
        });
        document.body.dispatchEvent(customDragStartEvent);

        isDragging.current = true;

        const customDragEvent = event as CustomDragStartEvent;
        // const {
        //   //  pointerEvent
        // } = customDragEvent.detail;

        if (curActiveDraggableCandidate.current) {
          setCurActiveDraggable(curActiveDraggableCandidate.current);
        }
        setDragOverlay();

        isDragMoving.current = true;
      }
    }, [onCustomDragStart, setDragOverlay]);

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
          const draggable: HTMLElement | null = document.querySelector(
            `[data-context-id="${boardListId}"][data-draggable-id="${dataDraggableId}"]`,
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
      },
      [boardListId, updateDuration],
    );

    const onPointerUp = useCallback(() => {
      console.log("[onPointerUp]");
      isPointerDown.current = false;
      pressStartTime.current = 0;
      clearInterval(intervalId.current);
      isDragging.current = false;
      isDragMoving.current = false;

      curActiveDraggableCandidate.current = null;
      setCurActiveDraggable(null);

      refDragOverlay.current = null;
      setStateDragOverlay(null);
    }, []);

    useEffect(() => {
      document.body.addEventListener("pointerdown", onPointerDown);
      document.body.addEventListener("pointermove", onPointerMove);
      document.body.addEventListener("pointerup", onPointerUp);

      return () => {
        document.body.addEventListener("pointerdown", onPointerDown);
        document.body.removeEventListener("pointermove", onPointerMove);
        document.body.removeEventListener("pointerup", onPointerUp);
      };
    }, [onPointerDown, onPointerMove, onPointerUp]);

    // const onPointerOver =

    type CustomDragStartEvent = CustomEvent<{
      // pointerEvent: React.PointerEvent | null;
    }>;

    const onDragStart = useCallback((event: React.DragEvent) => {
      event.preventDefault();
    }, []);

    const {
      setDroppableRef,
      setDraggableRef,
      setDraggableHandleRef: setDragHandleRef,
    } = useDnd({
      contextId: boardListId,
      droppableCount: 1,
      draggableCount: 1,
    });

    return (
      <CategoryTaskBoardListInternalBase
        ref={(el) => {
          refBase.current = el;
          setDroppableRef({
            contextId: boardListId,
            index: 0,
          })(el);
        }}
        boardListId={boardListId}
        // forEachParentItem={forEachParentItem}
        {...otherProps}
      >
        <Board
          ref={setDraggableRef({
            contextId: boardListId,
            index: 0,
          })}
        >
          <div
            ref={setDragHandleRef({
              contextId: boardListId,
              index: 0,
            })}
            onDragStart={onDragStart}
          >
            DOH
          </div>
        </Board>
        <Board
          ref={setDraggableRef({
            contextId: boardListId,
            index: 0,
          })}
        >
          <div
            ref={setDragHandleRef({
              contextId: boardListId,
              index: 0,
            })}
            onDragStart={onDragStart}
          >
            DOH
          </div>
        </Board>
        <Board
          ref={setDraggableRef({
            contextId: boardListId,
            index: 0,
          })}
        >
          <div
            ref={setDragHandleRef({
              contextId: boardListId,
              index: 0,
            })}
            onDragStart={onDragStart}
          >
            DOH
          </div>
        </Board>
        {stateDragOverlay}
      </CategoryTaskBoardListInternalBase>
    );
  },
});

{
  /* <BoardHeader
            parentItem={item}
            onEditStartParentItem={onEditStartParentItem}
            onEditFinishParentItem={onEditFinishParentItem}
          />
          <BoardMain
            boardListId={boardListId}
            parentItem={item}
            forEachChildItem={forEachChildItem}
          ></BoardMain> */
}

export type CategoryBoardListProps = CategoryBoardListInternalProps;

export const CategoryTaskBoardList = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListProps
>({
  Component: (
    { parentKeyName, childKeyName, parentItems: items, ...otherProps },
    ref,
  ) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          if (items) {
            // Inject default value
            snapshot.set(
              nestedIndexerAtom,
              new NestedIndexer({
                parentKeyName,
                childKeyName,
                items,
              }),
            );
          }
        }}
      >
        <CategoryTaskBoardListInternal
          ref={ref}
          parentKeyName={parentKeyName}
          childKeyName={childKeyName}
          parentItems={items}
          {...otherProps}
        />
      </RecoilRoot>
    );
  },
});
