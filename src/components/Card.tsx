import React, { useRef } from "react";
import { atom, useSetRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { ExecutionProps, styled } from "styled-components";
import { Task } from "@/atoms";
import { ChildItem } from "@/components/BoardContext";
import { StyledComponentProps, withMemoAndRef } from "@/utils";

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

const CardBase = styled.div`
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);

  &.cards-container-sortable-handle {
    cursor: grabbing;
  }
`;

export type CardProps = {
  childItem: ChildItem;
} & StyledComponentProps<"div">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: ({ childItem, ...otherProps }, ref) => {
    console.log("[CardBase]");

    const setStateCards = useSetRecoilState(cardsAtom);
    const refCard = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refCard.current) {
        setStateCards((cur) => ({
          ...cur,
          [childItem.id]: refCard.current,
        }));
      }
    }, [childItem.id, setStateCards]);

    const setStateCardDragHandles = useSetRecoilState(cardDragHandlesAtom);
    const refDragHandle = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refDragHandle.current) {
        setStateCardDragHandles((cur) => ({
          ...cur,
          [childItem.id]: refDragHandle.current,
        }));
      }
    }, [childItem.id, setStateCardDragHandles]);

    return (
      <CardBase
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            refCard.current = el;
            if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement>).current = el;
            }
          }
        }}
        {...otherProps}
      >
        {childItem.content}
        <div ref={refDragHandle} className="cards-container-sortable-handle">
          DOH!
        </div>
      </CardBase>
    );
  },
});
