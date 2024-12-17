import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import { GripVertical } from "react-bootstrap-icons";
import { Input } from "antd";
import {
  cardClassNameKvMapping,
  ChildItem,
  DndDataInterface,
  DraggableCustomAttributesKvObj,
  DraggableHandleCustomAttributesKvObj,
} from "@/components/BoardContext";
import { StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { Draggable } from "@hello-pangea/dnd";
const { TextArea } = Input;

// export const cardsAtom = atom<{
//   [id: string]: HTMLDivElement | null;
// }>({
//   key: "cardsAtom",
//   default: {},
// });

// export const cardDragHandlesAtom = atom<{
//   [id: string]: HTMLDivElement | null;
// }>({
//   key: "taskDragHandlesAtom",
//   default: {},
// });

const CardBase = styled.div`
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

const CardContentInput = styled(TextArea)`
  && {
    width: 100%;
    background-color: transparent;
    border: none;
    border-radius: 0;

    font-weight: bold;
    font-size: 14px;

    transition: none;

    &:not([readonly]) {
      outline: 2px solid yellow;
    }
  }
`;

const CardDragHandle = styled.div`
  &.${cardClassNameKvMapping["card-sortable-handle"]} {
    cursor: grab;
  }
`;

export type OnUpdateChildItem = <C extends ChildItem>({
  event,
  oldChildItem,
  newChildItem,
}: {
  event: React.ChangeEvent<HTMLTextAreaElement>;
  oldChildItem: C;
  newChildItem: C;
}) => void;

export type CardProps = {
  childItem: ChildItem;
  index: number;
  onUpdateChildItem?: OnUpdateChildItem;
} & StyledComponentProps<"div">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: ({ childItem, index, onUpdateChildItem, ...otherProps }, ref) => {
    console.log("[CardBase]");

    // const setStateCards = useSetRecoilState(cardsAtom);
    // const refCard = useRef<HTMLDivElement | null>(null);
    // useIsomorphicLayoutEffect(() => {
    //   if (refCard.current) {
    //     setStateCards((cur) => ({
    //       ...cur,
    //       [item.id]: refCard.current,
    //     }));
    //   }
    // }, [item.id, setStateCards]);

    // const setStateCardDragHandles = useSetRecoilState(cardDragHandlesAtom);
    // const refDragHandle = useRef<HTMLDivElement | null>(null);
    // useIsomorphicLayoutEffect(() => {
    //   if (refDragHandle.current) {
    //     setStateCardDragHandles((cur) => ({
    //       ...cur,
    //       [item.id]: refDragHandle.current,
    //     }));
    //   }
    // }, [item.id, setStateCardDragHandles]);

    const [stateIsEditMode, setStateIsEditMode] = useState<boolean>(false);

    const cardContentEditEnableHandler = useCallback<
      React.MouseEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(true);
    }, []);

    const cardContentEditDisableHandler = useCallback<
      React.FocusEventHandler<HTMLTextAreaElement>
    >(() => {
      setStateIsEditMode(false);
    }, []);

    const cardContentEditFinishHandler = useCallback<
      React.KeyboardEventHandler<HTMLTextAreaElement>
    >((event) => {
      if (event.key !== "Enter") {
        return;
      }
      setStateIsEditMode(false);
    }, []);

    const cardContentEditHandler = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        onUpdateChildItem?.({
          event,
          oldChildItem: childItem,
          newChildItem: {
            id: childItem.id,
            content: event.target.value,
          },
        });
      },
      [childItem, onUpdateChildItem],
    );

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": childItem.id,
    };
    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": childItem.id,
      };

    return (
      <Draggable
        draggableId={childItem.id}
        index={index}
        {...{ type: "child" }}
      >
        {(draggableProvided, draggableStateSnapshot, draggableRubric) => {
          return (
            <CardBase
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  // Object.entries(draggableCustomAttributes).forEach(
                  //   ([key, value]) => {
                  //     el.setAttribute(key, value as string);
                  //   },
                  // );
                  refBase.current = el;
                  // setNodeRef(el);
                  draggableProvided.innerRef(el);
                }
              }}
              {...draggableProvided.draggableProps}
              {...draggableCustomAttributes}
              {...otherProps}
            >
              {/* {childItem.content} */}
              <CardContentInput
                value={childItem.content}
                // autoFocus
                autoSize
                readOnly={!stateIsEditMode}
                onClick={cardContentEditEnableHandler}
                onBlur={cardContentEditDisableHandler}
                onKeyDown={cardContentEditFinishHandler}
                onChange={cardContentEditHandler}
              />
              <CardDragHandle
                {...draggableProvided.dragHandleProps}
                // ref={setDraggableHandleRef}
                // {...draggableHandleAttributes}
                // {...draggableHandleListeners}
                {...draggableHandleCustomAttributes}
              >
                <GripVertical />
              </CardDragHandle>
            </CardBase>
          );
        }}
      </Draggable>
    );
  },
});
