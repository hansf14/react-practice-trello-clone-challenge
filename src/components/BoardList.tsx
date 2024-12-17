import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import { useRecoilState } from "recoil";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import { getEmptyArray, StyledComponentProps } from "@/utils";
import { cardsContainerAtom } from "@/components/BoardMain";
import {
  nestedIndexerAtom,
  ParentItem,
  ChildItem,
  DndDataInterface,
  DroppableCustomAttributesKvObj,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";

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
    const {
      ref: setNodeRef,
      isDropTarget,
      // droppable,
    } = useDroppable({
      id: boardListId,
      accept: ["parent"] satisfies DndDataInterface["type"][],
      type: "root",
      collisionPriority: CollisionPriority.Highest,
    });

    // const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
    //   "data-droppable-id": boardListId,
    //   "data-droppable-allowed-types": "parent",
    // };

    return (
      <BoardListDropAreaBase
        ref={setNodeRef}
        isDropTarget={isDropTarget}
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

    const onDragStart = useCallback((event: any) => {
      console.log("[onDragStart]");
      console.log(event);
    }, []);

    const [stateNestedIndexer, setStateNestedIndexer] = useRecoilState(
      nestedIndexerAtom({
        parentKeyName,
        childKeyName,
        items: defaultCategoryTaskItems,
      }),
    );

    const onDragOver = useCallback(
      (event: any) => {
        console.log("[onDragOver]");

        // console.log(event);
        const {
          operation: { source, target },
        } = event;

        console.log(source.id);
        console.log(source.sortable.initialIndex);
        console.log(source.sortable.previousIndex);
        console.log(target.id);
        console.log(target.sortable.initialIndex);
        console.log(target.sortable.previousIndex);

        // target.element
        // target.index

        // console.log("active:", active);
        // console.log("over:", over);

        if (source.type === "child" && target.type === "parent") {
          const [parentIdFrom] =
            stateNestedIndexer.getParentIdFromChildId({
              childId: source.id,
            }) ?? getEmptyArray<string>();
          const parentIdTo = target.id;

          if (!parentIdFrom || !parentIdTo) {
            console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
            return;
          }

          const childIdListFrom = stateNestedIndexer.getChildIdListFromParentId(
            {
              parentId: parentIdFrom,
            },
          );
          const childIdListTo = stateNestedIndexer.getChildIdListFromParentId({
            parentId: parentIdTo,
          });

          if (!childIdListFrom || !childIdListTo) {
            console.warn("[onDragEnd] !childIdListFrom || !childIdListTo");
            return;
          }

          const idxFrom = childIdListFrom.findIndex(
            (childId) => childId === source.id,
          );
          const idxTo = target.sortable.initialIndex;
          console.log(target.sortable.initialIndex);
          console.log(target.sortable.previousIndex);

          setStateNestedIndexer((curNestedIndexer) => {
            const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
              curNestedIndexer,
            );
            newNestedIndexer.moveChild({
              parentIdFrom,
              parentIdTo,
              idxFrom,
              idxTo,
            });
            return newNestedIndexer;
          });
          return;
        }

        if (source.type === "child" && target.type === "child") {
          const [parentIdFrom] =
            stateNestedIndexer.getParentIdFromChildId({
              childId: source.id,
            }) ?? getEmptyArray<string>();

          const [parentIdTo] =
            stateNestedIndexer.getParentIdFromChildId({
              childId: target.id,
            }) ?? getEmptyArray<string>();

          const childIdListFrom = stateNestedIndexer.getChildIdListFromParentId(
            {
              parentId: parentIdFrom,
            },
          );
          const childIdListTo = stateNestedIndexer.getChildIdListFromParentId({
            parentId: parentIdTo,
          });
          if (!childIdListFrom || !childIdListTo) {
            console.warn("[onDragEnd] !childIdListFrom || !childIdListTo");
            return;
          }

          const idxFrom = childIdListFrom.findIndex(
            (childId) => childId === source.id,
          );
          const idxTo = childIdListTo.findIndex(
            (childId) => childId === target.id,
          );
          console.log(idxFrom);
          console.log(source.sortable.initialIndex);
          console.log(source.sortable.previewIndex);
          console.log(idxTo);
          console.log(target.sortable.initialIndex);
          console.log(target.sortable.previewIndex);

          setStateNestedIndexer((curNestedIndexer) => {
            const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
              curNestedIndexer,
            );
            newNestedIndexer.moveChild({
              parentIdFrom,
              parentIdTo,
              idxFrom,
              idxTo,
            });
            return newNestedIndexer;
          });
          return;
        }
      },
      [stateNestedIndexer, setStateNestedIndexer],
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

    // const onDragEnd = () => {
    //   console.log("[onDragEnd]");
    // };
    const onDragEnd = useCallback(
      (event: any) => {
        console.log("[onDragEnd]");

        // console.log(event);
        const {
          operation: { source, target },
        } = event;
        // console.log("source:", source);
        // console.log("target:", target);
        console.log(source.type, target.type);

        if (source.type === "parent" && target.type === "parent") {
          // const parentIdFrom = source.id;
          // const parentIdTo = target.id;
          // console.log(parentIdFrom);
          // console.log(parentIdTo);

          // const parentIdList = stateNestedIndexer.getParentIdList();
          // if (!parentIdList) {
          //   console.warn("[onDragEnd] !parentIdList");
          //   return;
          // }
          // const idxFrom = parentIdList.findIndex(
          //   (parentId) => parentId === parentIdFrom,
          // );
          // const idxTo = parentIdList.findIndex(
          //   (parentId) => parentId === parentIdTo,
          // );

          const idxFrom = source.index;
          const idxTo = target.index;
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
          return;
        }
      },
      [setStateNestedIndexer],
    );

    // const sensors = useSensors(
    //   // useSensor(PointerSensor, {
    //   //   activationConstraint: {
    //   //     distance: 3,
    //   //     // ㄴ Need to move 3px to activate drag event.
    //   //   },
    //   // }),
    //   useSensor(MouseSensor),
    //   useSensor(TouchSensor),
    //   // useSensor(KeyboardSensor, {
    //   //   coordinateGetter: sortableKeyboardCoordinates,
    //   // }),
    // );

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    return (
      <DragDropProvider
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <BoardListInternalBase ref={refBase} {...otherProps}>
          <BoardListDropArea>{children}</BoardListDropArea>
          {/* <BoardListDropArea
            ref={setNodeRef}
            isDropTarget={isDropTarget}
            {...droppableCustomAttributes}
          >
            {children}
          </BoardListDropArea> */}
        </BoardListInternalBase>
      </DragDropProvider>
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
    { parentKeyName, childKeyName, parentItems, ...otherProps },
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
      />
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
