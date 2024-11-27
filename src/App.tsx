import { useCallback } from "react";
import { ThemeProvider, createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { DragDropContext, OnDragEndResponder, TypeId } from "@hello-pangea/dnd";
import { useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import { arrayMoveElement } from "@/utils";
import DroppableBoard from "@/components/DroppableBoard";
import { categoryListAtom, categorySelectorFamily } from "@/atoms";
import { getRecoil, setRecoil } from "recoil-nexus";

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
  body {
    font-family: "Source Sans 3", sans-serif;
    font-optical-sizing: auto;
    font-weight: 500;
    font-style: normal;
    
    background-color: ${({ theme }) => theme.bgColor};
    color: black;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

const Wrapper = styled.div`
  margin: 0 auto;
  display: flex;
  max-width: 680px;
  width: 100%;
  height: 100vh;
  justify-content: center;
  align-items: center;
`;

const Boards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  gap: 10px;
`;

function App() {
  const [stateCategoryList, setStateCategoryList] =
    useRecoilState(categoryListAtom);
  // const stateCategoryIndexer = useRecoilValue(categoryIndexerSelector);
  // const stateTaskIndexer = useRecoilValue(taskIndexerSelector);

  const onDragEnd: OnDragEndResponder<TypeId> = useCallback<OnDragEndResponder>(
    (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      { source, destination, draggableId, ...otherParams },
      responderProvided,
    ) => {
      console.log("source:", source);
      console.log("destination:", destination);
      console.log("draggableId:", draggableId);
      // console.log("otherParams:", otherParams);

      if (!destination) {
        return;
      }

      if (source.droppableId === destination.droppableId) {
        // Same board movement
        const category = getRecoil(categorySelectorFamily(source.droppableId));
        if (!category) {
          return;
        }
        const taskListClone = [...category.taskList];
        arrayMoveElement({
          arr: taskListClone,
          idxFrom: source.index,
          idxTo: destination.index,
        });
        setRecoil(categorySelectorFamily(source.droppableId), {
          ...category,
          taskList: taskListClone,
        });
      } else {
        // Cross board movement
        const categorySrc = getRecoil(
          categorySelectorFamily(source.droppableId),
        );
        if (!categorySrc) {
          return;
        }
        const categoryDest = getRecoil(
          categorySelectorFamily(destination.droppableId),
        );
        if (!categoryDest) {
          return;
        }
        const taskListCloneSrc = [...categorySrc.taskList];
        const [task] = taskListCloneSrc.splice(source.index, 1);
        const taskListCloneDest = [...categoryDest.taskList];
        taskListCloneDest.splice(destination.index, 0, task);
        setRecoil(categorySelectorFamily(source.droppableId), {
          ...categorySrc,
          taskList: taskListCloneSrc,
        });
        setRecoil(categorySelectorFamily(destination.droppableId), {
          ...categoryDest,
          taskList: taskListCloneDest,
        });
      }
    },
    [],
  );

  console.log(stateCategoryList);

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
        <DragDropContext
          // onDragStart={dragStartHandler}
          onDragEnd={onDragEnd}
        >
          <Wrapper>
            <Boards>
              {stateCategoryList.map((stateCategory) => {
                return (
                  <DroppableBoard
                    key={stateCategory.text}
                    id={stateCategory.text}
                    tasks={stateCategory.taskList}
                  />
                );
              })}
            </Boards>
          </Wrapper>
        </DragDropContext>
        <ReactQueryDevtools initialIsOpen={true} />
      </ThemeProvider>
    </>
  );
}

export default App;
