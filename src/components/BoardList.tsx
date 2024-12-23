import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import { useRecoilCallback, useRecoilState } from "recoil";
import parse from "html-react-parser";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import {
  checkHasScrollbar,
  getEmptyArray,
  getMemoizedArray,
  ScrollbarCondition,
  StyledComponentProps,
} from "@/utils";
import {
  boardListContextAtomFamily,
  ParentItem,
  ChildItem,
  DndDataInterfaceCustomGeneric,
  DroppableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvMapping,
  DraggableCustomAttributesKvMapping,
  DndActiveDataInterface,
  DndOverDataInterface,
  isParentItemData,
  DndDataInterfaceCustom,
  isChildItemData,
  serializeAllowedTypes,
  DroppableCustomAttributesKvMapping,
  ScrollContainerCustomAttributesKvObj,
  ScrollContainerCustomAttributesKvMapping,
  getDndContextInfoFromActivator,
  customCollisionDetectionAlgorithm,
  DragOverlayCustomAttributesKvMapping,
  getDraggable,
  getDndContextInfoFromData,
  isCustomItemData,
  BoardListContextIndexer,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  MouseSensorOptions,
  useSensor,
  useSensors,
  MouseSensor, // as MouseSensorBase,
  TouchSensor,
  KeyboardSensor, // as KeyboardSensorBase,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import {
  restrictToHorizontalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { createPortal } from "react-dom";
import { DragScrollSpeed, useDragScroll } from "@/hooks/useDragScroll";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

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

const BoardListInternalBase = styled.div`
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
  width: max-content;
  height: 100%;

  display: flex;
  justify-content: stretch;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;

  ${({ isDropTarget }) =>
    (isDropTarget ?? false)
      ? css`
          background-color: rgb(0, 0, 0, 0.5);
        `
      : ""}
`;

/* &.${boardClassNameKvMapping["board-sortable-handle"]} {
    cursor: grab;
  } */

export type BoardListInternalProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems?: ParentItem[];
} & StyledComponentProps<"div">;

export const BoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardListInternalProps
>({
  displayName: "BoardListInternal",
  Component: (
    {
      boardListId,
      parentKeyName,
      childKeyName,
      parentItems = getEmptyArray<ParentItem>(),
      children,
      ...otherProps
    },
    ref,
  ) => {
    const [stateActiveParentItem, setStateActiveParentItem] =
      useState<ParentItem | null>(null);
    const [stateActiveChildItem, setStateActiveChildItem] =
      useState<ChildItem | null>(null);
    const refDragOverlayReactElement = useRef<React.ReactElement | null>(null);

    const boardListContextParam = useMemo(
      () => ({
        boardListId,
        parentKeyName,
        childKeyName,
      }),
      [boardListId, parentKeyName, childKeyName],
    );

    const [stateBoardListContext, setStateBoardListContext] = useRecoilState(
      boardListContextAtomFamily(boardListContextParam),
    );

    const initBoardListContext = useRecoilCallback(
      ({ set }) =>
        ({ items }: { items: ParentItem[] }) => {
          const newDefaultBoardListContextIndexer = new BoardListContextIndexer(
            {
              parentKeyName,
              childKeyName,
              items,
            },
          );

          set(boardListContextAtomFamily(boardListContextParam), {
            boardListId,
            indexer: newDefaultBoardListContextIndexer,
          });
        },
      [boardListContextParam, boardListId, parentKeyName, childKeyName],
    );

    useIsomorphicLayoutEffect(() => {
      initBoardListContext({ items: defaultCategoryTaskItems });
    }, [initBoardListContext]);

    const [isDragging, setIsDragging] = useState(false);
    const { dragScroll, getCurPointerEvent } = useDragScroll();

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const refDroppable = useRef<HTMLDivElement | null>(null);

    const onDragStart = useCallback(
      (event: DragStartEvent) => {
        // console.log("[onDragStart]");
        // console.log(event);

        setIsDragging(true);

        if (event.active.data.current) {
          const activator = event.activatorEvent.target as HTMLElement | null;
          if (!activator) {
            return;
          }

          const { draggableElement: draggable } =
            getDndContextInfoFromActivator({
              boardListId,
              activator,
            });
          if (!draggable) {
            return;
          }

          const draggableClone = draggable.cloneNode(true) as HTMLElement;
          draggableClone.setAttribute(
            DragOverlayCustomAttributesKvMapping["data-drag-overlay"],
            "true",
          );
          // console.log(draggableClone);

          refDragOverlayReactElement.current = parse(
            draggableClone.outerHTML,
          ) as React.ReactElement;
          refDragOverlayReactElement.current = React.cloneElement(
            refDragOverlayReactElement.current,
            {
              style: {
                width: draggable.offsetWidth,
                height: draggable.offsetHeight,
                cursor: "grabbing",
                opacity: "1",
              } satisfies React.CSSProperties,
            },
          );

          const activeDataUnknown = event.active.data
            .current as DndDataInterfaceCustom;
          if (isParentItemData(activeDataUnknown)) {
            const activeDataParent = activeDataUnknown;
            setStateActiveParentItem(activeDataParent.customData.item);
          } else if (isChildItemData(activeDataUnknown)) {
            const activeDataChild = activeDataUnknown;
            setStateActiveChildItem(activeDataChild.customData.item);
          } else {
            console.warn("[onDragStart] invalid dndData.type");
          }
        }
      },
      [boardListId],
    );

    // Update scroll direction on drag move
    const onDragMove = useCallback(
      ({ active, over, activatorEvent, delta, collisions }: DragMoveEvent) => {
        // console.log("[onDragMove]");

        const pointerEvent = getCurPointerEvent();
        if (!pointerEvent) {
          return;
        }
        const { clientX, clientY } = pointerEvent;
        const underlyingElements = document.elementsFromPoint(
          clientX,
          clientY,
        ) as HTMLElement[];

        const boardListIdAttribute =
          ScrollContainerCustomAttributesKvMapping["data-board-list-id"];
        const scrollContainerIdAttribute =
          ScrollContainerCustomAttributesKvMapping["data-scroll-container-id"];

        const scrollContainers = underlyingElements.filter(
          (underlyingElement) => {
            const underlyingElementBoardListId =
              underlyingElement.getAttribute(boardListIdAttribute);

            return (
              underlyingElement.hasAttribute(boardListIdAttribute) &&
              underlyingElementBoardListId === boardListId &&
              underlyingElement.hasAttribute(scrollContainerIdAttribute)
            );
          },
        );

        scrollContainers.forEach(async (scrollContainer) => {
          const scrollContainerId = scrollContainer.getAttribute(
            ScrollContainerCustomAttributesKvMapping[
              "data-scroll-container-id"
            ],
          );

          let scrollSpeed: DragScrollSpeed = {
            top: 6,
            bottom: 6,
            left: 6,
            right: 6,
          };
          let isDragScrollNeededForThisScrollContainer = false;
          if (!scrollContainerId) {
          } else if (scrollContainerId === boardListId) {
            isDragScrollNeededForThisScrollContainer = await dragScroll({
              scrollContainer: scrollContainer,
              scrollSpeed,
              desiredFps: 60,
            });

            // console.log(
            //   scrollContainerId,
            //   isDragScrollNeededForThisScrollContainer,
            // );
            if (isDragScrollNeededForThisScrollContainer) {
              return;
            }
          } else {
            scrollSpeed = {
              top: 3,
              bottom: 3,
              left: 3,
              right: 3,
            };
            isDragScrollNeededForThisScrollContainer = await dragScroll({
              scrollContainer: scrollContainer,
              scrollSpeed,
              desiredFps: 60,
            });

            // console.log(
            //   scrollContainerId,
            //   isDragScrollNeededForThisScrollContainer,
            // );
            if (isDragScrollNeededForThisScrollContainer) {
              return;
            }
          }
        });
      },
      [boardListId, dragScroll, getCurPointerEvent],
    );

    const onDragOver = useCallback(
      (event: DragOverEvent) => {
        // console.log("[onDragOver]");

        const { active, over } = event;
        // console.log("active:", active);
        // console.log("over:", over);
        if (!over) {
          return;
        }
        const activeId = active.id;
        const overId = over.id;
        if (typeof activeId !== "string" || typeof overId !== "string") {
          console.warn("[onDragOver] id should only be string.");
          return;
        }
        // if (activeId === overId) {
        //   return;
        // }

        const activeData = isCustomItemData(active.data.current)
          ? active.data.current
          : null;
        if (!activeData) {
          return;
        }
        const overData = isCustomItemData(over.data.current)
          ? over.data.current
          : null;
        if (!overData) {
          return;
        }
        const {
          draggableId: activeDraggableId,
          droppableId: activeDroppableId,
          indexOfDraggable: idxFrom,
        } = getDndContextInfoFromData({
          boardListContext: stateBoardListContext,
          data: activeData,
        });
        let {
          draggableId: overDraggableId,
          droppableId: overDroppableId,
          indexOfDraggable: idxTo,
          parentAsDroppableOfChild,
        } = getDndContextInfoFromData({
          boardListContext: stateBoardListContext,
          data: overData,
        });

        if (
          (!isParentItemData(activeData) && !isChildItemData(activeData)) ||
          (!isParentItemData(overData) && !isChildItemData(overData)) ||
          !activeDraggableId ||
          !activeDroppableId ||
          idxFrom < 0 ||
          !overDraggableId ||
          !overDroppableId ||
          idxTo < 0 ||
          (isParentItemData(overData) && !parentAsDroppableOfChild)
        ) {
          return;
        }

        if (isParentItemData(activeData) && isParentItemData(overData)) {
          setStateBoardListContext((curBoardListContext) => {
            curBoardListContext.indexer.moveParent({
              indexFrom: idxFrom,
              indexTo: idxTo,
            });
            return {
              boardListId,
              indexer: curBoardListContext.indexer,
            };
          });
          return;
        }

        if (isParentItemData(overData)) {
          if (!parentAsDroppableOfChild) {
            return;
          }
          overDroppableId = parentAsDroppableOfChild.droppableId;
          idxTo = parentAsDroppableOfChild.droppableLength;
          if (!overDroppableId || idxTo < 0) {
            return;
          }
        }

        console.group();
        console.log(
          `Active: ${activeDraggableId} ${activeDroppableId} ${idxFrom}`,
        );
        console.log(`Over: ${overDraggableId} ${overDroppableId} ${idxTo}`);
        console.log((activeData as any).sortable.items);
        console.groupEnd();

        setStateBoardListContext((curBoardListContext) => {
          curBoardListContext.indexer.moveChild({
            parentIdFrom: activeDroppableId,
            parentIdTo: overDroppableId,
            indexFrom: idxFrom,
            indexTo: idxTo,
          });
          return {
            boardListId,
            indexer: curBoardListContext.indexer,
          };
        });
      },
      [boardListId, stateBoardListContext, setStateBoardListContext],
    );

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

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        console.log("[onDragEnd]");

        setIsDragging(false);

        setStateActiveParentItem(null);
        setStateActiveChildItem(null);
        refDragOverlayReactElement.current = null;

        // const { active, over } = event;
        // // console.log(event);
        // // console.log("active:", active);
        // // console.log("over:", over);

        // if (!over) {
        //   return;
        // }

        // const activeId = active.id;
        // const overId = over.id;
        // if (typeof activeId !== "string" || typeof overId !== "string") {
        //   console.warn("[onDragOver] id should only be string.");
        //   return;
        // }

        // const activeDataUnknown = active.data
        //   .current as DndDataInterfaceUnknown;
        // const overDataUnknown = over.data.current as DndDataInterfaceUnknown;
        // if (!activeDataUnknown || !overDataUnknown || activeId === overId) {
        //   return;
        // }

        // if (
        //   isParentItemData(activeDataUnknown) &&
        //   isParentItemData(overDataUnknown)
        // ) {
        //   const activeData = activeDataUnknown;
        //   const overData = overDataUnknown;

        //   const idxFrom = activeData.sortable.index;
        //   const idxTo = overData.sortable.index;
        //   setStateNestedIndexer((curNestedIndexer) => {
        //     const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
        //       curNestedIndexer,
        //     );
        //     newNestedIndexer.moveParent({
        //       idxFrom,
        //       idxTo,
        //     });
        //     return newNestedIndexer;
        //   });
        // }
      },
      [setStateBoardListContext],
    );

    const sensors = useSensors(
      useSensor(MouseSensor, {
        // activationConstraint: {
        //   distance: 3,
        //   // ㄴ Need to move 3px to activate drag event.
        // },
      }),
      useSensor(TouchSensor, {
        // activationConstraint: {
        //   distance: 3,
        //   // ㄴ Need to move 3px to activate drag event.
        // },
      }),
      // useSensor(KeyboardSensor, {
      //   coordinateGetter: sortableKeyboardCoordinates,
      // }),
    );

    const parentIdList = useMemo(() => {
      return (
        parentItems.map((parentItem) => parentItem.id) ??
        getEmptyArray<ParentItem>()
      );
    }, [parentItems]);

    const modifiers = stateActiveParentItem
      ? getMemoizedArray({
          arr: [restrictToHorizontalAxis],
          keys: ["stateActiveParentItem"],
        })
      : stateActiveChildItem
        ? getMemoizedArray({
            arr: [restrictToWindowEdges],
            keys: ["stateActiveChildItem"],
          })
        : getEmptyArray<Modifier>();
    // console.log(modifiers);

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
      <DndContext
        sensors={sensors}
        collisionDetection={
          // closestCenter
          closestCorners
          // customCollisionDetectionAlgorithm
          // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#when-should-i-use-the-closest-corners-algorithm-instead-of-closest-center
        }
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        // autoScroll={{ acceleration: 1 }}
        autoScroll={{ enabled: false }}
      >
        <BoardListInternalBase
          ref={refBase}
          {...scrollContainerCustomAttributes}
          {...otherProps}
        >
          <BoardListDropArea ref={refDroppable} {...droppableCustomAttributes}>
            <SortableContext
              id={boardListId}
              items={parentIdList}
              strategy={horizontalListSortingStrategy}
            >
              {children}
            </SortableContext>
          </BoardListDropArea>
        </BoardListInternalBase>
        {createPortal(
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
        )}
      </DndContext>
    );
  },
});

export type BoardListProps = BoardListInternalProps;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (
    { parentKeyName, childKeyName, parentItems, children, ...otherProps },
    ref,
  ) => {
    return (
      //TODO: Recoil Root
      <BoardListInternal
        ref={ref}
        parentKeyName={parentKeyName}
        childKeyName={childKeyName}
        parentItems={parentItems}
        {...otherProps}
      >
        {children}
      </BoardListInternal>
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
