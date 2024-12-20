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
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
import { NestedIndexer, NestedIndexerItem } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import memoizee from "memoizee";
import { MultiRefMap } from "@/multimap";
import { OnEditFinish, OnEditStart } from "@/components/TextArea";

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

    const [stateCategoryTaskNestedIndexer, setStateCategoryTaskNestedIndexer] =
      useRecoilState(
        nestedIndexerAtom({
          parentKeyName,
          childKeyName,
          items: defaultCategoryTaskItems,
        }),
      );
    const categoryList = useMemo(() => {
      // console.log("[categoryList]");
      return (
        stateCategoryTaskNestedIndexer.getParentList__MutableParent() ??
        getEmptyArray<ParentItem>()
      );
    }, [stateCategoryTaskNestedIndexer]);

    const taskList = useMemo(() => {
      return categoryList.map((category) => {
        // console.log("[taskList]");
        return (
          stateCategoryTaskNestedIndexer.getChildListFromParentId__MutableChild(
            { parentId: category.id },
          ) ?? getEmptyArray<ChildItem>()
        );
      });
    }, [categoryList, stateCategoryTaskNestedIndexer]);

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
            setStateCategoryTaskNestedIndexer((curNestedIndexer) => {
              const newIndexer = new NestedIndexer(curNestedIndexer);
              newIndexer.updateParent({
                parentId: parentItem.id,
                parent: {
                  ...parentItem,
                  title: newValue,
                },
              });
              return newIndexer;
            });
          },
          deps: [
            parentItem,
            idOnEditFinishParentItem,
            setStateCategoryTaskNestedIndexer,
          ],
        }),
      [idOnEditFinishParentItem, setStateCategoryTaskNestedIndexer],
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
          return (
            <Board key={parentItem.id} parentItem={parentItem}>
              <BoardHeader
                parentItem={parentItem}
                onEditStartItem={onEditStartParentItem}
                onEditFinishItem={onEditFinishParentItem({ parentItem })}
              />
              <BoardMain boardListId={boardListId} parentItem={parentItem}>
                {taskList[index].map((task) => {
                  return (
                    <Card
                      key={task.id}
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
