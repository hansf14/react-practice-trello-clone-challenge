import { createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { ThemeProvider } from "styled-components";
import { darkTheme } from "./theme";
import {
	DragDropContext,
	Draggable,
	Droppable,
	OnDragEndResponder,
	OnDragStartResponder,
	TypeId,
} from "@hello-pangea/dnd";
import { useCallback, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { selectorOrderedListToDos, ToDoData } from "@/atoms";
import { arrayMoveElement } from "@/utils";
import DraggableCard from "@/components/DraggableCard";

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
	display: flex;
	max-width: 480px;
	width: 100%;
	margin: 0 auto;

	justify-content: center;
	align-items: center;
	height: 100vh;
`;

const Boards = styled.div`
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	width: 100%;
`;

const Board = styled.div`
	padding: 30px 10px 20px;
	background-color: ${({ theme }) => theme.boardBgColor};
	border-radius: 5px;
	min-height: 200px;
`;

function App() {
	// const [stateIsDragging, setStateIsDragging] = useState<boolean>(false);
	const [stateOrderedListToDos, setStateOrderedListToDos] = useRecoilState(
		selectorOrderedListToDos
	);

	// const dragStartHandler: OnDragStartResponder<TypeId> = useCallback(() => {
	// 	setStateIsDragging(true);
	// }, []);

	const dragEndHandler: OnDragEndResponder<TypeId> = useCallback(
		({ source, destination }) => {
			// console.log(source, destination);
			if (!destination) {
				return;
			}

			// setStateIsDragging(false);

			setStateOrderedListToDos((currentOrderedListToDos) => {
				const newOrderedListToDos = [...currentOrderedListToDos];
				arrayMoveElement({
					arr: newOrderedListToDos,
					idxFrom: source.index,
					idxTo: destination.index,
				});
				return newOrderedListToDos;
			});
		},
		[]
	);

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
					onDragEnd={dragEndHandler}
				>
					<Wrapper>
						<Boards>
							<Droppable droppableId="one">
								{(droppableProvided) => (
									<Board
										ref={droppableProvided.innerRef}
										{...droppableProvided.droppableProps}
									>
										{stateOrderedListToDos.map(({ id, text }, idx) => {
											const toDo = useMemo<ToDoData>(
												() => ({ id, text }),
												[id, text]
											);
											return (
												<DraggableCard
													key={id}
													toDo={toDo}
													index={idx}
													// isDragDisabled={stateIsDragging}
												/>
											);
										})}
										{droppableProvided.placeholder}
									</Board>
								)}
							</Droppable>
						</Boards>
					</Wrapper>
				</DragDropContext>
				<ReactQueryDevtools initialIsOpen={true} />
			</ThemeProvider>
		</>
	);
}

export default App;
