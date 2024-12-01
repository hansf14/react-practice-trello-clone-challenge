import React, { FormEventHandler, useCallback, useMemo, useState } from "react";
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
import { arrayMoveElement, generateUniqueRandomId } from "@/utils";
// import { Board as BoardBase } from "@/components/Board";
import { FormSubmitHandler, SubmitHandler, useForm } from "react-hook-form";
import { Category, Indexer, indexerAtom, Task } from "@/atoms";
import { DraggableCard as CardBase } from "@/components/DraggableCard";
import {
  closestCenter,
  closestCorners,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  DraggableContext,
  DraggableContextPropsData,
} from "@/components/DraggableContext";
import { CSS } from "@dnd-kit/utilities";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { createPortal } from "react-dom";
import { RequiredDeep } from "type-fest";
import { Input } from "antd";

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

const c = (prevProps: any, nextProps: any) => {
  // Custom comparison function for debugging re-renders
  const keys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);
  let rerenderTriggeredBy: any[] = [];

  keys.forEach((key) => {
    if (prevProps[key] !== nextProps[key]) {
      console.log(`Prop '${key}' changed:`, {
        previous: prevProps[key],
        next: nextProps[key],
      });
      rerenderTriggeredBy.push(key);
    }
  });

  // Return true to prevent re-rendering if all props are equal
  const shouldPreventRerender = rerenderTriggeredBy.length === 0;
  if (!shouldPreventRerender) {
    console.log("Re-render triggered by:", rerenderTriggeredBy);
  }
  return shouldPreventRerender;
};

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
  transform-style: preserve-3d;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  gap: 10px;
`;

const Board = styled.div<{ isDragging?: boolean; transform?: string }>`
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
      : ""}// background-color: ${({ theme }) => theme.boardBgColor};
`;

export type BoardHeadProps = {
  category: Category;
  listeners?: SyntheticListenerMap;
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
  React.forwardRef<HTMLDivElement, BoardHeadProps>(
    ({ category, listeners }, ref) => {
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
          <div ref={ref} {...listeners}>
            DOH!<br></br>DOH!
          </div>
        </div>
      );
    },
  ),
);
BoardHead.displayName = "BoardHead";

export type BoardBodyProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardBody = React.memo(
  React.forwardRef<HTMLDivElement, BoardBodyProps>(({ category }, ref) => {
    const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);

    const taskList = stateIndexer.getTaskListFromCategoryId__MutableTask({
      categoryId: category.id,
    });

    const items = useMemo(
      () => taskList?.map((task) => task.id) ?? [],
      [taskList],
    );
    const memoizedDataArray = React.useMemo(
      () =>
        taskList?.map((task, idx) => ({
          customProps: {
            type: "task" as DraggableContextPropsDataCustomType,
            index: idx,
            customData: task,
          },
        })) ?? [],
      [taskList],
    );
    const Draggables = useMemo(() => {
      console.log("BoardBody Draggables");

      if (!taskList || taskList.length === 0) {
        return <div>Empty!</div>;
      }
      return taskList.map((task, idx) => (
        <DraggableContext<DraggableContextPropsDataCustomType, Task>
          key={task.id}
          id={task.id}
          data={
            memoizedDataArray[idx]
            // {
            // customProps: {
            //   type: "task",
            //   index: idx,
            //   customData: task,
            // },
            // }
          }
        >
          {({
            attributes,
            listeners,
            setNodeRef,
            setActivatorNodeRef,
            transform,
            transition,
            isDragging,
          }) => {
            const style = {
              transform: CSS.Transform.toString(transform),
              transition,
            };

            return (
              <Card>
                <div
                  // key={task.id}
                  ref={setNodeRef}
                  style={style}
                  {...attributes}
                >
                  {task.text}
                  <div ref={setActivatorNodeRef} {...listeners}>
                    DOH!
                  </div>
                </div>
              </Card>
            );
          }}
        </DraggableContext>
      ));
    }, [taskList]);

    if (!taskList) {
      return <div>Empty!</div>;
    }

    return (
      <>
        {!taskList || taskList.length === 0 ? (
          <div>Empty!</div>
        ) : (
          <SortableContext
            items={items}
            // items={taskList}
            // strategy={rectSortingStrategy}
          >
            {Draggables}
            {/* {taskList.map((task, idx) => (
              <DraggableContext<DraggableContextPropsDataCustomType, Task>
                key={task.id}
                id={task.id}
                data={{
                  customProps: {
                    type: "task",
                    index: idx,
                    customData: task,
                  },
                }}
              >
                {({
                  attributes,
                  listeners,
                  setNodeRef,
                  setActivatorNodeRef,
                  transform,
                  transition,
                  isDragging,
                }) => {
                  const style = {
                    transform: CSS.Transform.toString(transform),
                    transition,
                  };

                  return (
                    <Card
                      key={task.id}
                      ref={setNodeRef}
                      style={style}
                      {...attributes}
                    >
                      {task.text}
                      <div ref={setActivatorNodeRef} {...listeners}>
                        DOH!
                      </div>
                    </Card>
                  );
                }}
              </DraggableContext>
            ))} */}
          </SortableContext>
        )}
      </>
    );
  }),
  c,
);
BoardBody.displayName = "BoardBody";

const Card = styled(CardBase)`
  /* touch-action: none; // Mobile에서 @dnd-kit 작동하기 위해서 필수임 */
`;

export type DraggableContextPropsDataCustomType = "category" | "task";

export type DraggableContextPropsDataCustomData = RequiredDeep<
  DraggableContextPropsData<
    DraggableContextPropsDataCustomType,
    Category | Task
  >
>;

export interface FormData {
  taskText: string;
}

function App() {
  const [stateIndexer, setStateIndexer] = useRecoilState(indexerAtom);

  const [stateActiveCategory, setStateActiveCategory] =
    useState<Category | null>(null);
  const [stateActiveTask, setStateActiveTask] = useState<Task | null>(null);

  // const detectSensor = () => {
  //   const isWebEntry = JSON.parse(sessionStorage.getItem("isWebEntry"));
  //   return isWebEntry ? PointerSensor : TouchSensor;
  // };
  const sensors = useSensors(
    // useSensor(PointerSensor),
    useSensor(MouseSensor),
    useSensor(
      TouchSensor,
      //    {
      //   activationConstraint: {
      //     distance: 10, // Adjust sensitivity for touch devices
      //   },
      // }
    ),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const onDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    // Property 'over' does not exist on type 'DragStartEvent'.
    // console.log(active);

    const data = active.data.current as DraggableContextPropsDataCustomData;
    if (data.customProps.customData && data.customProps.type === "category") {
      setStateActiveCategory(data.customProps.customData as Category);
      return;
    }
    if (data.customProps.customData && data.customProps.type === "task") {
      setStateActiveCategory(data.customProps.customData as Task);
      return;
    }
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    // console.log(active);
    // console.log(over);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      // console.log("onDragEnd");
      // // console.log("active:", active);
      // // console.log("over:", over);

      // const activeData = active.data
      //   .current as DraggableContextPropsDataCustomData;
      // const overData = over?.data
      //   .current as DraggableContextPropsDataCustomData;

      // if (over && activeData.customProps.customData && active.id !== over.id) {
      //   setStateIndexer((curIndexer) => {
      //     const newIndexer = new Indexer(curIndexer);
      //     newIndexer.moveCategory({
      //       idxFrom: activeData.customProps.index,
      //       idxTo: overData.customProps.index,
      //     });
      //     return newIndexer;
      //   });
      // }

      // // newIndexer.moveTask({
      // //   categoryIdFrom: activeData.customProps.customData.id,
      // //   categoryIdTo: overData.customProps.customData.id,
      // //   idxFrom: activeData.customProps.index,
      // //   idxTo: overData.customProps.index,
      // // });
    },
    [setStateIndexer],
  );

  const categoryList = stateIndexer.getCategoryList__MutableCategory();
  // const isActiveIdTask =
  //   stateActiveId && !!stateIndexer.getTask({ taskId: stateActiveId });
  // const isActiveIdCategory =
  //   stateActiveId && !!stateIndexer.getCategory({ categoryId: stateActiveId });

  console.log(stateIndexer);
  console.log("stateActiveCategory:", stateActiveCategory);

  const items = useMemo(
    () => categoryList?.map((task) => task.id) ?? [],
    [categoryList],
  );
  const memoizedDataArray = React.useMemo(
    () =>
      categoryList?.map((category, idx) => ({
        customProps: {
          type: "category" as DraggableContextPropsDataCustomType,
          index: idx,
          customData: category,
        },
      })) ?? [],
    [categoryList],
  );
  const Draggables = useMemo(() => {
    console.log("App Draggables");

    if (!categoryList || categoryList.length === 0) {
      return [<div>Empty!</div>, []];
    }

    let cc: any[] = [];

    return categoryList.map((category, idx) => {
      cc.push({
        customProps: {
          type: "category",
          index: idx,
          customData: category,
        },
      });
      return (
        <DraggableContext<DraggableContextPropsDataCustomType, Task>
          key={category.id}
          id={category.id}
          data={
            memoizedDataArray[idx]
            // {
            //   customProps: {
            //     type: "category",
            //     index: idx,
            //     customData: category,
            //   },
            // }
          }
        >
          {({
            attributes,
            listeners,
            setNodeRef,
            setActivatorNodeRef,
            transform,
            transition,
            isDragging,
          }) => {
            const style = {
              transform: CSS.Transform.toString(transform),
              transition,
            };
            // console.log(CSS.Transform.toString(transform));
            // console.log(style);

            return (
              <Board
                // key={category.id}
                ref={setNodeRef}
                style={style}
                isDragging={isDragging}
                transform={style.transform}
                {...attributes}
              >
                <BoardHead
                  ref={setActivatorNodeRef}
                  category={category}
                  listeners={listeners}
                />
                <BoardBody category={category} />
              </Board>
            );
          }}
        </DraggableContext>
      );
    });
  }, [categoryList]);

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
          {/* 모바일 지원: 모든 draggable item이나 handle의 CSS에 `touch-action: none;`을 주거나 sensors에 PointerSensor 대신 MouseSensor와 TouchSensor 사용. */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            // onDragOver={() => console.log("Over")}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <Wrapper>
              <Boards>
                {!categoryList || categoryList.length === 0 ? (
                  <div>Empty!</div>
                ) : (
                  <>
                    <SortableContext
                      // items={categoryList}
                      items={items}
                      // strategy={rectSortingStrategy}
                    >
                      {Draggables}
                      {/* {categoryList.map((category, idx) => {
                        return (
                          <DraggableContext<
                            DraggableContextPropsDataCustomType,
                            Task
                          >
                            key={category.id}
                            id={category.id}
                            data={{
                              customProps: {
                                type: "category",
                                index: idx,
                                customData: category,
                              },
                            }}
                          >
                            {({
                              attributes,
                              listeners,
                              setNodeRef,
                              setActivatorNodeRef,
                              transform,
                              transition,
                              isDragging,
                            }) => {
                              const style = {
                                transform: CSS.Transform.toString(transform),
                                transition,
                              };
                              // console.log(CSS.Transform.toString(transform));
                              // console.log(style);

                              return (
                                <Board
                                  key={category.id}
                                  ref={setNodeRef}
                                  style={style}
                                  isDragging={isDragging}
                                  transform={style.transform}
                                  {...attributes}
                                >
                                  <BoardHead
                                    ref={setActivatorNodeRef}
                                    category={category}
                                    listeners={listeners}
                                  />
                                  <BoardBody category={category} />
                                </Board>
                              );
                            }}
                          </DraggableContext>
                        );
                      })} */}
                    </SortableContext>
                  </>
                )}
                {createPortal(
                  <DragOverlay adjustScale={false}>
                    {stateActiveCategory && (
                      <Board>
                        <BoardHead category={stateActiveCategory} />
                        <BoardBody category={stateActiveCategory} />
                      </Board>
                    )}
                  </DragOverlay>,
                  document.body,
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
