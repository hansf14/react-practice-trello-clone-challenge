import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
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
import { BoardList, BoardListProps } from "@/components/BoardList";
import { getEmptyArray, SmartOmit } from "@/utils";
import { nestedIndexerAtom, ParentItem } from "@/components/BoardContext";
import { NestedIndexer, NestedIndexerItem } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { StatViewer } from "@/components/StatViwer";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { UseDndRoot, UseDndRootHandle } from "@/components/UseDndRoot";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultCategoryTaskItems } from "@/data";

const CategoryTaskBoardListInternalBase = styled(BoardList)``;

export type CategoryBoardListInternalProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems: ParentItem[];
};

export const CategoryTaskBoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: (
    { boardListId, parentKeyName, childKeyName, parentItems },
    ref,
  ) => {
    // const onUpdateChildItem = useCallback<OnUpdateChildItem>(
    //   ({ event, oldChildItem, newChildItem }) => {
    //     // console.log(event.target.value);
    //     setStateNestedIndexer((cur) => {
    //       const newIndexer = new NestedIndexer(cur);
    //       newIndexer.updateChild({
    //         childId: oldChildItem.id,
    //         child: newChildItem,
    //       });
    //       return newIndexer;
    //     });
    //   },
    //   [setStateNestedIndexer],
    // );

    // const forEachChildItem = useCallback<ForEachChildItem>(
    //   ({ idx, item, items }) => {
    //     return (
    //       <Card
    //         // key={item.id}
    //         childItem={item}
    //         onUpdateChildItem={onUpdateChildItem}
    //       />
    //     );
    //     // return items.map((item) => {
    //     //   return (
    //     //     <Card
    //     //       // key={item.id}
    //     //       childItem={item}
    //     //       onUpdateChildItem={onUpdateChildItem}
    //     //     />
    //     //   );
    //     // });
    //   },
    //   [onUpdateChildItem],
    // );

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

    // const refDndRoot = useRef<UseDndRootHandle | null>(null);

    // const refBase = useRef<HTMLDivElement | null>(null);
    // useImperativeHandle(ref, () => {
    //   return refBase.current as HTMLDivElement;
    // });

    // const {
    //   DragOverlay,
    //   onDragStart,
    //   // setGroupsRef,
    //   setDraggableRef,
    //   setDraggableHandleRef,
    // } = useDnd({
    //   dndRootHandle: refDndRoot.current,
    //   contextId: boardListId,
    // });

    // const [stateNestedIndexer, setStateNestedIndexer] = useRecoilState(nestedIndexerAtom);

    // const categoryList = stateNestedIndexer.getCategoryList__MutableCategory();

    const [stateCategoryTaskNestedIndexer, setStateCategoryTaskNestedIndexer] =
      useRecoilState(
        nestedIndexerAtom({
          parentKeyName,
          childKeyName,
          items: defaultCategoryTaskItems,
        }),
      );
    const categoryList = useMemo(
      () =>
        stateCategoryTaskNestedIndexer.getParentList__MutableParent() ??
        getEmptyArray<ParentItem>(),
      [stateCategoryTaskNestedIndexer],
    );

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
        setStateCategoryTaskNestedIndexer((curNestedIndexer) => {
          const newIndexer = new NestedIndexer(curNestedIndexer);
          newIndexer.updateParent({
            parentId: oldParentItem.id,
            parent: newParentItem,
          });
          return newIndexer;
        });
      },
      [setStateCategoryTaskNestedIndexer],
    );

    return (
      <>
        <StatViewer
        // TODO: make this draggable and movable (reposition)
        // WrapperComponent={(({ children }) => (
        //   <div>{children}</div>
        // ))}
        />

        <CategoryTaskBoardListInternalBase
          boardListId={boardListId}
          parentKeyName={parentKeyName}
          childKeyName={childKeyName}
          parentItems={categoryList}
        >
          {categoryList.map((parentItem) => {
            return (
              <Board key={parentItem.id} item={parentItem}>
                {({
                  draggableHandleAttributes,
                  draggableHandleListeners,
                  draggableHandleCustomAttributes,
                }) => {
                  return (
                    <>
                      <BoardHeader
                        parentItem={parentItem}
                        onEditStartParentItem={onEditStartParentItem}
                        onEditFinishParentItem={onEditFinishParentItem}
                        draggableHandleAttributes={draggableHandleAttributes}
                        draggableHandleListeners={draggableHandleListeners}
                        draggableHandleCustomAttributes={
                          draggableHandleCustomAttributes
                        }
                      />
                    </>
                  );
                }}
              </Board>
            );
          })}
        </CategoryTaskBoardListInternalBase>
      </>
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
      // initializeState={(snapshot) => {
      //   if (items) {
      //     // Inject default value
      //     snapshot.set(
      //       nestedIndexerAtom,
      //       new NestedIndexer({
      //         parentKeyName,
      //         childKeyName,
      //         items,
      //       }),
      //     );
      //   }
      // }}
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
