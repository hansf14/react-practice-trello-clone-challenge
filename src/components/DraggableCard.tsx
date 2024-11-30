import React from "react";
import { css, ExecutionProps, styled } from "styled-components";
// import { Draggable, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DraggableCardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})`
  padding: 10px;
  background-color: ${({
    theme,
    // theme, isDragging
  }) =>
    // Boolean(isDragging) ? "tomato" :
    theme.cardBgColor};
  border-radius: 5px;
  ${(
    {
      // isDragging
    },
  ) =>
    // isDragging
    //   ? css`
    //       box-shadow: 5px 5px 3px 3px rgba(0, 0, 0, 0.4);
    //     `
    //   :
    ""}
`;

export type DraggableCardProps = {
  // id: string;
  // index: number;
  // children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const DraggableCard = React.memo(
  React.forwardRef<HTMLDivElement, DraggableCardProps>((props, ref) => {
    // console.log(`index: [${index}] is rendered.`);
    // console.log(children, "is rendered.");
    // console.log(children);

    // const { attributes, listeners, setNodeRef, transform, transition } =
    //   useSortable({ id });

    // const style = {
    //   transform: CSS.Transform.toString(transform),
    //   transition,
    // };

    return (
      <DraggableCardBase
        ref={ref}
        // style={style}
        // {...attributes} // -> to handle
        // {...listeners} // -> to handle
        {...props}
      ></DraggableCardBase>
      // <Draggable draggableId={id} index={index}>
      //   {
      //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //     (draggableProvided, draggableStateSnapshot, draggableRubic) => (
      //       <DraggableCardBase
      //         ref={draggableProvided.innerRef}
      //         {...draggableProvided.dragHandleProps}
      //         {...draggableProvided.draggableProps}
      //         isDragging={draggableStateSnapshot.isDragging}
      //       >
      //         {children}
      //       </DraggableCardBase>
      //     )
      //   }
      // </Draggable>
    );
  }),
);
DraggableCard.displayName = "DraggableCard";
