import { ToDoData } from "@/atoms";
import { Draggable } from "@hello-pangea/dnd";
import React from "react";
import { styled } from "styled-components";

const Card = styled.div`
	margin-bottom: 5px;
	padding: 10px;
	background-color: ${({ theme }) => theme.cardBgColor};
	border-radius: 5px;
`;

export interface DraggableCardProps {
	toDo: ToDoData;
	index: number;
	// isDragDisabled?: boolean;
}

const DraggableCard = React.memo(({ toDo, index }: DraggableCardProps) => {
	// console.log(`index: [${index}] is rendered.`);
	const { id, text } = toDo;

	return (
		<Draggable
			key={id}
			draggableId={id}
			index={index}
			// isDragDisabled={isDragDisabled}
		>
			{(draggableProvided) => (
				<Card
					ref={draggableProvided.innerRef}
					{...draggableProvided.dragHandleProps}
					{...draggableProvided.draggableProps}
				>
					{text}
				</Card>
			)}
		</Draggable>
	);
});
DraggableCard.displayName = "DraggableCard";

export default DraggableCard;
