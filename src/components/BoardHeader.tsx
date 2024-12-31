import { useCallback, useContext, useImperativeHandle, useRef } from "react";
import { styled } from "styled-components";
import {
  GripVertical,
  ArrowClockwise,
  CheckLg,
  XCircleFill,
} from "react-bootstrap-icons";
import { SmartMerge, SmartOmit, StyledComponentProps } from "@/utils";
import {
  BoardContext,
  DraggableHandleCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  TextArea,
  TextAreaHandle,
  TextAreaExtendProps,
} from "@/components/TextArea";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { useRfd } from "@/hooks/useRfd";
import { useClickAway } from "react-use";

const BoardHeaderBase = styled.div``;

const BoardHeaderTitle = styled.h2`
  transform-style: preserve-3d;

  width: 100%;
  display: grid;

  text-align: center;
  font-weight: bold;
  font-size: 25px;
`;

const BoardHeaderTitleEditControllers = styled.div`
  transform: translateZ(10px);
  grid-column: 1;
  grid-row: 1;

  width: min-content;
  padding: 8px 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BoardHeaderTitleEditFinishButton = styled(CheckLg)`
  height: 30px;
  width: 30px;
  cursor: pointer;

  fill: green;
`;

const BoardHeaderTitleEditCancelButton = styled(ArrowClockwise)`
  height: 26px;
  width: 26px;
  cursor: pointer;
  margin-left: 2px;

  fill: black;
`;

const BoardHeaderTitleTextArea = styled(TextArea)`
  &&& {
    grid-column: 1;
    grid-row: 1;

    padding: 5px 38px;
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

    min-height: 81px;
    max-height: 116px;

    &::-webkit-scrollbar-track {
      border-radius: 0 3px 3px 0;
    }
  }
`;

const BoardHeaderBoardControllers = styled.div`
  grid-column: 1;
  grid-row: 1;
  justify-self: flex-end;

  width: min-content;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
`;

const BoardHeaderBoardRemoveButton = styled(XCircleFill)`
  height: 20px;
  width: 20px;
  cursor: pointer;
  margin: 0 5px 5px 0;

  clip-path: circle(48%);
  background-color: white;
  fill: #0e396f;
`;

const BoardHeaderDragHandleBase = styled.div`
  transform: translateZ(10px);

  height: 47px;
  padding: 0 3px;
  justify-self: end;

  display: flex;
  align-items: center;
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
    const { setActivatorNodeRef } = useContext(BoardContext);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const baseCbRef = useCallback(
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
        ref={baseCbRef}
        {...draggableHandleCustomAttributes}
        {...otherProps}
      >
        <GripVertical />
      </BoardHeaderDragHandleBase>
    );
  },
});

export type OnRemoveBoard = ({
  parentItemId,
}: {
  parentItemId: string;
}) => void;

export type BoardHeaderProps = SmartMerge<
  {
    boardListId: string;
    parentItem: ParentItem;
    draggableDragHandleProps: DraggableProvidedDragHandleProps | null;
    alertMessageOnRemoveBoard?: string | null;
    onRemoveBoard?: OnRemoveBoard;
  } & TextAreaExtendProps
> &
  StyledComponentProps<"div">;

export type BoardHeaderHandle = {
  baseElement: HTMLDivElement | null;
  boardHeaderTitleElement: HTMLHeadingElement | null;
  boardHeaderTitleTextAreaInstance: TextAreaHandle | null;
  boardHeaderDragHandleElement: HTMLDivElement | null;
};

export const BoardHeader = withMemoAndRef<
  "div",
  BoardHeaderHandle,
  BoardHeaderProps
>({
  displayName: "BoardHeader",
  Component: (
    {
      boardListId,
      parentItem,
      draggableDragHandleProps,
      alertMessageOnEditStart,
      alertMessageOnRemoveBoard: _alertMessageOnRemoveBoard,
      isEditMode = false,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
      onEditKeyDown: _onEditKeyDown,
      onRemoveBoard: _onRemoveBoard,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    const refBoardHeaderTitle = useRef<HTMLHeadingElement | null>(null);
    const refBoardHeaderTitleTextArea = useRef<TextAreaHandle | null>(null);
    const refBoardHeaderDragHandle = useRef<HTMLDivElement | null>(null);

    const { fixRfdBlurBugOnDragHandle } = useRfd();

    useImperativeHandle(ref, () => {
      return {
        baseElement: refBase.current,
        boardHeaderTitleElement: refBoardHeaderTitle.current,
        boardHeaderTitleTextAreaInstance: refBoardHeaderTitleTextArea.current,
        boardHeaderDragHandleElement: refBoardHeaderDragHandle.current,
      } satisfies BoardHeaderHandle;
    });

    const onFinishEdit = useCallback(() => {
      console.log("[onFinishEdit]", refBoardHeaderTitleTextArea.current);
      if (!refBoardHeaderTitleTextArea.current) {
        return;
      }
      refBoardHeaderTitleTextArea.current.dispatchEditFinish();
    }, []);

    const onEditCancel = useCallback(() => {
      console.log("[onEditCancel]", refBoardHeaderTitleTextArea.current);
      if (!refBoardHeaderTitleTextArea.current) {
        return;
      }
      refBoardHeaderTitleTextArea.current.dispatchEditCancel();
    }, []);

    const onClickAway = useCallback(() => {
      if (isEditMode) {
        // console.log("[onBlur]");
        onEditCancel();
      }
    }, [isEditMode, onEditCancel]);

    useClickAway(refBoardHeaderTitle, onClickAway, ["click"]);

    const alertMessageOnRemoveBoard =
      typeof _alertMessageOnRemoveBoard === "undefined"
        ? "Are you sure you want to remove the board?"
        : _alertMessageOnRemoveBoard;

    const onRemoveBoard = useCallback<React.MouseEventHandler>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        if (alertMessageOnRemoveBoard !== null) {
          const result = confirm(alertMessageOnRemoveBoard);
          if (!result) {
            return;
          }
        }
        _onRemoveBoard?.({ parentItemId: parentItem.id });
      },
      [parentItem.id, alertMessageOnRemoveBoard, _onRemoveBoard],
    );

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-draggable-handle-id": parentItem.id,
      };

    return (
      <BoardHeaderBase ref={refBase} {...otherProps}>
        <BoardHeaderTitle ref={refBoardHeaderTitle}>
          {isEditMode && (
            <BoardHeaderTitleEditControllers>
              <BoardHeaderTitleEditFinishButton onClick={onFinishEdit} />
              <BoardHeaderTitleEditCancelButton onClick={onEditCancel} />
            </BoardHeaderTitleEditControllers>
          )}
          <BoardHeaderTitleTextArea
            ref={refBoardHeaderTitleTextArea}
            isEditMode={isEditMode}
            value={parentItem.title}
            alertMessageOnEditStart={alertMessageOnEditStart}
            onEditStart={_onEditStart}
            onEditCancel={_onEditCancel}
            onEditChange={_onEditChange}
            onEditFinish={_onEditFinish}
            onEditKeyDown={_onEditKeyDown}
          />
          {!isEditMode && (
            <BoardHeaderBoardControllers>
              <BoardHeaderDragHandle
                ref={refBoardHeaderDragHandle}
                boardListId={boardListId}
                parentItemId={parentItem.id}
                onPointerDown={fixRfdBlurBugOnDragHandle}
                {...draggableDragHandleProps}
                {...draggableHandleCustomAttributes}
              />
              <BoardHeaderBoardRemoveButton onPointerDown={onRemoveBoard} />
            </BoardHeaderBoardControllers>
          )}
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  },
});
BoardHeader.displayName = "BoardHeader";
