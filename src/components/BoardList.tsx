import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { styled } from "styled-components";
import { useRecoilState } from "recoil";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Board } from "@/components/Board";
import { CssScrollbar } from "@/csses/scrollbar";
import { NestedIndexer } from "@/indexer";
import { isFunction, SmartOmit, StyledComponentProps } from "@/utils";
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
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";

const BoardListBase = styled.div`
  ${CssScrollbar}

  overflow-x: auto;
  /* overflow-y: hidden; */
  /* scroll-behavior: smooth; */
  /* ㄴ Not compatible with Sortable.js */
  width: 100%;
  height: 100%;
  padding: 0 10px;

  display: flex;
  justify-content: stretch;
  align-items: center;
  gap: 10px;

  &.${grabbingClassNameKvMapping["sortable-grabbing"]} * {
    cursor: grabbing !important;
  }

  .drag-overlay {
    opacity: 0.7;
  }

  .drag-placeholder {
    opacity: 0.7;
    border: 2px solid yellow;
  }

  .drag-handle {
    cursor: grab;
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

export type BoardListExtendProps = BoardListProps;

export type BoardListProps = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  parentItems?: ParentItem[];
  // forEachParentItem: ForEachParentItem;
} & StyledComponentProps<"div">;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (
    {
      boardListId,
      parentKeyName,
      childKeyName,
      parentItems,
      // forEachParentItem,
      children,
      ...otherProps
    },
    ref,
  ) => {
    // TODO: extend (useEffect/useIsomorphicLayoutEffect)

    const refBoardList = useRef<HTMLDivElement | null>(null);
    const [stateCardsContainer, setStateCardsContainer] =
      useRecoilState(cardsContainerAtom);

    const [stateNestedIndexer, setStateNestedIndexer] =
      useRecoilState(nestedIndexerAtom);

    useEffect(() => {
      setStateNestedIndexer(
        new NestedIndexer<ParentItem, ChildItem>({
          parentKeyName,
          childKeyName,
          items: parentItems ?? [],
        }),
      );
    }, [parentItems, parentKeyName, childKeyName, setStateNestedIndexer]);

    const categoryList = useMemo(
      () => stateNestedIndexer.getParentList__MutableParent() ?? [],
      [stateNestedIndexer],
    );

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

    const customDataAttributes: DataAttributesOfItemList = {
      "data-board-list-id": boardListId,
      "data-item-list-type": "parents",
      "data-item-list-id": "root",
    };

    return (
      <BoardListBase
        ref={ref}
        // {...otherProps}
        // {...customDataAttributes}
      >
        {children}
        {/* {categoryList.length === 0 && <div>Empty!</div>} */}
        {/* {categoryList.length !== 0 &&
              categoryList.map((category, idx) => {
                const customDataAttributes: DataAttributesOfItem = {
                  "data-board-list-id": boardListId,
                  "data-item-type": "parent",
                  "data-item-id": category.id,
                };
                return React.Children.map(
                  forEachParentItem({
                    idx,
                    item: category,
                    items: categoryList,
                    droppableProvided,
                    droppableStateSnapshot,
                  }),
                  (child) => {
                    const _child = React.isValidElement(child)
                      ? React.cloneElement(child as React.ReactElement, {
                          key: category.id,
                          ...customDataAttributes,
                        })
                      : child;
                    // console.log(_child);
                    return _child;
                  },
                );
              })} */}
      </BoardListBase>
    );
  },
});
