import React, { useCallback, useRef, useState } from "react";
import { atom, useSetRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import { Input } from "antd";
import { cardClassNameKvMapping, ChildItem } from "@/components/BoardContext";
import { StyledComponentProps, withMemoAndRef } from "@/utils";
const { TextArea } = Input;

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
`;

const CardContentInput = styled(TextArea)`
  && {
    width: 100%;
    background-color: transparent;
    border: none;
    border-radius: 0;

    font-weight: bold;
    font-size: 14px;

    transition: none;

    &:not([readonly]) {
      outline: 2px solid yellow;
    }
  }
`;

const CardDragHandle = styled.div`
  &.${cardClassNameKvMapping["card-sortable-handle"]} {
    cursor: grab;
  }
`;

export type OnUpdateChildItem = <C extends ChildItem>({
  event,
  oldChildItem,
  newChildItem,
}: {
  event: React.ChangeEvent<HTMLTextAreaElement>;
  oldChildItem: C;
  newChildItem: C;
}) => void;

export type CardProps = {
  childItem: ChildItem;
  onUpdateChildItem?: OnUpdateChildItem;
} & StyledComponentProps<"div">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: ({ childItem, onUpdateChildItem, ...otherProps }, ref) => {
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

    const [stateIsEditMode, setStateIsEditMode] = useState<boolean>(false);

    const cardContentEditEnableHandler = useCallback<
      React.MouseEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(true);
    }, []);

    const cardContentEditDisableHandler = useCallback<
      React.FocusEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(false);
    }, []);

    const cardContentEditFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >((event) => {
      if (event.key !== "Enter") {
        return;
      }
      setStateIsEditMode(false);
    }, []);

    const cardContentEditHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        onUpdateChildItem?.({
          event,
          oldChildItem: childItem,
          newChildItem: {
            id: childItem.id,
            content: event.target.value,
          },
        });
      },
      [childItem, onUpdateChildItem],
    );

    return (
      <CardBase ref={ref} {...otherProps}>
        {/* {childItem.content} */}
        <CardContentInput
          value={childItem.content}
          // autoFocus
          autoSize
          readOnly={!stateIsEditMode}
          onClick={cardContentEditEnableHandler}
          onBlur={cardContentEditDisableHandler}
          onKeyDown={cardContentEditFinishHandler}
          onChange={cardContentEditHandler}
        />
        <CardDragHandle
          ref={refDragHandle}
          className={cardClassNameKvMapping["card-sortable-handle"]}
        >
          <GripVertical />
        </CardDragHandle>
      </CardBase>
    );
  },
});
