import React, {
  FormEventHandler,
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { atom, useRecoilState } from "recoil";
import { darkTheme } from "./theme";
import { arrayMoveElement, generateUniqueRandomId } from "@/utils";
import { FormSubmitHandler, SubmitHandler, useForm } from "react-hook-form";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import { createPortal } from "react-dom";
import { Input } from "antd";
import { useWhichPropsChanged } from "@/hooks/useWhichPropsChanged";
import {
  useDraggable,
  UseDraggableSetDraggableHandleRef,
  UseDraggableItemSpec,
  UseDraggableParams,
  UseDraggableOnDragStartCb,
  UseDraggableOnDragEndCb,
  useDroppable,
  UseDroppableItemSpec,
  useDnd,
  UseDraggableListeners,
} from "@/hooks/useDnd";
import { CursorFollower } from "@/components/CursorFollower";
import { NestedIndexer } from "@/indexer";
import dragula from "dragula";
import autoScroll from "dom-autoscroller";
import Sortable, { AutoScroll, MultiDrag, Swap } from "sortablejs";

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
  html {
    height: 100%;
    overflow: auto;
  }
  body {
    height: 100%;
    min-height: 100%;
    overflow: auto;
    font-family: "Source Sans 3", sans-serif;
    font-optical-sizing: auto;
    font-weight: 500;
    font-style: normal;
  }
  #root {
    height: 100%;
  }
  a {
    text-decoration: none;
    color: inherit;
  }

  /* // .gu-mirror{position:fixed!important;margin:0!important;z-index:9999!important;opacity:.8}.gu-hide{display:none!important}.gu-unselectable{-webkit-user-select:none!important;-moz-user-select:none!important;-ms-user-select:none!important;user-select:none!important}.gu-transit{opacity:.2}
  .gu-transit {
    && {
      opacity: 0.7;
      border: 1px solid orange;
    }
  }

  .gu-mirror {
    position: fixed;
  }

  .gu-hide{
    display:none !important
  } */

  /* .sortable-ghost {
    -webkit-user-select:none !important;
    -moz-user-select:none!important;
    -ms-user-select:none!important;
    user-select:none!important
  } */

  // DragOverlay + Ghost
  .sortable-chosen {
    background: blue;
  }

  // DragOverlay
  .sortable-drag {
    background: green;
  }

  // Ghost
  .sortable-ghost {
    background: red;
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
  padding: 10px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Dashboard = styled.div`
  width: max-content;
  display: flex;
  justify-content: stretch;
  gap: 10px;
`;

const Board = styled.div<{ isDragging?: boolean; transform?: string }>`
  touch-action: none;
  flex-shrink: 0;
  width: min(100%, 300px);
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
`;

const DragGhost = styled.div`
  display: flex;
  align-items: stretch;
`;

export type BoardHeadProps = {
  category: Category;
  dragHandle?: {
    setDragHandleRef: UseDraggableSetDraggableHandleRef;
    listeners: UseDraggableListeners;
  };
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

const boardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "categoryDragHandlesAtom",
  default: {},
});

const cardsAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "cardsAtom",
  default: {},
});

const cardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "taskDragHandlesAtom",
  default: {},
});

export const BoardHead = React.memo(
  React.forwardRef<HTMLDivElement, BoardHeadProps>(
    ({ category, dragHandle }, ref) => {
      const [stateIndexerCategoryTask, setStateIndexerCategoryTask] =
        useRecoilState(indexerCategoryTaskAtom);
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

          setStateIndexerCategoryTask((curIndexer) => {
            const newTask = {
              id: generateUniqueRandomId(),
              text: data.taskText,
            } satisfies Task;

            const newIndexer = new NestedIndexer(curIndexer);
            newIndexer.createChild({
              parentId: category.id,
              child: newTask,
              shouldAppend: false,
            });
            return newIndexer;
          });

          reset();
        },
        [setStateIndexerCategoryTask, category.id, reset],
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
          setStateIndexerCategoryTask((curIndexer) => {
            const newIndexer = new NestedIndexer(curIndexer);
            newIndexer.updateParent({
              parentId: category.id,
              parent: {
                id: category.id,
                text: event.target.value,
              },
            });
            return newIndexer;
          });
        },
        [setStateIndexerCategoryTask, category.id],
      );

      const [stateBoardDragHandles, setStateBoardDragHandles] =
        useRecoilState(boardDragHandlesAtom);
      const refDragHandle = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        if (refDragHandle.current) {
          setStateBoardDragHandles((cur) => ({
            ...cur,
            [category.id]: refDragHandle.current,
          }));
        }
      }, [category.id, setStateBoardDragHandles]);

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
          <div ref={refDragHandle}>
            DOH!<br></br>DOH!
          </div>
        </div>
      );
    },
  ),
);
BoardHead.displayName = "BoardHead";

export type BoardBaseProps = {} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardBase = React.memo(
  React.forwardRef<HTMLDivElement, BoardBaseProps>(
    (props: BoardBaseProps, ref) => {
      const { ...otherProps } = props;
      return <Board ref={ref} {...otherProps}></Board>;
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

export const Card = React.memo(
  React.forwardRef<HTMLDivElement, { task: Task }>(
    ({ task }: { task: Task }, ref) => {
      console.log("[CardBase]");

      const [stateCardDragHandles, setStateCardDragHandles] =
        useRecoilState(cardDragHandlesAtom);
      const refDragHandle = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        if (refDragHandle.current) {
          setStateCardDragHandles((cur) => ({
            ...cur,
            [task.id]: refDragHandle.current,
          }));
        }
      }, [task.id, setStateCardDragHandles]);

      const [stateCards, setStateCards] = useRecoilState(cardsAtom);
      const refCard = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        if (refCard.current) {
          setStateCards((cur) => ({
            ...cur,
            [task.id]: refCard.current,
          }));
        }
      }, [task.id, setStateCards]);

      return (
        <div
          ref={(el) => {
            if (el) {
              refCard.current = el;
              if (ref) {
                (ref as MutableRefObject<HTMLDivElement>).current = el;
              }
            }
          }}
        >
          {task.text}
          <div ref={refDragHandle}>DOH!</div>
        </div>
      );
    },
  ),
);

const BoardBodyBase = styled.div``;

export type BoardBodyProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardBody = React.memo(
  React.forwardRef<HTMLDivElement, BoardBodyProps>((props, ref) => {
    const { category } = props;
    const [stateIndexer, setStateIndexer] = useRecoilState(
      indexerCategoryTaskAtom,
    );

    const taskList = useMemo<Task[]>(
      () =>
        stateIndexer.getChildListFromParentId__MutableChild({
          parentId: category.id,
        }) ?? [],
      [category.id, stateIndexer],
    );

    return (
      <BoardBodyBase ref={ref}>
        {!taskList || taskList.length === 0 ? (
          <div>Empty!</div>
        ) : (
          taskList.map((task, idx) => {
            return <Card key={task.id} task={task} {...props} />;
          })
        )}
      </BoardBodyBase>
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

  const draggableCategories = useMemo<UseDraggableItemSpec<Category>[]>(
    () =>
      categoryList.map((category, idx) => ({
        type: "category",
        index: idx,
        data: category,
      })),
    [categoryList],
  );

  const droppableCategories = useMemo<UseDroppableItemSpec<Category>[]>(
    () =>
      categoryList.map((category, idx) => ({
        acceptableTypes: ["category"],
        index: idx,
        data: category,
      })),
    [categoryList],
  );

  const [stateActiveCategory, setStateActiveCategory] =
    useState<UseDraggableItemSpec<Category> | null>(null);
  // const [stateActiveTask, setStateActiveTask] = useState<Task | null>(null);

  const onDragStartCb = useCallback<UseDraggableOnDragStartCb<Category>>(
    ({ active }) => {
      // console.log("active:", active);
      setStateActiveCategory(active);
    },
    [],
  );

  const onDragEndCb = useCallback<UseDraggableOnDragEndCb<Category>>(() => {
    setStateActiveCategory(null);
  }, []);

  // const {
  //   draggableProvided,
  //   setDraggableRef,
  //   setDraggableHandleRef,
  //   setDragGhostRef,
  //   isDragging,
  // } = useDraggable({
  //   items: draggableCategories,
  //   onDragStartCb,
  //   onDragEndCb,
  // });
  // const { setDroppableRef, droppableProvided } = useDroppable({
  //   items: droppableCategories,
  // });

  // const {
  //   setDraggableAndDroppableRef,
  //   retUseDraggable: {
  //     // Draggables,
  //     listeners: draggableListeners,
  //     setDraggableRef,
  //     setDraggableHandleRef,
  //     setDragGhostRef,
  //     isDragging,
  //   },
  //   retUseDroppable: { droppableProvided },
  // } = useDnd({
  //   useDraggableParams: {
  //     items: draggableCategories,
  //     onDragStartCb,
  //     onDragEndCb,
  //   },
  //   useDroppableParams: {
  //     items: droppableCategories,
  //   },
  // });

  const refDashboard = useRef<HTMLDivElement | null>(null);
  const refBoards = useRef<HTMLDivElement[]>([]);
  const refBoardBodies = useRef<HTMLDivElement[]>([]);
  const [stateBoardDragHandles, setStateBoardDragHandles] =
    useRecoilState(boardDragHandlesAtom);
  const [stateCards, setStateCards] = useRecoilState(cardsAtom);
  const [stateCardDragHandles, setStateCardDragHandles] =
    useRecoilState(cardDragHandlesAtom);

  // console.log(refDashboard.current);
  // console.log(refBoards.current);
  // console.log(stateBoardDragHandles);
  console.log(stateCardDragHandles);

  const [stateIsDragging, setStateIsDragging] = useState(false);

  useEffect(() => {
    const sortables: Sortable[] = [];
    if (refDashboard.current) {
      // https://github.com/SortableJS/Sortable
      const sortable = Sortable.create(refDashboard.current, {
        group: "categories",
        animation: 150,
        scroll: true,
        // https://github.com/SortableJS/Sortable/blob/master/plugins/AutoScroll/README.md
        // bubbleScroll: true,
        // scrollSensitivity: 500, // px, how near the mouse must be to an edge to start scrolling.
        // scrollSpeed: 10, // px, speed of the scrolling
      });
      sortables.push(sortable);
    }

    refBoardBodies.current.forEach((boardBody) => {
      const sortable = Sortable.create(boardBody, {
        group: "tasks",
        animation: 150,
        scroll: true,
        fallbackOnBody: true, // Fore correct positioning of the drag ghost element
        ghostClass: "doh",
        // onStart: (event) => {
        //   // setStateIsDragging(true);
        //   event.target.classList.remove("sortable-ghost");
        // },
        // onUpdate: (event) => {
        //   // setStateIsDragging(true);
        //   event.target.classList.remove("sortable-ghost");
        // },
        // onChange:  (event) => {
        //   // setStateIsDragging(true);
        //   event.target.classList.remove("sortable-ghost");
        // },
        onEnd: (event) => {
          console.log("task moved");
          console.log(event);
        },
      });
      sortables.push(sortable);
    });

    // https://www.npmjs.com/package/dom-autoscroller
    const scroll = autoScroll([document.body], {
      margin: 50,
      maxSpeed: 5,
      scrollWhenOutside: true,
      autoScroll: function () {
        //Only scroll when the pointer is down, and there is a child being dragged.
        return this.down;
        // return this.down && stateIsDragging;
      },
    });

    return () => {
      sortables.forEach((sortable) => sortable.destroy());
    };
  }, [stateIsDragging]);

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
          <Dashboard ref={refDashboard}>
            {categoryList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              <>
                {categoryList.map((category, idx) => {
                  return (
                    <Board
                      key={category.id}
                      ref={(el) => {
                        if (el) {
                          refBoards.current[idx] = el;
                        }
                      }}
                    >
                      <BoardHead category={category} />
                      <BoardBody
                        ref={(el) => {
                          if (el) {
                            refBoardBodies.current[idx] = el;
                          }
                        }}
                        category={category}
                      />
                    </Board>
                  );
                })}
              </>
            )}
          </Dashboard>
          {/* {!!stateActiveCategory &&
            createPortal(
              <DragGhost ref={setDragGhostRef}>
                <Board isDragging={isDragging}>
                  <BoardHead category={stateActiveCategory.data} />
                  <BoardBody category={stateActiveCategory.data} />
                </Board>
              </DragGhost>,
              document.body,
            )} */}
          {/* <div
            ref={setDragGhostRef}
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
          </div> */}
        </Main>
        <ReactQueryDevtools initialIsOpen={true} />
      </ThemeProvider>
    </>
  );
}

export default App;
