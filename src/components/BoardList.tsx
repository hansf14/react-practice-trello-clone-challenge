import React, {
  useCallback,
  useEffect,
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
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { SortableContext } from "@dnd-kit/sortable";
import {
  ClientRect,
  closestCenter,
  closestCorners,
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  Modifier,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { defaultCategoryTaskItems } from "@/data";
import {
  restrictToFirstScrollableAncestor,
  restrictToHorizontalAxis,
} from "@dnd-kit/modifiers";

const BoardListBase = styled.div`
  ${CssScrollbar}

  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
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
  // forEachParentItem: ForEachParentItem;
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

    // useEffect(() => {
    //   const sortables = initSortables();
    //   return () => {
    //     sortables.forEach((sortable) => sortable.destroy());
    //   };
    // }, [initSortables]);

    // const [stateBoardDragHandles, setStateBoardDragHandles] =
    //   useRecoilState(boardDragHandlesAtom);
    // const [stateCards, setStateCards] = useRecoilState(cardsAtom);
    // const [stateCardDragHandles, setStateCardDragHandles] =
    //   useRecoilState(cardDragHandlesAtom);

    // const { getDeviceDetector } = useDeviceDetector();
    // const { getIsTouchDevice } = getDeviceDetector();

    // console.log(refDashboard.current);
    // console.log(refBoards.current);
    // console.log(stateBoardDragHandles);
    // console.log(stateCardDragHandles);

    // console.log(categoryList);

    // console.log(stateNestedIndexer.toPlain());
    // console.log("stateActiveCategory:", stateActiveCategory);
    // console.log("isDragging:", isDragging);

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

    const [stateActiveParent, setStateActiveParent] =
      useState<ParentItem | null>(null);

    const refDragOverlayReactElement = useRef<React.ReactElement | null>(null);
    // const refDragOverlaySize = useRef<{ width: number; height: number } | null>(
    //   null,
    // );

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
        // console.log(draggable);
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
              opacity: "0.7",
            } satisfies React.CSSProperties,
          },
        );

        const dndData = event.active.data.current as DndDataInterface;
        if (dndData.type === "parent") {
          setStateActiveParent(event.active.data.current.item);
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

    const onDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        // console.log(event);
        if (!over) {
          return;
        }

        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) {
          return;
        }

        const idxFrom = parentItems.findIndex(
          (parentItem) => parentItem.id === activeId,
        );
        const idxTo = parentItems.findIndex(
          (parentItem) => parentItem.id === overId,
        );

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

        setStateActiveParent(null);
      },
      [parentItems, setStateNestedIndexer],
    );

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCorners
          // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#when-should-i-use-the-closest-corners-algorithm-instead-of-closest-center
        }
        onDragStart={onDragStart}
        // onDragOver={() => console.log("Over")}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={parentItems}>
          <BoardListBase ref={ref} {...otherProps}>
            {children}
          </BoardListBase>
        </SortableContext>
        {createPortal(
          <DragOverlay
            modifiers={
              stateActiveParent
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
