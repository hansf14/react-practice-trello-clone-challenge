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
// import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/react/sortable";
import { closestCenter, pointerIntersection } from "@dnd-kit/collision";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import {
  CollisionPriority,
  Modifier,
  ModifierConstructor,
} from "@dnd-kit/abstract";
import {
  AutoScroller,
  DragDropManager,
  KeyboardSensor,
  PointerSensor,
  Scroller,
} from "@dnd-kit/dom";
import { useDroppable } from "@dnd-kit/react";

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

  &[data-dnd-placeholder] {
    opacity: 0.7 !important;
  }
`;

export type BoardProps = {
  item: ParentItem;
  index: number;
  children?: ({
    // draggableHandleAttributes,
    // draggableHandleListeners,
    setDraggableHandleRef,
    draggableHandleCustomAttributes,
  }: {
    setDraggableHandleRef: (el: HTMLElement | null) => void;
    // draggableHandleAttributes: DraggableAttributes;
    // draggableHandleListeners: SyntheticListenerMap | undefined;
    draggableHandleCustomAttributes: Record<string, string>;
  }) => React.ReactNode;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const Board = withMemoAndRef<"div", HTMLDivElement, BoardProps>({
  displayName: "Board",
  Component: ({ item, index, children, ...otherProps }, ref) => {
    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const {
      ref: setNodeRef,
      targetRef: setDroppableRef,
      sourceRef: setDraggableRef,
      handleRef: setDraggableHandleRef,
      isDragSource,
      isDropTarget,
      status,
    } = useSortable({
      id: item.id,
      index,
      // transition,
      // transition: {
      //   duration,
      //   easing,
      //   idle,
      // },
      // element,
      // handle,
      modifiers: [RestrictToHorizontalAxis as unknown as ModifierConstructor],
      sensors: [PointerSensor.configure({}), KeyboardSensor],
      // target,
      accept: ["parent", "child"] satisfies DndDataInterface["type"][],
      // collisionDetector,
      // collisionDetector: pointerIntersection,
      collisionDetector: closestCenter,
      // collisionPriority,
      disabled: false,
      data: item,
      // effects,
      // feedback,
      // group,
      // plugins,
      plugins: [AutoScroller], // Slows down the scroll speed
      type: "parent",
    });
    // https://next.dndkit.com/react/hooks/use-sortable

    // const style = {
    //   // transition,
    //   transition: "none",
    //   transform: CSS.Transform.toString(transform),
    // };

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": item.id,
    };

    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": item.id,
      };

    return (
      // <SortableContext items={item.items ?? getEmptyArray()}>
      <BoardBase
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            // Object.entries(draggableCustomAttributes).forEach(
            //   ([key, value]) => {
            //     el.setAttribute(key, value as string);
            //   },
            // );
            refBase.current = el;
            setDraggableRef(el);
            setDroppableRef(el);
          }
        }}
        isDragSource={isDragSource}
        // style={style}
        {...draggableCustomAttributes}
        {...otherProps}
      >
        {children?.({
          // draggableHandleAttributes,
          // draggableHandleListeners,
          setDraggableHandleRef,
          draggableHandleCustomAttributes,
        })}
      </BoardBase>
      // </SortableContext>
    );
  },
});
