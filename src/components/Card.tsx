import React, { MutableRefObject, useRef } from "react";
import { atom, useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { Task } from "@/atoms";

export const cardsAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "cardsAtom",
  default: {},
});

export const cardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "taskDragHandlesAtom",
  default: {},
});

export const Card = React.memo(
  React.forwardRef<HTMLDivElement, { task: Task }>(
    ({ task }: { task: Task }, ref) => {
      console.log("[CardBase]");

      const [stateCards, setStateCards] = useRecoilState(cardsAtom);
      const refCard = useRef<HTMLDivElement | null>(null);
      useIsomorphicLayoutEffect(() => {
        if (refCard.current) {
          setStateCards((cur) => ({
            ...cur,
            [task.id]: refCard.current,
          }));
        }
      }, [task.id, setStateCards]);

      const [stateCardDragHandles, setStateCardDragHandles] =
        useRecoilState(cardDragHandlesAtom);
      const refDragHandle = useRef<HTMLDivElement | null>(null);
      useIsomorphicLayoutEffect(() => {
        if (refDragHandle.current) {
          setStateCardDragHandles((cur) => ({
            ...cur,
            [task.id]: refDragHandle.current,
          }));
        }
      }, [task.id, setStateCardDragHandles]);

      return (
        <div
          ref={(el) => {
            if (el) {
              refCard.current = el;
              if (ref) {
                (ref as MutableRefObject<HTMLDivElement>).current = el;
              }
            }
          }}
        >
          {task.text}
          <div ref={refDragHandle} className="sortable-handle">
            DOH!
          </div>
        </div>
      );
    },
  ),
);
