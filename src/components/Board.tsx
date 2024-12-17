import { css, styled } from "styled-components";
import { getEmptyArray, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import React, { useImperativeHandle, useRef } from "react";
import {
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import {
  Draggable,
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  Droppable,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";

type BoardBaseProps = {
  isDragSource?: boolean;
};

const BoardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragSource"].includes(prop),
})<BoardBaseProps>`
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

  ${({ isDragSource }) => {
    return css`
      ${(isDragSource ?? false)
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

  &:not(:last-child) {
    margin-right: 10px;
  }
`;

export type BoardProps = {
  parentItem: ParentItem;
  index: number;
  children?: ({
    draggableHandleProps,
    draggableStateSnapshot,
    draggableHandleCustomAttributes,
  }: {
    draggableHandleProps: DraggableProvidedDragHandleProps | null;
    draggableStateSnapshot: DraggableStateSnapshot;
    draggableHandleCustomAttributes: Record<string, string>;
  }) => React.ReactNode;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: ({ parentItem: item, index, children, ...otherProps }, ref) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": item.id,
    };

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": item.id,
      };

    return (
      <Draggable draggableId={item.id} index={index}>
        {(draggableProvided, draggableStateSnapshot, draggableRubric) =>
          // TODO: Rubric
          {
            return (
              <BoardBase
                ref={(el: HTMLDivElement | null) => {
                  if (el) {
                    refBase.current = el;
                    draggableProvided.innerRef(el);
                  }
                }}
                // isDragging={isDragging}
                // style={style}
                {...draggableProvided.draggableProps}
                {...draggableCustomAttributes}
                {...otherProps}
              >
                {children?.({
                  draggableHandleProps: draggableProvided.dragHandleProps,
                  draggableStateSnapshot,
                  draggableHandleCustomAttributes,
                })}
              </BoardBase>
            );
          }
        }
      </Draggable>
    );
  },
});

{
  /* </Draggable>
      <SortableContext items={item.items ?? getEmptyArray()}>
        <BoardBase
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              // Object.entries(draggableCustomAttributes).forEach(
              //   ([key, value]) => {
              //     el.setAttribute(key, value as string);
              //   },
              // );
              refBase.current = el;
              setNodeRef(el);
            }
          }}
          style={style}
          // isDragging={isDragging}
          // isDragSource={isDragSource}
          {...draggableCustomAttributes}
          {...otherProps}
        >
          {children?.({
            draggableHandleAttributes,
            draggableHandleListeners,
            draggableHandleCustomAttributes,
          })}
        </BoardBase>
      </SortableContext> */
}
