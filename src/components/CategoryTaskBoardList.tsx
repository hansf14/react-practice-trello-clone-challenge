import { useCallback, useMemo } from "react";
import { styled } from "styled-components";
import { Board } from "@/components/Board";
import { BoardHeader, OnRemoveBoard } from "@/components/BoardHeader";
import {
  BoardListExtendProps,
  BoardList,
  BoardListInternalProps,
} from "@/components/BoardList";
import { generateUniqueRandomId, memoizeCallback } from "@/utils";
import {
  ParentItem,
  BoardListContextProvider,
  useBoardListContext,
  BoardListContextValue,
  UseBoardContextParams,
  BoardListContextIndexer,
  ChildItem,
} from "@/components/BoardContext";
import {
  BoardMain,
  OnAddChildItem,
  OnClearChildItems,
} from "@/components/BoardMain";
import { BoardCard, OnRemoveCard } from "@/components/BoardCard";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { OnEditFinish, OnEditKeyDown } from "@/components/TextArea";

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

    const onClearChildItems = useCallback<OnClearChildItems>(
      ({ parentItemId }) => {
        setStateBoardListContext((curBoardListContext) => {
          const newBoardListContextIndexer = new BoardListContextIndexer(
            curBoardListContext.indexer,
          );
          newBoardListContextIndexer.clearChildIdListOfParentId({
            parentId: parentItemId,
            shouldKeepRef: false,
          });
          return {
            boardListId,
            indexer: newBoardListContextIndexer,
          };
        });
      },
      [boardListId, setStateBoardListContext],
    );

    const onAddChildItemSuccess = useCallback<OnAddChildItem>(
      ({ parentItemId, value }) => {
        setStateBoardListContext((curBoardListContext) => {
          const newBoardListContextIndexer = new BoardListContextIndexer(
            curBoardListContext.indexer,
          );
          const newChildItem = {
            id: generateUniqueRandomId(),
            content: value,
          } satisfies ChildItem;
          newBoardListContextIndexer.createChild({
            parentId: parentItemId,
            child: newChildItem,
            shouldAppend: false,
            shouldKeepRef: false,
          });
          return {
            boardListId,
            indexer: newBoardListContextIndexer,
          };
        });
      },
      [boardListId, setStateBoardListContext],
    );

    const onEditKeyDown = useCallback<OnEditKeyDown>(
      ({ textAreaHandle, event }) => {
        switch (event.key) {
          // case "Enter": {
          //   textAreaHandle.dispatchEditFinish();
          //   break;
          // }
          case "Escape": {
            textAreaHandle.dispatchEditCancel();
            break;
          }
          default:
            return;
        }
      },
      [],
    );

    const onRemoveBoard = useCallback<OnRemoveBoard>(
      ({ parentItemId }) => {
        setStateBoardListContext((curBoardListContext) => {
          const newBoardListContextIndexer = new BoardListContextIndexer(
            curBoardListContext.indexer,
          );
          newBoardListContextIndexer.removeParent({
            parentId: parentItemId,
            shouldKeepRef: false,
          });
          return {
            boardListId,
            indexer: newBoardListContextIndexer,
          };
        });
      },
      [boardListId, setStateBoardListContext],
    );

    const onRemoveCard = useCallback<OnRemoveCard>(
      ({ childItemId }) => {
        setStateBoardListContext((curBoardListContext) => {
          const newBoardListContextIndexer = new BoardListContextIndexer(
            curBoardListContext.indexer,
          );
          newBoardListContextIndexer.removeChild({
            childId: childItemId,
            shouldKeepRef: false,
          });
          return {
            boardListId,
            indexer: newBoardListContextIndexer,
          };
        });
      },
      [boardListId, setStateBoardListContext],
    );

    const alertMessageOnEditStart = useCallback(
      ({ editTarget }: { editTarget: string }) => {
        return (
          <>
            Press "Esc" or touch/click elsewhere to cancel.
            <br />
            The current {editTarget} drag will be disabled till you
            finish/cancel the edit.
          </>
        );
      },
      [],
    );

    const alertMessageOnRemove = useCallback(
      ({ editTarget }: { editTarget: string }) => {
        return `Are you sure you want to remove the ${editTarget}?`;
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
        addBoardModalTitle="Add Task Category"
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
                isEditMode,
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
                      alertMessageOnRemoveBoard={alertMessageOnRemove({
                        editTarget: "task category",
                      })}
                      isEditMode={isEditMode}
                      onEditStart={onEditStart}
                      onEditCancel={onEditCancel}
                      onEditChange={onEditChange}
                      onEditFinish={onEditFinishParentItem({
                        parentItem,
                        onEditFinish,
                      })}
                      onEditKeyDown={onEditKeyDown}
                      onRemoveBoard={onRemoveBoard}
                    />
                    <BoardMain
                      boardListId={boardListId}
                      parentItem={parentItem}
                      direction="vertical"
                      onClearChildItems={onClearChildItems}
                      onAddChildItemSuccess={onAddChildItemSuccess}
                    >
                      {parentItems[parentItemIndex].items?.map(
                        (childItem, childItemIndex) => {
                          return (
                            <BoardCard
                              key={childItem.id}
                              boardListId={boardListId}
                              childItem={childItem}
                              index={childItemIndex}
                              droppableId={parentItem.id}
                              alertMessageOnEditStart={alertMessageOnEditStart({
                                editTarget: "task",
                              })}
                              alertMessageOnRemoveCard={alertMessageOnRemove({
                                editTarget: "task",
                              })}
                              // onEditKeyDownCbs={onEditKeyDownCbs}
                              onEditFinish={onUpdateChildItem({
                                childItem,
                              })}
                              onEditKeyDown={onEditKeyDown}
                              onRemoveCard={onRemoveCard}
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
