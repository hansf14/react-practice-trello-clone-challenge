import React, { useMemo } from "react";
import { styled } from "styled-components";
import { Droppable } from "@hello-pangea/dnd";
import { selectorOrderedTasksOfType, Task, Tasks, TasksId } from "@/atoms";
import DraggableCard from "./DraggableCard";
import { useRecoilValue } from "recoil";

const Title = styled.h2`
	text-align: center;
	font-weight: 600;
	margin-bottom: 10px;
	font-size: 18px;
`;

const Board = styled.div`
  max-width: 300px;
	padding: 10px 10px 20px;
	background-color: ${({ theme }) => theme.boardBgColor};
	border-radius: 5px;
	min-height: 300px;
`;

export interface DroppableBoardProps {
	id: TasksId;
	tasks: Task[];
}

const DroppableBoard = React.memo(({ id, tasks }: DroppableBoardProps) => {
	// const stateOrderedListToDos = useRecoilValue(() => selectorOrderedListTasks);

	return (
		<Board>
			<Title>ABC</Title>
			<Droppable droppableId={id}>
				{(droppableProvided) => (
					<div
						ref={droppableProvided.innerRef}
						{...droppableProvided.droppableProps}
					>
						{tasks.map((task, idx) => {
							const toDoMemoized = useMemo<Task>(
								() => task,
								[...Object.values(task)]
							);
							return (
								<DraggableCard
									key={toDoMemoized.id}
									draggableId={toDoMemoized.id}
									task={toDoMemoized}
									index={idx}
									// isDragDisabled={stateIsDragging}
								/>
							);
						})}
						{droppableProvided.placeholder}
					</div>
				)}
			</Droppable>
		</Board>
	);
});
DroppableBoard.displayName = "DroppableBoard";

export default DroppableBoard;
