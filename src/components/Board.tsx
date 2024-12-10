import { styled } from "styled-components";
import {
  isFunction,
  SmartOmit,
  StyledComponentProps,
  withMemoAndRef,
} from "@/utils";
import {
  boardClassNameKvMapping,
  ChildItem,
  ParentItem,
} from "@/components/BoardContext";
import {
  Draggable,
  DraggableProvided,
  DraggableProvidedDragHandleProps,
  DraggableRubric,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

const BoardBase = styled.div`
  flex-shrink: 0;
  height: 85%;
  width: min(100%, 300px);
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  // Glassmorphism
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(13.5px);
  -webkit-backdrop-filter: blur(13.5px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);

  // DragOverlay
  &.${boardClassNameKvMapping["board-sortable-drag"]} {
    opacity: 0.7 !important;
  }

  // Ghost
  &.${boardClassNameKvMapping["board-sortable-ghost"]} {
    opacity: 0.7;
    border: 2px solid yellow;
  }
`;

export type BoardPropsChildren = ({
  draggableProvidedDragHandleProps,
  draggableStateSnapshot,
  draggableRubric,
}: {
  draggableProvidedDragHandleProps: DraggableProvidedDragHandleProps | null;
  draggableStateSnapshot: DraggableStateSnapshot;
  draggableRubric: DraggableRubric;
}) => React.ReactNode;

export type BoardProps = {} & StyledComponentProps<"div">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: ({ ...otherProps }, ref) => {
    return <BoardBase ref={ref} {...otherProps}></BoardBase>;
  },
});
