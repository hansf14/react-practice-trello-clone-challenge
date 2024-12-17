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
import { BoardListInternal, BoardListProps } from "@/components/BoardList";
import { getEmptyArray, SmartOmit } from "@/utils";
import {
  ChildItem,
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
import { NestedIndexer, NestedIndexerItem } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { StatViewer } from "@/components/StatViwer";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import { DragDropProvider } from "@dnd-kit/react";
import { DragDropManager, KeyboardSensor, PointerSensor } from "@dnd-kit/dom";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";

const CategoryTaskBoardListInternalBase = styled(BoardListInternal)``;

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

    const taskList = useMemo(() => {
      return categoryList.map((category) => {
        return (
          stateCategoryTaskNestedIndexer.getChildListFromParentId__MutableChild(
            { parentId: category.id },
          ) ?? getEmptyArray<ChildItem>()
        );
      });
    }, [categoryList, stateCategoryTaskNestedIndexer]);

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

    // const manager = new DragDropManager({
    //   // global sensors
    //   sensors: [PointerSensor, KeyboardSensor],
    //   // global modifiers
    //   // modifiers: [RestrictToHorizontalAxis],
    // });
    // https://next.dndkit.com/react/components/drag-drop-provider
    // https://next.dndkit.com/concepts/drag-drop-manager

    return (
      <CategoryTaskBoardListInternalBase
        ref={ref}
        boardListId={boardListId}
        parentKeyName={parentKeyName}
        childKeyName={childKeyName}
        parentItems={categoryList}
      >
        {categoryList.map((parentItem, index) => {
          return (
            <Board key={parentItem.id} parentItem={parentItem} index={index}>
              {({
                // draggableHandleAttributes,
                // draggableHandleListeners,
                setDraggableHandleRef,
                draggableHandleCustomAttributes,
              }) => {
                return (
                  <>
                    <BoardHeader
                      parentItem={parentItem}
                      onEditStartParentItem={onEditStartParentItem}
                      onEditFinishParentItem={onEditFinishParentItem}
                      setDraggableHandleRef={setDraggableHandleRef}
                      // draggableHandleAttributes={draggableHandleAttributes}
                      // draggableHandleListeners={draggableHandleListeners}
                      draggableHandleCustomAttributes={
                        draggableHandleCustomAttributes
                      }
                    />
                    <BoardMain
                      boardListId={boardListId}
                      parentItem={parentItem}
                    >
                      {taskList[index].map((childItem, index) => {
                        return (
                          <Card
                            key={childItem.id}
                            item={childItem}
                            index={index}
                            // onUpdateChildItem={onUpdateChildItem}
                          />
                        );
                      })}
                    </BoardMain>
                  </>
                );
              }}
            </Board>
          );
        })}
      </CategoryTaskBoardListInternalBase>
    );
  },
});

export type CategoryBoardListProps = CategoryBoardListInternalProps;

export const CategoryTaskBoardList = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListProps
>({
  displayName: "CategoryTaskBoardList",
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
