import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
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
import { Group, useDnd } from "@/hooks/useDnd";

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

    const refBase = useRef<React.ElementRef<
      typeof CategoryTaskBoardListInternalBase
    > | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as React.ElementRef<
        typeof CategoryTaskBoardListInternalBase
      >;
    });

    const {
      DragOverlay,
      onDragStart,
      setGroupsRef,
      setDroppableRef,
      setDraggableRef,
      setDraggableHandleRef,
    } = useDnd({
      contextId: boardListId,
      droppableCount: 2,
      draggableCount: 3,
    });

    // function nearbyElements({
    //   x,
    //   y,
    //   maxDistance,
    //   directions,
    //   directionArr,
    // }: {
    //   x: number;
    //   y: number;
    //   maxDistance?: number;
    //   directions?: number;
    //   directionArr?: number[];
    // }) {
    //   const _directions = directions ?? 8;
    //   const _directionArr = directionArr ?? [0, 1, 2, 3, 4, 5, 6, 7];
    //   const angles = _directionArr.map(
    //     (dir) => (2 * Math.PI * dir) / _directions,
    //   );
    //   const cx = 
    // }

    // TODO: remove index from props (automatically manage)
    return (
      <CategoryTaskBoardListInternalBase
        ref={(el) => {
          refBase.current = el;
          setDroppableRef({
            contextId: boardListId,
            index: 0,
            tagKeysAcceptable: ["category"],
          })(el);
        }}
        boardListId={boardListId}
        {...otherProps}
      >
        <Group ref={setGroupsRef({ index: 0 })}>
          <Board
            ref={setDraggableRef({
              contextId: boardListId,
              index: 0,
              tagKey: "category",
            })}
          >
            <div
              ref={setDraggableHandleRef({
                contextId: boardListId,
                index: 0,
              })}
              onDragStart={onDragStart}
            >
              DOH1
            </div>
            <div
              ref={setDroppableRef({
                contextId: boardListId,
                index: 1,
                tagKeysAcceptable: ["category"],
              })}
            >
              {/* <Group ref={setGroupsRef({ index: 1 })}> */}
              <div>Task1</div>
              <div>Task2</div>
              <div>Task3</div>
              {/* </Group> */}
            </div>
          </Board>
          <Board
            ref={setDraggableRef({
              contextId: boardListId,
              index: 1,
              tagKey: "category",
            })}
          >
            <div
              ref={setDraggableHandleRef({
                contextId: boardListId,
                index: 1,
              })}
              onDragStart={onDragStart}
            >
              DOH2
            </div>
          </Board>
          <Board
            ref={setDraggableRef({
              contextId: boardListId,
              index: 2,
              tagKey: "category",
            })}
          >
            <div
              ref={setDraggableHandleRef({
                contextId: boardListId,
                index: 2,
              })}
              onDragStart={onDragStart}
            >
              DOH3
            </div>
          </Board>
        </Group>
        {DragOverlay}
      </CategoryTaskBoardListInternalBase>
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
