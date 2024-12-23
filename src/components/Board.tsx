import { css, CSSProperties, styled } from "styled-components";
import { StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  BoardContextValue,
  BoardContextProvider,
  DraggableCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import { DndDataInterfaceCustomGeneric } from "@/components/BoardContext";
import { Draggable } from "@hello-pangea/dnd";

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
        border: 2px solid yellow;
        opacity: 0.7;

        // [data-draggable-handle-id] {
        //   background-color: red;
        //   pointer-events: none;
        // }
        `
        : ""}
    `;
  }}

  &[data-drag-overlay] {
    opacity; 1;
    background-color: cornflowerblue;
    //#526C97;
  }
`;

export type BoardProps = {
  boardListId: string;
  parentItem: ParentItem;
  index: number;
  onUnmount?: () => void;
} & StyledComponentProps<"div">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: (
    { boardListId, parentItem, index, children, onUnmount, ...otherProps },
    ref,
  ) => {
    useEffect(() => {
      return () => {
        onUnmount?.();
      };
    }, [onUnmount]);
    // const sortableConfig = useMemo<UseSortableArguments>(
    //   () => ({
    //     id: parentItem.id,
    //
    //     data: {
    //       customData: {
    //         boardListId,
    //         type: "parent",
    //         item: parentItem,
    //       },
    //     } satisfies DndDataInterfaceCustomGeneric<"parent">,
    //   }),
    //   [boardListId, parentItem],
    // );

    // const {
    //   isDragging,
    //   setNodeRef,
    //   setActivatorNodeRef,
    //   attributes: draggableHandleAttributes,
    //   listeners: draggableHandleListeners,
    //   transform,
    //   transition,
    // } = useSortable(sortableConfig);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    // const callbackRef = useCallback(
    //   (el: HTMLDivElement | null) => {
    //     refBase.current = el;
    //     setNodeRef(el);
    //   },
    //   [setNodeRef],
    // );

    // const boardContextValue = useMemo<BoardContextValue>(
    //   () => ({
    //     setActivatorNodeRef,
    //     draggableHandleAttributes,
    //     draggableHandleListeners,
    //   }),
    //   [
    //     draggableHandleAttributes,
    //     draggableHandleListeners,
    //     setActivatorNodeRef,
    //   ],
    // );

    // const style = useMemo(
    //   () => ({
    //     transition: "none",
    //     transform: CSS.Transform.toString(transform),
    //   }),
    //   [transform],
    // );
    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-draggable-id": parentItem.id,
    };

    return (
      <Draggable
        draggableId={parentItem.id}
        index={index}
        // disabled // TODO: isEditMode
      >
        {(draggableProvided, draggableStateSnapshot, draggableRubric) => {
          return (
            <BoardBase
              ref={draggableProvided.innerRef}
              isDragging={draggableStateSnapshot.isDragging}
              {...draggableProvided.draggableProps}
              {...draggableProvided.dragHandleProps}
              // ref={callbackRef}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              {children}
            </BoardBase>
          );
        }}
      </Draggable>
    );
  },
});
