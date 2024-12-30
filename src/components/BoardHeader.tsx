import { useCallback, useContext, useImperativeHandle, useRef } from "react";
import { styled } from "styled-components";
import { GripVertical, ArrowClockwise, CheckLg } from "react-bootstrap-icons";
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
  OnEditKeyDownCbs,
} from "@/components/TextArea";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

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

  fill: black; // #ce241b;
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

    &:not([readonly]) {
      min-height: 81px;
    }
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
      // draggableHandleAttributes,
      // draggableHandleListeners,
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
        // {...draggableHandleAttributes}
        // {...draggableHandleListeners}
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
  draggableDragHandleProps: DraggableProvidedDragHandleProps | null;
  alertMessageOnEditStart?: string | null;
  isEditMode?: boolean;
  onEditKeyDownCbs?: OnEditKeyDownCbs | null;
  onEditStart?: OnEditStart;
  onEditCancel?: OnEditCancel;
  onEditChange?: OnEditChange;
  onEditFinish?: OnEditFinish;
} & StyledComponentProps<"div">;

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
      isEditMode = false,
      onEditKeyDownCbs,
      onEditStart: _onEditStart,
      onEditCancel: _onEditCancel,
      onEditChange: _onEditChange,
      onEditFinish: _onEditFinish,
      ...otherProps
    },
    ref,
  ) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    const refBoardHeaderTitle = useRef<HTMLHeadingElement | null>(null);
    const refBoardHeaderTitleTextArea = useRef<TextAreaHandle | null>(null);
    const refBoardHeaderDragHandle = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => {
      return {
        baseElement: refBase.current,
        boardHeaderTitleElement: refBoardHeaderTitle.current,
        boardHeaderTitleTextAreaInstance: refBoardHeaderTitleTextArea.current,
        boardHeaderDragHandleElement: refBoardHeaderDragHandle.current,
      } satisfies BoardHeaderHandle;
    });

    const onFinishEdit = useCallback<React.PointerEventHandler<SVGElement>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        // console.log("[onFinishEdit]", refBoardHeaderTitleTextArea.current);
        if (!refBoardHeaderTitleTextArea.current) {
          return;
        }
        refBoardHeaderTitleTextArea.current.dispatchEditFinish();
      },
      [],
    );

    const onEditCancel = useCallback<React.PointerEventHandler<SVGElement>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        // console.log("[onEditCancel]", refBoardHeaderTitleTextArea.current);

        if (!refBoardHeaderTitleTextArea.current) {
          return;
        }
        refBoardHeaderTitleTextArea.current.dispatchEditCancel();
      },
      [],
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
              {/* Because the antd component TextArea uses stopPropagation under-the-hood on click, we have to use `onPointerDown` instead of `onClick`. */}
              <BoardHeaderTitleEditFinishButton onPointerDown={onFinishEdit} />
              <BoardHeaderTitleEditCancelButton onPointerDown={onEditCancel} />
            </BoardHeaderTitleEditControllers>
          )}
          <BoardHeaderTitleTextArea
            ref={refBoardHeaderTitleTextArea}
            value={parentItem.title}
            alertMessageOnEditStart={alertMessageOnEditStart}
            onEditKeyDownCbs={onEditKeyDownCbs}
            onEditStart={_onEditStart}
            onEditCancel={_onEditCancel}
            onEditChange={_onEditChange}
            onEditFinish={_onEditFinish}
          />
          <BoardHeaderDragHandle
            ref={refBoardHeaderDragHandle}
            boardListId={boardListId}
            parentItemId={parentItem.id}
            {...draggableDragHandleProps}
            {...draggableHandleCustomAttributes}
          />
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  },
});
BoardHeader.displayName = "BoardHeader";
