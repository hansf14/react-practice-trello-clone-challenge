import React, { useCallback, useImperativeHandle, useRef } from "react";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { DroppableHandle } from "@/hocs/withDroppable";
import { css, styled } from "styled-components";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

export type UseDndContextId = string;
export type UseDndDroppableId = string;
export type UseDndDraggableId = string;
export type Droppables = Map<UseDndDroppableId, DroppableHandle>;

export type UseDndGlobalStateKey = UseDndContextId; // ContextId
export type UseDndGlobalStateValue = {
  dndRootIntersectionObserver: IntersectionObserver | null;
  dndRootElementsPendingToBeObserved: Map<HTMLElement, HTMLElement>;
  dndRootDragCursorArea: HTMLDivElement | null;
  dndRootChildrenWrapper: HTMLDivElement | null;
  curActiveDroppable: HTMLElement | null;
  curActiveDraggable: HTMLElement | null;
  droppableHandles: Droppables;
};
export class UseDndGlobalState extends Map<
  UseDndGlobalStateKey,
  UseDndGlobalStateValue
> {
  addDndContext({ contextId }: { contextId: UseDndContextId }) {
    if (!this.has(contextId)) {
      this.set(contextId, {
        dndRootIntersectionObserver: null,
        dndRootElementsPendingToBeObserved: new Map<HTMLElement, HTMLElement>(),
        dndRootDragCursorArea: null,
        dndRootChildrenWrapper: null,
        curActiveDroppable: null,
        curActiveDraggable: null,
        droppableHandles: new Map<UseDndDroppableId, DroppableHandle>(),
      });
    }
  }

  getDndContext({ contextId }: { contextId: UseDndContextId }) {
    return this.get(contextId);
  }

  removeDndContext({ contextId }: { contextId: UseDndContextId }) {
    this.delete(contextId);
  }
}

export const dndGlobalState = new UseDndGlobalState();

////////////////////////////////////////////

const UseDndRootBase = styled.div`
  width: 100%;
  height: 100%;
  flex-grow: 1;
  container-type: size;
  container-name: root;
`;

export type DragCursorAreaProps = {
  width: number;
  height: number;
};

const DragCursorArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["width", "height"].includes(prop),
})<DragCursorAreaProps>`
  position: fixed;
  width: ${({ width }) => width + "px"};
  height: ${({ height }) => height + "px"};

  ${({ width, height }) => {
    const widthStr = width + "px";
    const heightStr = height + "px";
    return css`
      transform: translate3d(${widthStr}, ${heightStr}, 0);
    `;
  }}
`;

export type UseDndRootChildrenWrapper = {
  dragCursorAreaWidth: number;
  dragCursorAreaHeight: number;
};

const UseDndRootChildrenWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["dragCursorAreaWidth", "dragCursorAreaHeight"].includes(prop),
})<UseDndRootChildrenWrapper>`
  width: 100cqw;
  height: 100cqh;

  ${({ dragCursorAreaWidth, dragCursorAreaHeight }) => {
    const dragCursorAreaWidthStr = -dragCursorAreaWidth + "px";
    const dragCursorAreaHeightStr = -dragCursorAreaHeight + "px";
    return css`
      transform: translate3d(
        ${dragCursorAreaWidthStr},
        ${dragCursorAreaHeightStr},
        0
      );
    `;
  }}
`;

export type UseDndRootHandle = {
  contextId?: UseDndContextId;
  baseElement: HTMLDivElement | null;
};

export type UseDndRootProps = {
  contextId: UseDndContextId;
  children?: React.ReactNode;
  dragCollisionDetectionSensitivity?: Partial<DragCursorAreaProps>;
};

export const UseDndRoot = withMemoAndRef<
  "div",
  UseDndRootHandle,
  UseDndRootProps
>({
  displayName: "UseDndRoot",
  Component: (
    { contextId, children, dragCollisionDetectionSensitivity },
    ref,
  ) => {
    const {
      width: dragCursorAreaWidth = 10,
      height: dragCursorAreaHeight = 10,
    } = dragCollisionDetectionSensitivity ?? {};
    const refBase = useRef<HTMLDivElement | null>(null);

    const refPrevContextId = useRef<UseDndContextId>(contextId);
    const dndState = dndGlobalState.getDndContext({ contextId });
    if (!dndState) {
      dndGlobalState.addDndContext({ contextId });
    } else {
      if (refPrevContextId.current !== contextId) {
        dndGlobalState.removeDndContext({ contextId });
      }
    }
    refPrevContextId.current = contextId;

    useImperativeHandle(ref, () => {
      return {
        contextId: contextId,
        baseElement: refBase.current,
      };
    });

    const intersectionObserverCb = useCallback<IntersectionObserverCallback>(
      (entries, observer) => {
        console.log("[intersectionObserverCb]");

        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[intersectionObserverCb] !dndState");
          return;
        }

        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            dndState.curActiveDroppable &&
            dndState.curActiveDraggable
          ) {
            const dataActiveDroppableContextId =
              dndState.curActiveDroppable.getAttribute("data-context-id");
            const dataActiveDroppableId =
              dndState.curActiveDroppable.getAttribute("data-droppable-id");
            const dataActiveDroppableTagKeysAcceptableStr =
              dndState.curActiveDroppable.getAttribute(
                "data-droppable-tag-keys-acceptable",
              );
            if (!dataActiveDroppableTagKeysAcceptableStr) {
              continue;
            }
            const dataActiveDroppableTagKeysAcceptable: string[] = JSON.parse(
              dataActiveDroppableTagKeysAcceptableStr.replaceAll(/'/g, '"'),
            );

            const dataActiveDraggableContextId =
              dndState.curActiveDraggable.getAttribute("data-context-id");
            const dataActiveDraggableId =
              dndState.curActiveDraggable.getAttribute("data-draggable-id");
            const dataActiveDraggableTagKey =
              dndState.curActiveDraggable.getAttribute(
                "data-draggable-tag-key",
              );

            if (
              !dataActiveDroppableContextId ||
              !dataActiveDroppableId ||
              !dataActiveDraggableContextId ||
              !dataActiveDroppableTagKeysAcceptable ||
              !dataActiveDraggableId ||
              !dataActiveDraggableTagKey ||
              contextId !== dataActiveDroppableContextId ||
              contextId !== dataActiveDraggableContextId
            ) {
              console.log("1");
              continue;
            }

            // 1. Dragged over
            // 2. Not dragged over (empty space)
            // 3. Not dragged over (empty but should be inserted ex. between large gap)

            const target = entry.target;
            const targetContextId = target.getAttribute("data-context-id");
            const targetId = target.getAttribute("data-draggable-id");
            const targetTagKey = target.getAttribute("data-draggable-tag-key");

            if (
              !targetContextId ||
              !targetId ||
              !targetTagKey ||
              dataActiveDroppableContextId !== targetContextId ||
              !dataActiveDroppableTagKeysAcceptable.includes(targetTagKey)
            ) {
              continue;
            }

            console.log("true");

            // TODO:
            // const groupsForActiveDroppable = groups.get({
            //   keys: [dataDroppableContextId, dataDroppableId],
            // });
            // if (!groupsForActiveDroppable) {
            //   continue;
            // }
            // const curOverDraggable = entry.target as HTMLElement;
            // for (const group of groupsForActiveDroppable) {
            //   if (group.elements.includes(curOverDraggable)) {
            //     console.log(true);
            //   }
            // }
          }
        }
      },
      [contextId],
    );

    const dragAreaCallbackRef = useCallback(
      (el: HTMLDivElement | null) => {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (dndState) {
          dndState.dndRootDragCursorArea = el;
        }
      },
      [contextId],
    );

    useIsomorphicLayoutEffect(() => {
      const dndState = dndGlobalState.getDndContext({ contextId });
      if (dndState) {
        const elementsToBeObserved = [
          ...dndState.dndRootElementsPendingToBeObserved.values(),
        ];
        elementsToBeObserved.forEach((element) => {
          dndState.dndRootIntersectionObserver?.observe(element);
          dndState.dndRootElementsPendingToBeObserved.delete(element);
        });
      }
    });

    useIsomorphicLayoutEffect(() => {
      const dndState = dndGlobalState.getDndContext({ contextId });
      if (
        dndState &&
        !dndState.dndRootIntersectionObserver &&
        dndState.dndRootDragCursorArea
      ) {
        dndState.dndRootIntersectionObserver = new IntersectionObserver(
          intersectionObserverCb,
          {
            root: dndState.dndRootDragCursorArea,
          },
        );
      }
    }, [contextId, dndState, intersectionObserverCb]);

    const childWrapperCallbackRef = useCallback(
      (el: HTMLDivElement | null) => {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (dndState) {
          dndState.dndRootChildrenWrapper = el;
        }
      },
      [contextId],
    );

    console.log(dndGlobalState.getDndContext({ contextId })!);
    console.log(
      dndGlobalState.getDndContext({ contextId })!.dndRootIntersectionObserver,
    );

    if (!contextId) {
      return <div ref={refBase}>{children}</div>;
    }

    return (
      <UseDndRootBase ref={refBase}>
        <DragCursorArea
          ref={dragAreaCallbackRef}
          width={dragCursorAreaWidth}
          height={dragCursorAreaHeight}
        >
          <UseDndRootChildrenWrapper
            ref={childWrapperCallbackRef}
            dragCursorAreaWidth={dragCursorAreaWidth}
            dragCursorAreaHeight={dragCursorAreaHeight}
          >
            {children}
          </UseDndRootChildrenWrapper>
        </DragCursorArea>
      </UseDndRootBase>
    );
  },
});
