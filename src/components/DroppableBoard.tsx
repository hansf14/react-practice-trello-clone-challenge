import React from "react";
import { styled } from "styled-components";
import { Droppable } from "@hello-pangea/dnd";
import { Task } from "@/atoms";
import DraggableCard from "./DraggableCard";

const Title = styled.h2`
  margin-bottom: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
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

const DroppableArea = styled.div`
  flex-grow: 1;
`;

export interface DroppableBoardProps {
  id: string;
  tasks: Task[];
}

const DroppableBoard = React.memo(({ id, tasks }: DroppableBoardProps) => {
  return (
    <DroppableBoardBase>
      <Title>ABC</Title>
      <Droppable droppableId={id}>
        {(droppableProvided) => (
          <DroppableArea
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
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
});
DroppableBoard.displayName = "DroppableBoard";

export default DroppableBoard;
