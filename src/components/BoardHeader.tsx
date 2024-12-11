import React, { useCallback, useRef, useState } from "react";
import { styled } from "styled-components";
import { useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { GripVertical, XCircleFill } from "react-bootstrap-icons";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
import { StyledComponentProps, withMemoAndRef } from "@/utils";
import {
  boardClassNameKvMapping,
  boardDragHandlesAtom,
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
import { useStateWithCb } from "@/hooks/useStateWithCb";
import { TextAreaRef } from "antd/es/input/TextArea";
const { TextArea } = Input;

const BoardHeaderBase = styled.div``;

const BoardHeaderTitle = styled.h2`
  transform-style: preserve-3d;

  width: 100%;
  display: grid;

  text-align: center;
  font-weight: bold;
  font-size: 25px;
`;

const BoardHeaderTitleEditCancelButton = styled(XCircleFill)`
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

    width: 100%;
    padding: 5px 32px;
    background-color: transparent;
    border: none;
    border-radius: 0;

    font-weight: bold;
    font-size: 22px;
    text-align: center;

    background-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    backdrop-filter: blur(13.5px);
    -webkit-backdrop-filter: blur(13.5px);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.18);

    transition: none;

    &:not([readonly]) {
      outline: 2px solid yellow;
    }
  }
`;

const BoardDragHandle = styled.div`
  transform: translateZ(10px);
  grid-column: 1;
  grid-row: 1;

  height: 47px;
  padding-left: 10px;
  justify-self: end;

  display: flex;
  align-items: center;
`;

export type OnEditStartParentItem = ({
  elementTextArea,
  handlers,
}: {
  elementTextArea: TextAreaRef;
  handlers: {
    editCancelHandler: () => void;
  };
}) => void;

export type OnEditCancelParentItem = () => void;

export type OnEditingParentItem = <P extends ParentItem>({
  event,
  oldParentItem,
  newParentItem,
}: {
  event: React.ChangeEvent<HTMLTextAreaElement>;
  oldParentItem: P;
  newParentItem: P;
}) => void;

export type OnEditFinishParentItem = <P extends ParentItem>({
  oldParentItem,
  newParentItem,
}: {
  oldParentItem: P;
  newParentItem: P;
}) => void;

export type BoardHeaderProps = {
  parentItem: ParentItem;
  onEditStartParentItem?: OnEditStartParentItem;
  onEditCancelParentItem?: OnEditCancelParentItem;
  onEditingParentItem?: OnEditingParentItem;
  onEditFinishParentItem?: OnEditFinishParentItem;
} & StyledComponentProps<"div">;

export const BoardHeader = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardHeaderProps
>({
  displayName: "BoardHeader",
  Component: (
    {
      parentItem,
      onEditStartParentItem,
      onEditCancelParentItem,
      onEditingParentItem,
      onEditFinishParentItem,
      ...otherProps
    },
    ref,
  ) => {
    const refBoardHeaderTitleTextArea = useRef<TextAreaRef>(null);
    const { state: stateIsEditMode, setState: setStateIsEditMode } =
      useStateWithCb<boolean>({
        initialState: false,
      });
    const [stateParentItemTitle, setStateParentItemTitle] = useState<string>(
      parentItem.title,
    );
    const refParentItemTitleBackup = useRef<string>(parentItem.title);

    const boardHeaderTitleEditCancelHandler = useCallback<
      React.MouseEventHandler<SVGElement>
    >(
      (event) => {
        setStateIsEditMode({ newStateOrSetStateAction: false });
        setStateParentItemTitle(refParentItemTitleBackup.current);

        onEditCancelParentItem?.();
      },
      [setStateIsEditMode, onEditCancelParentItem],
    );

    const boardHeaderTitleEditEnableHandler = useCallback<
      React.MouseEventHandler<TextAreaRef>
    >(
      (event) => {
        setStateIsEditMode({
          newStateOrSetStateAction: true,
          cb: () => {
            if (!refBoardHeaderTitleTextArea.current) {
              return;
            }
            onEditStartParentItem?.({
              elementTextArea: refBoardHeaderTitleTextArea.current,
              handlers: {
                editCancelHandler:
                  boardHeaderTitleEditCancelHandler as () => void,
              },
            });
          },
        });
      },
      [
        setStateIsEditMode,
        onEditStartParentItem,
        boardHeaderTitleEditCancelHandler,
      ],
    );

    const boardHeaderTitleEditHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        setStateParentItemTitle(event.target.value);

        onEditingParentItem?.({
          event,
          oldParentItem: parentItem,
          newParentItem: {
            id: parentItem.id,
            title: event.target.value,
          },
        });
      },
      [parentItem, onEditingParentItem],
    );

    const boardHeaderTitleEditFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        if (event.key !== "Enter") {
          return;
        }
        setStateIsEditMode({ newStateOrSetStateAction: false });
        refParentItemTitleBackup.current = stateParentItemTitle;

        onEditFinishParentItem?.({
          oldParentItem: parentItem,
          newParentItem: {
            id: parentItem.id,
            title: stateParentItemTitle,
          },
        });
      },
      [
        parentItem,
        stateParentItemTitle,
        setStateIsEditMode,
        onEditFinishParentItem,
      ],
    );

    const [stateBoardDragHandles, setStateBoardDragHandles] =
      useRecoilState(boardDragHandlesAtom);
    const refDragHandle = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refDragHandle.current) {
        setStateBoardDragHandles((cur) => ({
          ...cur,
          [parentItem.id]: refDragHandle.current,
        }));
      }
    }, [parentItem.id, setStateBoardDragHandles]);

    return (
      <BoardHeaderBase ref={ref} {...otherProps}>
        <BoardHeaderTitle>
          {stateIsEditMode && (
            <BoardHeaderTitleEditCancelButton
              onClick={boardHeaderTitleEditCancelHandler}
            />
          )}
          <BoardHeaderTitleTextArea
            ref={refBoardHeaderTitleTextArea}
            value={stateParentItemTitle}
            // autoFocus
            autoSize
            readOnly={!stateIsEditMode}
            onClick={boardHeaderTitleEditEnableHandler}
            onKeyDown={boardHeaderTitleEditFinishHandler}
            onChange={boardHeaderTitleEditHandler}
          />
          <BoardDragHandle
            ref={refDragHandle}
            className={boardClassNameKvMapping["board-sortable-handle"]}
          >
            <GripVertical />
          </BoardDragHandle>
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  },
});
BoardHeader.displayName = "BoardHeader";
