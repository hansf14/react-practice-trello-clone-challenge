import { FormEventHandler, useCallback, useState } from "react";
import { ThemeProvider, createGlobalStyle, styled } from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import { arrayMoveElement, generateUniqueRandomId } from "@/utils";
import { Board as BoardBase } from "@/components/DraggableAndDroppableBoard";
import { FormSubmitHandler, SubmitHandler, useForm } from "react-hook-form";
import { Indexer, indexerAtom, Task } from "@/atoms";
import { DraggableCard } from "@/components/DraggableCard";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { DraggableContext } from "@/components/DraggableContext";
import { CSS } from "@dnd-kit/utilities";

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
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

const Main = styled.main`
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  background-repeat: no-repeat;
  background-size: cover;
  color: black;

  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  justify-content: center;
  align-items: center;
`;

const Wrapper = styled.div`
  /* margin: 0 auto;
  display: flex;
  max-width: 680px;

  justify-content: center;
  align-items: center; */
`;

const Boards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  gap: 10px;
`;

const Board = styled(BoardBase)<{ isDragging?: boolean }>`
  opacity: ${({ isDragging }) => (isDragging ? "0.5" : "1")};
`;

const Title = styled.h2`
  margin: 10px 0 15px;
  text-align: center;
  font-weight: bold;
  font-size: 22px;
`;

const Form = styled.form`
  width: 100%;

  input {
    width: 100%;
  }
`;

export interface FormData {
  taskText: string;
}

function App() {
  const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);

  const {
    register,
    handleSubmit,
    // setValue,
    reset, // setValue("taskText", "")
    formState: { errors },
  } = useForm<FormData>();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [currentContainerId, setCurrentContainerId] =
    useState<UniqueIdentifier>();
  const [containerName, setContainerName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = (event: DragStartEvent) => {};

  const onDragMove = (event: DragMoveEvent) => {};

  const onValid = useCallback<
    ({ categoryId }: { categoryId: string }) => SubmitHandler<FormData>
  >(
    ({ categoryId }) => {
      return (data: FormData, event) => {
        // console.log(data);

        setStateIndexer((curIndexer) => {
          const newTask = {
            id: generateUniqueRandomId(),
            text: data.taskText,
          } satisfies Task;

          const newIndexer = new Indexer(curIndexer);
          newIndexer.createTask({
            categoryId,
            task: newTask,
            shouldAppend: false,
          });
          return newIndexer;
        });

        reset();
      };
    },
    [setStateIndexer, reset],
  );

  const onSubmit = useCallback<
    ({
      categoryId,
    }: {
      categoryId: string;
    }) => FormEventHandler<HTMLFormElement>
  >(
    ({ categoryId }) => {
      return (event) => {
        return handleSubmit((data, event) => onValid({ categoryId }));
      };
    },
    [handleSubmit, onValid],
  );

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

  const onDragEnd = useCallback(
    (
      event: DragEndEvent,
      // // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // { source, destination, draggableId, ...otherParams },
      // // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // responderProvided,
    ) => {
      // console.log("source:", source);
      // console.log("destination:", destination);
      // console.log("draggableId:", draggableId);
      // // console.log("otherParams:", otherParams);

      const { active, over } = event;
      console.log("active:", active);
      console.log("over:", over);

      if (over && active.id !== over.id) {
        // setStateIndexer((curIndexer) => {
        //   const newIndexer = new Indexer(curIndexer);
        //   newIndexer.moveTask({
        //     categoryIdFrom: source.droppableId,
        //     categoryIdTo: destination.droppableId,
        //     idxFrom: source.index,
        //     idxTo: destination.index,
        //   });
        //   return newIndexer;
        // });
      }
    },
    [setStateIndexer],
  );

  const categoryList = stateIndexer.getCategoryList__MutableCategory();

  console.log(stateIndexer);

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
        {/* <button onClick={aaaa}>ABC</button> */}
        <Main>
          <DndContext onDragEnd={onDragEnd}>
            <Wrapper>
              <Boards>
                {!categoryList || categoryList.length === 0 ? (
                  <div>Empty!</div>
                ) : (
                  <SortableContext items={categoryList}>
                    {categoryList.map((category) => {
                      const taskList =
                        stateIndexer.getTaskListFromCategoryId__MutableTask({
                          categoryId: category.id,
                        });

                      if (!taskList) {
                        return <div>Empty!</div>;
                      }

                      return (
                        <DraggableContext id={category.id}>
                          {({
                            attributes,
                            listeners,
                            setNodeRef,
                            transform,
                            transition,
                            isDragging,
                          }) => {
                            const style = {
                              transform: CSS.Transform.toString(transform),
                              transition,
                            };

                            return (
                              <Board
                                key={category.id}
                                ref={setNodeRef}
                                style={style}
                                isDragging={isDragging}
                                {...attributes}
                                slotHeader={
                                  <div>
                                    <Title>{category.text}</Title>
                                    <Form
                                      onSubmit={onSubmit({
                                        categoryId: category.id,
                                      })}
                                    >
                                      <input
                                        type="text"
                                        placeholder={`Add a task on ${category.text}`}
                                        {...register("taskText", {
                                          required: true,
                                        })}
                                      />
                                    </Form>
                                    <div {...listeners}>DOH!</div>
                                  </div>
                                }
                                slotBody={
                                  !taskList || taskList.length === 0 ? (
                                    <div>Empty!</div>
                                  ) : (
                                    <SortableContext items={taskList}>
                                      {taskList.map((task, idx) => (
                                        <DraggableContext
                                          key={task.id}
                                          id={task.id}
                                        >
                                          {({
                                            attributes,
                                            listeners,
                                            setNodeRef,
                                            transform,
                                            transition,
                                          }) => {
                                            const style = {
                                              transform:
                                                CSS.Transform.toString(
                                                  transform,
                                                ),
                                              transition,
                                            };

                                            return (
                                              <DraggableCard
                                                key={task.id}
                                                ref={setNodeRef}
                                                style={style}
                                                {...attributes}
                                              >
                                                {task.text}
                                                <div {...listeners}>DOH!</div>
                                              </DraggableCard>
                                            );
                                          }}
                                          {/* <DraggableCard key={task.id} id={task.id}>
                                  {task.text}
                                </DraggableCard> */}
                                        </DraggableContext>
                                      ))}
                                    </SortableContext>
                                    // <SortableContext items={taskList}>
                                    //   {taskList.map((task, idx) => (
                                    //     <DraggableCard key={task.id} id={task.id}>
                                    //       {task.text}
                                    //     </DraggableCard>
                                    //   ))}
                                    // </SortableContext>
                                  )
                                }
                              />
                            );
                          }}
                        </DraggableContext>
                      );
                    })}
                  </SortableContext>
                )}
              </Boards>
            </Wrapper>
          </DndContext>
        </Main>
        <ReactQueryDevtools initialIsOpen={true} />
      </ThemeProvider>
    </>
  );
}

export default App;
