import React, { useImperativeHandle, useRef } from "react";
import { Draggable, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { css, styled } from "styled-components";
import { SmartMerge, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  DraggableCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import { TextAreaPropsListeners, useTextArea } from "@/components/TextArea";
import { useRfd } from "@/hooks/useRfd";

type BoardBaseProps = {
  isDragging?: boolean;
};

const BoardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<BoardBaseProps>`
  margin: 0 5px;

  flex-shrink: 0;
  height: 85%;
  max-width: 300px;
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  // Glassmorphism
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  // backdrop-filter: blur(13.5px);
  // -webkit-backdrop-filter: blur(13.5px);
  // ㄴ 모바일 크롬 & 삼성인터넷 등 페이지 로드 되자마자 빠르게 오른쪽으로 스크롤 옮기면 backdrop-filter 적용된 element에 잔상이 크게 잠깐 보이는 버그가 있다.
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);

  ${({ isDragging }) => {
    return css`
      ${(isDragging ?? false)
        ? `
          border: 1px solid white;
          opacity: 1;
          background-color: #a9b8d1; //#526C97;
        `
        : ""}
    `;
  }}
`;

export type BoardChildren = ({
  draggableDragHandleProps,
  isEditMode,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditFinish,
}: {
  draggableDragHandleProps: DraggableProvidedDragHandleProps | null;
  isEditMode: boolean;
} & TextAreaPropsListeners) => React.ReactNode;

export type BoardProps = SmartMerge<
  {
    boardListId: string;
    parentItem: ParentItem;
    index: number;
    children: BoardChildren;
  } & TextAreaPropsListeners
> &
  SmartOmit<StyledComponentProps<"div">, "children">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: (
    {
      boardListId,
      parentItem,
      index,
      children,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const { cbRefForDraggable } = useRfd();

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

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-draggable-id": parentItem.id,
      "data-draggable-index": index.toString(),
      "data-droppable-id": boardListId,
    };

    return (
      <Draggable
        draggableId={parentItem.id}
        index={index}
        isDragDisabled={isEditMode}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
        {(draggableProvided, draggableStateSnapshot, draggableRubric) => {
          // console.log(draggableStateSnapshot.draggingOver); // trash-can-parent
          return (
            <BoardBase
              ref={cbRefForDraggable({
                refDraggable: refBase,
                draggableProvidedInnerRef: draggableProvided.innerRef,
              })}
              isDragging={draggableStateSnapshot.isDragging}
              {...draggableProvided.draggableProps}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              {children({
                draggableDragHandleProps: draggableProvided.dragHandleProps,
                isEditMode,
                onEditStart,
                onEditCancel,
                onEditChange,
                onEditFinish,
              })}
            </BoardBase>
          );
        }}
      </Draggable>
    );
  },
});
