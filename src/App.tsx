import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider, createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import { nestedIndexerCategoryTaskAtom } from "@/atoms";
// import autoScroll from "dom-autoscroller";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Sortable, { MultiDrag, Swap } from "sortablejs";
import { BoardHeader } from "@/components/BoardHeader";
import { BoardMain, cardsContainerAtom } from "@/components/BoardMain";
// import { BoardFooter } from "@/components/BoardFooter";
import { CssScrollbar } from "@/css/scrollbar";
import { NestedIndexer } from "@/indexer";
import {
  customDataAttributeNameKvMapping,
  dataItemListTypeValueKvMapping,
  dataItemTypeValueKvMapping,
  ItemCustomDataAttributes,
  ItemListCustomDataAttributes,
} from "@/sortable";

/* @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap'); */
const GlobalStyle = createGlobalStyle`
  /* http://meyerweb.com/eric/tools/css/reset/
    v5.0.1 | 20191019
    License: none (public domain)
  */
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, menu, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed,
  figure, figcaption, footer, header, hgroup,
  main, menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }
  /* HTML5 display-role reset for older browsers */
  article, aside, details, figcaption, figure,
  footer, header, hgroup, main, menu, nav, section {
    display: block;
  }
  /* HTML5 hidden-attribute fix for newer browsers */
  *[hidden] {
      display: none;
  }
  body {
    line-height: 1;
  }
  menu, ol, ul {
    list-style: none;
  }
  blockquote, q {
    quotes: none;
  }
  blockquote:before, blockquote:after,
  q:before, q:after {
    content: '';
    content: none;
  }
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
  
  * {
    box-sizing: border-box;
  }
  html {
    overflow: auto;
    height: 100%;
  }
  body {
    overflow: auto;
    height: 100%;
    min-height: 100%;
    font-family: "Source Sans 3", sans-serif;
    font-optical-sizing: auto;
    font-weight: 500;
    font-style: normal;
    word-break: break-word;
  }
  #root {
    width: 100%;
    height: 100%;
  }
  a {
    text-decoration: none;
    color: inherit;
  }

  .sortable-grabbing * {
    cursor: grabbing !important;
  }
`;

const Main = styled.main`
  min-width: fit-content;
  height: 100%;
  background: ${({ theme }) => theme.background};
  background-repeat: no-repeat;
  background-size: cover;
  color: black;
  gap: 10px;
  padding: 0 10px 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

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

const Board = styled.div`
  flex-shrink: 0;
  height: 85%;
  width: min(100%, 300px);
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  // Glassmorphism
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(13.5px);
  -webkit-backdrop-filter: blur(13.5px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);

  // DragOverlay
  &.sortable-drag {
    opacity: 0.7 !important;
  }

  // Ghost
  &.sortable-ghost {
    opacity: 0.7;
    border: 2px solid yellow;
  }
`;

// Sortable extra-plugins
// Sortable.mount(new MultiDrag(), new Swap());

function App() {
  const [stateNestedIndexerCategoryTask, setStateNestedIndexerCategoryTask] =
    useRecoilState(nestedIndexerCategoryTaskAtom);

  const categoryList = useMemo(
    () => stateNestedIndexerCategoryTask.getParentList__MutableParent() ?? [],
    [stateNestedIndexerCategoryTask],
  );

  const refBoardsContainer = useRef<HTMLDivElement | null>(null);
  const [stateCardsContainer, setStateCardsContainer] =
    useRecoilState(cardsContainerAtom);
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

  const [stateIsDragging, setStateIsDragging] = useState(false);

  useEffect(() => {
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
            containerFrom === dataItemListTypeValueKvMapping["categories"] &&
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

    return () => {
      sortables.forEach((sortable) => sortable.destroy());
    };
  }, [
    categoryList,
    stateCardsContainer,
    stateIsDragging,
    setStateNestedIndexerCategoryTask,
  ]);

  const customDataAttributes: ItemListCustomDataAttributes = {
    "data-item-list-type": "categories",
    "data-item-list-id": "root",
  };

  // console.log(categoryList);
  console.log(stateNestedIndexerCategoryTask);
  // console.log("stateActiveCategory:", stateActiveCategory);
  // console.log("isDragging:", isDragging);

  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <Helmet>
          <link
            href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
            rel="stylesheet"
          />
        </Helmet>
        <GlobalStyle />
        <Main>
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
                    <Board key={category.id} {...customDataAttributes}>
                      <BoardHeader category={category} />
                      <BoardMain category={category} />
                      {/* <BoardFooter category={category} /> */}
                    </Board>
                  );
                })}
              </>
            )}
          </BoardsContainer>
        </Main>
        <ReactQueryDevtools initialIsOpen={true} />
      </ThemeProvider>
    </>
  );
}

export default App;
