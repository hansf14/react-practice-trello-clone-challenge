import React, { useImperativeHandle, useRef } from "react";
import { css, styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import {
  ChildItem,
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
} from "@/components/BoardContext";
import { SmartMerge, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  TextArea,
  TextAreaHandle,
  TextAreaPropsListeners as TextAreaPropsListeners,
  useTextArea,
} from "@/components/TextArea";
import { Draggable } from "@hello-pangea/dnd";

type CardBaseProps = {
  isDragging?: boolean;
};

const CardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<CardBaseProps>`
  margin: 5px 0;

  padding: 10px;
  background-color: rgba(255, 255, 255, 0.45);

  ${({ isDragging }) => {
    return css`
      ${(isDragging ?? false)
        ? `
          border: 1px solid white;
          opacity: 1;
          background-color: ghostwhite; //#526C97;
        `
        : ""}
    `;
  }}
`;

const CardContentTextArea = styled(TextArea)`
  && {
    font-weight: bold;
    font-size: 14px;
  }
`;

const CardDragHandleBase = styled.div`
  display: inline-flex;
`;

export type CardDragHandleProps = {
  boardListId: string;
  childItemId: string;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const CardDragHandle = withMemoAndRef<
  "div",
  HTMLDivElement,
  CardDragHandleProps
>({
  displayName: "CardDragHandle",
  Component: ({ boardListId, childItemId, ...otherProps }, ref) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-draggable-handle-id": childItemId,
      };

    return (
      <CardDragHandleBase
        ref={refBase}
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

export type CardProps = SmartMerge<
  {
    boardListId: string;
    childItem: ChildItem;
    index: number;
    droppableId: string;
    alertMessageOnEditStart?: string | null;
  } & TextAreaPropsListeners
> &
  SmartOmit<StyledComponentProps<"div">, "children">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: (
    {
      boardListId,
      childItem,
      index,
      droppableId,
      alertMessageOnEditStart,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
      onRemove: _onRemove,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-draggable-id": childItem.id,
      "data-draggable-index": index.toString(),
      "data-droppable-id": droppableId,
    };

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-draggable-handle-id": childItem.id,
      };

    const {
      isEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      disableEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      toggleEditMode,
      onEditStart,
      onEditCancel,
      onEditChange,
      onEditFinish,
    } = useTextArea({
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
    });
    const refCardContentTextArea = useRef<TextAreaHandle | null>(null);

    return (
      <Draggable
        draggableId={childItem.id}
        index={index}
        isDragDisabled={isEditMode}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
        {(draggableProvided, draggableStateSnapshot, draggableRubric) => {
          // console.log(draggableStateSnapshot.isDragging);
          // console.log(draggableStateSnapshot.draggingOver);
          // console.log(draggableRubric.draggableId);
          // console.log(draggableRubric.source);
          // console.log(draggableRubric.type);

          return (
            <CardBase
              ref={(el: HTMLDivElement | null) => {
                refBase.current = el;
                draggableProvided.innerRef(el);
              }}
              isDragging={draggableStateSnapshot.isDragging}
              {...draggableProvided.draggableProps}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              <CardContentTextArea
                ref={refCardContentTextArea}
                value={childItem.content}
                alertMessageOnEditStart={alertMessageOnEditStart}
                onEditStart={onEditStart}
                onEditCancel={onEditCancel}
                onEditChange={onEditChange}
                onEditFinish={onEditFinish}
              />
              <CardDragHandle
                boardListId={boardListId}
                childItemId={childItem.id}
                {...draggableProvided.dragHandleProps}
                {...draggableHandleCustomAttributes}
              />
            </CardBase>
          );
        }}
      </Draggable>
    );
  },
});
