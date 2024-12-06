import React, { useCallback, useRef, useState } from "react";
import { ExecutionProps, styled } from "styled-components";
import { atom, useRecoilState } from "recoil";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { GripVertical } from "react-bootstrap-icons";
import { Category, indexerCategoryTaskAtom } from "@/atoms";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
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

  // Handle
  &.board-sortable-handle {
    cursor: grabbing;
  }
`;

export const boardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "categoryDragHandlesAtom",
  default: {},
});

export type BoardHeaderProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardHeader = React.memo(
  React.forwardRef<HTMLDivElement, BoardHeaderProps>(({ category }, ref) => {
    const [stateIndexerCategoryTask, setStateIndexerCategoryTask] =
      useRecoilState(indexerCategoryTaskAtom);
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
        setStateIndexerCategoryTask((curIndexer) => {
          const newIndexer = new NestedIndexer(curIndexer);
          newIndexer.updateParent({
            parentId: category.id,
            parent: {
              id: category.id,
              text: event.target.value,
            },
          });
          return newIndexer;
        });
      },
      [setStateIndexerCategoryTask, category.id],
    );

    const [stateBoardDragHandles, setStateBoardDragHandles] =
      useRecoilState(boardDragHandlesAtom);
    const refDragHandle = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refDragHandle.current) {
        setStateBoardDragHandles((cur) => ({
          ...cur,
          [category.id]: refDragHandle.current,
        }));
      }
    }, [category.id, setStateBoardDragHandles]);

    return (
      <BoardHeaderBase ref={ref}>
        <BoardHeaderTitle>
          <BoardHeaderTitleInput
            value={category.text}
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
            className="board-sortable-handle"
          >
            <GripVertical />
          </BoardDragHandle>
        </BoardHeaderTitle>
      </BoardHeaderBase>
    );
  }),
);
BoardHeader.displayName = "BoardHeader";
