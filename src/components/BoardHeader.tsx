import { useCallback, useContext, useImperativeHandle, useRef } from "react";
import { styled } from "styled-components";
import { GripVertical, ArrowClockwise } from "react-bootstrap-icons";
import { SmartOmit, StyledComponentProps } from "@/utils";
import {
  BoardContext,
  DraggableHandleCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  OnEditCancel,
  OnEditFinish,
  OnEditChange,
  OnEditStart,
  TextArea,
  TextAreaHandle,
  useTextArea,
} from "@/components/TextArea";

const BoardHeaderBase = styled.div``;

const BoardHeaderTitle = styled.h2`
  transform-style: preserve-3d;

  width: 100%;
  display: grid;

  text-align: center;
  font-weight: bold;
  font-size: 25px;
`;

const BoardHeaderTitleEditCancelButton = styled(ArrowClockwise)`
  transform: translateZ(10px);
  grid-column: 1;
  grid-row: 1;

  height: 47px;
  width: 35px;
  padding: 0 5px;
  cursor: pointer;
`;

const BoardHeaderTitleTextArea = styled(TextArea)`
  && {
    grid-column: 1;
    grid-row: 1;

    padding: 5px 32px;
    font-size: 22px;
    text-align: center;

    background-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 16px 0 rgba(31, 38, 135, 0.37);
    // backdrop-filter: blur(13.5px);
    // -webkit-backdrop-filter: blur(13.5px);
    // ㄴ 모바일 크롬에서 텍스트 드래그 선택 또는 텍스트 커서 깜빡일때 바로 전의 index draggable이 다른 색상으로 보이는(드래그시)/깜빡이는(커서 올려놓을 시) 버그 발생 => opacity로 대체

    opacity: 0.95;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
`;

const BoardHeaderDragHandleBase = styled.div`
  transform: translateZ(10px);
  grid-column: 1;
  grid-row: 1;

  height: 47px;
  padding-left: 10px;
  justify-self: end;

  display: flex;
  align-items: center;

  cursor: grab;
`;

export type BoardHeaderDragHandleProps = {
  boardListId: string;
  parentItemId: string;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const BoardHeaderDragHandle = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardHeaderDragHandleProps
>({
  displayName: "BoardHeaderDragHandle",
  Component: ({ boardListId, parentItemId, ...otherProps }, ref) => {
    const {
      setActivatorNodeRef,
      draggableHandleAttributes,
      draggableHandleListeners,
    } = useContext(BoardContext);

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
        "data-board-list-id": boardListId,
        "data-draggable-handle-id": parentItemId,
      };

    return (
      <BoardHeaderDragHandleBase
        ref={callbackRef}
        {...draggableHandleAttributes}
        {...draggableHandleListeners}
        {...draggableHandleCustomAttributes}
        {...otherProps}
      >
        <GripVertical />
      </BoardHeaderDragHandleBase>
    );
  },
});

export type BoardHeaderProps = {
  boardListId: string;
  parentItem: ParentItem;
  onEditStartItem?: OnEditStart;
  onEditCancelItem?: OnEditCancel;
  onEditingItem?: OnEditChange;
  onEditFinishItem?: OnEditFinish;
} & StyledComponentProps<"div">;

export const BoardHeader = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardHeaderProps
>({
  displayName: "BoardHeader",
  Component: (
    {
      boardListId,
      parentItem,
      onEditStartItem,
      onEditCancelItem,
      onEditingItem,
      onEditFinishItem,
      ...otherProps
    },
    ref,
  ) => {
    const {
      stateIsEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setStateIsEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEditModeEnabled,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEditModeDisabled,
      onEditStart,
      onEditCancel,
      onEditChange,
      onEditFinish,
    } = useTextArea({
      onEditStartItem,
      onEditCancelItem,
      onEditChangeItem: onEditingItem,
      onEditFinishItem,
    });
    const refBoardHeaderTitleTextArea = useRef<TextAreaHandle | null>(null);

    return (
      <BoardHeaderBase ref={ref} {...otherProps}>
        <BoardHeaderTitle>
          {stateIsEditMode && refBoardHeaderTitleTextArea.current && (
            <BoardHeaderTitleEditCancelButton
              onClick={refBoardHeaderTitleTextArea.current.dispatchEditCancel}
            />
          )}
          <BoardHeaderTitleTextArea
            ref={refBoardHeaderTitleTextArea}
            value={parentItem.title}
            onEditStart={onEditStart}
            onEditCancel={onEditCancel}
            onEditChange={onEditChange}
            onEditFinish={onEditFinish}
          />
          <BoardHeaderDragHandle
            boardListId={boardListId}
            parentItemId={parentItem.id}
          />
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  },
});
BoardHeader.displayName = "BoardHeader";
