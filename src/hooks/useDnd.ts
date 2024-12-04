import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useForceRenderWithOptionalCb } from "@/hooks/useForceRenderWithOptionalCb";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { atom, useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

////////////////////////////////////

// Desktop Events (Mouse)
// Event	Description
// onDragStart	Triggered when dragging starts (mouse down).
// onDrag	Triggered continuously while dragging.
// onDragEnd	Triggered when dragging ends (mouse up).
// onMouseDown	Triggered when the mouse is pressed.
// onMouseMove	Continuously triggered as the mouse moves.
// onMouseUp	Triggered when the mouse is released.

// Touch Events
// Event	Description
// onTouchStart	Triggered when a touch gesture starts (finger touch).
// onTouchMove	Continuously triggered as the finger moves across the screen.
// onTouchEnd	Triggered when the finger is lifted, ending the touch.
// onDragStart	Framer Motion provides this cross-device event (works for touch as well).
// onDrag	Works for both mouse and touch events.
// onDragEnd	Works for both mouse and touch events.

////////////////////////////////////

// On the Draggable Element:
// Event	Occurs When
// ondrag	An element is being dragged
// ondragstart	The user starts to drag an element
// ondragend	The user has finished dragging an element
// Note: While dragging an element, the ondrag event fires every 350 milliseconds.

// On the Drop Target:
// Event	Occurs When
// ondragenter	A dragged element enters the drop target
// ondragleave	A dragged element leaves the drop target
// ondragover	A dragged element is over the drop target
// ondrop	A dragged element is dropped on the target

////////////////////////////////////

// export interface UseDraggableConfig {
//   effectAllowed: DataTransfer["effectAllowed"];
//   dropEffect: DataTransfer["dropEffect"];
// }

export interface UseDraggableRefObj {
  element: HTMLElement | null;
  elementHandle: HTMLElement | null;
}

export type UseDraggableSetDraggableRef = (node: HTMLElement | null) => void;

export type UseDraggableSetDraggableHandleRef = (
  node: HTMLElement | null,
) => void;

export type UseDraggableItemBaseSpec = { id: string };

export type UseDroppableItemBaseSpec = UseDraggableItemBaseSpec;

export type UseDraggableItemSpec<T extends UseDraggableItemBaseSpec> = {
  type: string;
  index: number;
  data: T;
};

export type UseDroppableItemSpec<T extends UseDraggableItemBaseSpec> = {
  acceptableTypes: string[];
  index: number;
  data: T;
};

export type UseDraggableOnDragStartCb<T extends UseDraggableItemBaseSpec> =
  NonNullable<UseDraggableParams<T>["onDragStartCb"]>;

export interface UseDraggableParams<
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
  DroppableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
> {
  items: UseDraggableItemSpec<DraggableItemSpec>[];
  onDragStartCb?: ({
    active,
  }: {
    active: UseDraggableItemSpec<DraggableItemSpec>;
  }) => void;
  onDragEndCb?: ({
    active,
    over,
  }: {
    index: number;
    active: UseDraggableItemSpec<DraggableItemSpec>;
    over: UseDroppableItemSpec<DroppableItemSpec>;
  }) => void;
}

export interface UseDroppableParams<
  DroppableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
> {
  items: UseDroppableItemSpec<DroppableItemSpec>[];
}

const isDraggingAtom = atom<boolean>({
  key: "is-dragging-atom",
  default: false,
});

export function cloneCssPropertiesToCssStyleDeclaration(
  cssProperties: React.CSSProperties,
  styleDeclaration: CSSStyleDeclaration,
) {
  Object.entries(cssProperties).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const cssKey = key.replace(
        /[A-Z]/g,
        (match) => `-${match.toLowerCase()}`,
      ); // Convert camelCase to kebab-case
      styleDeclaration.setProperty(cssKey, String(value));
    }
  });
}

export const useDraggable = <
  DraggableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
>(
  props: UseDraggableParams<DraggableItemSpec>,
) => {
  const { items, onDragStartCb = () => {} } = props;
  const { forceRender } = useForceRenderWithOptionalCb();

  const [stateIsDraggedOver, setStateIsDraggedOver] = useState<boolean>(false);

  // const [stateIsDragging, setStateIsDragging] = useState<boolean>(false);
  // Need immediate update
  const refIsDragging = useRef<boolean>(false);
  const [stateIsDragging, setStateIsDragging] = useRecoilState(isDraggingAtom);
  const refActiveDomStyle = useRef<Record<string, string> | null>();

  const refDraggables = useRef<UseDraggableRefObj[]>(
    items.map(() => ({
      element: null,
      elementHandle: null,
    })),
  );
  useBeforeRender(() => {
    if (refDraggables.current.length < items.length) {
      refDraggables.current.concat(
        Array(items.length - refDraggables.current.length),
      );
    }
  }, [items]);

  const refDragGhost = useRef<HTMLElement>();
  const refDragGhostRelativePos = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  useBeforeRender(() => {
    if (!refDragGhost.current) {
      return;
    }
    // Mandatory
    refDragGhost.current.style.setProperty("position", "fixed");
    refDragGhost.current.style.setProperty("left", "0");
    refDragGhost.current.style.setProperty("top", "0");
    refDragGhost.current.style.setProperty("display", "none");
    if (refActiveDomStyle.current) {
      refDragGhost.current.style.setProperty(
        "width",
        refActiveDomStyle.current["width"],
      );
      refDragGhost.current.style.setProperty(
        "height",
        refActiveDomStyle.current["height"],
      );
    }

    // Custom
    // ...
  }, [refDragGhost.current]);

  // const [stateEffectAllowed, setStateEffectAllowed] =
  //   useState<UseDndConfig["effectAllowed"]>("move");
  // const [stateDropEffect, setStateDropEffect] =
  //   useState<UseDndConfig["dropEffect"]>("move");

  // const setConfig = useCallback((config: UseDndConfig) => {
  //   setStateEffectAllowed(config.effectAllowed);
  //   setStateDropEffect(config.dropEffect);
  // }, []);

  /////////////////////////////////////////////////////

  /////////////////////////////////////////////////////

  // const onMouseDown = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.MouseEvent<HTMLElement>) => {
  //       console.log("[onMouseDown]");
  //       if (stateIsDragging && refDragGhost.current) {
  //         window.addEventListener("mousemove", onMouseMove);
  //       }
  //     },
  //   [],
  // );

  const onMouseMove = useCallback(
    // ({ index }: { index: number }) =>
    (event: MouseEvent) => {
      // console.log("[onMouseMove]");
      // console.log("stateIsDragging:", stateIsDragging);
      // console.log("refIsDragging.current:", refIsDragging.current);
      // console.log("refDragGhost.current:", refDragGhost.current);

      if (refIsDragging.current && refDragGhost.current) {
        const { x: relativeX, y: relativeY } = refDragGhostRelativePos.current;
        const x = relativeX + event.pageX;
        const y = relativeY + event.pageY;

        refDragGhost.current.style.removeProperty("display");
        refDragGhost.current.style.setProperty(
          "transform",
          `translate3d(${x}px, ${y}px, 0)`,
        );
      }
    },
    [],
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      console.log("[onMouseUp]");
      if (refIsDragging.current && refDragGhost.current) {
        refDragGhost.current.style.setProperty("display", "none");
      }
      window.removeEventListener("mousemove", onMouseMove);
      refIsDragging.current = false;
    },
    [onMouseMove],
  );

  /////////////////////////////////////////////////////
  // Draggable related

  // [1] Triggered: When the user starts dragging an element.
  // [2] Use case: Initialize any data transfer or visual feedback for the drag operation.
  // [3] Common Methods/Properties:
  // - e.dataTransfer.setData(type, data): Sets data to be transferred.
  // - e.dataTransfer.effectAllowed: Specifies the allowed operations (move, copy, etc.).
  //
  // element.addEventListener('dragstart', (e) => {
  //   e.dataTransfer.setData('text/plain', 'Dragged Item');
  //   e.dataTransfer.effectAllowed = 'move';
  //   console.log('Drag started');
  // });
  const onDragStart = useCallback(
    ({ index }: { index: number }) =>
      (event: React.DragEvent<HTMLElement>) => {
        console.log("[onDragStart]");

        event.preventDefault();

        // event.dataTransfer.effectAllowed = stateEffectAllowed;
        // event.dataTransfer.setData(
        //   "application/json",
        //   JSON.stringify({
        //     index: 1,
        //   }),
        // );

        // // Prevent showing the default ghost preview by showing empty/transparent image (invisible 1x1 pixel image)
        // const img = new Image();
        // img.src =
        //   "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        // // event.dataTransfer.setDragImage(
        // //   refDraggables.current[index].element!,
        // //   100,
        // //   100,
        // // );
        // event.dataTransfer.setDragImage(img, 0, 0);

        refIsDragging.current = true;
        setStateIsDragging(true);

        if (
          !!refDraggables.current[index].element &&
          !!refDraggables.current[index].elementHandle
        ) {
          // const { x, y } = (
          //   event.target as HTMLElement
          // ).getBoundingClientRect(); // elementHandleRect
          const elementRect =
            refDraggables.current[index].element!.getBoundingClientRect();
          const elementHandleRect =
            refDraggables.current[index].elementHandle!.getBoundingClientRect();
          // console.log(x);
          // console.log(elementRect.x);
          // console.log(elementHandleRect.x);

          // console.log(event.pageX);
          // console.log(event.clientX);
          // console.log(event.screenX);
          // console.log(event.movementX);

          refDragGhostRelativePos.current.x =
            elementRect.x - elementHandleRect.x;
          refDragGhostRelativePos.current.y =
            elementRect.y - elementHandleRect.y;
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp, {
          once: true,
        });

        onDragStartCb({
          active: items[index],
        });

        /////////////////////////////////////////////////////

        if (refDraggables.current[index].element) {
          const originalElement = refDraggables.current[index]
            .element as HTMLElement;
          const { offsetWidth, offsetHeight } = originalElement;
          refActiveDomStyle.current ??= {};
          refActiveDomStyle.current["width"] = offsetWidth + "px";
          refActiveDomStyle.current["height"] = offsetHeight + "px";
        }
      },
    [items, onMouseMove, onMouseUp, onDragStartCb, setStateIsDragging],
  );

  // [1] Triggered: While the element is being dragged.
  // [2] Use case: Use sparingly to provide feedback (e.g., updating coordinates or highlighting targets).
  // [3] Common Methods/Properties:
  // You can monitor the clientX and clientY coordinates to track drag movement.
  //
  // element.addEventListener('drag', (e) => {
  //   console.log(`Dragging at ${e.clientX}, ${e.clientY}`);
  // });
  // const onDrag = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDrag]");

  //       // if (stateIsDragging && refDragGhost.current) {
  //       //   refDragGhost.current.style.setProperty("position", "fixed");
  //       //   refDragGhost.current.style.setProperty("background-color", "red");
  //       //   refDragGhost.current.style.setProperty("left", `${event.clientX}px`);
  //       //   refDragGhost.current.style.setProperty("top", `${event.clientY}px`);
  //       // }
  //     },
  //   [],
  // );

  // [1] Triggered: When the drag operation is completed (either dropped or cancelled).
  // [2] Use case: Clean up visual feedback or finalize state.
  // [3] Common Methods/Properties:
  // The e.dataTransfer.dropEffect indicates the final operation (none, copy, move).
  //
  // element.addEventListener('dragend', (e) => {
  //   console.log(`Drag ended with effect: ${e.dataTransfer.dropEffect}`);
  // });
  // const onDragEnd = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDragEnd]");
  //       // setStateIsDragging(false);
  //       event.dataTransfer.clearData();
  //     },
  //   [],
  // );

  /////////////////////////////////////////////////////

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
          // console.log(node);
          node.setAttribute("draggable", "true");

          refDraggables.current[index].elementHandle = node;
        }
      },
    [],
  );

  const setDragGhostRef = useMemo(
    () => (node: HTMLElement | null) => {
      if (node) {
        // console.log(node);
        refDragGhost.current = node;
        forceRender();
      }
    },
    [forceRender],
  );

  /////////////////////////////////////////////////////

  const draggableProvided = useMemo(
    () =>
      ({ index }: { index: number }) => ({
        onDragStart: onDragStart({ index }),
        // onDrag: onDrag({ index }),
        // onDragEnd: onDragEnd({ index }),
      }),
    [onDragStart],
  );

  // console.log("stateIsDragging:", stateIsDragging);
  // console.log("refIsDragging.current:", refIsDragging.current);
  const ret = useMemo(
    () => ({
      // setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      setDragGhostRef,
      isDragging: stateIsDragging,
      draggableProvided,
    }),
    [
      // setConfig,
      setDraggableRef,
      setDraggableHandleRef,
      setDragGhostRef,
      stateIsDragging,
      draggableProvided,
    ],
  );
  // console.log("ret.isDragging:", ret.isDragging);

  return ret;
};

export const useDroppable = <
  DroppableItemSpec extends UseDraggableItemBaseSpec = UseDraggableItemBaseSpec,
>(
  props: UseDroppableParams<DroppableItemSpec>,
) => {
  /////////////////////////////////////////////////////
  // Droppable related
  // [1] Triggered: Continuously while the dragged item is over a valid drop target.
  // [2] Use case: Prevent the default behavior (which disables dropping) and optionally update visuals dynamically.
  // [3] Common Methods/Properties:
  // e.preventDefault(): Allows the drop operation.
  // e.dataTransfer.dropEffect: Indicates the type of drag-and-drop operation (copy, move, etc.).
  // dropTarget.addEventListener('dragover', (e) => {
  //   e.preventDefault(); // Must call to allow drop
  //   e.dataTransfer.dropEffect = 'move';
  //   console.log('Drag over target');
  // });
  // const onDragOver = useCallback(
  //   ({ category }: { category: T }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDragOver]");
  //       event.preventDefault(); // Allow drop over
  //       // event.dataTransfer.dropEffect = stateDropEffect;
  //     },
  //   [],
  // );
  // [1] Triggered: When a dragged item enters a valid drop target.
  // [2] Use case: Highlight potential drop targets or provide visual feedback.
  // [3] Common Methods/Properties:
  // e.target: Refers to the potential drop zone.
  //
  // dropTarget.addEventListener('dragenter', (e) => {
  //   e.target.style.backgroundColor = 'lightblue';
  //   console.log('Drag entered target');
  // });
  // const onDragEnter = useCallback(() => {
  //   console.log("[onDragEnter]");
  //   setStateIsDraggedOver(true);
  // }, []);
  // [1] Triggered: When the dragged item leaves a valid drop target.
  // [2] Use case: Revert visual feedback or clean up styles.
  // [3] Common Methods/Properties:
  // Similar to dragenter.
  //
  // dropTarget.addEventListener('dragleave', (e) => {
  //   e.target.style.backgroundColor = '';
  //   console.log('Drag left target');
  // });
  // const onDragLeave = useCallback(() => {
  //   console.log("[onDragLeave]");
  //   setStateIsDraggedOver(false);
  // }, []);
  // [1] Triggered: When the dragged item is dropped on a valid target.
  // [2] Use case: Handle the drop logic, such as retrieving the transferred data or moving elements.
  // [3] Common Methods/Properties:
  //e.dataTransfer.getData(type): Retrieves the data set in dragstart.
  //e.preventDefault(): Stops default handling of the drop event.
  //
  // dropTarget.addEventListener('drop', (e) => {
  //   e.preventDefault();
  //   const data = e.dataTransfer.getData('text/plain');
  //   console.log(`Dropped data: ${data}`);
  // });
  // const onDrop = useCallback(
  //   ({ index }: { index: number }) =>
  //     (event: React.DragEvent<HTMLElement>) => {
  //       console.log("[onDrop]");
  //       event.preventDefault();
  //       console.log(JSON.parse(event.dataTransfer.getData("application/json")));
  //     },
  //   [],
  // );
  /////////////////////////////////////////////////////
  // const droppableProvided = useMemo(
  //   () => ({
  //     onDragOver,
  //     onDragEnter,
  //     onDragLeave,
  //     onDrop,
  //   }),
  //   [onDragOver, onDragEnter, onDragLeave, onDrop],
  // );
  // const ret = useMemo(
  //   () => ({
  //     droppableProvided,
  //   }),
  //   [droppableProvided],
  // );
  // return ret;
};
