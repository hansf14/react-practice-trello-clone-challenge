import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RecoilRoot, useRecoilCallback, useRecoilState } from "recoil";
import { Board, BoardProps } from "@/components/Board";
import { BoardHeader } from "@/components/BoardHeader";
import { BoardListInternal, BoardListProps } from "@/components/BoardList";
import {
  getEmptyArray,
  getMemoizedArray,
  memoizeCallback,
  SmartOmit,
  StyledComponentProps,
} from "@/utils";
import {
  ChildItem,
  boardListContextAtomFamily,
  ParentItem,
  BoardListContextIndexer,
  BoardListContextProvider,
} from "@/components/BoardContext";
import { NestedIndexer, NestedIndexerItem } from "@/indexer";
import { BoardMain } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import memoizee from "memoizee";
import { MultiRefMap } from "@/multimap";
import { OnEditFinish, OnEditStart } from "@/components/TextArea";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

const CategoryTaskBoardListInternalBase = styled(BoardListInternal)``;

export type CategoryBoardListInternalProps = BoardListProps;

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

    const categoryList = useMemo(() => {
      // console.log("[categoryList]");
      return (
        stateBoardListContext.indexer.getParentList__MutableParent() ??
        getEmptyArray<ParentItem>()
      );
    }, [stateBoardListContext]);

    const taskList = useMemo(() => {
      return categoryList.map((category) => {
        // console.log("[taskList]");
        return (
          stateBoardListContext.indexer.getChildListOfParentId__MutableChild({
            parentId: category.id,
          }) ?? getEmptyArray<ChildItem>()
        );
      });
    }, [categoryList, stateBoardListContext]);

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
        parentItems={categoryList}
      >
        {categoryList.map((parentItem, index) => {
          console.log(parentItem.items?.map((item) => item.id));
          return (
            <Board
              key={parentItem.id}
              boardListId={boardListId}
              parentItem={parentItem}
            >
              <BoardHeader
                boardListId={boardListId}
                parentItem={parentItem}
                onEditStartItem={onEditStartParentItem}
                onEditFinishItem={onEditFinishParentItem({ parentItem })}
              />
              <BoardMain boardListId={boardListId} parentItem={parentItem}>
                {taskList[index].map((task) => {
                  return (
                    <Card
                      key={task.id}
                      boardListId={boardListId}
                      childItem={task}
                      // onUpdateChildItem={onUpdateChildItem}
                    />
                  );
                })}
              </BoardMain>
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
    {
      boardListId,
      parentKeyName,
      childKeyName,
      parentItems,
      ...otherProps
    },
    ref,
  ) => {
    const boardListContextParams = useMemo(
      () => ({
        boardListId,
        parentKeyName,
        childKeyName,
      }),
      [boardListId, parentKeyName, childKeyName],
    );

    return (
      <BoardListContextProvider
        value={boardListContextParams}
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
          boardListId={boardListId}
          parentKeyName={parentKeyName}
          childKeyName={childKeyName}
          parentItems={items}
          {...otherProps}
        />
      </BoardListContextProvider>
    );
  },
});
