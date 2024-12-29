import { useCallback, useMemo } from "react";
import { Board } from "@/components/Board";
import { BoardHeader } from "@/components/BoardHeader";
import {
  BoardListExtendProps,
  BoardList,
  BoardListInternalProps,
} from "@/components/BoardList";
import { memoizeCallback } from "@/utils";
import {
  ParentItem,
  BoardListContextProvider,
  useBoardListContext,
  BoardListContextValue,
  UseBoardContextParams,
  BoardListContextIndexer,
  ChildItem,
} from "@/components/BoardContext";
import { BoardMain } from "@/components/BoardMain";
import { Card } from "@/components/Card";
import { styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { OnEditFinish } from "@/components/TextArea";

const CategoryTaskBoardListInternalBase = styled(BoardList)``;

export type CategoryBoardListInternalProps = BoardListInternalProps;

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stateBoardListContext,
      setStateBoardListContext,
    } = useBoardListContext(boardListContextParams);

    const idOnEditFinishParentItem = useMemoizeCallbackId();
    const onEditFinishParentItem = useCallback(
      ({
        parentItem,
        onEditFinish,
      }: {
        parentItem: ParentItem;
        onEditFinish?: OnEditFinish;
      }) =>
        memoizeCallback<OnEditFinish>({
          id: idOnEditFinishParentItem,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fn: ({ textAreaHandle, oldValue, newValue }) => {
            setStateBoardListContext((curBoardListContext) => {
              const newBoardListContextIndexer = new BoardListContextIndexer(
                curBoardListContext.indexer,
              );
              newBoardListContextIndexer.updateParent({
                oldParentId: parentItem.id,
                newParent: {
                  ...parentItem,
                  title: newValue,
                },
                shouldKeepRef: false,
              });
              return {
                boardListId,
                indexer: newBoardListContextIndexer,
              };
            });

            onEditFinish?.({ textAreaHandle, oldValue, newValue });
          },
          deps: [
            parentItem,
            onEditFinish,
            idOnEditFinishParentItem,
            boardListId,
            setStateBoardListContext,
          ],
        }),
      [idOnEditFinishParentItem, boardListId, setStateBoardListContext],
    );

    const idOnUpdateChildItem = useMemoizeCallbackId();
    const onUpdateChildItem = useCallback(
      ({ childItem }: { childItem: ChildItem }) =>
        memoizeCallback<OnEditFinish>({
          id: idOnUpdateChildItem,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fn: ({ oldValue, newValue }) => {
            setStateBoardListContext((curBoardListContext) => {
              const newBoardListContextIndexer = new BoardListContextIndexer(
                curBoardListContext.indexer,
              );
              newBoardListContextIndexer.updateChild({
                oldChildId: childItem.id,
                newChild: {
                  id: childItem.id,
                  content: newValue,
                },
                shouldKeepRef: false,
              });
              return {
                boardListId,
                indexer: newBoardListContextIndexer,
              };
            });
          },
          deps: [
            childItem,
            idOnUpdateChildItem,
            boardListId,
            setStateBoardListContext,
          ],
        }),
      [idOnUpdateChildItem, boardListId, setStateBoardListContext],
    );

    const alertMessageOnEditStart = useCallback(
      ({ editTarget }: { editTarget: string }) => {
        return `Press 'enter' to finish the edit.\nPress 'esc' or touch/click elsewhere to cancel.\nThe ${editTarget} drag will be disabled till you finish/cancel the edit.`;
      },
      [],
    );

    return (
      <CategoryTaskBoardListInternalBase
        ref={ref}
        boardListId={boardListId}
        parentKeyName={parentKeyName}
        childKeyName={childKeyName}
        direction="horizontal"
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
              {({
                draggableDragHandleProps,
                onEditStart,
                onEditCancel,
                onEditChange,
                onEditFinish,
              }) => {
                return (
                  <>
                    <BoardHeader
                      boardListId={boardListId}
                      parentItem={parentItem}
                      draggableDragHandleProps={draggableDragHandleProps}
                      alertMessageOnEditStart={alertMessageOnEditStart({
                        editTarget: "task category",
                      })}
                      onEditStart={onEditStart}
                      onEditCancel={onEditCancel}
                      onEditChange={onEditChange}
                      onEditFinish={onEditFinishParentItem({
                        parentItem,
                        onEditFinish,
                      })}
                    />
                    <BoardMain
                      boardListId={boardListId}
                      parentItem={parentItem}
                      direction="vertical"
                    >
                      {parentItems[parentItemIndex].items?.map(
                        (childItem, childItemIndex) => {
                          return (
                            <Card
                              key={childItem.id}
                              boardListId={boardListId}
                              childItem={childItem}
                              index={childItemIndex}
                              droppableId={parentItem.id}
                              alertMessageOnEditStart={alertMessageOnEditStart({
                                editTarget: "task",
                              })}
                              onEditFinish={onUpdateChildItem({
                                childItem,
                              })}
                            />
                          );
                        },
                      )}
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
