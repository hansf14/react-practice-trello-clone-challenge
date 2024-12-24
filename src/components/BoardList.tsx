import React, {
  startTransition,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import parse from "html-react-parser";
import { CssScrollbar } from "@/csses/scrollbar";
import { getEmptyArray, getMemoizedArray, StyledComponentProps } from "@/utils";
import {
  ParentItem,
  ChildItem,
  DroppableCustomAttributesKvObj,
  isParentItemData,
  DndDataInterfaceCustom,
  isChildItemData,
  serializeAllowedTypes,
  ScrollContainerCustomAttributesKvObj,
  ScrollContainerCustomAttributesKvMapping,
  getDndContextInfoFromActivator,
  DragOverlayCustomAttributesKvMapping,
  getDndContextInfoFromData,
  isCustomItemData,
  BoardListContextIndexer,
  BoardListContextValue,
  BoardListContextParams,
  useBoardContext,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { createPortal } from "react-dom";
import { DragScrollSpeed, useDragScroll } from "@/hooks/useDragScroll";
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragUpdateResponder,
} from "@hello-pangea/dnd";

// // https://github.com/clauderic/dnd-kit/issues/477#issuecomment-985194908
// https://github.com/clauderic/dnd-kit/discussions/1493
// export class MouseSensor extends MouseSensorBase {
//   static activators = [
//     {
//       eventName: "onMouseDown" as const,
//       handler: (
//         { nativeEvent: event }: React.MouseEvent,
//         { onActivation }: MouseSensorOptions,
//       ) => {
//         return shouldHandleEvent(event.target as HTMLElement);
//       },
//     },
//   ];
// }
// // export class KeyboardSensor extends LibKeyboardSensor {
// //   static activators = [
// //     {
// //       eventName: 'onKeyDown' as const,
// //       handler: ({ nativeEvent: event }: KeyboardEvent<Element>) => {
// //         return shouldHandleEvent(event.target as HTMLElement)
// //       }
// //     }
// //   ]
// // }
// function shouldHandleEvent(element: HTMLElement | null) {
//   let cur = element;
//   while (cur) {
//     if (cur.hasAttribute("data-no-dnd")) {
//       return false;
//     }
//     // if (cur.dataset && cur.dataset.noDnd) {
//     //   return false;
//     // }
//     cur = cur.parentElement;
//   }
//   return true;
// }

const BoardListBase = styled.div`
  ${CssScrollbar}

  overflow-x: auto;
  overflow-y: hidden;

  max-width: 100dvw;
  width: 100%;
  height: 100%;
  padding: 10px;
`;
// touch-action: none;
// touch-action: manipulation;
// https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action
// https://docs.dndkit.com/api-documentation/sensors/touch#touch-action

type BoardListDropAreaProps = {
  isDropTarget?: boolean;
};

const BoardListDropArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDropTarget"].includes(prop),
})<BoardListDropAreaProps>`
  width: 100%;
  height: 100%;

  padding: 10px;
`;
// ${({ isDropTarget }) =>
//   (isDropTarget ?? false)
//     ? css`
//         background-color: rgb(0, 0, 0, 0.5);
//       `
//     : ""}

const BoardListDropAreaMinusMargin = styled.div`
  margin: 0 -5px;
  // ㄴ To deduct the flex item's margin

  width: 100%;
  height: 100%;

  display: flex;
  justify-content: stretch;
  align-items: center;
  border-radius: 10px;
`;

/* &.${boardClassNameKvMapping["board-sortable-handle"]} {
    cursor: grab;
  } */

export type BoardListProps = BoardListContextParams &
  StyledComponentProps<"div">;

export type BoardListExtendProps = BoardListContextValue;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (
    { boardListId, parentKeyName, childKeyName, children, ...otherProps },
    ref,
  ) => {
    const [stateActiveParentItem, setStateActiveParentItem] =
      useState<ParentItem | null>(null);
    const [stateActiveChildItem, setStateActiveChildItem] =
      useState<ChildItem | null>(null);
    const refDragOverlayReactElement = useRef<React.ReactElement | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const { dragScroll, getCurPointerEvent } = useDragScroll();

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const refDroppable = useRef<HTMLDivElement | null>(null);

    const boardListContextParams = useMemo(
      () => ({
        boardListId,
        parentKeyName,
        childKeyName,
      }),
      [boardListId, parentKeyName, childKeyName],
    );
    const {
      parentItems__Immutable: parentItems,
      stateBoardListContext,
      setStateBoardListContext,
    } = useBoardContext(boardListContextParams);

    // const onDragStart = useCallback(
    //   (event: DragStartEvent) => {
    //     // console.log("[onDragStart]");
    //     // console.log(event);

    //     setIsDragging(true);

    //     if (event.active.data.current) {
    //       const activator = event.activatorEvent.target as HTMLElement | null;
    //       if (!activator) {
    //         return;
    //       }

    //       const { draggableElement: draggable } =
    //         getDndContextInfoFromActivator({
    //           boardListId,
    //           activator,
    //         });
    //       if (!draggable) {
    //         return;
    //       }

    //       const draggableClone = draggable.cloneNode(true) as HTMLElement;
    //       draggableClone.setAttribute(
    //         DragOverlayCustomAttributesKvMapping["data-drag-overlay"],
    //         "true",
    //       );
    //       // console.log(draggableClone);

    //       refDragOverlayReactElement.current = parse(
    //         draggableClone.outerHTML,
    //       ) as React.ReactElement;
    //       refDragOverlayReactElement.current = React.cloneElement(
    //         refDragOverlayReactElement.current,
    //         {
    //           style: {
    //             width: draggable.offsetWidth,
    //             height: draggable.offsetHeight,
    //             cursor: "grabbing",
    //             opacity: "1",
    //           } satisfies React.CSSProperties,
    //         },
    //       );

    //       const activeDataUnknown = event.active.data
    //         .current as DndDataInterfaceCustom;
    //       if (isParentItemData(activeDataUnknown)) {
    //         const activeDataParent = activeDataUnknown;
    //         setStateActiveParentItem(activeDataParent.customData.item);
    //       } else if (isChildItemData(activeDataUnknown)) {
    //         const activeDataChild = activeDataUnknown;
    //         setStateActiveChildItem(activeDataChild.customData.item);
    //       } else {
    //         console.warn("[onDragStart] invalid dndData.type");
    //       }
    //     }
    //   },
    //   [boardListId],
    // );

    // const onDragOver = useCallback(
    //   (event: DragOverEvent) => {
    //     console.log("[onDragOver]");

    //     const { active, over } = event;
    //     // console.log("active:", active);
    //     // console.log("over:", over);
    //     if (!over) {
    //       return;
    //     }
    //     const activeId = active.id;
    //     const overId = over.id;
    //     if (typeof activeId !== "string" || typeof overId !== "string") {
    //       console.warn("[onDragOver] id should only be string.");
    //       return;
    //     }
    //     if (activeId === overId) {
    //       return;
    //     }
    //     console.log(activeId, overId);

    //     const activeData = isCustomItemData(active.data.current)
    //       ? active.data.current
    //       : null;
    //     if (!activeData) {
    //       return;
    //     }
    //     const overData = isCustomItemData(over.data.current)
    //       ? over.data.current
    //       : null;
    //     if (!overData) {
    //       return;
    //     }
    //     const {
    //       draggableId: activeDraggableId,
    //       droppableId: activeDroppableId,
    //       indexOfDraggable: indexFrom,
    //     } = getDndContextInfoFromData({
    //       boardListContext: stateBoardListContext,
    //       data: activeData,
    //     });
    //     let {
    //       draggableId: overDraggableId,
    //       droppableId: overDroppableId,
    //       indexOfDraggable: indexTo,
    //       parentAsDroppableOfChild,
    //     } = getDndContextInfoFromData({
    //       boardListContext: stateBoardListContext,
    //       data: overData,
    //     });

    //     // console.group();
    //     // console.log(activeDraggableId);
    //     // console.log(activeDroppableId);
    //     // console.log(indexFrom);
    //     // console.log(overDraggableId);
    //     // console.log(overDroppableId);
    //     // console.log(indexTo);
    //     // console.log(parentAsDroppableOfChild);
    //     // console.groupEnd();

    //     if (
    //       (!isParentItemData(activeData) && !isChildItemData(activeData)) ||
    //       (!isParentItemData(overData) && !isChildItemData(overData)) ||
    //       !activeDraggableId ||
    //       !activeDroppableId ||
    //       indexFrom < 0 ||
    //       !overDraggableId ||
    //       !overDroppableId ||
    //       indexTo < 0 ||
    //       (isParentItemData(overData) && !parentAsDroppableOfChild)
    //     ) {
    //       return;
    //     }

    //     if (isParentItemData(activeData) && isParentItemData(overData)) {
    //       // https://github.com/clauderic/dnd-kit/issues/900#issuecomment-1845035824
    //       // `startTransition` didn't work for 'Maximum update depth exceeded' error.
    //       requestAnimationFrame(() => {
    //         setStateBoardListContext((curBoardListContext) => {
    //           const newBoardListContextIndexer = new BoardListContextIndexer(
    //             curBoardListContext.indexer,
    //           );
    //           newBoardListContextIndexer.moveParent({
    //             indexFrom,
    //             indexTo,
    //           });
    //           return {
    //             boardListId,
    //             indexer: newBoardListContextIndexer,
    //           };
    //         });
    //       });
    //       return;
    //     }

    //     if (isParentItemData(overData)) {
    //       if (!parentAsDroppableOfChild) {
    //         return;
    //       }
    //       overDroppableId = parentAsDroppableOfChild.droppableId;
    //       indexTo = parentAsDroppableOfChild.droppableLength;
    //       if (!overDroppableId || indexTo < 0) {
    //         return;
    //       }
    //     }

    //     // console.group();
    //     // console.log(
    //     //   `Active: ${activeDraggableId} ${activeDroppableId} ${indexFrom}`,
    //     // );
    //     // console.log(`Over: ${overDraggableId} ${overDroppableId} ${indexTo}`);
    //     // console.log((activeData as any).sortable.items);
    //     // console.groupEnd();

    //     if (activeDroppableId !== overDroppableId) {
    //       requestAnimationFrame(() => {
    //         setStateBoardListContext((curBoardListContext) => {
    //           const newBoardListContextIndexer = new BoardListContextIndexer(
    //             curBoardListContext.indexer,
    //           );
    //           newBoardListContextIndexer.moveChild({
    //             parentIdFrom: activeDroppableId,
    //             parentIdTo: overDroppableId,
    //             indexFrom: indexFrom,
    //             indexTo: indexTo,
    //             shouldKeepRef: false,
    //           });
    //           return {
    //             boardListId,
    //             indexer: newBoardListContextIndexer,
    //           };
    //         });
    //       });
    //     }
    //   },
    //   [boardListId, stateBoardListContext, setStateBoardListContext],
    // );

    // function handleDragOver(event) {
    //   const { active, over, draggingRect } = event;
    //   const { id } = active;
    //   let overId;
    //   if (over) {
    //     overId = over.id;
    //   }

    //   const overParent = findParent(overId);
    //   const overIsContainer = isContainer(overId);
    //   const activeIsContainer = isContainer(activeId);
    //   if (overIsContainer) {
    //     const overIsRow = isRow(overId);
    //     const activeIsRow = isRow(activeId);
    //     // only columns to be added to rows
    //     if (overIsRow) {
    //       if (activeIsRow) {
    //         return;
    //       }

    //       if (!activeIsContainer) {
    //         return;
    //       }
    //     } else if (activeIsContainer) {
    //       return;
    //     }
    //   }

    //   setData((prev) => {
    //     const activeIndex = data.items.findIndex((item) => item.id === id);
    //     const overIndex = data.items.findIndex((item) => item.id === overId);

    //     let newIndex = overIndex;
    //     const isBelowLastItem =
    //       over &&
    //       overIndex === prev.items.length - 1 &&
    //       draggingRect.offsetTop > over.rect.offsetTop + over.rect.height;

    //     const modifier = isBelowLastItem ? 1 : 0;

    //     newIndex =
    //       overIndex >= 0 ? overIndex + modifier : prev.items.length + 1;

    //     let nextParent;
    //     if (overId) {
    //       nextParent = overIsContainer ? overId : overParent;
    //     }

    //     prev.items[activeIndex].parent = nextParent;
    //     const nextItems = arrayMove(prev.items, activeIndex, newIndex);

    //     return {
    //       items: nextItems,
    //     };
    //   });
    // }

    // const onDragEnd = useCallback(
    //   (event: DragEndEvent) => {
    //     console.log("[onDragEnd]");

    //     setIsDragging(false);

    //     setStateActiveParentItem(null);
    //     setStateActiveChildItem(null);
    //     refDragOverlayReactElement.current = null;

    //     // const { active, over } = event;
    //     // // console.log(event);
    //     // // console.log("active:", active);
    //     // // console.log("over:", over);

    //     // if (!over) {
    //     //   return;
    //     // }

    //     // const activeId = active.id;
    //     // const overId = over.id;
    //     // if (typeof activeId !== "string" || typeof overId !== "string") {
    //     //   console.warn("[onDragOver] id should only be string.");
    //     //   return;
    //     // }

    //     // const activeDataUnknown = active.data
    //     //   .current as DndDataInterfaceUnknown;
    //     // const overDataUnknown = over.data.current as DndDataInterfaceUnknown;
    //     // if (!activeDataUnknown || !overDataUnknown || activeId === overId) {
    //     //   return;
    //     // }

    //     // if (
    //     //   isParentItemData(activeDataUnknown) &&
    //     //   isParentItemData(overDataUnknown)
    //     // ) {
    //     //   const activeData = activeDataUnknown;
    //     //   const overData = overDataUnknown;

    //     //   const idxFrom = activeData.sortable.index;
    //     //   const idxTo = overData.sortable.index;
    //     //   setStateNestedIndexer((curNestedIndexer) => {
    //     //     const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
    //     //       curNestedIndexer,
    //     //     );
    //     //     newNestedIndexer.moveParent({
    //     //       idxFrom,
    //     //       idxTo,
    //     //     });
    //     //     return newNestedIndexer;
    //     //   });
    //     // }
    //   },
    //   [setStateBoardListContext],
    // );

    const parentIdList = useMemo(() => {
      return parentItems.map((parentItem) => parentItem.id);
    }, [parentItems]);

    const childIdList = useMemo(() => {
      return parentItems.reduce<string[]>((acc, curParentItem) => {
        const childIdList = (curParentItem.items ?? []).map(
          (childItem) => childItem.id,
        );
        return acc.concat(...childIdList);
      }, []);
    }, [parentItems]);

    // const modifiers = stateActiveParentItem
    //   ? getMemoizedArray({
    //       arr: [restrictToHorizontalAxis],
    //       keys: ["stateActiveParentItem"],
    //     })
    //   : stateActiveChildItem
    //     ? getMemoizedArray({
    //         arr: [restrictToWindowEdges],
    //         keys: ["stateActiveChildItem"],
    //       })
    //     : getEmptyArray<Modifier>();
    // // console.log(modifiers);

    const scrollContainerCustomAttributes: ScrollContainerCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-scroll-container-id": boardListId,
        "data-scroll-container-allowed-types": serializeAllowedTypes({
          allowedTypes: ["parent"],
        }),
      };

    const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-droppable-id": boardListId,
      "data-droppable-allowed-types": serializeAllowedTypes({
        allowedTypes: ["parent"],
      }),
    };

    return (
      <DragDropContext
        onDragEnd={() => {}}
        // onDragStart={onDragStart}
        onDragStart={(start, responderProvided) => {
          console.log(start);
          console.log(responderProvided);
        }}
        // onDragUpdate={onDragMove}
        // // onDragOver={onDragOver}
        // onDragEnd={onDragEnd}
        // autoScroll={{ acceleration: 1 }}
        autoScrollerOptions={{
          disabled: true,
        }}
      >
        <BoardListBase
          ref={refBase}
          {...scrollContainerCustomAttributes}
          {...otherProps}
        >
          <Droppable
            droppableId={boardListId}
            direction="horizontal"
            type="parent"
          >
            {(droppableProvided, droppableStateSnapshot) => {
              return (
                <BoardListDropArea
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  {...droppableCustomAttributes}
                >
                  <BoardListDropAreaMinusMargin>
                    {children}
                    {droppableProvided.placeholder}
                  </BoardListDropAreaMinusMargin>
                </BoardListDropArea>
              );
            }}
          </Droppable>
        </BoardListBase>
        {/* {createPortal(
          <DragOverlay
            modifiers={modifiers}
            // dropAnimation={null}
            // ㄴ No animation
            dropAnimation={{
              // ...defaultDropAnimation,
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: "1",
                  },
                },
              }),
            }}
            // https://github.com/clauderic/dnd-kit/issues/317
            // ㄴ Removes flickering due to opacity animation
          >
            {refDragOverlayReactElement.current}
          </DragOverlay>,
          document.body,
        )} */}
      </DragDropContext>
    );
  },
});

// https://github.com/clauderic/dnd-kit/pull/334#issuecomment-1965708784
// import { snapCenterToCursor } from '@dnd-kit/modifiers';
// import {
//   CollisionDetection, DndContext, DragOverlay, rectIntersection
// } from '@dnd-kit/core';

// const fixCursorSnapOffset: CollisionDetection = (args) => {
//   // Bail out if keyboard activated
//   if (!args.pointerCoordinates) {
//     return rectIntersection(args);
//   }
//   const { x, y } = args.pointerCoordinates;
//   const { width, height } = args.collisionRect;
//   const updated = {
//     ...args,
//     // The collision rectangle is broken when using snapCenterToCursor. Reset
//     // the collision rectangle based on pointer location and overlay size.
//     collisionRect: {
//       width,
//       height,
//       bottom: y + height / 2,
//       left: x - width / 2,
//       right: x + width / 2,
//       top: y - height / 2,
//     },
//   };
//   return rectIntersection(updated);
// };

// const Component = () => {
//   return (
//     <DndContext
//       collisionDetection={fixCursorSnapOffset}
//     >
//       {/* ... */}
//       <DragOverlay modifiers={[snapCenterToCursor]}>
//           <div>
//             Your overlay
//           </div>
//       </DragOverlay>
//     </DndContext>
//   );
// };
