import { useCallback } from "react";
import { RecoilRoot } from "recoil";
import { Board } from "@/components/Board";
import { BoardHeader } from "@/components/BoardHeader";
import {
  BoardList,
  BoardListExtendProps,
  ForEachParentItem,
} from "@/components/BoardList";
import { withMemoAndRef } from "@/utils";
import { nestedIndexerAtom } from "@/components/BoardContext";
import { NestedIndexer } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card } from "@/components/Card";

export type CategoryBoardListInternalProps = BoardListExtendProps;

export const CategoryTaskBoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: ({ boardListId, ...otherProps }, ref) => {
    // const forEachChildItem = useCallback<For

    const forEachChildItem = useCallback<ForEachChildItem>(
      ({ idx, item, items }) => {
        idx;
        return <Card childItem={item} />;
      },
      [],
    );

    const forEachParentItem = useCallback<ForEachParentItem>(
      ({ idx, item, items }) => (
        <Board>
          <BoardHeader parentItem={item} />
          <BoardMain
            boardListId={boardListId}
            parentItem={item}
            forEachChildItem={forEachChildItem}
          />
        </Board>
      ),
      [],
    );

    return (
      <BoardList
        ref={ref}
        boardListId={boardListId}
        forEachParentItem={forEachParentItem}
        {...otherProps}
      />
    );
  },
});

export const CategoryTaskBoardList = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: (
    { parentKeyName, childKeyName, parentItems: items, ...otherProps },
    ref,
  ) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          if (items) {
            // Inject default value
            snapshot.set(
              nestedIndexerAtom,
              new NestedIndexer({
                parentKeyName,
                childKeyName,
                items,
              }),
            );
          }
        }}
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
