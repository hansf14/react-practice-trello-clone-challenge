import React, { useCallback, useMemo, useRef } from "react";
import { SmartOmit } from "@/utils";
import { useSortable, UseSortableArguments } from "@dnd-kit/sortable";
import { useWhichPropsChanged } from "@/hooks/useWhichPropsChanged";

export type DraggableContextPropsData<T extends string, D> = {
  customProps?: {
    type?: T;
    index?: number;
    customData?: D;
    [x: string]: any;
  };
};

export const DraggableContext = React.memo(
  <T extends string, D>(
    props: SmartOmit<UseSortableArguments, "data"> & {
      data?: DraggableContextPropsData<T, D>;
    } & {
      children: (
        draggableProvided: ReturnType<typeof useSortable>,
      ) => React.ReactNode;
    },
  ) => {
    // console.log("[DraggableContext]");
    const { children, ...otherProps } = props;
    // const draggableProvided = useRef(useSortable(otherProps));
    const draggableProvided = useSortable(otherProps);
    // const draggableProvided = useSortable({
    //   ...otherProps,
    //   transition: {
    //     duration: 150, // milliseconds
    //     easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    //   },
    // });

    useWhichPropsChanged(props);

    // Memoize the `children` render function
    // const memoizedChildren = useCallback(
    //   () => children(draggableProvided),
    //   [children, draggableProvided],
    // );
    const memoizedChildren = useCallback(
      () => children(draggableProvided),
      [children, draggableProvided],
    );

    // Ensure children is a callable function
    if (typeof children !== "function") {
      throw new Error("The children prop must be a function.");
    }

    // return <>{children(draggableProvided)}</>;
    // return <>{children(draggableProvided)}</>;
    return <>{memoizedChildren()}</>;
  },
) as <T extends string, D>(
  props: SmartOmit<UseSortableArguments, "data"> & {
    data?: DraggableContextPropsData<T, D>;
    children: (
      draggableProvided: ReturnType<typeof useSortable>,
    ) => React.ReactNode;
  },
) => React.JSX.Element;
