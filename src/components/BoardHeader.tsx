import React, { useCallback, useRef, useState } from "react";
import { styled } from "styled-components";
import { useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { GripVertical } from "react-bootstrap-icons";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
import { StyledComponentProps, withMemoAndRef } from "@/utils";
import {
  boardDragHandlesAtom,
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
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

const BoardHeaderTitleInput = styled(TextArea)`
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

    &:not([readonly]):focus {
      outline: 2px solid yellow;
    }
  }
`;

const BoardDragHandle = styled.div`
  grid-column: 1;
  grid-row: 1;

  transform: translateZ(10px);
  height: 47px;
  padding-left: 10px;
  justify-self: end;

  display: flex;
  align-items: center;

  &.boards-container-sortable-handle {
    cursor: grab;
  }
`;

export type BoardHeaderProps = {
  parentItem: ParentItem;
  // onUpdateParent?: <P extends ParentItem>({
  //   newValue,
  // }: {
  //   newValue: P;
  // }) => void;
} & StyledComponentProps<"div">;

export const BoardHeader = withMemoAndRef<
  "div",
  HTMLDivElement,
  BoardHeaderProps
>({
  displayName: "BoardHeader",
  Component: ({ parentItem }, ref) => {
    const [stateIndexer, setStateIndexer] = useRecoilState(nestedIndexerAtom);
    const [stateIsEditMode, setStateIsEditMode] = useState<boolean>(false);

    const boardHeaderTitleEditEnableHandler = useCallback<
      React.MouseEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(true);
    }, []);

    const boardHeaderTitleEditDisableHandler = useCallback<
      React.FocusEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(false);
    }, []);

    const boardHeaderTitleEditFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >((event) => {
      if (event.key !== "Enter") {
        return;
      }
      setStateIsEditMode(false);
    }, []);

    const boardHeaderTitleEditHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        // console.log(event.target.value);
        setStateIndexer((curIndexer) => {
          const newIndexer = new NestedIndexer(curIndexer);
          newIndexer.updateParent({
            parentId: parentItem.id,
            parent: {
              id: parentItem.id,
              title: event.target.value,
            },
          });
          return newIndexer;
        });
      },
      [setStateIndexer, parentItem.id],
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
      <BoardHeaderBase ref={ref}>
        <BoardHeaderTitle>
          <BoardHeaderTitleInput
            value={parentItem.title}
            // autoFocus
            autoSize
            readOnly={!stateIsEditMode}
            onClick={boardHeaderTitleEditEnableHandler}
            onBlur={boardHeaderTitleEditDisableHandler}
            onKeyDown={boardHeaderTitleEditFinishHandler}
            onChange={boardHeaderTitleEditHandler}
          />
          <BoardDragHandle
            ref={refDragHandle}
            className="boards-container-sortable-handle"
          >
            <GripVertical />
          </BoardDragHandle>
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  },
});
BoardHeader.displayName = "BoardHeader";
