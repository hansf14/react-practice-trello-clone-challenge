import { css, styled } from "styled-components";
import { getEmptyArray, SmartOmit, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import React, { useImperativeHandle, useRef } from "react";
import {
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
  ParentItem,
} from "@/components/BoardContext";
import { DndDataInterface } from "@/components/BoardContext";
import { DraggableAttributes, useDndMonitor } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type BoardBaseProps = {
  isDragging?: boolean;
};

const BoardBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDragging"].includes(prop),
})<BoardBaseProps>`
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
`;

export type BoardProps = {
  item: ParentItem;
  children?: ({
    draggableHandleAttributes,
    draggableHandleListeners,
    draggableHandleCustomAttributes,
  }: {
    draggableHandleAttributes: DraggableAttributes;
    draggableHandleListeners: SyntheticListenerMap | undefined;
    draggableHandleCustomAttributes: Record<string, string>;
  }) => React.ReactNode;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: ({ item, children, ...otherProps }, ref) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const {
      setNodeRef,
      attributes: draggableHandleAttributes,
      listeners: draggableHandleListeners,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: item.id,
      data: {
        type: "parent",
        item,
      } satisfies DndDataInterface,
    });

    const style = {
      // transition,
      transition: "none",
      transform: CSS.Transform.toString(transform),
    };

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": item.id,
    };

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": item.id,
      };

    return (
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
          isDragging={isDragging}
          style={style}
          {...draggableCustomAttributes}
          {...otherProps}
        >
          {children?.({
            draggableHandleAttributes,
            draggableHandleListeners,
            draggableHandleCustomAttributes,
          })}
        </BoardBase>
      </SortableContext>
    );
  },
});
