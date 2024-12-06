import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ThemeProvider, createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import autoScroll from "dom-autoscroller";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Sortable, { MultiDrag, Swap } from "sortablejs";
import { boardDragHandlesAtom, BoardHeader } from "@/components/BoardHeader";
import { BoardMain, cardsContainerAtom } from "@/components/BoardMain";
import { BoardFooter } from "@/components/BoardFooter";
import { cardDragHandlesAtom, cardsAtom } from "@/components/Card";
import { useDeviceDetector } from "@/hooks/useDeviceDetector";
import { CssScrollbar } from "@/css/scrollbar";

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
    > div {
      /* height: 100%; */
    }
  }

  // Ghost
  &.sortable-ghost {
    opacity: 0.7;
    border: 1px solid orange;
  }
`;

// Sortable extra-plugins
// Sortable.mount(new MultiDrag(), new Swap());

function App() {
  const [stateIndexerCategoryTask, setStateIndexerCategoryTask] =
    useRecoilState(indexerCategoryTaskAtom);

  // const [stateActiveCategoryDomStyle, setStateActiveCategoryDomStyle] =
  //   useState({});

  // const onDragStart = (event: DragStartEvent) => {
  //   const { active } = event;
  //   setActiveId(active.id);
  // };

  // const onDragMove = (event: DragMoveEvent) => {
  //   const { active, over } = event;

  //   // Handle items sorting
  //   if (
  //     active &&
  //     over &&
  //     active.id.toString().includes("item") &&
  //     over.id.toString().includes("item") &&
  //     active.id !== over.id
  //   ) {
  //     // Find the active container and over container
  //     // const activeContainer =
  //     //       const findValueOfItems =
  //     // Cid: UniqueIdentifier | undefined, type:
  //     // if (tpe === 'container') {
  //     // return containers.find((container) => container.id === id);
  //     // if (type === 'item') {
  //     // return containers.find((container) =>
  //     // container.items.find((item) => item.id === id),
  //     // string)
  //     // => {
  //     const activeContainer = findValueOfItems(active.id, "item");
  //     const overContainer = findValueOfItems(over.id, "item");

  //     if (!activeContainer || !overContainer) {
  //       return;
  //     }

  //     // Find the active and over container index
  //     const activeContainerIdx = containers.findIndex(
  //       (container) => container.id === activeContainer.id,
  //     );
  //     const overContainerIdx = containers.findIndex(
  //       (container) => container.id === overContainer.id,
  //     );

  //     // Find the active and over item
  //     // ...

  //     // In the same container
  //     if (activeContainerIdx === overContainerIdx) {
  //       let newItems = [...containers];
  //       newItems[activeContainerIdx].items = arrayMove(
  //         newItems[activeContainerIdx].items,
  //         activeItemIdx,
  //         overItemIdx,
  //       );

  //       setContainers(newItems);
  //     } else {
  //       let newITems = [...containers];
  //       const [removedItem] = newItems[activeContainerIdx].items.splice(
  //         activeItemIdx,
  //         1,
  //       );
  //       newItems[overContainerIdx].items.splice(overItemIdx, 0, removedItem);
  //       setContainers(newItems);
  //     }
  //   }

  //   // Handle item drop into a container
  //   if (
  //     active &&
  //     over &&
  //     active.id.toString().includes("item") &&
  //     over.id.toString().includes("container") &&
  //     active.id !== over.id
  //   ) {
  //     // Find the active and over container
  //     const activeContainer = findValueOfItems(active.id, "item");
  //     const overContainer = findValueOfItems(over.id, "container");

  //     // If the active or over container is undefined, return
  //     if (!activeContainer || !overContainer) {
  //       return;
  //     }

  //     // Find the active and over container index
  //     const activeContainerIdx = containers.findIndex(
  //       (container) => container.id === activeContainer.id,
  //     );
  //     const overContainerIdx = containers.findIndex(
  //       (container) => container.id === overContainer.id,
  //     );

  //     // Find the index of the active item in the active container
  //     const activeItemIndex = activeContainer.items.findIndex(
  //       (item) => item.id === active.id,
  //     );
  //     const overItemIndex = overContainer.items.findIndex(
  //       (item) => item.id === over.id,
  //     );

  //     // Remove the active item from the active container and add it to the over container
  //     let newItems = [...containers];
  //     const [removedItem] = newItems[activeContainerIdx].items.splice(
  //       activeItemIndex,
  //       1,
  //     );
  //     newItems[overContainerIndex].items.push(removedItem);
  //     setContainers(newItems);
  //   }
  // };

  // const onValid = useCallback<
  //   ({ categoryId }: { categoryId: string }) => SubmitHandler<FormData>
  // >(
  //   ({ categoryId }) => {
  //     return (data: FormData, event) => {
  //       // console.log(data);

  //       setStateIndexer((curIndexer) => {
  //         const newTask = {
  //           id: generateUniqueRandomId(),
  //           text: data.taskText,
  //         } satisfies Task;

  //         const newIndexer = new Indexer(curIndexer);
  //         newIndexer.createTask({
  //           categoryId,
  //           task: newTask,
  //           shouldAppend: false,
  //         });
  //         return newIndexer;
  //       });

  //       reset();
  //     };
  //   },
  //   [setStateIndexer, reset],
  // );

  // const onSubmit = useCallback<
  //   ({
  //     categoryId,
  //   }: {
  //     categoryId: string;
  //   }) => FormEventHandler<HTMLFormElement>
  // >(
  //   ({ categoryId }) => {
  //     return (event) => {
  //       return handleSubmit((data, event) => onValid({ categoryId }));
  //     };
  //   },
  //   [handleSubmit, onValid],
  // );

  // const onDragEnd: OnDragEndResponder<TypeId> = useCallback<OnDragEndResponder>(
  //   (
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     { source, destination, draggableId, ...otherParams },
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     responderProvided,
  //   ) => {
  //     console.log("source:", source);
  //     console.log("destination:", destination);
  //     // console.log("draggableId:", draggableId);
  //     // // console.log("otherParams:", otherParams);

  //     if (!destination) {
  //       return;
  //     }

  //     setStateIndexer((curIndexer) => {
  //       const newIndexer = new Indexer(curIndexer);
  //       newIndexer.moveTask({
  //         categoryIdFrom: source.droppableId,
  //         categoryIdTo: destination.droppableId,
  //         idxFrom: source.index,
  //         idxTo: destination.index,
  //       });
  //       return newIndexer;
  //     });
  //   },
  //   [setStateIndexer],
  // );

  // const onDragEnd = (event: DragEndEvent) => {
  //   // Handle container sorting
  //   if (
  //     active &&
  //     over &&
  //     active.id.toString().includes("container") &&
  //     over.id.toString().includes("container") &&
  //     active.id !== over.id
  //   ) {
  //     const activeContainerIdx = containers.findIndex(
  //       (container) => container.id === active.id,
  //     );
  //     const overContainerIdx = containers.findIndex(
  //       (container) => container.id === over.id,
  //     );

  //     // Swap the active and over container
  //     let newItems = [...containers];
  //     newItems = arrayMove(newItems, activeContainerIndex, overContainerIndex);
  //     setContainers(newItems);
  //   }

  //   // Handle item sorting
  //   if (
  //     active &&
  //     over &&
  //     active.id.toString().includes("item") &&
  //     over.id.toString().includes("item") &&
  //     active.id !== over.id
  //   ) {
  //     const activeContainer = findValueOfItems(active.id, "item");
  //     const overContainer = findValueOfItems(over.id, "item");

  //     if (!activeContainer || !overContainer) {
  //       return;
  //     }

  //     // Find the active and over container index
  //     const activeContainerIdx = containers.findIndex(
  //       (container) => container.id === activeContainer.id,
  //     );
  //     const overContainerIdx = containers.findIndex(
  //       (container) => container.id === overContainer.id,
  //     );

  //     // Find the index of the active item in the active container
  //     const activeItemIndex = activeContainer.items.findIndex(
  //       (item) => item.id === active.id,
  //     );
  //     const overItemIndex = overContainer.items.findIndex(
  //       (item) => item.id === over.id,
  //     );

  //     // In the same container
  //     if (activeContainerIdx === overContainerIdx) {
  //       let newItems = [...containers];
  //       newItems[activeContainerIdx].items = arrayMove(
  //         newItems[activeContainerIdx].items,
  //         activeItemIdx,
  //         overItemIdx,
  //       );

  //       setContainers(newItems);
  //     } else {
  //       let newITems = [...containers];
  //       const [removedItem] = newItems[activeContainerIdx].items.splice(
  //         activeItemIdx,
  //         1,
  //       );
  //       newItems[overContainerIdx].items.splice(overItemIdx, 0, removedItem);
  //       setContainers(newItems);
  //     }

  //     //Handle item drop into a container
  //     // ...
  //   }
  //   setActiveId(null);
  // };

  /////////////////////////////////////////////////////

  const categoryList = useMemo(
    () => stateIndexerCategoryTask.getParentList__MutableParent() ?? [],
    [stateIndexerCategoryTask],
  );

  const refBoardsContainer = useRef<HTMLDivElement | null>(null);
  const [stateCardsContainer, setStateCardsContainer] =
    useRecoilState(cardsContainerAtom);
  const [stateBoardDragHandles, setStateBoardDragHandles] =
    useRecoilState(boardDragHandlesAtom);
  const [stateCards, setStateCards] = useRecoilState(cardsAtom);
  const [stateCardDragHandles, setStateCardDragHandles] =
    useRecoilState(cardDragHandlesAtom);

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
        group: "categories",
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
        group: "tasks",
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
  }, [categoryList, stateCardsContainer, stateIsDragging]);

  // console.log(categoryList);
  // console.log(stateIndexerCategoryTask);
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
          <BoardsContainer ref={refBoardsContainer}>
            {categoryList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              <>
                {categoryList.map((category) => {
                  return (
                    <Board key={category.id}>
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
