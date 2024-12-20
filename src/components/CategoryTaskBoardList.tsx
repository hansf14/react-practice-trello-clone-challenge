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
import {
  BoardHeader,
  OnEditFinishParentItem,
  OnEditStartParentItem,
} from "@/components/BoardHeader";
import { BoardListInternal, BoardListProps } from "@/components/BoardList";
import {
  getEmptyArray,
  getMemoizedArray,
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
import { StatViewer } from "@/components/StatViwer";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { defaultCategoryTaskItems } from "@/data";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import memoizee from "memoizee";
import { MultiRefMap } from "@/multimap";

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
      console.log("[categoryList]");
      return (
        stateCategoryTaskNestedIndexer.getParentList__MutableParent() ??
        getEmptyArray<ParentItem>()
      );
    }, [stateCategoryTaskNestedIndexer]);

    const taskList = useMemo(() => {
      return categoryList.map((category) => {
        console.log("[taskList]");
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
                onEditStartParentItem={onEditStartParentItem}
                onEditFinishParentItem={onEditFinishParentItem}
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
