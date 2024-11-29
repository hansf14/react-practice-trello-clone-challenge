import React from "react";
import { css, styled } from "styled-components";
import { Draggable, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Task } from "@/atoms";

const DraggableCardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<Partial<DraggableStateSnapshot>>`
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  padding: 10px;
  background-color: ${({ theme, isDragging }) =>
    Boolean(isDragging) ? "tomato" : theme.cardBgColor};
  border-radius: 5px;
  ${({ isDragging }) =>
    isDragging
      ? css`
          box-shadow: 5px 5px 3px 3px rgba(0, 0, 0, 0.4);
        `
      : ""}
`;

export interface DraggableCardProps {
  id: string;
  index: number;
  task: Task;
}

const DraggableCard = React.memo(({ id, index, task }: DraggableCardProps) => {
  // console.log(`index: [${index}] is rendered.`);
  console.log(task, "is rendered.");
  // console.log(task);
  const { text } = task;

  return (
    <Draggable draggableId={id} index={index}>
      {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (draggableProvided, draggableStateSnapshot, draggableRubic) => (
          <DraggableCardBase
            ref={draggableProvided.innerRef}
            {...draggableProvided.dragHandleProps}
            {...draggableProvided.draggableProps}
            isDragging={draggableStateSnapshot.isDragging}
          >
            {text}
          </DraggableCardBase>
        )
      }
    </Draggable>
  );
});
DraggableCard.displayName = "DraggableCard";

export default DraggableCard;
