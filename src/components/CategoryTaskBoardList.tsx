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
} from "@/components/BoardList";
import { SmartOmit } from "@/utils";
import { nestedIndexerAtom } from "@/components/BoardContext";
import { NestedIndexer } from "@/indexer";
import { BoardMain, ForEachChildItem } from "@/components/BoardMain";
import { Card, OnUpdateChildItem } from "@/components/Card";
import { styled } from "styled-components";
import { useDnd } from "@/hooks/useDnd";
import { StatViewer } from "@/components/StatViwer";
import {
  DroppableHandle,
  DroppableProps,
  withDroppable,
} from "@/hocs/withDroppable";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { UseDndRoot, UseDndRootHandle } from "@/components/UseDndRoot";

const BoardListBase = withDroppable<"div", DroppableHandle, BoardListProps>({
  BaseComponent: BoardList,
});
const CategoryTaskBoardListInternalBase = styled(BoardListBase)<
  DroppableProps<BoardListProps>
>`
  height: 100%;
  padding: 0 10px;
` as ReturnType<
  typeof React.forwardRef<HTMLDivElement, DroppableProps<BoardListProps>>
>;

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

    const refDndRoot = useRef<UseDndRootHandle | null>(null);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const {
      DragOverlay,
      onDragStart,
      // setGroupsRef,
      setDraggableRef,
      setDraggableHandleRef,
    } = useDnd({
      dndRootHandle: refDndRoot.current,
      contextId: boardListId,
    });

    return (
      <>
        <StatViewer
          WrapperComponent={React.memo(({ children }) => (
            <div>{children}</div>
          ))}
        />
        {/* <StatViewer
          WrapperComponent={React.memo(({ children }) => (
            <div>{children}</div>
          ))}
        /> */}
        <UseDndRoot ref={refDndRoot} contextId={boardListId}>
          <CategoryTaskBoardListInternalBase
            ref={(el) => {
              refBase.current = el;
              // setDroppableRef({
              //   droppableId: "0",
              //   tagKeysAcceptable: ["category"],
              // })(el);
              // setGroupsRef({ droppableId: "0" });
            }}
            contextId={boardListId}
            droppableId={"0"}
            tagKeysAcceptable={["category", "task"]}
            boardListId={boardListId} // TODO: remove and replace it with contextId
            {...otherProps}
          >
            <Board
              ref={setDraggableRef({
                draggableId: "0",
                tagKey: "category",
              })}
            >
              <div
                ref={setDraggableHandleRef({
                  draggableId: "0",
                })}
                onDragStart={onDragStart}
              >
                DOH1
              </div>
            </Board>
            <Board
              ref={setDraggableRef({
                draggableId: "1",
                tagKey: "category",
              })}
            >
              <div
                ref={setDraggableHandleRef({
                  draggableId: "1",
                })}
                onDragStart={onDragStart}
              >
                DOH2
              </div>
            </Board>
            <Board
              ref={setDraggableRef({
                draggableId: "2",
                tagKey: "category",
              })}
            >
              <div
                ref={setDraggableHandleRef({
                  draggableId: "2",
                })}
                onDragStart={onDragStart}
              >
                DOH3
              </div>
            </Board>
            <Board
              ref={setDraggableRef({
                draggableId: "3",
                tagKey: "category",
              })}
            >
              <div
                ref={setDraggableHandleRef({
                  draggableId: "3",
                })}
                onDragStart={onDragStart}
              >
                DOH4
              </div>
            </Board>
            {DragOverlay}
          </CategoryTaskBoardListInternalBase>
        </UseDndRoot>
      </>
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
