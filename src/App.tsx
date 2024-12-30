import { ThemeProvider, createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
// import { ReactQueryDevtools } from "react-query/devtools";
import { lightTheme } from "./theme";
import { CategoryTaskBoardList } from "@/components/CategoryTaskBoardList";
import { defaultCategoryTaskItems } from "@/data";
import { getCssScrollbar } from "@/csses/scrollbar";

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

  :root {
    color-scheme: only light;
  }
  
  html {
    overflow-x: auto;
    overflow-y: hidden;
    
    height: 100%;
    min-width: max-content;
    width: 100%;
    // ㄴ min-width: max-content; width: 100%;
    // ㄴ 마치 max(max-content, 100%)처럼 가능함
    
    background: ${({ theme }) => theme.background};
    background-repeat: no-repeat;
    background-size: cover;
    color: black;
  }
  // Due to @hello-pangea/dnd's drop and collision detection functionality work normally, we have to use the HTML scroll, not the body scroll or inner elements.
  // But we have to sacrifice some features like transparent scrollbar with the html tag background (which is possible in body or inner elements), BoardList component's scroll functionality encapsulation.
  // Also, in mobile, the scrollbar is always overlay type. Can't make it always visible in HTML tag.

  body {
    height: 100%;

    font-family: "Source Sans 3", sans-serif;
    font-optical-sizing: auto;
    font-weight: 500;
    font-style: normal;
    word-break: break-word;

    ${({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      theme,
    }) =>
      getCssScrollbar({
        outline: "1px solid white",
        margin: "1px",

        thumbBackground: "white",
        trackBackground: "#8dbeb7",
      })}
    
    * {
      ${({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        theme,
      }) =>
        getCssScrollbar({
          thumbBackground: "white",
          trackBackground: "transparent",
        })}
    }
  }

  #root {
    width: max-content;
    height: 100%;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

const Main = styled.main`
  width: max-content;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

function App() {
  return (
    <>
      <ThemeProvider theme={lightTheme}>
        <Helmet>
          <link
            href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
            rel="stylesheet"
          />
        </Helmet>
        <GlobalStyle />
        <Main>
          <CategoryTaskBoardList
            boardListId="category-task-board"
            defaultItems={defaultCategoryTaskItems}
            parentKeyName="category"
            childKeyName="task"
          />
        </Main>
        {/* <ReactQueryDevtools initialIsOpen={true} /> */}
      </ThemeProvider>
    </>
  );
}

export default App;
