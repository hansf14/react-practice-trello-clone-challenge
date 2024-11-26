import React from "react";
import { styled } from "styled-components";
import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/atoms";

const Card = styled.div`
	margin-bottom: 5px;
	padding: 10px;
	background-color: ${({ theme }) => theme.cardBgColor};
	border-radius: 5px;
`;

export interface DraggableCardProps {
	task: Task;
	index: number;
	// isDragDisabled?: boolean;
	draggableId: string;
}

const DraggableCard = React.memo(({ task, index }: DraggableCardProps) => {
	// console.log(`index: [${index}] is rendered.`);
	const { id, text } = task;

	return (
		<Draggable
			// key={id}
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
