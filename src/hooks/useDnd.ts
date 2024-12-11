import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { useUniqueRandomIds } from "@/hooks/useUniqueRandomIds";
import { memoizeCallback } from "@/utils";
import { useCallback, useRef } from "react";
import { atom, atomFamily, selector, useRecoilState } from "recoil";

export type DndAtomState = {
  [contextId: string]: {
    droppables: {
      [droppableId: string]: {};
    };
    draggables: {
      [draggableId: string]: {};
    };
  };
};
export type DndAtomParams = { contextId: string };

export const dndAtom = atomFamily<DndAtomState, DndAtomParams>({
  key: "dndAtom",
  default: ({ contextId }) => {
    return {
      [contextId]: {
        droppables: {},
        draggables: {},
      },
    };
  },
});

export type UseDndParams = {
  contextId: string;
  droppableCount: number;
  draggableCount: number;
};

export const useDnd = (params: UseDndParams) => {
  const { contextId, droppableCount, draggableCount } = params;

  let { ids: droppableIds, keepOrExpandIds: keepOrExpandDroppableIds } =
    useUniqueRandomIds({ count: droppableCount });
  const refDroppableIds = useRef<string[]>(droppableIds);
  useBeforeRender(() => {
    refDroppableIds.current = keepOrExpandDroppableIds({
      newCount: droppableCount,
    });
  }, [droppableCount, keepOrExpandDroppableIds]);

  let { ids: draggableIds, keepOrExpandIds: keepOrExpandDraggableIds } =
    useUniqueRandomIds({ count: draggableCount });
  const refDraggableIds = useRef<string[]>(draggableIds);
  useBeforeRender(() => {
    refDraggableIds.current = keepOrExpandDraggableIds({
      newCount: draggableCount,
    });
  }, [draggableCount, keepOrExpandDraggableIds]);

  const [stateDnd, setStateDnd] = useRecoilState(dndAtom({ contextId }));

  const idSetDroppableRef = useMemoizeCallbackId();
  const setDroppableRef = useCallback(
    ({ contextId, index }: { contextId: string; index: number }) =>
      memoizeCallback({
        id: idSetDroppableRef,
        fn: (el: HTMLElement | null) => {
          // console.log(setDraggableRef);
          if (el) {
            el.classList.add("droppable");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-droppable-id", droppableIds[index]);
          }
        },
        deps: [contextId, index, idSetDroppableRef, droppableIds],
      }),
    [idSetDroppableRef, droppableIds],
  );

  const idSetDraggableRef = useMemoizeCallbackId();
  const setDraggableRef = useCallback(
    ({ contextId, index }: { contextId: string; index: number }) =>
      memoizeCallback({
        id: idSetDraggableRef,
        fn: (el: HTMLElement | null) => {
          // console.log(setDraggableRef);
          if (el) {
            el.classList.add("draggable");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-id", draggableIds[index]);
          }
        },
        deps: [contextId, index, , idSetDraggableRef, draggableIds],
      }),
    [idSetDraggableRef, draggableIds],
  );

  const idSetDraggableHandleRef = useMemoizeCallbackId();
  const setDraggableHandleRef = useCallback(
    ({ contextId, index }: { contextId: string; index: number }) =>
      memoizeCallback({
        id: idSetDraggableHandleRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.setAttribute("draggable", "true"); // 드래그로 텍스트 블록 처리 되는거 방지용도로만 적용시킴
            el.setAttribute("tabindex", "0");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-handle-id", draggableIds[index]);
          }
        },
        deps: [contextId, index, , idSetDraggableHandleRef, draggableIds],
      }),
    [idSetDraggableHandleRef, draggableIds],
  );

  return {
    setDroppableRef,
    setDraggableRef,
    setDraggableHandleRef,
  };
};
