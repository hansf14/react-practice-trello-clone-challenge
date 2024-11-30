import { Droppable } from "@hello-pangea/dnd";
import { Content } from "antd/es/layout/layout";
import React from "react";

// const DroppableContainerBase = styled.div.withConfig({
//   shouldForwardProp: (prop) =>
//     !["isDraggingOver", "draggingFromThisWith"].includes(prop),
// })<Partial<DroppableStateSnapshot>>`
//   padding: 10px;
//   flex-grow: 1;
//   background-color: ${({ isDraggingOver, draggingFromThisWith }) =>
//     !Boolean(isDraggingOver)
//       ? "green"
//       : Boolean(draggingFromThisWith)
//         ? "yellow"
//         : "red"};
//   transition: background-color 0.3s ease-in-out;
// `;

export interface DroppableContainerProps {
  id: string;
}

export const DroppableContainer = React.memo(
  ({ id }: DroppableContainerProps) => {
    return null;
    // return (
    //   <Droppable droppableId={id}>
    //     {(droppableProvided, droppableStateSnapshot) => (
    //       <DroppableContainerBase
    //         ref={droppableProvided.innerRef}
    //         {...droppableProvided.droppableProps}
    //       >
    //         {}
    //         {droppableProvided.placeholder}
    //       </DroppableContainerBase>
    //     )}
    //   </Droppable>
    // );
  },
);
DroppableContainer.displayName = "DroppableContainer";
