import React, { useCallback } from "react";
import { styled } from "styled-components";
import { Droppable, DroppableStateSnapshot } from "@hello-pangea/dnd";
import { categorySelectorFamily, Task } from "@/atoms";
import { useForm } from "react-hook-form";
import DraggableCard from "./DraggableCard";
import { useRecoilState } from "recoil";
import { generateUniqueRandomId } from "@/utils";

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

const DroppableBoardBase = styled.div`
  max-width: 300px;
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.boardBgColor};
  border-radius: 5px;
`;

const DroppableArea = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["isDraggingOver", "draggingFromThisWith"].includes(prop),
})<Partial<DroppableStateSnapshot>>`
  padding: 10px;
  flex-grow: 1;
  background-color: ${({ isDraggingOver, draggingFromThisWith }) =>
    !Boolean(isDraggingOver)
      ? "green"
      : Boolean(draggingFromThisWith)
        ? "yellow"
        : "red"};
  transition: background-color 0.3s ease-in-out;
`;

export interface DroppableBoardProps {
  id: string;
  tasks: Task[];
  label: string;
}

export interface FormData {
  taskText: string;
}

const DroppableBoard = React.memo(
  ({ id, tasks, label }: DroppableBoardProps) => {
    const [stateCategory, setStateCategory] = useRecoilState(
      categorySelectorFamily(id),
    );

    const {
      register,
      handleSubmit,
      // setValue,
      reset, // setValue("taskText", "")
      formState: { errors },
    } = useForm<FormData>();

    const onValid = useCallback(
      (data: FormData) => {
        // console.log(data);

        setStateCategory((cur) => {
          if (!cur) {
            return;
          }
          const newTask = {
            id: generateUniqueRandomId(),
            text: data.taskText,
            categoryKey: id,
          } satisfies Task;

          const curClone = { ...cur };
          curClone.taskList = [...curClone.taskList, newTask];
          return curClone;
        });

        reset();
      },
      [id, setStateCategory, reset],
    );

    return (
      <DroppableBoardBase>
        <Title>{label}</Title>
        <Form onSubmit={handleSubmit(onValid)}>
          <input
            type="text"
            placeholder={`Add a task on ${label}`}
            {...register("taskText", { required: true })}
          />
        </Form>
        <Droppable droppableId={id}>
          {(droppableProvided, droppableStateSnapshot) => (
            <DroppableArea
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              isDraggingOver={droppableStateSnapshot.isDraggingOver}
              draggingFromThisWith={droppableStateSnapshot.draggingFromThisWith}
            >
              {tasks.map((task, idx) => {
                return (
                  <DraggableCard
                    key={task.id}
                    id={task.id}
                    index={idx}
                    task={task}
                  />
                );
              })}
              {droppableProvided.placeholder}
            </DroppableArea>
          )}
        </Droppable>
      </DroppableBoardBase>
    );
  },
);
DroppableBoard.displayName = "DroppableBoard";

export default DroppableBoard;
