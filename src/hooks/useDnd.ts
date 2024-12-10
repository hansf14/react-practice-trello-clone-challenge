import { useBeforeRender } from "@/hooks/useBeforeRender";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { useUniqueRandomIds } from "@/hooks/useUniqueRandomIds";
import { memoizeCallback } from "@/utils";
import { useCallback, useRef } from "react";
import {
  atom,
  atomFamily,
  selector,
  selectorFamily,
  useRecoilState,
} from "recoil";

export const curDefaultContextIdAtom = atom<string>({
  key: "contextIdAtom",
  default: "0",
});

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
export type DndAtomParams = { contextId?: string } | null;

export const dndSelector = selector<DndAtomState>({
  key: "dndAtom",
  get: ({ get }) => {
    const stateDefaultContextId = get(
      selector({
        key: "dndAtom/default",
        get: ({ get }) => {
          const curContextId = get(curDefaultContextIdAtom);
          const contextId = (+curContextId + 1).toString();
          return contextId;
        },
      }),
    );
    return {
      [stateDefaultContextId]: {
        droppables: {},
        draggables: {},
      },
    };
  },
  set: ({ get, set }, newValue) => {},
});

export type UseDndParams = {
  droppableCount: number;
  draggableCount: number;
};

export const useDnd = (params: UseDndParams) => {
  const { droppableCount, draggableCount } = params;

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

  const [stateDnd, setStateDnd] = useRecoilState(dndSelector);

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
            el.setAttribute("data-draggable", draggableIds[index]);
          }
        },
        deps: [contextId, index, , idSetDraggableRef, draggableIds],
      }),
    [idSetDraggableRef, draggableIds],
  );

  const idSetDragHandleRef = useMemoizeCallbackId();
  const setDragHandleRef = useCallback(
    ({ contextId, index }: { contextId: string; index: number }) =>
      memoizeCallback({
        id: idSetDragHandleRef,
        fn: (el: HTMLElement | null) => {
          if (el) {
            el.setAttribute("draggable", "true"); // 드래그로 텍스트 블록 처리 되는거 방지용도로만 적용시킴
            el.setAttribute("tabindex", "0");

            el.setAttribute("data-context-id", contextId);
            el.setAttribute("data-draggable-handle", draggableIds[index]);
          }
        },
        deps: [contextId, index, , idSetDragHandleRef, draggableIds],
      }),
    [idSetDragHandleRef, draggableIds],
  );

  return {
    setDroppableRef,
    setDraggableRef,
    setDragHandleRef,
  };
};
