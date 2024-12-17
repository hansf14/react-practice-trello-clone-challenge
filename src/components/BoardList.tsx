import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import { useRecoilState } from "recoil";
import parse from "html-react-parser";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import {
  getEmptyArray,
  getMemoizedArray,
  SmartOmit,
  StyledComponentProps,
} from "@/utils";
import { cardsContainerAtom } from "@/components/BoardMain";
import {
  nestedIndexerAtom,
  ParentItem,
  ChildItem,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import {
  DragDropContext,
  Droppable,
  DroppableStateSnapshot,
  OnDragEndResponder,
  OnDragStartResponder,
  OnDragUpdateResponder,
} from "@hello-pangea/dnd";

const BoardListInternalBase = styled.div`
  ${CssScrollbar}

  overflow-x: auto;

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
  isDraggingOver?: boolean;
};

const BoardListDropArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDraggingOver"].includes(prop),
})<BoardListDropAreaProps>`
  min-width: max-content;
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: stretch;
  align-items: center;
  // gap: 10px;
  // ㄴ Causes jittering in @hello-pangea/dnd
  padding: 10px;
  border-radius: 10px;

  ${({ isDraggingOver }) =>
    (isDraggingOver ?? false)
      ? css`
          background-color: rgb(0, 0, 0, 0.5);
        `
      : ""}
`;

export type BoardListInternalProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems?: ParentItem[];
  children?: ({
    droppablePlaceholder,
    droppableStateSnapshot,
  }: {
    droppablePlaceholder: React.ReactNode;
    droppableStateSnapshot: DroppableStateSnapshot;
  }) => React.ReactNode;
} & SmartOmit<StyledComponentProps<"div">, "children">;

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

    const onDragStart = useCallback<OnDragStartResponder>((event) => {
      console.log("[onDragStart]");
      console.log(event);
      // if (event.active.data.current) {
      //   const activator = event.activatorEvent.target as HTMLElement | null;
      //   if (!activator) {
      //     return;
      //   }
      //   const draggableHandle = activator.closest(
      //     `[${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
      //   );
      //   // console.log(draggableHandle);
      //   if (!draggableHandle) {
      //     return;
      //   }
      //   const draggableHandleId = draggableHandle.getAttribute(
      //     DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"],
      //   );
      //   // console.log(draggableHandleId);
      //   if (!draggableHandleId) {
      //     return;
      //   }
      //   const draggableId = draggableHandleId;
      //   const draggable = draggableHandle.closest(
      //     `[${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
      //   ) as HTMLElement;
      //   console.log(draggable);
      //   if (!draggable) {
      //     return;
      //   }
      //   refDragOverlayReactElement.current = parse(
      //     draggable.outerHTML,
      //   ) as React.ReactElement;
      //   refDragOverlayReactElement.current = React.cloneElement(
      //     refDragOverlayReactElement.current,
      //     {
      //       style: {
      //         width: draggable.offsetWidth,
      //         height: draggable.offsetHeight,
      //         cursor: "grabbing",
      //         opacity: "1",
      //       } satisfies React.CSSProperties,
      //     },
      //   );
      //   const dndData = event.active.data.current as DndDataInterface;
      //   if (dndData.type === "parent") {
      //     setStateActiveParentItem(event.active.data.current.item);
      //   } else if (dndData.type === "child") {
      //     setStateActiveChildItem(event.active.data.current.item);
      //   } else {
      //     console.warn("[onDragStart] invalid dndData.type");
      //   }
      // }
    }, []);

    const [stateNestedIndexer, setStateNestedIndexer] = useRecoilState(
      nestedIndexerAtom({
        parentKeyName,
        childKeyName,
        items: defaultCategoryTaskItems,
      }),
    );

    const onDragOver = useCallback<OnDragUpdateResponder>((event) => {
      console.log("[onDragOver]");

      // const { active, over } = event;
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
      // const activeData = active.data.current as DndActiveDataInterface;
      // const overData = over.data.current as DndOverDataInterface;
      // const activeType = activeData.type;
      // const overType = overData.type;
      // const activeIndex = activeData.sortable.index;
      // const overIndex = overData.sortable.index;
      // // console.log("activeType:", activeType);
      // // console.log("overType:", overType);
      // // console.log("activeIndex:", activeIndex);
      // // console.log("overIndex:", overIndex);
      // if (activeIndex === -1 || overIndex === -1) {
      //   return;
      // }
      // if (activeType === "child" && overType === "child") {
      //   // setStateNestedIndexer((curNestedIndexer) => {
      //   //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
      //   //     curNestedIndexer,
      //   //   );
      //   //   const [parentIdFrom] =
      //   //     newNestedIndexer.getParentIdFromChildId({
      //   //       childId: activeId,
      //   //     }) ?? getEmptyArray<string>();
      //   //   const [parentIdTo] =
      //   //     newNestedIndexer.getParentIdFromChildId({
      //   //       childId: overId,
      //   //     }) ?? getEmptyArray<string>();
      //   //   if (!parentIdFrom || !parentIdTo) {
      //   //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
      //   //     return newNestedIndexer;
      //   //   }
      //   //   newNestedIndexer.moveChild({
      //   //     parentIdFrom,
      //   //     parentIdTo,
      //   //     idxFrom: activeIndex,
      //   //     idxTo: overIndex,
      //   //   });
      //   //   return newNestedIndexer;
      //   // });
      // } else if (activeType === "child" && overType === "parent") {
      //   // setStateNestedIndexer((curNestedIndexer) => {
      //   //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
      //   //     curNestedIndexer,
      //   //   );
      //   //   const [parentIdFrom] =
      //   //     newNestedIndexer.getParentIdFromChildId({
      //   //       childId: activeId,
      //   //     }) ?? getEmptyArray<string>();
      //   //   const [parentIdTo] =
      //   //     newNestedIndexer.getParentIdFromChildId({
      //   //       childId: overId,
      //   //     }) ?? getEmptyArray<string>();
      //   //   if (!parentIdFrom || !parentIdTo) {
      //   //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
      //   //     return newNestedIndexer;
      //   //   }
      //   //   newNestedIndexer.moveChild({
      //   //     parentIdFrom,
      //   //     parentIdTo,
      //   //     idxFrom: activeIndex,
      //   //     idxTo: overIndex,
      //   //   });
      //   //   return newNestedIndexer;
      //   // });
      // }
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
    const onDragEnd = useCallback<OnDragEndResponder>(
      (event) => {
        console.log("[onDragEnd]");
        // const { active, over } = event;
        // // console.log(event);
        // console.log("active:", active);
        // console.log("over:", over);
        // if (!over) {
        //   return;
        // }
        // const activeId = active.id;
        // const overId = over.id;
        // const activeData = active.data.current as DndActiveDataInterface;
        // const overData = over.data.current as DndOverDataInterface;
        // if (activeId === overId) {
        //   return;
        // }
        // const idxFrom = activeData.sortable.index;
        // const idxTo = overData.sortable.index;
        // setStateNestedIndexer((curNestedIndexer) => {
        //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
        //     curNestedIndexer,
        //   );
        //   newNestedIndexer.moveParent({
        //     idxFrom,
        //     idxTo,
        //   });
        //   return newNestedIndexer;
        // });
        // setStateActiveParentItem(null);
        // setStateActiveChildItem(null);
      },
      [setStateNestedIndexer],
    );

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    return (
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <BoardListInternalBase ref={refBase} {...otherProps}>
          <Droppable droppableId={boardListId} direction="horizontal">
            {(droppableProvided, droppableStateSnapshot) => {
              // console.log(droppableStateSnapshot.draggingFromThisWith);
              return (
                <BoardListDropArea
                  //  ref={ref} // TODO: cf> Board
                  ref={droppableProvided.innerRef}
                  isDraggingOver={droppableStateSnapshot.isDraggingOver}
                  {...droppableProvided.droppableProps}
                  {...otherProps}
                >
                  {children?.({
                    droppablePlaceholder: droppableProvided.placeholder,
                    droppableStateSnapshot,
                  })}
                </BoardListDropArea>
              );
            }}
          </Droppable>
        </BoardListInternalBase>
      </DragDropContext>
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
