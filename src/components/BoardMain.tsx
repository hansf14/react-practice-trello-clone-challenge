import React, { useCallback, useMemo, useRef } from "react";
import { ExecutionProps, styled } from "styled-components";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import { Card } from "@/components/Card";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import { generateUniqueRandomId } from "@/utils";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
const { TextArea } = Input;

const BoardMainBase = styled.div`
  transform-style: preserve-3d;
  height: inherit;
  flex-grow: 1;

  display: flex;
  flex-direction: column;
`;

const BoardMainContentContainer = styled.div`
  overflow: hidden;
  height: 100%;
  margin-top: 10px;
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

const BoardMainContent = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toolbar = styled.div`
  transform: translateZ(10px);
  width: 100%;
  display: flex;
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
`;

const ScrollUpButton = styled(ArrowUpCircleFill)`
  width: 25px;
  height: 25px;
`;

const TaskButtons = styled.div`
  display: flex;
  justify-content: center;
`;

const TaskAddButton = styled(PlusCircleFill)`
  width: 25px;
  height: 25px;
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
      useRecoilState(indexerCategoryTaskAtom);

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

    return (
      <BoardMainBase ref={ref}>
        <BoardMainContentContainer>
          <BoardMainContent ref={refCardsContainer}>
            {!taskList || taskList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              taskList.map((task) => {
                return <Card key={task.id} task={task} {...props} />;
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
