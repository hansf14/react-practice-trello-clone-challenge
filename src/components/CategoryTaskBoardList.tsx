import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { useDnd } from "@/hooks/useDnd";

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

    const pressStartTime = useRef<number>(0);
    const isPointerDown = useRef<boolean>(false);
    const intervalId = useRef<number>(0);
    const isDragEventFired = useRef<boolean>(false);
    const curPointerEvent = useRef<PointerEvent | null>(null);
    const [dragOverlay, setDragOverlay] = useState<React.ReactElement | null>(
      null,
    );

    const onCustomDragStart = (event: Event) => {
      console.log("DRAG!");
      const customDragEvent = event as CustomDragStartEvent;
      const {
        //  pointerEvent
      } = customDragEvent.detail;
      // setState
    };

    const updateDuration = () => {
      if (!isPointerDown.current || isDragEventFired.current) {
        return;
      }

      clearTimeout(intervalId.current);
      intervalId.current = setTimeout(
        () => updateDuration(),
        500,
      ) as unknown as number;

      const currentDuration = Date.now() - pressStartTime.current;
      console.log(`Held down for ${currentDuration} ms so far.`);

      if (!isDragEventFired.current && currentDuration >= 2000) {
        const customDragStartEvent: CustomDragStartEvent = new CustomEvent(
          "custom-drag-start",
          {
            detail: {
              //  pointerEvent: event
            },
          },
        );
        document.addEventListener("custom-drag-start", onCustomDragStart, {
          once: true,
        });
        document.dispatchEvent(customDragStartEvent);

        isDragEventFired.current = true;
      }
    };

    useEffect(() => {
      document.addEventListener("pointermove", onPointerMove);

      return () => {
        document.removeEventListener("pointermove", onPointerMove);
      };
    }, []);

    const onPointerMove = (event: PointerEvent) => {
      curPointerEvent.current = event;
    };

    const onPointerDown = (event: React.PointerEvent) => {
      pressStartTime.current = Date.now();
      isPointerDown.current = true;

      curPointerEvent.current = event.nativeEvent;

      updateDuration();
    };

    type CustomDragStartEvent = CustomEvent<{
      // pointerEvent: React.PointerEvent | null;
    }>;

    const onPointerUp = () => {
      isPointerDown.current = false;
      pressStartTime.current = 0;
      clearInterval(intervalId.current);
      isDragEventFired.current = false;
    };

    const onDragStart = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const { setDroppableRef, setDraggableRef, setDragHandleRef } = useDnd({
      droppableCount: 1,
      draggableCount: 1,
    });

    return (
      <CategoryTaskBoardListInternalBase
        ref={(el) => {
          refBase.current = el;
          // setDroppableRef({contextId});
        }}
        boardListId={boardListId}
        // forEachParentItem={forEachParentItem}
        {...otherProps}
      >
        <Board ref={setDraggableRef}>
          <div
            ref={setDragHandleRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onDragStart={onDragStart}
          >
            DOH
          </div>
          {/* <BoardHeader
            parentItem={item}
            onEditStartParentItem={onEditStartParentItem}
            onEditFinishParentItem={onEditFinishParentItem}
          />
          <BoardMain
            boardListId={boardListId}
            parentItem={item}
            forEachChildItem={forEachChildItem}
          ></BoardMain> */}
        </Board>
        {dragOverlay}
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
