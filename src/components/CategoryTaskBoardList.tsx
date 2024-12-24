import { useCallback, useMemo } from "react";
import { Board } from "@/components/Board";
import { BoardHeader } from "@/components/BoardHeader";
import {
  BoardListExtendProps,
  BoardList,
  BoardListProps,
} from "@/components/BoardList";
import { memoizeCallback } from "@/utils";
import {
  ParentItem,
  BoardListContextProvider,
  useBoardContext,
  BoardListContextValue,
  UseBoardContextParams,
} from "@/components/BoardContext";
import { BoardMain } from "@/components/BoardMain";
import { Card } from "@/components/Card";
import { styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { OnEditFinish, OnEditStart } from "@/components/TextArea";

const CategoryTaskBoardListInternalBase = styled(BoardList)``;

export type CategoryBoardListInternalProps = BoardListProps;

export const CategoryTaskBoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: ({ boardListId, parentKeyName, childKeyName }, ref) => {
    const boardListContextParams = useMemo<UseBoardContextParams>(
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

    // const categoryList = useMemo(() => {
    //   // console.log("[categoryList]");
    //   return (
    //     stateBoardListContext.indexer.getParentList__MutableParent() ??
    //     getEmptyArray<ParentItem>()
    //   );
    // }, [stateBoardListContext]);

    // const taskList = useMemo(() => {
    //   return categoryList.map((category) => {
    //     // console.log("[taskList]");
    //     return (
    //       stateBoardListContext.indexer.getChildListOfParentId__MutableChild({
    //         parentId: category.id,
    //       }) ?? getEmptyArray<ChildItem>()
    //     );
    //   });
    // }, [categoryList, stateBoardListContext]);

    const onEditStartParentItem = useCallback<OnEditStart>(
      ({ elementTextArea, handlers: { editCancelHandler } }) => {},
      [],
    );

    const idOnEditFinishParentItem = useMemoizeCallbackId();
    const onEditFinishParentItem = useCallback<
      ({ parentItem }: { parentItem: ParentItem }) => OnEditFinish
    >(
      ({ parentItem }) =>
        memoizeCallback<OnEditFinish>({
          id: idOnEditFinishParentItem,
          fn: ({ oldValue, newValue }) => {
            setStateBoardListContext((curBoardListContext) => {
              curBoardListContext.indexer.updateParent({
                oldParentId: parentItem.id,
                newParent: {
                  ...parentItem,
                  title: newValue,
                },
              });
              return {
                ...curBoardListContext,
              };
            });
          },
          deps: [
            parentItem,
            idOnEditFinishParentItem,
            setStateBoardListContext,
          ],
        }),
      [idOnEditFinishParentItem, setStateBoardListContext],
    );

    return (
      <CategoryTaskBoardListInternalBase
        ref={ref}
        boardListId={boardListId}
        parentKeyName={parentKeyName}
        childKeyName={childKeyName}
      >
        {parentItems.map((parentItem, parentItemIndex) => {
          // console.log(parentItems.map((item) => item.id));
          return (
            <Board
              key={parentItem.id}
              boardListId={boardListId}
              parentItem={parentItem}
              index={parentItemIndex}
            >
              <BoardHeader
                boardListId={boardListId}
                parentItem={parentItem}
                onEditStartItem={onEditStartParentItem}
                onEditFinishItem={onEditFinishParentItem({ parentItem })}
              />
              <BoardMain boardListId={boardListId} parentItem={parentItem}>
                {parentItems[parentItemIndex].items?.map(
                  (childItem, childItemIndex) => {
                    return (
                      <Card
                        key={childItem.id}
                        boardListId={boardListId}
                        childItem={childItem}
                        index={childItemIndex}
                        // onUpdateChildItem={onUpdateChildItem}
                      />
                    );
                  },
                )}
              </BoardMain>
            </Board>
          );
        })}
      </CategoryTaskBoardListInternalBase>
    );
  },
});

export type CategoryBoardListProps = BoardListExtendProps;

export const CategoryTaskBoardList = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListProps
>({
  displayName: "CategoryTaskBoardList",
  Component: (
    {
      boardListId,
      parentKeyName,
      childKeyName,
      defaultItems = [],
      ...otherProps
    },
    ref,
  ) => {
    const boardListContextParams = useMemo<BoardListContextValue>(
      () => ({
        boardListId,
        parentKeyName,
        childKeyName,
        defaultItems,
      }),
      [boardListId, parentKeyName, childKeyName, defaultItems],
    );

    return (
      <BoardListContextProvider value={boardListContextParams}>
        <CategoryTaskBoardListInternal
          ref={ref}
          boardListId={boardListId}
          parentKeyName={parentKeyName}
          childKeyName={childKeyName}
          {...otherProps}
        />
      </BoardListContextProvider>
    );
  },
});
