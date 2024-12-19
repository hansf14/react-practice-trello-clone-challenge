import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
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
import { emptyFunction, StyledComponentProps } from "@/utils";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
const { TextArea } = Input;

const CardInternalBase = styled.div`
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

const CardDragHandleBase = styled.div`
  // &.${cardClassNameKvMapping["card-sortable-handle"]} {
  //   cursor: grab;
  // }
`;

export type CardContextValue = SyntheticListenerMap | undefined;
//  {
//   listeners: SyntheticListenerMap | undefined;
//   // setListeners: React.Dispatch<
//   //   React.SetStateAction<SyntheticListenerMap | undefined>
//   // >;
// }

// const CardContext = createContext<CardContextValue>({
//   listeners: undefined,
//   // setListeners: emptyFunction,
// });

const CardContext = createContext<CardContextValue>(undefined);

const CardProvider = ({
  value,
  children,
}: {
  value: CardContextValue;
  children: React.ReactNode;
}) => {
  // const [state, setState] = React.useState<CardContextValue>(value);

  // useEffect(() => {
  //   console.log("CardProvider - New Value:", value);
  //   setState(value);
  // }, [value]);

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

export type CardDragHandleProps = {
  childItemId: string;
} & StyledComponentProps<"div">;

export const CardDragHandle = withMemoAndRef<
  "div",
  HTMLDivElement,
  CardDragHandleProps
>({
  displayName: "CardDragHandle",
  Component: ({ childItemId, ...otherProps }, ref) => {
    const listeners = useContext(CardContext);
    const draggableHandleCustomAttributes: DraggableHandleCustomAttributesKvObj =
      {
        "data-draggable-handle-id": childItemId,
      };

    // console.log(listeners);

    return (
      <CardDragHandleBase
        ref={ref}
        {...listeners}
        {...draggableHandleCustomAttributes}
        {...otherProps}
      />
    );
  },
});

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
  item: ChildItem;
  // draggableHandleListeners: any;
  onUpdateChildItem?: OnUpdateChildItem;
} & StyledComponentProps<"div">;

export const Card = withMemoAndRef<"div", HTMLDivElement, CardProps>({
  displayName: "Card",
  Component: (
    {
      item,
      //  draggableHandleListeners,
      onUpdateChildItem,
      ...otherProps
    },
    ref,
  ) => {
    console.log("[CardBase]");

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
          oldChildItem: item,
          newChildItem: {
            id: item.id,
            content: event.target.value,
          },
        });
      },
      [item, onUpdateChildItem],
    );

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    // const {
    //   setNodeRef,
    //   attributes: draggableAttributes,
    //   listeners: draggableHandleListeners,
    //   transform,
    //   transition,
    //   isDragging,
    // } = useSortable({
    //   id: item.id,
    //   data: {
    //     type: "child",
    //     item,
    //   } satisfies DndDataInterface<"child">,
    // });

    // const style = {
    //   transition,
    //   // transition: "none",
    //   // transition: {
    //   //   duration: 150,
    //   //   easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    //   // },
    //   transform: CSS.Transform.toString(transform),
    //   // transform: transform && {
    //   //   transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    //   // },
    // };
    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": item.id,
    };

    return (
      <CardInternalBase
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            refBase.current = el;
            // setNodeRef(el);
          }
        }}
        // style={style}
        // {...draggableAttributes}
        {...draggableCustomAttributes}
        {...otherProps}
      >
        {/* {childItem.content} */}
        <CardContentInput
          value={item.content}
          // autoFocus
          autoSize
          readOnly={!stateIsEditMode}
          onClick={cardContentEditEnableHandler}
          onBlur={cardContentEditDisableHandler}
          onKeyDown={cardContentEditFinishHandler}
          onChange={cardContentEditHandler}
        />
        <CardDragHandle childItemId={item.id}>
          <GripVertical />
        </CardDragHandle>
      </CardInternalBase>
    );
  },
});

// When drag happens `SortableContext` value changes and triggers `useSortable` due to context change.
// -> When `useSortable` gets triggered, `listeners` value (`onMouseDown`, `onTouchStart`) change.
// -> Only because `listeners` prop changes, rendering the whole descendants is a waste.
// -> So  I separated the prone-to-change value (`listeners`) into a React Context. So that not the whole card get re-rendered, only the drag handle gets re-rendered with the new `listeners` attached.
// => That way, due to context change, it doesn't re-render unnecessary descendants re-rendering, since the props for this Internal Component (with React.memo) didn't change, only its handle gets re-rendered due to subscription to the React Context. It saves from unnecessary re-rendering of descendants.
export const A = withMemoAndRef<"div", HTMLDivElement, { item: ChildItem }>({
  displayName: "A",
  Component: ({ item, ...otherProps }, ref) => {
    const {
      setNodeRef,
      attributes: draggableAttributes,
      listeners: draggableHandleListeners,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: item.id,
      data: {
        type: "child",
        item: item,
      } satisfies DndDataInterface<"child">,
    });

    const style = useMemo(
      () => ({
        transition,
        // transition: "none",
        // transition: {
        //   duration: 150,
        //   easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        // },
        transform: CSS.Transform.toString(transform),
        // transform: transform && {
        //   transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        // },
      }),
      [transition, transform],
    );
    const draggableCustomAttributes: DraggableCustomAttributesKvObj = {
      "data-draggable-id": item.id,
    };

    const c = useCallback(
      (el: HTMLDivElement | null) => {
        // ref // TODO:
        setNodeRef(el);
      },
      [setNodeRef],
    );

    return (
      <CardProvider value={draggableHandleListeners}>
        <Card
          ref={c}
          item={item}
          // style={style}
          // {...draggableHandleListeners}
          {...draggableAttributes}
          {...draggableCustomAttributes}
          {...otherProps}
        />
      </CardProvider>
    );
  },
});
