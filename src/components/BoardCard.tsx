import React, { useCallback, useImperativeHandle, useRef } from "react";
import { css, styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import {
  ChildItem,
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
} from "@/components/BoardContext";
import {
  memoizeCallback,
  SmartMerge,
  SmartOmit,
  StyledComponentProps,
} from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  TextArea,
  TextAreaExtendProps,
  TextAreaHandle,
  useTextArea,
} from "@/components/TextArea";
import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";

type BoardCardBaseProps = {
  isDragging?: boolean;
};

const BoardCardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<BoardCardBaseProps>`
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

const BoardCardContentTextArea = styled(TextArea)`
  && {
    font-weight: bold;
    font-size: 14px;
  }
`;

const BoardCardDragHandleBase = styled.div`
  display: inline-flex;
`;

export type BoardCardDragHandleProps = {
  boardListId: string;
  childItemId: string;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const BoardCardDragHandle = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardCardDragHandleProps
>({
  displayName: "BoardCardDragHandle",
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
      <BoardCardDragHandleBase
        ref={refBase}
        {...draggableHandleCustomAttributes}
        {...otherProps}
      >
        <GripVertical />
      </BoardCardDragHandleBase>
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

export type BoardCardProps = SmartMerge<
  {
    boardListId: string;
    childItem: ChildItem;
    index: number;
    droppableId: string;
    alertMessageOnEditStart?: string | null;
    isEditMode?: boolean;
  } & TextAreaExtendProps
> &
  SmartOmit<StyledComponentProps<"div">, "children">;

export const BoardCard = withMemoAndRef<"div", HTMLDivElement, BoardCardProps>({
  displayName: "BoardCard",
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
      onEditKeyDown,
      // onRemove: _onRemove,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const idBaseCbRef = useMemoizeCallbackId();
    const baseCbRef = useCallback(
      ({
        draggableProvidedInnerRef,
      }: {
        draggableProvidedInnerRef: DraggableProvided["innerRef"];
      }) =>
        memoizeCallback({
          id: idBaseCbRef,
          fn: (el: HTMLDivElement | null) => {
            refBase.current = el;
            draggableProvidedInnerRef(el);
          },
          deps: [draggableProvidedInnerRef, idBaseCbRef],
        }),
      [idBaseCbRef],
    );

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
            <BoardCardBase
              ref={baseCbRef({
                draggableProvidedInnerRef: draggableProvided.innerRef,
              })}
              isDragging={draggableStateSnapshot.isDragging}
              {...draggableProvided.draggableProps}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              <BoardCardContentTextArea
                ref={refCardContentTextArea}
                value={childItem.content}
                alertMessageOnEditStart={alertMessageOnEditStart}
                onEditStart={onEditStart}
                onEditCancel={onEditCancel}
                onEditChange={onEditChange}
                onEditFinish={onEditFinish}
                onEditKeyDown={onEditKeyDown}
              />
              <BoardCardDragHandle
                boardListId={boardListId}
                childItemId={childItem.id}
                {...draggableProvided.dragHandleProps}
                {...draggableHandleCustomAttributes}
              />
            </BoardCardBase>
          );
        }}
      </Draggable>
    );
  },
});
