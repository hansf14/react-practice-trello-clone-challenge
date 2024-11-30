import React from "react";
import { styled } from "styled-components";
import { Droppable, DroppableStateSnapshot } from "@hello-pangea/dnd";

const Title = styled.h2`
  margin: 10px 0 15px;
  text-align: center;
  font-weight: bold;
  font-size: 22px;
`;

const DraggableAndDroppableBoardBase = styled.div`
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

export interface DraggableAndDroppableBoardProps {
  id: string;
  label: string;
  slotHeader?: React.ReactNode;
  slotBody?: React.ReactNode;
}

export const DraggableAndDroppableBoard = React.memo(
  (props: DraggableAndDroppableBoardProps) => {
    const { id, label, slotHeader, slotBody } = props;

    return (
      <DraggableAndDroppableBoardBase>
        <Title>{label}</Title>
        {slotHeader}
        <Droppable droppableId={id}>
          {(droppableProvided, droppableStateSnapshot) => (
            <DroppableArea
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              isDraggingOver={droppableStateSnapshot.isDraggingOver}
              draggingFromThisWith={droppableStateSnapshot.draggingFromThisWith}
            >
              {slotBody}
              {droppableProvided.placeholder}
            </DroppableArea>
          )}
        </Droppable>
      </DraggableAndDroppableBoardBase>
    );
  },
);
DraggableAndDroppableBoard.displayName = "DraggableAndDroppableBoard";
