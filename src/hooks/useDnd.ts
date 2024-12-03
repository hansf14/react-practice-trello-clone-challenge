import { useBeforeRender } from "@/hooks/useBeforeRender";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

export interface UseDndParams<T> {
  items: T[];
}

export interface UseDndConfig {
  effectAllowed: DataTransfer["effectAllowed"];
  dropEffect: DataTransfer["dropEffect"];
}

export interface UseDndDraggable {
  element: HTMLElement | null;
  elementHandle: HTMLElement | null;
}

export type UseDndSetDraggableRef = (node: HTMLElement | null) => void;

export type UseDndSetDraggableHandleRef = (node: HTMLElement | null) => void;

export const useDnd = <T>(props: UseDndParams<T>) => {
  const [stateIsDraggedOver, setStateIsDraggedOver] = useState<boolean>(false);
  const [stateIsDragging, setStateIsDragging] = useState<boolean>(false);

  const refDraggables = useRef<UseDndDraggable[]>(
    props.items.map((item) => ({
      element: null,
      elementHandle: null,
    })),
  );
  useBeforeRender(() => {
    if (refDraggables.current.length < props.items.length) {
      refDraggables.current.concat(
        Array(props.items.length - refDraggables.current.length),
      );
    }
  }, [props.items]);

  const [stateEffectAllowed, setStateEffectAllowed] =
    useState<UseDndConfig["effectAllowed"]>("move");
  const [stateDropEffect, setStateDropEffect] =
    useState<UseDndConfig["dropEffect"]>("move");

  const setConfig = useCallback((config: UseDndConfig) => {
    setStateEffectAllowed(config.effectAllowed);
    setStateDropEffect(config.dropEffect);
  }, []);

  /////////////////////////////////////////////////////
  // Draggable related
  const onDragStart = useCallback(
    ({ index }: { index: number }) =>
      (event: React.DragEvent<HTMLDivElement>) => {
        event.dataTransfer.effectAllowed = stateEffectAllowed;
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            index: 1,
          }),
        );
        setStateIsDragging(true);

        // event.dataTransfer.setDragImage(
        //   refDraggables.current[index].element!,
        //   100,
        //   100,
        // );

        // const originalElement = refDraggables.current[index].element!;
        // const dragImage = originalElement.cloneNode(true) as HTMLElement;
        // dragImage.id = "draggeimage";
        // // dragImage.style.position = "absolute";
        // dragImage.style.background = "red";
        // dragImage.style.opacity = "1";
        // dragImage.style["backdropFilter"] = "none";
        // document.body.appendChild(dragImage);
        // event.dataTransfer.setDragImage(dragImage, 0, 0);

        // const { active } = event;
        // // Property 'over' does not exist on type 'DragStartEvent'.
        // console.log(active);

        // const data = active.data.current as DraggableContextPropsDataCustomData;
        // if (data.customProps.customData && data.customProps.type === "category") {
        //   setStateActiveCategory(data.customProps.customData as Category);

        //   if (refActiveCategoryDom.current) {
        //     const { offsetHeight, offsetWidth } = refActiveCategoryDom.current;
        //     setStateActiveCategoryDomStyle({
        //       height: offsetHeight,
        //       width: offsetWidth,
        //     });
        //   }
        //   return;
        // }
        // if (data.customProps.customData && data.customProps.type === "task") {
        //   setStateActiveCategory(data.customProps.customData as Task);
        //   return;
        // }
      },
    [stateEffectAllowed],
  );

  // Triggered: When the drag operation is completed (either dropped or cancelled).
  // Use case: Clean up visual feedback or finalize state.
  const onDragEnd = useCallback(
    ({ index }: { index: number }) =>
      (event: React.DragEvent<HTMLDivElement>) => {
        console.log("[onDragEnd]");
        setStateIsDragging(false);
        event.dataTransfer.clearData();
      },
    [],
  );

  /////////////////////////////////////////////////////
  // Droppable related

  // Triggered: Continuously while the dragged item is over a valid drop target.
  // Use case: Prevent the default behavior (which disables dropping) and optionally update visuals dynamically.
  const onDragOver = useCallback(
    ({ category }: { category: T }) =>
      (event: React.DragEvent<HTMLDivElement>) => {
        console.log("[onDragOver]");
        event.preventDefault(); // Allow drop over
        event.dataTransfer.dropEffect = stateDropEffect;
      },
    [stateDropEffect],
  );

  // Triggered: When a dragged item enters a valid drop target.
  // Use case: Highlight potential drop targets or provide visual feedback.
  const onDragEnter = useCallback(() => {
    console.log("[onDragEnter]");
    setStateIsDraggedOver(true);
  }, []);

  // Triggered: When the dragged item leaves a valid drop target.
  // Use case: Revert visual feedback or clean up styles.
  const onDragLeave = useCallback(() => {
    console.log("[onDragLeave]");
    setStateIsDraggedOver(false);
  }, []);

  // Triggered: When the dragged item is dropped on a valid target.
  // Use case: Handle the drop logic, such as retrieving the transferred data or moving elements.
  const onDrop = useMemo(
    () =>
      ({ category }: { category: T }) =>
      (event: React.DragEvent<HTMLDivElement>) => {
        console.log("[onDrop]");
        event.preventDefault();
        console.log(JSON.parse(event.dataTransfer.getData("application/json")));
      },
    [],
  );

  const setDraggableRef = useMemo(
    () =>
      ({ index }: { index: number }) =>
      (node: HTMLElement | null) => {
        if (node) {
          // console.log(node);
          // node.setAttribute("data-draggable", "true");

          refDraggables.current[index].element = node;
        }
      },
    [],
  );

  const setDraggableHandleRef = useMemo(
    () =>
      ({ index }: { index: number }) =>
      (node: HTMLElement | null) => {
        if (node) {
          console.log(node);
          node.setAttribute("draggable", "true");

          refDraggables.current[index].elementHandle = node;
        }
      },
    [],
  );

  /////////////////////////////////////////////////////

  const draggableProvided = useMemo(
    () =>
      ({ index }: { index: number }) => ({
        onDragStart: onDragStart({ index }),
        onDragEnd: onDragEnd({ index }),
      }),
    [onDragStart, onDragEnd],
  );

  const droppableProvided = useMemo(
    () => ({
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop,
    }),
    [onDragOver, onDragEnter, onDragLeave, onDrop],
  );

  const ret = useMemo(
    () => ({
      setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      draggableProvided,
      droppableProvided,
    }),
    [
      setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      draggableProvided,
      droppableProvided,
    ],
  );

  return ret;
};
