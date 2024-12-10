import React, { useCallback } from "react";
import { RecoilRoot, useRecoilState } from "recoil";
import { Board } from "@/components/Board";
import {
  BoardHeader,
  OnEditFinishParentItem,
  OnEditStartParentItem,
} from "@/components/BoardHeader";
import {
  BoardList,
  BoardListExtendProps,
  BoardListProps,
  BoardListPropsChildren,
} from "@/components/BoardList";
import { SmartOmit, withMemoAndRef } from "@/utils";
import { nestedIndexerAtom } from "@/components/BoardContext";
import { NestedIndexer } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { Droppable } from "@hello-pangea/dnd";

const CategoryTaskBoardListInternalBase = styled(BoardList)<BoardListProps>`
  height: 100%;
  padding: 0 10px;
` as ReturnType<
  typeof React.forwardRef<React.ElementRef<typeof BoardList>, BoardListProps>
>; // <- Casting for `children` render props intellisense.

export type CategoryBoardListInternalProps = SmartOmit<
  BoardListExtendProps,
  "children"
>;

export const CategoryTaskBoardListInternal = withMemoAndRef<
  "div",
  HTMLDivElement,
  CategoryBoardListInternalProps
>({
  Component: ({ boardListId, ...otherProps }, ref) => {
    const [stateIndexer, setStateIndexer] = useRecoilState(nestedIndexerAtom);

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
        setStateIndexer((cur) => {
          const newIndexer = new NestedIndexer(cur);
          newIndexer.updateParent({
            parentId: oldParentItem.id,
            parent: newParentItem,
          });
          return newIndexer;
        });
      },
      [setStateIndexer],
    );

    const onUpdateChildItem = useCallback<OnUpdateChildItem>(
      ({ event, oldChildItem, newChildItem }) => {
        // console.log(event.target.value);
        setStateIndexer((cur) => {
          const newIndexer = new NestedIndexer(cur);
          newIndexer.updateChild({
            childId: oldChildItem.id,
            child: newChildItem,
          });
          return newIndexer;
        });
      },
      [setStateIndexer],
    );

    const forEachChildItem = useCallback<ForEachChildItem>(
      ({ idx, item, items }) => {
        return (
          <Card
            // key={item.id}
            childItem={item}
            onUpdateChildItem={onUpdateChildItem}
          />
        );
        // return items.map((item) => {
        //   return (
        //     <Card
        //       // key={item.id}
        //       childItem={item}
        //       onUpdateChildItem={onUpdateChildItem}
        //     />
        //   );
        // });
      },
      [onUpdateChildItem],
    );

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

    return (
      <CategoryTaskBoardListInternalBase
        ref={ref}
        boardListId={boardListId}
        // forEachParentItem={forEachParentItem}
        {...otherProps}
      >
        {({ items, droppableProvidedPlaceholder, droppableStateSnapshot }) => {
          return (
            <>
              {items.length === 0 && <div>Empty!</div>}
              {items.length !== 0 &&
                items.map((item, idx) => {
                  return (
                    <Board
                      key={item.id}
                      id={item.id}
                      index={idx}
                      // key={item.id}
                    >
                      {({
                        draggableProvidedDragHandleProps,
                        draggableStateSnapshot,
                        draggableRubric,
                      }) => {
                        return (
                          <>
                            <BoardHeader
                              parentItem={item}
                              onEditStartParentItem={onEditStartParentItem}
                              onEditFinishParentItem={onEditFinishParentItem}
                              {...draggableProvidedDragHandleProps}
                            />
                            <BoardMain
                              boardListId={boardListId}
                              parentItem={item}
                              forEachChildItem={forEachChildItem}
                            >
                              {/* <Card
                // key={item.id}
                // childItem={item}
                onUpdateChildItem={onUpdateChildItem}
              /> */}
                            </BoardMain>
                          </>
                        );
                      }}
                    </Board>
                  );
                })}
              {/* {droppableProvidedPlaceholder} */}
            </>
          );
        }}
        {/* <Droppable droppableId={item.id}>
          {(droppableProvided, droppableStateSnapshot) => ( */}
        {/* <Board
          ref={droppableProvided.innerRef}
          {...droppableProvided.droppableProps}
          // key={item.id}
        >
          <BoardHeader
            parentItem={item}
            onEditStartParentItem={onEditStartParentItem}
            onEditFinishParentItem={onEditFinishParentItem}
          />
          <BoardMain
            boardListId={boardListId}
            parentItem={item}
            forEachChildItem={forEachChildItem}
          >
            <Card
              // key={item.id}
              childItem={item}
              onUpdateChildItem={onUpdateChildItem}
            />
          </BoardMain>
        </Board> */}
        {/* )}
        </Droppable> */}
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
