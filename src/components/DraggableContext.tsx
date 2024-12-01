import { SmartOmit } from "@/utils";
import { useSortable, UseSortableArguments } from "@dnd-kit/sortable";
import React from "react";

export type DraggableContextPropsData<T extends string, D> = {
  customProps?: {
    type?: T;
    index?: number;
    customData?: D;
    [x: string]: any;
  };
};

export const DraggableContext = <T extends string, D>(
  props: SmartOmit<UseSortableArguments, "data"> & {
    data?: DraggableContextPropsData<T, D>;
  } & {
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
