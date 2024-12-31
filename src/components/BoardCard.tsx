import React, { useCallback, useImperativeHandle, useRef } from "react";
import { css, styled } from "styled-components";
import {
  ArrowClockwise,
  CheckLg,
  GripVertical,
  XCircleFill,
} from "react-bootstrap-icons";
import {
  ChildItem,
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
} from "@/components/BoardContext";
import { SmartMerge, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  TextArea,
  TextAreaExtendProps,
  TextAreaHandle,
  useTextArea,
} from "@/components/TextArea";
import { Draggable } from "@hello-pangea/dnd";
import { useRfd } from "@/hooks/useRfd";

type BoardCardBaseProps = {
  isDragging?: boolean;
};

const BoardCardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<BoardCardBaseProps>`
  margin: 5px 0;

  padding: 10px;
  background-color: rgba(255, 255, 255, 0.45);

  display: flex;
  flex-direction: column;
  gap: 3px;

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

    padding: 4px 6px;
  }
`;

const BoardCardControllers = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
`;

const BoardCardDragHandleBase = styled.div`
  grid-column: 1;
  display: inline-flex;
`;

const BoardCardDragHandleIcon = styled(GripVertical)`
  width: 20px;
  height: 30px;
`;

const BoardCardEditControllers = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
`;

const BoardCardEditFinishButton = styled(CheckLg)`
  height: 20px;
  width: 20px;
  cursor: pointer;

  fill: green;
`;

const BoardCardEditCancelButton = styled(ArrowClockwise)`
  height: 20px;
  width: 20px;
  cursor: pointer;

  fill: black;
`;

const BoardCardRemoveButton = styled(XCircleFill)`
  grid-column: 3;
  width: 20px;
  height: 20px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: #0e396f;
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
        <BoardCardDragHandleIcon />
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

export type OnRemoveCard = ({ childItemId }: { childItemId: string }) => void;

export type BoardCardProps = SmartMerge<
  {
    boardListId: string;
    childItem: ChildItem;
    droppableId: string;
    index: number;
    alertMessageOnRemoveCard?: string | null;
    onRemoveCard?: OnRemoveCard;
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
      alertMessageOnRemoveCard: _alertMessageOnRemoveCard,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
      onEditKeyDown,
      onRemoveCard: _onRemoveCard,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const { cbRefForDraggable, fixRfdBlurBugOnDragHandle } = useRfd();

    const alertMessageOnRemoveCard =
      typeof _alertMessageOnRemoveCard === "undefined"
        ? "Are you sure you want to remove the card?"
        : _alertMessageOnRemoveCard;

    const onRemoveCard = useCallback<React.MouseEventHandler>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        if (alertMessageOnRemoveCard !== null) {
          const result = confirm(alertMessageOnRemoveCard);
          if (!result) {
            return;
          }
        }
        _onRemoveCard?.({ childItemId: childItem.id });
      },
      [childItem.id, alertMessageOnRemoveCard, _onRemoveCard],
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
      initialIsEditMode: false,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
    });
    const refCardContentTextArea = useRef<TextAreaHandle | null>(null);

    const onFinishEditHandler = useCallback(() => {
      if (!refCardContentTextArea.current) {
        return;
      }
      refCardContentTextArea.current.dispatchEditFinish();
    }, []);

    const onEditCancelHandler = useCallback(() => {
      if (!refCardContentTextArea.current) {
        return;
      }
      refCardContentTextArea.current.dispatchEditCancel();
    }, []);

    const onBlur = useCallback(() => {
      if (isEditMode) {
        onEditCancelHandler();
      }
    }, [isEditMode, onEditCancelHandler]);

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
              ref={cbRefForDraggable({
                refDraggable: refBase,
                draggableProvidedInnerRef: draggableProvided.innerRef,
              })}
              isDragging={draggableStateSnapshot.isDragging}
              onBlur={onBlur}
              {...draggableProvided.draggableProps}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              <BoardCardContentTextArea
                ref={refCardContentTextArea}
                isEditMode={isEditMode}
                value={childItem.content}
                alertMessageOnEditStart={alertMessageOnEditStart}
                onEditStart={onEditStart}
                onEditCancel={onEditCancel}
                onEditChange={onEditChange}
                onEditFinish={onEditFinish}
                onEditKeyDown={onEditKeyDown}
              />
              <BoardCardControllers>
                <BoardCardDragHandle
                  boardListId={boardListId}
                  childItemId={childItem.id}
                  onPointerDown={fixRfdBlurBugOnDragHandle}
                  {...draggableProvided.dragHandleProps}
                  {...draggableHandleCustomAttributes}
                />
                {isEditMode && (
                  <BoardCardEditControllers>
                    <BoardCardEditFinishButton
                      onPointerDown={onFinishEditHandler} // Should use `onPointerDown`, not `onClick`. Because seems like the antd component TextArea uses stopPropagation under-the-hood on click
                    />
                    <BoardCardEditCancelButton
                      onPointerDown={onEditCancelHandler}
                    />
                  </BoardCardEditControllers>
                )}
                <BoardCardRemoveButton onClick={onRemoveCard} />
              </BoardCardControllers>
            </BoardCardBase>
          );
        }}
      </Draggable>
    );
  },
});
