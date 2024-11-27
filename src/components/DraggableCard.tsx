import React from "react";
import { styled } from "styled-components";
import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/atoms";

const DraggableCardBase = styled.div`
  margin-bottom: 5px;
  padding: 10px;
  background-color: ${({ theme }) => theme.cardBgColor};
  border-radius: 5px;
`;

export interface DraggableCardProps {
  id: string;
  index: number;
  task: Task;
}

const DraggableCard = React.memo(({ id, index, task }: DraggableCardProps) => {
  // console.log(`index: [${index}] is rendered.`);
	console.log(task,"is rendered.");
	// console.log(task);
  const { text } = task;

  return (
    <Draggable draggableId={id} index={index}>
      {(draggableProvided) => (
        <DraggableCardBase
          ref={draggableProvided.innerRef}
          {...draggableProvided.dragHandleProps}
          {...draggableProvided.draggableProps}
        >
          {text}
        </DraggableCardBase>
      )}
    </Draggable>
  );
});
DraggableCard.displayName = "DraggableCard";

export default DraggableCard;
