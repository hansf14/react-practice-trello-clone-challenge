import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ExecutionProps, styled } from "styled-components";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { Category, nestedIndexerCategoryTaskAtom, Task } from "@/atoms";
import { Card } from "@/components/Card";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  checkHasScrollbar,
  generateUniqueRandomId,
  memoizeCallback,
} from "@/utils";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { CssScrollbar } from "@/css/scrollbar";
import { throttle } from "lodash-es";
import {
  ItemCustomDataAttributes,
  ItemListCustomDataAttributes,
} from "@/sortable";
const { TextArea } = Input;

const BoardMainBase = styled.div`
  contain: size;
  height: 100%;
  gap: 10px;
  display: flex;
  flex-direction: column;
`;

const BoardMainContentContainer = styled.div`
  overflow: hidden;
  height: 100%;
  /* margin-top: 10px; */
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

const BoardMainContent = styled.div`
  ${CssScrollbar}

  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toolbar = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
`;

const TaskAdder = styled.form`
  flex-grow: 1;
`;

const TaskAdderInput = styled(TextArea)`
  && {
    height: 56px;
    border: none;
    border-radius: 0;
    font-weight: bold;
    font-size: 14px;

    resize: none;
    transition: none;
  }
`;

const ToolbarButtons = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ScrollButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ScrollDownButton = styled(ArrowDownCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const ScrollUpButton = styled(ArrowUpCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const TaskButtons = styled.div`
  display: flex;
  justify-content: center;
`;

const TaskAddButton = styled(PlusCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

export interface FormData {
  taskText: string;
}

export const cardsContainerAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "cardsContainerAtom",
  default: {},
});

export type BoardMainProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardMain = React.memo(
  React.forwardRef<HTMLDivElement, BoardMainProps>((props, ref) => {
    const { category } = props;

    const [stateIndexerCategoryTask, setStateIndexerCategoryTask] =
      useRecoilState(nestedIndexerCategoryTaskAtom);

    const setStateCardsContainer = useSetRecoilState(cardsContainerAtom);
    const refCardsContainer = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refCardsContainer.current) {
        setStateCardsContainer((cur) => ({
          ...cur,
          [category.id]: refCardsContainer.current,
        }));
      }
    }, [category.id, setStateCardsContainer]);

    const taskList = useMemo<Task[]>(
      () =>
        stateIndexerCategoryTask.getChildListFromParentId__MutableChild({
          parentId: category.id,
        }) ?? [],
      [category.id, stateIndexerCategoryTask],
    );

    const {
      register,
      handleSubmit,
      // setValue,
      reset, // setValue("taskText", "")
      formState: { errors },
    } = useForm<FormData>();

    const onValid = useCallback<SubmitHandler<FormData>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scrollDownHandler = useCallback<React.MouseEventHandler>((event) => {
      refCardsContainer.current?.scrollBy({
        top: 50,
        behavior: "smooth",
      });
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scrollUpHandler = useCallback<React.MouseEventHandler>((event) => {
      refCardsContainer.current?.scrollBy({
        top: -50,
        behavior: "smooth",
      });
    }, []);

    const idCheckHasVerticalScrollbar = useMemoizeCallbackId();
    const checkHasVerticalScrollbar = useCallback(
      ({ element }: { element: HTMLElement }) =>
        memoizeCallback({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fn: throttle(
            ((entries, observer) => {
              const hasVerticalScrollbar = checkHasScrollbar({
                element,
                condition: "vertical",
              });
              if (hasVerticalScrollbar) {
                element.style.setProperty("padding-right", "10px");
              } else {
                element.style.removeProperty("padding-right");
              }
            }) satisfies ResizeObserverCallback,
            17,
          ),
          id: idCheckHasVerticalScrollbar,
          deps: [element, idCheckHasVerticalScrollbar],
        }),
      [idCheckHasVerticalScrollbar],
    );

    // const idCheckHasVerticalScrollbar = useMemoizeCallbackId();
    // const checkHasVerticalScrollbar = useCallback<ResizeObserverCallback>(
    //   (entries, observer) => {
    //     const element = entries[0].target as HTMLElement;
    //     const hasVerticalScrollbar = checkHasScrollbar({
    //       element,
    //       condition: "vertical",
    //     });
    //     if (hasVerticalScrollbar) {
    //       element.style.setProperty("padding-right", "10px");
    //     } else {
    //       element.style.removeProperty("padding-right");
    //     }
    //   },
    //   [],
    // );

    useEffect(() => {
      let resizeObserver: ResizeObserver | null = null;
      if (refCardsContainer.current) {
        // resizeObserver = new ResizeObserver(checkHasVerticalScrollbar);
        resizeObserver = new ResizeObserver(
          checkHasVerticalScrollbar({ element: refCardsContainer.current }),
        );
        resizeObserver.observe(refCardsContainer.current, {
          box: "border-box",
        });
      }
      return () => {
        resizeObserver?.disconnect();
      };
    }, [checkHasVerticalScrollbar]);

    const customDataAttributes: ItemListCustomDataAttributes = {
      "data-item-list-type": "tasks",
      "data-item-list-id": category.id,
    };

    return (
      <BoardMainBase ref={ref}>
        <BoardMainContentContainer>
          <BoardMainContent ref={refCardsContainer} {...customDataAttributes}>
            {!taskList || taskList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              taskList.map((task) => {
                const customDataAttributes: ItemCustomDataAttributes = {
                  "data-item-type": "task",
                  "data-item-id": task.id,
                };
                return (
                  <Card
                    key={task.id}
                    task={task}
                    {...props}
                    {...customDataAttributes}
                  />
                );
              })
            )}
          </BoardMainContent>
        </BoardMainContentContainer>
        <Toolbar>
          <TaskAdder onSubmit={handleSubmit(onValid)}>
            <TaskAdderInput
              rows={2}
              placeholder={`Add a task on ${category.text}`}
              {...register("taskText", {
                required: true,
              })}
            />
          </TaskAdder>
          <ToolbarButtons>
            <ScrollButtons>
              <ScrollDownButton onClick={scrollDownHandler} />
              <ScrollUpButton onClick={scrollUpHandler} />
            </ScrollButtons>
            <TaskButtons>
              <TaskAddButton />
            </TaskButtons>
          </ToolbarButtons>
        </Toolbar>
      </BoardMainBase>
    );
  }),
);
BoardMain.displayName = "BoardMain";
