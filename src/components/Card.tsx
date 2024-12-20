import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import { Input } from "antd";
import {
  CardContext,
  CardContextValue,
  CardProvider,
  ChildItem,
  DndDataInterface,
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
} from "@/components/BoardContext";
import { emptyFunction, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
const { TextArea } = Input;

const CardInternalBase = styled.div`
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

const CardDragHandleBase = styled.div``;
// &.${cardClassNameKvMapping["card-sortable-handle"]} {
//   cursor: grab;
// }

export type CardDragHandleProps = {
  childItemId: string;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const CardDragHandle = withMemoAndRef<
  "div",
  HTMLDivElement,
  CardDragHandleProps
>({
  displayName: "CardDragHandle",
  Component: ({ childItemId, ...otherProps }, ref) => {
    const {
      setActivatorNodeRef,
      draggableHandleAttributes,
      draggableHandleListeners,
    } = useContext(CardContext);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const callbackRef = useCallback(
      (el: HTMLDivElement | null) => {
        refBase.current = el;
        setActivatorNodeRef?.(el);
      },
      [setActivatorNodeRef],
    );

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": childItemId,
      };

    return (
      <CardDragHandleBase
        ref={callbackRef}
        {...draggableHandleAttributes}
        {...draggableHandleListeners}
        {...draggableHandleCustomAttributes}
        {...otherProps}
      >
        <GripVertical />
      </CardDragHandleBase>
    );
  },
});

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
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: ({ childItem, onUpdateChildItem, ...otherProps }, ref) => {
    const sortableConfig = useMemo(
      () => ({
        id: childItem.id,
        data: {
          type: "child",
          item: childItem,
        } satisfies DndDataInterface<"child">,
      }),
      [childItem],
    );

    const {
      isDragging,
      setNodeRef,
      setActivatorNodeRef,
      attributes: draggableHandleAttributes,
      listeners: draggableHandleListeners,
      transform,
      transition,
    } = useSortable(sortableConfig);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const callbackRef = useCallback(
      (el: HTMLDivElement | null) => {
        refBase.current = el;
        setNodeRef(el);
      },
      [setNodeRef],
    );

    const cardContextValue = useMemo<CardContextValue>(
      () => ({
        setActivatorNodeRef,
        draggableHandleAttributes,
        draggableHandleListeners,
      }),
      [
        draggableHandleAttributes,
        draggableHandleListeners,
        setActivatorNodeRef,
      ],
    );

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

    const style = useMemo(
      () => ({
        transition,
        // transition: "none",
        // transition: {
        //   duration: 150,
        //   easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        // },
        transform: CSS.Transform.toString(transform),
        // transform: transform && {
        //   transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        // },
      }),
      [transition, transform],
    );

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": childItem.id,
    };

    const children = useMemo(
      () => (
        <>
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
          <CardDragHandle childItemId={childItem.id} />
        </>
      ),
      [
        childItem.content,
        childItem.id,
        stateIsEditMode,
        cardContentEditDisableHandler,
        cardContentEditEnableHandler,
        cardContentEditFinishHandler,
        cardContentEditHandler,
      ],
    );

    return (
      <CardProvider value={cardContextValue}>
        <CardInternalBase
          ref={callbackRef}
          item={childItem}
          style={style}
          // {...draggableHandleListeners}
          {...draggableHandleAttributes}
          {...draggableCustomAttributes}
          {...otherProps}
        >
          {children}
        </CardInternalBase>
      </CardProvider>
    );
  },
});
