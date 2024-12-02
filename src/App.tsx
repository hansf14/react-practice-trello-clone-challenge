import React, {
  FormEventHandler,
  MutableRefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ThemeProvider,
  createGlobalStyle,
  styled,
  css,
  ExecutionProps,
} from "styled-components";
import { Helmet } from "react-helmet-async";
import { ReactQueryDevtools } from "react-query/devtools";
import { useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import {
  arrayMoveElement,
  createKeyValueMapping,
  generateUniqueRandomId,
} from "@/utils";
import { FormSubmitHandler, SubmitHandler, useForm } from "react-hook-form";
import { Category, Indexer, indexerAtom, Task } from "@/atoms";
import { CSS } from "@dnd-kit/utilities";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { createPortal } from "react-dom";
import { RequiredDeep } from "type-fest";
import { Input } from "antd";
import { useWhichPropsChanged } from "@/hooks/useWhichPropsChanged";
import { useDnd, UseDndSetDraggableHandleRef } from "@/hooks/useDnd";
import { useDrag, useDrop, XYCoord } from "react-dnd";

const { TextArea } = Input;

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

const DndItemTypes = ["category", "task"] as const;
export type DndItemType = (typeof DndItemTypes)[number];
const DndItemTypeMapping = createKeyValueMapping({ arr: DndItemTypes });

const Main = styled.main`
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  background-repeat: no-repeat;
  background-size: cover;
  color: black;
  gap: 10px;
  padding: 10px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Boards = styled.div`
  transform-style: preserve-3d;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  gap: 10px;
`;

export interface BoardProps {
  isDragging?: boolean;
  transform?: string;
  isDraggedOver?: boolean;
}

const Board = styled.div<BoardProps>`
  max-width: 300px;
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;

  // Glassmorphism
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(13.5px);
  -webkit-backdrop-filter: blur(13.5px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);

  transform-style: preserve-3d;
  ${({ isDragging, transform }) =>
    isDragging
      ? css`
          transform: ${(transform ?? "") + "translateZ(10px) !important"};
          opacity: 0.85;
          border: 3px solid yellow;
        `
      : ""} // background-color: ${({ theme }) => theme.boardBgColor};

  background-color: ${({ isDraggedOver }) =>
    (isDraggedOver ?? false) ? "orange" : "green"};
`;

export type BoardHeadProps = {
  category: Category;
  // setDragHandleRef: UseDndSetDraggableHandleRef;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

const BoardHeadTitle = styled.h2`
  width: 100%;
  margin: 10px 0 15px;
  text-align: center;
  font-weight: bold;
  font-size: 22px;
`;

const BoardHeadTitleInput = styled(TextArea)`
  && {
    width: 100%;
    min-height: auto;
    padding: 0;
    background-color: transparent;
    border: none;
    border-radius: 0;

    font-weight: bold;
    font-size: 22px;
    text-align: center;
    line-height: 1;

    transition: none;

    &:focus {
      outline: 2px solid yellow;
    }
  }
`;

const BoardHeadForm = styled.form`
  width: 100%;

  input {
    width: 100%;
  }
`;

export const BoardHead = React.memo(
  React.forwardRef<HTMLDivElement, BoardHeadProps>(({ category }, ref) => {
    const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);
    const [stateIsEditMode, setStateIsEditMode] = useState<boolean>(false);

    const {
      register,
      handleSubmit,
      // setValue,
      reset, // setValue("taskText", "")
      formState: { errors },
    } = useForm<FormData>();

    const onValid = useCallback<SubmitHandler<FormData>>(
      (data: FormData, event) => {
        // console.log(data);

        setStateIndexer((curIndexer) => {
          const newTask = {
            id: generateUniqueRandomId(),
            text: data.taskText,
          } satisfies Task;

          const newIndexer = new Indexer(curIndexer);
          newIndexer.createTask({
            categoryId: category.id,
            task: newTask,
            shouldAppend: false,
          });
          return newIndexer;
        });

        reset();
      },
      [setStateIndexer, category.id, reset],
    );

    const boardHeadTitleEditEnableHandler = useCallback<
      React.MouseEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(true);
    }, []);

    const boardHeadTitleEditDisableHandler = useCallback<
      React.FocusEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(false);
    }, []);

    const boardHeadTitleEditFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >((event) => {
      if (event.key !== "Enter") {
        return;
      }
      setStateIsEditMode(false);
    }, []);

    const boardHeadTitleEditHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        // console.log(event.target.value);
        setStateIndexer((curIndexer) => {
          const newIndexer = new Indexer(curIndexer);
          newIndexer.updateCategory({
            categoryId: category.id,
            category: {
              id: category.id,
              text: event.target.value,
            },
          });
          return newIndexer;
        });
      },
      [setStateIndexer, category.id],
    );

    return (
      <div ref={ref}>
        <BoardHeadTitle>
          <BoardHeadTitleInput
            value={category.text}
            // autoFocus
            autoSize
            readOnly={!stateIsEditMode}
            onClick={boardHeadTitleEditEnableHandler}
            onBlur={boardHeadTitleEditDisableHandler}
            onKeyDown={boardHeadTitleEditFinishHandler}
            onChange={boardHeadTitleEditHandler}
          />
        </BoardHeadTitle>
        <BoardHeadForm onSubmit={handleSubmit(onValid)}>
          <input
            type="text"
            placeholder={`Add a task on ${category.text}`}
            {...register("taskText", {
              required: true,
            })}
          />
        </BoardHeadForm>
        <div ref={ref}>
          DOH!<br></br>DOH!
        </div>
      </div>
    );
  }),
);
BoardHead.displayName = "BoardHead";

export type BoardBaseProps = {} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardBase = React.memo(
  React.forwardRef<HTMLDivElement, BoardBaseProps>(
    (props: BoardBaseProps, ref) => {
      const { ...otherProps } = props;

      const [{ isDraggedOver }, setDroppableRef] = useDrop({
        accept: [DndItemTypeMapping["task"]],
        drop: (item, monitor) => console.log(item),
        collect: (monitor) => ({
          isDraggedOver: monitor.isOver(),
        }),
      });

      const setRef = useCallback(
        (node: HTMLDivElement | null) => {
          if (node) {
            setDroppableRef(node);
            if (ref) {
              (ref as MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }
        },
        [ref, setDroppableRef],
      );

      return (
        <Board
          ref={setRef}
          isDraggedOver={isDraggedOver}
          {...otherProps}
        ></Board>
      );
    },
  ),
);

// export const BoardBase = React.memo(
//   React.forwardRef<HTMLDivElement, BoardBaseProps>(
//     (props: BoardBaseProps, ref) => {
//       const { category, ...otherProps } = props;
//       return (
//         <Board ref={ref} {...otherProps}>
//           <BoardHead category={category} />
//           <BoardBody category={category} />
//         </Board>
//       );
//     },
//   ),
// );

export interface DndItem {
  type: DndItemType;
  index: number;
  data: Category | Task;
}

export interface CardBaseProps {
  isDragging: boolean;
}

export interface CardProps {
  task: Task;
  index: number;
}

export interface CardDragCollectedProps {
  isDragging: boolean;
}

export interface CardDropCollectedProps {
  handlerId: string | symbol | null;
}

const CardBase = styled.div<CardBaseProps>`
  background-color: ${({ isDragging }) => (isDragging ? "red" : "1")};
`;

export const Card = React.memo(
  React.forwardRef<HTMLDivElement, CardProps>(({ task, index }, ref) => {
    console.log("[CardBase]");
    const refElement = useRef<HTMLDivElement>();

    const [{ isDragging }, setDraggableHandleRef, setDraggableRef] = useDrag<
      DndItem,
      void,
      CardDragCollectedProps
    >({
      type: DndItemTypeMapping["task"],
      item: {
        type: DndItemTypeMapping["task"],
        index,
        data: task,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [{ handlerId }, setDroppableRef] = useDrop<
      DndItem,
      void,
      CardDropCollectedProps
    >({
      accept: DndItemTypeMapping["task"],
      collect: (monitor) => ({
        handlerId: monitor.getHandlerId(),
      }),
      hover: (item, monitor) => {
        if (!refElement.current) {
          return;
        }

        // console.log(item);
        const draggedIndex = item.index;
        const hoveredIndex = index;
        // console.log("draggedIndex:", draggedIndex);
        // console.log("hoveredIndex:", hoveredIndex);

        // Don't replace items with themselves
        if (draggedIndex === hoveredIndex) {
          return;
        }

        // Get rectangle on screen
        const hoveredBoundingRect = refElement.current?.getBoundingClientRect();

        // Get vertical middle
        const hoveredMiddleY =
          (hoveredBoundingRect.bottom - hoveredBoundingRect.top) / 2;
        console.log("hoveredMiddleY:", hoveredMiddleY);

        // Get mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoveredClientY =
          (clientOffset as XYCoord).y - hoveredBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging downwards
        if (draggedIndex < hoveredIndex && hoveredClientY < hoveredMiddleY) {
          return;
        }
        // Dragging upwards
        if (draggedIndex > hoveredIndex && hoveredClientY > hoveredMiddleY) {
          return;
        }

        // // Time to actually perform the action
        // moveCard(dragIndex, hoverIndex);

        // // Note: we're mutating the monitor item here!
        // // Generally it's better to avoid mutations,
        // // but it's good here for the sake of performance
        // // to avoid expensive index searches.
        // item.index = hoverIndex;
      },
    });

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (node) {
          setDraggableRef(node);
          setDroppableRef(node);
          refElement.current = node;
          if (ref) {
            (ref as MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }
      },
      [ref, setDraggableRef, setDroppableRef],
    );

    return (
      <CardBase ref={setRef} isDragging={isDragging}>
        {task.text}
        <div ref={setDraggableHandleRef}>DOH!</div>
      </CardBase>
    );
  }),
);

export type BoardBodyProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardBody = React.memo(
  React.forwardRef<HTMLDivElement, BoardBodyProps>((props, ref) => {
    const { category } = props;
    const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);

    const taskList = useMemo(() => {
      // console.log("[taskList]");
      return stateIndexer.getTaskListFromCategoryId__MutableTask({
        categoryId: category.id,
      });
    }, [category.id, stateIndexer]);

    return (
      <>
        {!taskList || taskList.length === 0 ? (
          <div>Empty!</div>
        ) : (
          taskList.map((task, idx) => {
            return (
              <Card
                ref={ref}
                key={task.id}
                index={idx}
                task={task}
                {...props}
              />
            );
          })
        )}
      </>
    );
  }),
);
BoardBody.displayName = "BoardBody";

// export type DraggableContextPropsDataCustomType = "category" | "task";

// export type DraggableContextPropsDataCustomData = RequiredDeep<
//   DraggableContextPropsData<
//     DraggableContextPropsDataCustomType,
//     Category | Task
//   >
// >;

export interface FormData {
  taskText: string;
}

function App() {
  const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);

  const [stateActiveCategory, setStateActiveCategory] =
    useState<Category | null>(null);
  const [stateActiveTask, setStateActiveTask] = useState<Task | null>(null);
  const [stateActiveCategoryDomStyle, setStateActiveCategoryDomStyle] =
    useState({});

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
    () => stateIndexer.getCategoryList__MutableCategory() ?? [],
    [stateIndexer],
  );

  // console.log(stateIndexer);
  // console.log("stateActiveCategory:", stateActiveCategory);

  // const {
  //   draggableProvided,
  //   setDraggableRef,
  //   setDraggableHandleRef,
  //   droppableProvided,
  // } = useDnd<Category>({
  //   items: categoryList,
  // });

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
          <Boards>
            {categoryList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              <>
                {categoryList.map((category, idx) => {
                  return (
                    <BoardBase
                      key={category.id}
                      // ref={setDraggableRef}
                      // ref={setDraggableRef({ index: idx })}
                      // {...draggableProvided({ index: idx })}
                    >
                      <BoardHead
                        category={category}
                        // setDragHandleRef={setDraggableHandleRef({ index: idx })}
                      />
                      <BoardBody category={category} />
                    </BoardBase>
                  );
                })}
                {/* {createPortal(
                        <DragOverlay adjustScale={false}>
                          {stateActiveCategory && (
                            <Board style={stateActiveCategoryDomStyle}>
                              <BoardHead category={stateActiveCategory} />
                              <BoardBody category={stateActiveCategory} />
                            </Board>
                          )}
                        </DragOverlay>,
                        document.body,
                      )} */}
              </>
            )}
          </Boards>
          <div
          // onDragEnter={onDragEnter}
          // onDragLeave={onDragLeave}
          // onDragOver={onDragOver({ category: { id: "123", text: "1234" } })}
          // onDrop={onDrop({ category: { id: "123", text: "1234" } })}
          >
            AAA
            <br />
            BBB
            <br />
            CCC
          </div>
        </Main>
        <ReactQueryDevtools initialIsOpen={true} />
      </ThemeProvider>
    </>
  );
}

export default App;
