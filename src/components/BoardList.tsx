import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import { useRecoilState } from "recoil";
import parse from "html-react-parser";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import { getEmptyArray, getMemoizedArray, StyledComponentProps } from "@/utils";
import { cardsContainerAtom } from "@/components/BoardMain";
import {
  nestedIndexerAtom,
  ParentItem,
  ChildItem,
  DndDataInterface,
  DroppableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvMapping,
  DraggableCustomAttributesKvMapping,
  DndActiveDataInterface,
  DndOverDataInterface,
  isParentItemData,
  DndDataInterfaceUnknown,
  isChildItemData,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import {
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDndContext,
  useDndMonitor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import {
  restrictToFirstScrollableAncestor,
  restrictToHorizontalAxis,
} from "@dnd-kit/modifiers";
import { createPortal } from "react-dom";
import { useDragScroll } from "@/hooks/useDragScroll";

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

const BoardListDropAreaBase = styled.div.withConfig({
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

// Sortable extra-plugins
// Sortable.mount(new MultiDrag(), new Swap());

// export type BoardListExtendProps = SmartOmit<
//   BoardListProps,
//   // "forEachParentItem"
// >;

const BoardListDropArea = withMemoAndRef({
  Component: ({ boardListId, ...otherProps }: any, ref) => {
    // const {
    //   ref: setNodeRef,
    //   isDropTarget,
    //   // droppable,
    // } = useDroppable({
    //   id: boardListId,
    //   accept: ["parent"] satisfies DndDataInterface["type"][],
    //   type: "root",
    //   collisionPriority: CollisionPriority.Highest,
    // });

    // const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
    //   "data-droppable-id": boardListId,
    //   "data-droppable-allowed-types": "parent",
    // };

    return (
      <BoardListDropAreaBase
        // ref={setNodeRef}
        // isDropTarget={isDropTarget}
        // {...droppableCustomAttributes}
        {...otherProps}
      />
    );
  },
});

export type BoardListInternalProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems?: ParentItem[];
  // children?: ({
  //   droppableProvided,
  //   droppableSnapshot,
  //   // draggableHandleCustomAttributes,
  // }: {
  //   droppableProvided: DroppableProvided;
  //   droppableSnapshot: DroppableStateSnapshot;
  //   draggableHandleCustomAttributes: Record<string, string>;
  // }) => React.ReactNode;
} & StyledComponentProps<"div">;

export const BoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardListInternalProps
>({
  displayName: "BoardListInternal",
  Component: (props, ref) => {
    const {
      boardListId,
      parentKeyName,
      childKeyName,
      parentItems = getEmptyArray<ParentItem>(),
      // forEachParentItem,
      children,
      ...otherProps
    } = props;

    const [stateActiveParentItem, setStateActiveParentItem] =
      useState<ParentItem | null>(null);
    const [stateActiveChildItem, setStateActiveChildItem] =
      useState<ChildItem | null>(null);
    const refDragOverlayReactElement = useRef<React.ReactElement | null>(null);

    const [stateNestedIndexer, setStateNestedIndexer] = useRecoilState(
      nestedIndexerAtom({
        parentKeyName,
        childKeyName,
        items: defaultCategoryTaskItems,
      }),
    );

    const [isDragging, setIsDragging] = useState(false);
    const { dragScroll, endDragScroll } = useDragScroll();

    const onDragStart = useCallback((event: DragStartEvent) => {
      console.log("[onDragStart]");
      // console.log(event);

      setIsDragging(true);

      if (event.active.data.current) {
        const activator = event.activatorEvent.target as HTMLElement | null;
        if (!activator) {
          return;
        }
        const draggableHandle = activator.closest(
          `[${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
        );
        // console.log(draggableHandle);
        if (!draggableHandle) {
          return;
        }
        const draggableHandleId = draggableHandle.getAttribute(
          DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"],
        );
        // console.log(draggableHandleId);
        if (!draggableHandleId) {
          return;
        }
        const draggableId = draggableHandleId;
        const draggable = draggableHandle.closest(
          `[${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
        ) as HTMLElement;
        console.log(draggable);
        if (!draggable) {
          return;
        }
        refDragOverlayReactElement.current = parse(
          draggable.outerHTML,
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
          .current as DndDataInterfaceUnknown;
        if (isParentItemData(activeDataUnknown)) {
          const activeDataParent = activeDataUnknown;
          setStateActiveParentItem(activeDataParent.item);
        } else if (isChildItemData(activeDataUnknown)) {
          const activeDataChild = activeDataUnknown;
          setStateActiveChildItem(activeDataChild.item);
        } else {
          console.warn("[onDragStart] invalid dndData.type");
        }
      }
    }, []);

    // Update scroll direction on drag move
    const onDragMove = ({
      active,
      over,
      activatorEvent,
      delta,
      collisions,
    }: DragMoveEvent) => {
      // console.log("[onDragMove]");

      dragScroll({
        isDragging,
        elementScrollContainer: refBase.current,
        active,
      });
    };

    const onDragOver = useCallback((event: DragOverEvent) => {
      console.log("[onDragOver]");

      const { active, over } = event;
      console.log("active:", active);
      console.log("over:", over);
      if (!over) {
        return;
      }
      const activeId = active.id;
      const overId = over.id;
      if (typeof activeId !== "string" || typeof overId !== "string") {
        console.warn("[onDragOver] id should only be string.");
        return;
      }
      const activeData = active.data.current as DndDataInterfaceUnknown;
      const overData = over.data.current as DndDataInterfaceUnknown;
      const activeType = activeData.type;
      const overType = overData.type;
      const activeIndex = activeData.sortable.index;
      const overIndex = overData.sortable.index;
      // console.log("activeType:", activeType);
      // console.log("overType:", overType);
      // console.log("activeIndex:", activeIndex);
      // console.log("overIndex:", overIndex);
      if (activeIndex === -1 || overIndex === -1) {
        return;
      }
      if (activeType === "child" && overType === "child") {
        // setStateNestedIndexer((curNestedIndexer) => {
        //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
        //     curNestedIndexer,
        //   );
        //   const [parentIdFrom] =
        //     newNestedIndexer.getParentIdFromChildId({
        //       childId: activeId,
        //     }) ?? getEmptyArray<string>();
        //   const [parentIdTo] =
        //     newNestedIndexer.getParentIdFromChildId({
        //       childId: overId,
        //     }) ?? getEmptyArray<string>();
        //   if (!parentIdFrom || !parentIdTo) {
        //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
        //     return newNestedIndexer;
        //   }
        //   newNestedIndexer.moveChild({
        //     parentIdFrom,
        //     parentIdTo,
        //     idxFrom: activeIndex,
        //     idxTo: overIndex,
        //   });
        //   return newNestedIndexer;
        // });
      } else if (activeType === "child" && overType === "parent") {
        // setStateNestedIndexer((curNestedIndexer) => {
        //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
        //     curNestedIndexer,
        //   );
        //   const [parentIdFrom] =
        //     newNestedIndexer.getParentIdFromChildId({
        //       childId: activeId,
        //     }) ?? getEmptyArray<string>();
        //   const [parentIdTo] =
        //     newNestedIndexer.getParentIdFromChildId({
        //       childId: overId,
        //     }) ?? getEmptyArray<string>();
        //   if (!parentIdFrom || !parentIdTo) {
        //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
        //     return newNestedIndexer;
        //   }
        //   newNestedIndexer.moveChild({
        //     parentIdFrom,
        //     parentIdTo,
        //     idxFrom: activeIndex,
        //     idxTo: overIndex,
        //   });
        //   return newNestedIndexer;
        // });
      }
    }, []);

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

    // const onDragEnd = () => {
    //   console.log("[onDragEnd]");
    // };
    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        console.log("[onDragEnd]");

        setIsDragging(false);

        const { active, over } = event;
        // console.log(event);
        console.log("active:", active);
        console.log("over:", over);
        if (!over) {
          return;
        }
        const activeId = active.id;
        const overId = over.id;
        const activeDataUnknown = active.data
          .current as DndDataInterfaceUnknown;
        const overDataUnknown = over.data.current as DndDataInterfaceUnknown;
        if (!activeDataUnknown || !overDataUnknown || activeId === overId) {
          return;
        }

        if (
          isParentItemData(activeDataUnknown) &&
          isParentItemData(overDataUnknown)
        ) {
          const activeData = activeDataUnknown;
          const overData = overDataUnknown;

          const idxFrom = activeData.sortable.index;
          const idxTo = overData.sortable.index;
          setStateNestedIndexer((curNestedIndexer) => {
            const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
              curNestedIndexer,
            );
            newNestedIndexer.moveParent({
              idxFrom,
              idxTo,
            });
            return newNestedIndexer;
          });
        }

        setStateActiveParentItem(null);
        setStateActiveChildItem(null);
      },
      [setStateNestedIndexer],
    );

    const sensors = useSensors(
      useSensor(MouseSensor, {
        // activationConstraint: {
        //   distance: 3,
        //   // ㄴ Need to move 3px to activate drag event.
        // },
      }),
      useSensor(TouchSensor),
      // useSensor(KeyboardSensor, {
      //   coordinateGetter: sortableKeyboardCoordinates,
      // }),
    );

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#composition-of-existing-algorithms
    // function customCollisionDetectionAlgorithm(args) {
    //   // First, let's see if there are any collisions with the pointer
    //   const pointerCollisions = pointerWithin(args);

    //   // Collision detection algorithms return an array of collisions
    //   if (pointerCollisions.length > 0) {
    //     return pointerCollisions;
    //   }

    //   // If there are no collisions with the pointer, return rectangle intersections
    //   return rectIntersection(args);
    // }

    /////////////////////////////////////////

    // const handleDragEnd = () => {
    //   setScrollSpeed({ x: 0, y: 0 });
    // };

    // const { active } = useDndContext()

    // const [scrollDirection, setScrollDirection] = useState(null)

    // // this scrolls the section based on the direction
    // useEffect(() => {
    //   if (!scrollDirection) return

    //   const el = refBase.current
    //   if (!el) return

    //   const speed = 10

    //   const intervalId = setInterval(() => {
    //     el.scrollLeft += speed * scrollDirection
    //   }, 5)

    //   return () => {
    //     clearInterval(intervalId)
    //   }
    // }, [scrollDirection, refBase.current])

    // // if we are dragging, detect if we are near the edge of the section
    // useEffect(() => {
    //   const handleMouseMove = (event) => {
    //     const el = refBase.current
    //     if (!active || !el) return
    //     const isOverflowing = el.scrollWidth > el.clientWidth
    //     if (!isOverflowing) return

    //     // get bounding box of the section
    //     const { left, right } = el.getBoundingClientRect()
    //     // xPos of the mouse
    //     const xPos = event.clientX
    //     const threshold = 200

    //     const newScrollDirection = xPos < left + threshold ? -1 : xPos > right - threshold ? 1 : null
    //     if (newScrollDirection !== scrollDirection) {
    //       setScrollDirection(newScrollDirection)
    //     }
    //   }
    //   if (active) {
    //     window.addEventListener('mousemove', handleMouseMove)
    //   } else {
    //     window.removeEventListener('mousemove', handleMouseMove)
    //     setScrollDirection(null)
    //   }
    //   return () => {
    //     window.removeEventListener('mousemove', handleMouseMove)
    //     setScrollDirection(null)
    //   }
    // }, [active, refBase.current])

    const parentIdList = useMemo(() => {
      return (
        parentItems.map((parentItem) => ({
          id: parentItem.id,
        })) ?? getEmptyArray<ParentItem>()
      );
    }, [parentItems]);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={
          // closestCenter
          closestCorners
          // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#when-should-i-use-the-closest-corners-algorithm-instead-of-closest-center
        }
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        // autoScroll={{ acceleration: 1 }}
        autoScroll={{ enabled: false }}
      >
        {/* <SortableContext items={parentItems}> */}
        <BoardListInternalBase ref={refBase} {...otherProps}>
          <BoardListDropArea>
            <SortableContext items={parentIdList}>{children}</SortableContext>
          </BoardListDropArea>
        </BoardListInternalBase>
        {/* </SortableContext> */}
        {createPortal(
          <DragOverlay
            modifiers={
              stateActiveParentItem
                ? getMemoizedArray({
                    arr: [
                      restrictToHorizontalAxis,
                      restrictToFirstScrollableAncestor,
                    ],
                    keys: ["stateActiveParentItem"],
                  })
                : getEmptyArray<Modifier>()
            }
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
{
  /* <DndContext
  sensors={sensors}
  collisionDetection={
    // closestCenter
    closestCorners
    // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#when-should-i-use-the-closest-corners-algorithm-instead-of-closest-center
  }
  onDragStart={onDragStart}
  onDragOver={onDragOver}
  onDragEnd={onDragEnd}
  autoScroll={{ acceleration: 1 }}
> */
}
{
  /* {createPortal(
  <DragOverlay
    modifiers={
      stateActiveParentItem
        ? getMemoizedArray({
            refs: [
              restrictToHorizontalAxis,
              restrictToFirstScrollableAncestor,
            ],
          })
        : getEmptyArray<Modifier>()
    }
    dropAnimation={null}
    // dropAnimation={{
    //   // ...defaultDropAnimation,
    //   sideEffects: defaultDropAnimationSideEffects({
    //     styles: {
    //       active: {
    //         opacity: "1",
    //       },
    //     },
    //   }),
    // }}
    // https://github.com/clauderic/dnd-kit/issues/317
    // ㄴ Removes flickering due to opacity animation
  >
    {refDragOverlayReactElement.current}
  </DragOverlay>,
  document.body,
)} */
}

export type BoardListProps = BoardListInternalProps;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (
    { parentKeyName, childKeyName, parentItems, children, ...otherProps },
    ref,
  ) => {
    const parentIdList = useMemo(() => {
      return (
        (parentItems ?? getEmptyArray<ChildItem>()).map((parentItem) => ({
          id: parentItem.id,
        })) ?? getEmptyArray<ParentItem>()
      );
    }, [parentItems]);

    return (
      //TODO: Recoil Root
      <BoardListInternal
        ref={ref}
        parentKeyName={parentKeyName}
        childKeyName={childKeyName}
        parentItems={parentItems}
        {...otherProps}
      >
        <SortableContext items={parentIdList}>{children}</SortableContext>
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
