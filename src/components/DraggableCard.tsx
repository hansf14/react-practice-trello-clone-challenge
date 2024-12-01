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

// const Task = styled.div<{ isDragging: boolean }>`
//   background: ${({ isDragging }) => (isDragging ? "#e0e0e0" : "white")};
//   border: 1px solid #ddd;
//   padding: 12px;
//   margin-bottom: 8px;
//   border-radius: 4px;
//   box-shadow: ${({ isDragging }) =>
//     isDragging ? "0px 4px 6px rgba(0, 0, 0, 0.1)" : "none"};
//   position: ${({ isDragging }) => (isDragging ? "absolute" : "relative")};
//   z-index: ${({ isDragging }) => (isDragging ? 1000 : 1)};
//   cursor: grab;
// `;

export type DraggableCardProps = {
  // id: string;
  // index: number;
  // children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const DraggableCard = React.memo(
  React.forwardRef<HTMLDivElement, DraggableCardProps>((props, ref) => {
    // console.log(`index: [${index}] is rendered.`);
    console.log("rendered.");
    // console.log(children);

    React.useEffect(() => {
      // console.log(props.children);
      console.log('props.children changed');
  }, [props.children]);

    return <DraggableCardBase ref={ref} {...props} />;
  }),
);
DraggableCard.displayName = "DraggableCard";
