import { useSortable, UseSortableArguments } from "@dnd-kit/sortable";
import React from "react";

export const DraggableContext = (
  props: UseSortableArguments & {
    children: (
      draggableProvided: ReturnType<typeof useSortable>,
    ) => React.ReactNode;
  },
) => {
  const { children, ...otherProps } = props;
  const draggableProvided = useSortable(otherProps);

  // Ensure children is a callable function
  if (typeof children !== "function") {
    throw new Error("The children prop must be a function.");
  }

  return <>{children(draggableProvided)}</>;
};
