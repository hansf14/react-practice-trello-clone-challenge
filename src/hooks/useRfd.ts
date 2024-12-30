import { useCallback } from "react";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { DraggableProvided, DroppableProvided } from "@hello-pangea/dnd";
import { memoizeCallback } from "@/utils";

export const useRfd = () => {
  const idCbRefForDraggable = useMemoizeCallbackId();
  const cbRefForDraggable = useCallback(
    ({
      refDraggable,
      draggableProvidedInnerRef,
    }: {
      refDraggable: React.MutableRefObject<any>;
      draggableProvidedInnerRef: DraggableProvided["innerRef"];
    }) =>
      memoizeCallback({
        id: idCbRefForDraggable,
        fn: (el: HTMLDivElement | null) => {
          refDraggable.current = el;
          draggableProvidedInnerRef(el);
        },
        deps: [draggableProvidedInnerRef, idCbRefForDraggable],
      }),
    [idCbRefForDraggable],
  );

  const idCbRefForDroppable = useMemoizeCallbackId();
  const cbRefForDroppable = useCallback(
    ({
      refDroppable,
      droppableProvidedInnerRef,
    }: {
      refDroppable: React.MutableRefObject<any>;
      droppableProvidedInnerRef: DroppableProvided["innerRef"];
    }) =>
      memoizeCallback({
        id: idCbRefForDroppable,
        fn: (el: HTMLDivElement | null) => {
          refDroppable.current = el;
          droppableProvidedInnerRef(el);
        },
        deps: [droppableProvidedInnerRef, idCbRefForDroppable],
      }),
    [idCbRefForDroppable],
  );

  // Fixes the blur bug of RFD (@hello-pangea/dnd) that on draggable handle doesn't cause firing other element's blur event.
  const fixRfdBlurBugOnDragHandle = useCallback(() => {
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement) {
      focusedElement.blur();
    }
  }, []);

  return {
    cbRefForDraggable,
    cbRefForDroppable,
    fixRfdBlurBugOnDragHandle,
  };
};
