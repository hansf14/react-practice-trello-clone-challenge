import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import { useRecoilState } from "recoil";
import parse from "html-react-parser";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Board } from "@/components/Board";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import {
  getEmptyArray,
  getMemoizedArray,
  isFunction,
  SmartOmit,
  StyledComponentProps,
} from "@/utils";
import { cardsContainerAtom } from "@/components/BoardMain";
import {
  dataAttributeKvMapping,
  dataAttributeItemListTypeKvMapping,
  nestedIndexerAtom,
  dataAttributeItemTypeKvMapping,
  DataAttributesOfItemList,
  DataAttributesOfItem,
  ParentItem,
  ChildItem,
  grabbingClassNameKvMapping,
  boardClassNameKvMapping,
  cardClassNameKvMapping,
  DndDataInterface,
  DraggableHandleCustomAttributesKvMapping,
  DraggableCustomAttributesKvMapping,
  DroppableCustomAttributesKvObj,
  DndActiveDataInterface,
  DndOverDataInterface,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { createPortal } from "react-dom";
import { defaultCategoryTaskItems } from "@/data";
import {
  closestCenter,
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  MouseSensor,
  TouchSensor,
  useDndMonitor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import {
  restrictToFirstScrollableAncestor,
  restrictToHorizontalAxis,
} from "@dnd-kit/modifiers";

const BoardListBase = styled.div`
  ${CssScrollbar}

  overflow-x: auto;
  overflow-y: hidden;
  // width: 100%;
  width: 1000vw;
  height: 100%;
  padding: 0 10px;

  display: flex;
  justify-content: stretch;
  align-items: center;
  gap: 10px;

  [data-draggable-handle-id] {
    cursor: grab;
    // touch-action: none;
    // touch-action: manipulation;
    // https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action
    // https://docs.dndkit.com/api-documentation/sensors/touch#touch-action
  }
`;

/* &.${boardClassNameKvMapping["board-sortable-handle"]} {
    cursor: grab;
  } */

// Sortable extra-plugins
// Sortable.mount(new MultiDrag(), new Swap());

// export type BoardListExtendProps = SmartOmit<
//   BoardListProps,
//   // "forEachParentItem"
// >;

export type BoardListProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems?: ParentItem[];
  // children?: ({
  //   droppableProvided,
  //   droppableSnapshot,
  //   // draggableHandleCustomAttributes,
  // }: {
  //   droppableProvided: DroppableProvided;
  //   droppableSnapshot: DroppableStateSnapshot;
  //   draggableHandleCustomAttributes: Record<string, string>;
  // }) => React.ReactNode;
} & StyledComponentProps<"div">;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (props, ref) => {
    const {
      boardListId,
      parentKeyName,
      childKeyName,
      parentItems = getEmptyArray<ParentItem>(),
      // forEachParentItem,
      children,
      ...otherProps
    } = props;

    const refBoardList = useRef<HTMLDivElement | null>(null);
    const [stateCardsContainer, setStateCardsContainer] =
      useRecoilState(cardsContainerAtom);

    // const onDragEnd = useCallback(
    //   (evt: Sortable.SortableEvent) => {
    //     evt.target.classList.remove(
    //       grabbingClassNameKvMapping["sortable-grabbing"],
    //     );

    //     console.log(evt);
    //     const {
    //       oldIndex: idxFrom,
    //       newIndex: idxTo,
    //       item: target,
    //       from: elementContainerFrom,
    //       to: elementContainerTo,
    //     } = evt;

    //     const itemType = target.getAttribute(
    //       dataAttributeKvMapping["data-item-type"],
    //     );
    //     const id = target.getAttribute(dataAttributeKvMapping["data-item-id"]);

    //     const containerFrom = elementContainerFrom.getAttribute(
    //       dataAttributeKvMapping["data-item-list-type"],
    //     );
    //     const containerFromId = elementContainerFrom.getAttribute(
    //       dataAttributeKvMapping["data-item-list-id"],
    //     );

    //     const containerTo = elementContainerTo.getAttribute(
    //       dataAttributeKvMapping["data-item-list-type"],
    //     );
    //     const containerToId = elementContainerTo.getAttribute(
    //       dataAttributeKvMapping["data-item-list-id"],
    //     );

    //     console.log("containerFrom:", containerFrom);
    //     console.log("containerTo:", containerTo);
    //     console.log("itemType:", itemType);
    //     console.log("id:", id);

    //     if (
    //       !itemType ||
    //       (typeof id !== "number" && typeof id !== "bigint" && !id) ||
    //       typeof idxFrom === "undefined" ||
    //       typeof idxTo === "undefined" ||
    //       !containerFrom ||
    //       (typeof containerFromId !== "number" &&
    //         typeof containerFromId !== "bigint" &&
    //         !containerFromId) ||
    //       !containerTo ||
    //       (typeof containerToId !== "number" &&
    //         typeof containerToId !== "bigint" &&
    //         !containerToId)
    //     ) {
    //       return;
    //     }

    //     if (
    //       containerFrom === containerTo &&
    //       containerFrom === dataAttributeItemListTypeKvMapping["parents"] &&
    //       itemType === dataAttributeItemTypeKvMapping["parent"]
    //     ) {
    //       console.log("[onDragEnd - Parent]");
    //       setStateNestedIndexer((cur) => {
    //         const newNestedIndexer = new NestedIndexer(cur);
    //         newNestedIndexer.moveParent({
    //           idxFrom,
    //           idxTo,
    //         });
    //         return newNestedIndexer;
    //       });
    //       return;
    //     }

    //     if (
    //       containerFrom === containerTo &&
    //       containerFrom === dataAttributeItemListTypeKvMapping["children"] &&
    //       itemType === dataAttributeItemTypeKvMapping["child"]
    //     ) {
    //       console.log("[onDragEnd - Child]");
    //       setStateNestedIndexer((cur) => {
    //         const newNestedIndexer = new NestedIndexer(cur);
    //         newNestedIndexer.moveChild({
    //           idxFrom,
    //           idxTo,
    //           parentIdFrom: containerFromId,
    //           parentIdTo: containerToId,
    //         });
    //         return newNestedIndexer;
    //       });
    //       return;
    //     }
    //   },
    //   [setStateNestedIndexer],
    // );

    // const initSortables = useCallback(() => {
    //   const sortables: Sortable[] = [];
    //   if (refBoardList.current) {
    //     // https://github.com/SortableJS/Sortable
    //     const sortable = Sortable.create(refBoardList.current, {
    //       group: `${boardListId}-${dataAttributeItemListTypeKvMapping["parents"]}`,
    //       // animation: 150,
    //       animation: 0,
    //       forceFallback: true, // Show ghost image without default's opacity gradient in desktop
    //       direction: "horizontal",
    //       handle: "." + boardClassNameKvMapping["board-sortable-handle"],
    //       // handle: ".sortable-handle",
    //       // ㄴ Drag handle selector within list items

    //       // filter: ".ignore-elements",
    //       // ㄴ  Selectors that do not lead to dragging (String or Function)

    //       // draggable: ".item",
    //       // ㄴ Specifies which items inside the element should be draggable

    //       dragClass: boardClassNameKvMapping["board-sortable-drag"],
    //       // dragClass: "sortable-drag",
    //       // ㄴ DragOverlay
    //       // .sortable-drag
    //       // Class name for the dragging item

    //       ghostClass: boardClassNameKvMapping["board-sortable-ghost"],
    //       // ghostClass: "boards-container-sortable-ghost",
    //       // ㄴ Ghost
    //       // .sortable-ghost
    //       // Class name for the drop placeholder

    //       // chosenClass: "boards-container-sortable-chosen",
    //       // ㄴ DragOverlay + Ghost
    //       // .sortable-chosen
    //       // Class name for the chosen item

    //       // https://github.com/SortableJS/Sortable/blob/master/plugins/AutoScroll/README.md
    //       // `AutoScroll`, `OnSpill` are already included, so no need to import. (Only need to import `MultiDrag`, `Swap` as extra-plugin when needed.)

    //       revertOnSpill: true,
    //       scroll: true,
    //       scrollSensitivity: 50, // px, how near the mouse must be to an edge to start scrolling.
    //       scrollSpeed: 10, // px, speed of the scrolling
    //       forceAutoScrollFallback: true, // 이거 하니까 좀 빨라지네
    //       // bubbleScroll: true,

    //       delayOnTouchOnly: false,
    //       // onStart: (evt) => {
    //       //   document.body.style.cursor = "grabbing !important";
    //       //   // evt.item.style.pointerEvents = "auto !Important";
    //       //   // evt.item.style.userSelect = "initial !important";
    //       // },
    //       onChoose: (evt) => {
    //         evt.target.classList.add(
    //           grabbingClassNameKvMapping["sortable-grabbing"],
    //         );
    //       },
    //       onUnchoose: (evt) => {
    //         evt.target.classList.remove(
    //           grabbingClassNameKvMapping["sortable-grabbing"],
    //         );
    //       },
    //       onStart: (evt) => {
    //         evt.target.classList.add(
    //           grabbingClassNameKvMapping["sortable-grabbing"],
    //         );
    //       },
    //       onEnd: onDragEnd,
    //       onMove: (evt) => {
    //         (evt.target as HTMLElement).classList.add("sortable-grabbing");
    //       },
    //     });
    //     sortables.push(sortable);
    //   }

    //   categoryList.forEach((category) => {
    //     // console.log(stateCardsContainer);
    //     // console.log(category.id);
    //     const cardsContainer = stateCardsContainer[category.id];
    //     if (!cardsContainer) {
    //       return;
    //     }
    //     const sortable = Sortable.create(cardsContainer, {
    //       group: `${boardListId}-${dataAttributeItemListTypeKvMapping["children"]}`,
    //       animation: 150,
    //       // animation: 0,
    //       forceFallback: true,
    //       fallbackOnBody: true, // For correct positioning of the drag ghost element
    //       handle: "." + cardClassNameKvMapping["card-sortable-handle"],

    //       revertOnSpill: true,
    //       scroll: true,
    //       scrollSensitivity: 30,
    //       scrollSpeed: 5,
    //       forceAutoScrollFallback: true,
    //       onEnd: onDragEnd,
    //     });
    //     sortables.push(sortable);
    //   });

    //   // https://www.npmjs.com/package/dom-autoscroller
    //   // const scroll = autoScroll(
    //   //   [document.body, ...Object.values(stateCardsContainer)],
    //   //   {
    //   //     margin: 100,
    //   //     maxSpeed: 30,
    //   //     scrollWhenOutside: true,
    //   //     autoScroll: function () {
    //   //       //Only scroll when the pointer is down, and there is a child being dragged.
    //   //       return this.down;
    //   //     },
    //   //   },
    //   // );

    //   return sortables;
    // }, [boardListId, categoryList, stateCardsContainer, onDragEnd]);

    const [stateActiveParentItem, setStateActiveParentItem] =
      useState<ParentItem | null>(null);
    const [stateActiveChildItem, setStateActiveChildItem] =
      useState<ChildItem | null>(null);

    const refDragOverlayReactElement = useRef<React.ReactElement | null>(null);

    const onDragStart = useCallback((event: DragStartEvent) => {
      console.log("[onDragStart]");

      // console.log(event.active.data.current);
      if (event.active.data.current) {
        const activator = event.activatorEvent.target as HTMLElement | null;
        if (!activator) {
          return;
        }

        const draggableHandle = activator.closest(
          `[${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
        );
        // console.log(draggableHandle);
        if (!draggableHandle) {
          return;
        }

        const draggableHandleId = draggableHandle.getAttribute(
          DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"],
        );
        // console.log(draggableHandleId);
        if (!draggableHandleId) {
          return;
        }

        const draggableId = draggableHandleId;
        const draggable = draggableHandle.closest(
          `[${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
        ) as HTMLElement;
        console.log(draggable);
        if (!draggable) {
          return;
        }

        refDragOverlayReactElement.current = parse(
          draggable.outerHTML,
        ) as React.ReactElement;
        refDragOverlayReactElement.current = React.cloneElement(
          refDragOverlayReactElement.current,
          {
            style: {
              width: draggable.offsetWidth,
              height: draggable.offsetHeight,
              cursor: "grabbing",
              opacity: "1",
            } satisfies React.CSSProperties,
          },
        );

        const dndData = event.active.data.current as DndDataInterface;
        if (dndData.type === "parent") {
          setStateActiveParentItem(event.active.data.current.item);
        } else if (dndData.type === "child") {
          setStateActiveChildItem(event.active.data.current.item);
        } else {
          console.warn("[onDragStart] invalid dndData.type");
        }
      }
    }, []);

    const [stateNestedIndexer, setStateNestedIndexer] = useRecoilState(
      nestedIndexerAtom({
        parentKeyName,
        childKeyName,
        items: defaultCategoryTaskItems,
      }),
    );

    const onDragOver = useCallback(
      (event: DragOverEvent) => {
        const { active, over } = event;

        // console.log("active:", active);
        // console.log("over:", over);

        if (!over) {
          return;
        }

        const activeId = active.id;
        const overId = over.id;
        if (typeof activeId !== "string" || typeof overId !== "string") {
          console.warn("[onDragOver] id should only be string.");
          return;
        }
        const activeData = active.data.current as DndActiveDataInterface;
        const overData = over.data.current as DndOverDataInterface;
        const activeType = activeData.type;
        const overType = overData.type;
        const activeIndex = activeData.sortable.index;
        const overIndex = overData.sortable.index;

        // console.log("activeType:", activeType);
        // console.log("overType:", overType);
        // console.log("activeIndex:", activeIndex);
        // console.log("overIndex:", overIndex);

        if (activeIndex === -1 || overIndex === -1) {
          return;
        }

        if (activeType === "child" && overType === "child") {
          // setStateNestedIndexer((curNestedIndexer) => {
          //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
          //     curNestedIndexer,
          //   );
          //   const [parentIdFrom] =
          //     newNestedIndexer.getParentIdFromChildId({
          //       childId: activeId,
          //     }) ?? getEmptyArray<string>();
          //   const [parentIdTo] =
          //     newNestedIndexer.getParentIdFromChildId({
          //       childId: overId,
          //     }) ?? getEmptyArray<string>();
          //   if (!parentIdFrom || !parentIdTo) {
          //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
          //     return newNestedIndexer;
          //   }
          //   newNestedIndexer.moveChild({
          //     parentIdFrom,
          //     parentIdTo,
          //     idxFrom: activeIndex,
          //     idxTo: overIndex,
          //   });
          //   return newNestedIndexer;
          // });
        } else if (activeType === "child" && overType === "parent") {
          // setStateNestedIndexer((curNestedIndexer) => {
          //   const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
          //     curNestedIndexer,
          //   );
          //   const [parentIdFrom] =
          //     newNestedIndexer.getParentIdFromChildId({
          //       childId: activeId,
          //     }) ?? getEmptyArray<string>();
          //   const [parentIdTo] =
          //     newNestedIndexer.getParentIdFromChildId({
          //       childId: overId,
          //     }) ?? getEmptyArray<string>();
          //   if (!parentIdFrom || !parentIdTo) {
          //     console.warn("[onDragOver] !parentIdFrom || !parentIdTo");
          //     return newNestedIndexer;
          //   }
          //   newNestedIndexer.moveChild({
          //     parentIdFrom,
          //     parentIdTo,
          //     idxFrom: activeIndex,
          //     idxTo: overIndex,
          //   });
          //   return newNestedIndexer;
          // });
        }
      },
      [setStateNestedIndexer],
    );

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        console.log("[onDragEnd]");
        const { active, over } = event;

        // console.log(event);
        console.log("active:", active);
        console.log("over:", over);

        if (!over) {
          return;
        }

        const activeId = active.id;
        const overId = over.id;
        const activeData = active.data.current as DndActiveDataInterface;
        const overData = over.data.current as DndOverDataInterface;

        if (activeId === overId) {
          return;
        }

        const idxFrom = activeData.sortable.index;
        const idxTo = overData.sortable.index;
        setStateNestedIndexer((curNestedIndexer) => {
          const newNestedIndexer = new NestedIndexer<ParentItem, ChildItem>(
            curNestedIndexer,
          );
          newNestedIndexer.moveParent({
            idxFrom,
            idxTo,
          });
          return newNestedIndexer;
        });
        setStateActiveParentItem(null);
        setStateActiveChildItem(null);
      },
      [setStateNestedIndexer],
    );

    const sensors = useSensors(
      // useSensor(PointerSensor, {
      //   activationConstraint: {
      //     distance: 3,
      //     // ㄴ Need to move 3px to activate drag event.
      //   },
      // }),
      useSensor(MouseSensor),
      useSensor(TouchSensor),
      // useSensor(KeyboardSensor, {
      //   coordinateGetter: sortableKeyboardCoordinates,
      // }),
    );

    const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
      "data-droppable-id": boardListId,
      "data-droppable-allowed-types": "parent",
    };

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const { setNodeRef } = useDroppable({
      id: boardListId,
      data: {
        accepts: ["type1", "type2"],
      },
    });

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={
          // closestCenter
          closestCorners
          // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#when-should-i-use-the-closest-corners-algorithm-instead-of-closest-center
        }
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        autoScroll={{ acceleration: 1 }}
      >
        <SortableContext items={parentItems}>
          <BoardListBase
            ref={(el: HTMLDivElement | null) => {
              if (el) {
                refBase.current = el;
                setNodeRef(el);
              }
            }}
            {...droppableCustomAttributes}
            {...otherProps}
          >
            {children}
          </BoardListBase>
        </SortableContext>
        {createPortal(
          <DragOverlay
            modifiers={
              stateActiveParentItem
                ? getMemoizedArray({
                    refs: [
                      restrictToHorizontalAxis,
                      restrictToFirstScrollableAncestor,
                    ],
                  })
                : getEmptyArray<Modifier>()
            }
            dropAnimation={null}
            // dropAnimation={{
            //   // ...defaultDropAnimation,
            //   sideEffects: defaultDropAnimationSideEffects({
            //     styles: {
            //       active: {
            //         opacity: "1",
            //       },
            //     },
            //   }),
            // }}
            // https://github.com/clauderic/dnd-kit/issues/317
            // ㄴ Removes flickering due to opacity animation
          >
            {refDragOverlayReactElement.current}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    );
  },
});

// https://github.com/clauderic/dnd-kit/pull/334#issuecomment-1965708784
// import { snapCenterToCursor } from '@dnd-kit/modifiers';
// import {
//   CollisionDetection, DndContext, DragOverlay, rectIntersection
// } from '@dnd-kit/core';

// const fixCursorSnapOffset: CollisionDetection = (args) => {
//   // Bail out if keyboard activated
//   if (!args.pointerCoordinates) {
//     return rectIntersection(args);
//   }
//   const { x, y } = args.pointerCoordinates;
//   const { width, height } = args.collisionRect;
//   const updated = {
//     ...args,
//     // The collision rectangle is broken when using snapCenterToCursor. Reset
//     // the collision rectangle based on pointer location and overlay size.
//     collisionRect: {
//       width,
//       height,
//       bottom: y + height / 2,
//       left: x - width / 2,
//       right: x + width / 2,
//       top: y - height / 2,
//     },
//   };
//   return rectIntersection(updated);
// };

// const Component = () => {
//   return (
//     <DndContext
//       collisionDetection={fixCursorSnapOffset}
//     >
//       {/* ... */}
//       <DragOverlay modifiers={[snapCenterToCursor]}>
//           <div>
//             Your overlay
//           </div>
//       </DragOverlay>
//     </DndContext>
//   );
// };
