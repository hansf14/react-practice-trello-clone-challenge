import styled from "styled-components";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Sortable, { MultiDrag, Swap } from "sortablejs";
import { BoardProps } from "@/components/Board";
import { CssScrollbar } from "@/css/scrollbar";
import { NestedIndexerBaseItem } from "@/indexer";
import { withMemoAndRef } from "@/utils";
import { RecoilRoot, useRecoilState } from "recoil";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { cardsContainerAtom } from "@/components/BoardMain";

const BoardsContainer = styled.div`
  ${CssScrollbar}

  overflow: auto;
  /* scroll-behavior: smooth; */
  /* ㄴ Not compatible with Sortable.js */
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: stretch;
  align-items: center;
  gap: 10px;
`;

export const B = () => {
  const [stateNestedIndexerCategoryTask, setStateNestedIndexerCategoryTask] =
    useRecoilState(nestedIndexerCategoryTaskAtom);
  return (
    <div>
      <Board<Category, Task> indexer={stateNestedIndexerCategoryTask} />
      {/* <A<{id: string;}, {id: string;}> /> */}
    </div>
  );
};

// Sortable extra-plugins
// Sortable.mount(new MultiDrag(), new Swap());

export const BoardListInternal = (<
  Parent extends NestedIndexerBaseItem,
  Child extends NestedIndexerBaseItem,
>() =>
  withMemoAndRef<"div", HTMLDivElement, BoardProps<Parent, Child>>(
    (props, ref) => {
      const refBoardsContainer = useRef<HTMLDivElement | null>(null);
      const [stateCardsContainer, setStateCardsContainer] =
        useRecoilState(cardsContainerAtom);

      const [
        stateNestedIndexerCategoryTask,
        setStateNestedIndexerCategoryTask,
      ] = useRecoilState(nestedIndexerCategoryTaskAtom);

      const categoryList = useMemo(
        () =>
          stateNestedIndexerCategoryTask.getParentList__MutableParent() ?? [],
        [stateNestedIndexerCategoryTask],
      );
      localS
      const initSortables = useCallback(() => {
        const sortables: Sortable[] = [];
        if (refBoardsContainer.current) {
          // https://github.com/SortableJS/Sortable
          const sortable = Sortable.create(refBoardsContainer.current, {
            group: dataItemListTypeValueKvMapping["categories"],
            // animation: 150,
            animation: 0,
            forceFallback: true, // Show ghost image without default's opacity gradient in desktop
            direction: "horizontal",
            handle: ".boards-container-sortable-handle",
            // ㄴ Drag handle selector within list items

            // filter: ".ignore-elements",
            // ㄴ  Selectors that do not lead to dragging (String or Function)

            // draggable: ".item",
            // ㄴ Specifies which items inside the element should be draggable

            // dragClass: "sortable-drag",
            // ㄴ DragOverlay
            // .sortable-drag
            // Class name for the dragging item

            // ghostClass: "boards-container-sortable-ghost",
            // ㄴ Ghost
            // .sortable-ghost
            // Class name for the drop placeholder

            // chosenClass: "boards-container-sortable-chosen",
            // ㄴ DragOverlay + Ghost
            // .sortable-chosen
            // Class name for the chosen item

            // https://github.com/SortableJS/Sortable/blob/master/plugins/AutoScroll/README.md
            // `AutoScroll`, `OnSpill` are already included, so no need to import. (Only need to import `MultiDrag`, `Swap` as extra-plugin when needed.)

            revertOnSpill: true,
            scroll: true,
            scrollSensitivity: 50, // px, how near the mouse must be to an edge to start scrolling.
            scrollSpeed: 10, // px, speed of the scrolling
            forceAutoScrollFallback: true, // 이거 하니까 좀 빨라지네
            // bubbleScroll: true,

            delayOnTouchOnly: false,
            // onStart: (evt) => {
            //   document.body.style.cursor = "grabbing !important";
            //   // evt.item.style.pointerEvents = "auto !Important";
            //   // evt.item.style.userSelect = "initial !important";
            // },
            onChoose: (evt) => {
              evt.target.classList.add("sortable-grabbing");
            },
            onUnchoose: (evt) => {
              evt.target.classList.remove("sortable-grabbing");
            },
            onStart: (evt) => {
              evt.target.classList.add("sortable-grabbing");
            },
            onEnd: (evt) => {
              evt.target.classList.remove("sortable-grabbing");

              console.log(evt);
              const {
                oldIndex: idxFrom,
                newIndex: idxTo,
                item: target,
                from: elementContainerFrom,
                to: elementContainerTo,
              } = evt;

              const itemType = target.getAttribute(
                customDataAttributeNameKvMapping["data-item-type"],
              );
              const id = target.getAttribute(
                customDataAttributeNameKvMapping["data-item-id"],
              );

              const containerFrom = elementContainerFrom.getAttribute(
                customDataAttributeNameKvMapping["data-item-list-type"],
              );
              const containerFromId = elementContainerFrom.getAttribute(
                customDataAttributeNameKvMapping["data-item-list-id"],
              );

              const containerTo = elementContainerTo.getAttribute(
                customDataAttributeNameKvMapping["data-item-list-type"],
              );
              const containerToId = elementContainerTo.getAttribute(
                customDataAttributeNameKvMapping["data-item-list-id"],
              );

              console.log("containerFrom:", containerFrom);
              console.log("containerTo:", containerTo);
              console.log("itemType:", itemType);
              console.log("id:", id);

              if (
                !itemType ||
                (typeof id !== "number" && typeof id !== "bigint" && !id) ||
                typeof idxFrom === "undefined" ||
                typeof idxTo === "undefined" ||
                !containerFrom ||
                (typeof containerFromId !== "number" &&
                  typeof containerFromId !== "bigint" &&
                  !containerFromId) ||
                !containerTo ||
                (typeof containerToId !== "number" &&
                  typeof containerToId !== "bigint" &&
                  !containerToId)
              ) {
                return;
              }

              if (
                containerFrom === containerTo &&
                containerFrom ===
                  dataItemListTypeValueKvMapping["categories"] &&
                itemType === dataItemTypeValueKvMapping["category"]
              ) {
                setStateNestedIndexerCategoryTask((cur) => {
                  const newNestedIndexer = new NestedIndexer(cur);
                  newNestedIndexer.moveParent({
                    idxFrom,
                    idxTo,
                  });
                  return newNestedIndexer;
                });
                return;
              }

              if (
                containerFrom === containerTo &&
                containerFrom === dataItemListTypeValueKvMapping["tasks"] &&
                itemType === dataItemTypeValueKvMapping["task"]
              ) {
                setStateNestedIndexerCategoryTask((cur) => {
                  const newNestedIndexer = new NestedIndexer(cur);
                  newNestedIndexer.moveChild({
                    idxFrom,
                    idxTo,
                    parentIdFrom: containerFromId,
                    parentIdTo: containerToId,
                  });
                  return newNestedIndexer;
                });
                return;
              }
            },
            onMove: (evt) => {
              (evt.target as HTMLElement).classList.add("sortable-grabbing");
            },
          });
          sortables.push(sortable);
        }

        categoryList.forEach((category) => {
          // console.log(stateCardsContainer);
          // console.log(category.id);
          const cardsContainer = stateCardsContainer[category.id];
          if (!cardsContainer) {
            return;
          }
          const sortable = Sortable.create(cardsContainer, {
            group: dataItemListTypeValueKvMapping["tasks"],
            animation: 150,
            // animation: 0,
            forceFallback: true,
            fallbackOnBody: true, // For correct positioning of the drag ghost element
            handle: ".cards-container-sortable-handle",

            revertOnSpill: true,
            scroll: true,
            scrollSensitivity: 30,
            scrollSpeed: 5,
            forceAutoScrollFallback: true,
            onEnd: (event) => {
              console.log(event);
            },
          });
          sortables.push(sortable);
        });

        // https://www.npmjs.com/package/dom-autoscroller
        // const scroll = autoScroll(
        //   [document.body, ...Object.values(stateCardsContainer)],
        //   {
        //     margin: 100,
        //     maxSpeed: 30,
        //     scrollWhenOutside: true,
        //     autoScroll: function () {
        //       //Only scroll when the pointer is down, and there is a child being dragged.
        //       return this.down;
        //     },
        //   },
        // );

        return sortables;
      }, [
        categoryList,
        stateCardsContainer,
        setStateNestedIndexerCategoryTask,
      ]);

      useEffect(() => {
        const sortables = initSortables();
        return () => {
          sortables.forEach((sortable) => sortable.destroy());
        };
      }, [initSortables]);

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
      console.log(stateNestedIndexerCategoryTask);
      // console.log("stateActiveCategory:", stateActiveCategory);
      // console.log("isDragging:", isDragging);

      const customDataAttributes: ItemListCustomDataAttributes = {
        "data-item-list-type": "categories",
        "data-item-list-id": "root",
      };

      return (
        <BoardsContainer ref={refBoardsContainer} {...customDataAttributes}>
          {categoryList.length === 0 ? (
            <div>Empty!</div>
          ) : (
            <>
              {categoryList.map((category) => {
                const customDataAttributes: ItemCustomDataAttributes = {
                  "data-item-type": "category",
                  "data-item-id": category.id,
                };
                return (
                  <B />
                  // <Board key={category.id} {...customDataAttributes}></Board>
                );
              })}
            </>
          )}
        </BoardsContainer>
      );
    },
  ) as <
    Parent extends NestedIndexerBaseItem,
    Child extends NestedIndexerBaseItem,
  >(
    props: BoardProps<Parent, Child> & React.RefAttributes<HTMLDivElement>,
  ) => React.ReactNode)();

export const BoardList = withMemoAndRef<"div", HTMLDivElement>(() => {
  return (
    <RecoilRoot
    // initializeState={(snapshot) => {
    //   // snapshot.set(counterAtom, 10); // Inject default value
    // }}
    >
      <BoardListInternal />
    </RecoilRoot>
  );
});
