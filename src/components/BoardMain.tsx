import { useCallback, useMemo, useRef, useState } from "react";
import { css, styled } from "styled-components";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import { memoizeCallback, StyledComponentProps } from "@/utils";
import { Input } from "antd";
import {
  DraggablesContainerCustomAttributesKvObj,
  DroppableCustomAttributesKvObj,
  ParentItem,
  ScrollContainerCustomAttributesKvObj,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { Droppable } from "@hello-pangea/dnd";
import { getPlaceholder } from "@/hooks/useDragScroll";
import { TextAreaRef } from "antd/es/input/TextArea";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
const { TextArea } = Input;

const BoardMainBase = styled.div`
  height: 100%;
  min-height: 0;
  gap: 10px;
  display: flex;
  flex-direction: column;
`;

const BoardMainContentContainer = styled.div`
  overflow: hidden;
  min-height: 0;
  height: 100%;
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  // backdrop-filter: blur(13.5px);
  // ㄴ Causes bug in dnd-kit and @hello-pangea/dnd
  // https://github.com/clauderic/dnd-kit/issues/1256
`;

const BoardMainContent = styled.div`
  width: 100%;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;
`;

type BoardMainContentMinusMarginProps = {
  isDraggingOver?: boolean;
};

const BoardMainContentMinusMargin = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDraggingOver"].includes(prop),
})<BoardMainContentMinusMarginProps>`
  margin: -5px 10px -5px 0;
  height: 100%;

  display: flex;
  flex-direction: column;

  ${({ isDraggingOver }) => {
    return css`
      ${(isDraggingOver ?? false)
        ? `
        background-color: rgba(0, 0, 0, 0.1);
      `
        : ""}
    `;
  }}
`;

const ChildItemForm = styled.form`
  width: 100%;
  display: flex;
  gap: 8px;
`;

const ChildItemAdder = styled.div`
  flex-grow: 1;
`;

const ChildItemAdderInput = styled(TextArea)`
  && {
    height: 74px;
    border: none;
    border-radius: 0;
    font-weight: bold;
    font-size: 14px;

    resize: none;
    transition: none;

    background-color: rgb(204, 221, 223);
    color: black;
  }
`;

const ToolbarButtons = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
`;

const BoardControllers = styled.div`
  display: flex;
  gap: 3px;
`;

const ScrollDownButton = styled(ArrowDownCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: black;
`;

const ScrollUpButton = styled(ArrowUpCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: black;
  margin-left: -1px;
`;

const ChildItemAdderInputClearButton = styled(XCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: black;
  margin-left: -1px;
`;

const CardInputControllers = styled.div`
  display: flex;
  gap: 3px;
`;

const ChildItemAddButton = styled.button`
  all: unset;
`;

const ChildItemAddButtonIcon = styled(PlusCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: black;
`;

const ClearChildItemsButton = styled(XCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;

  clip-path: circle(48%);
  background-color: white;
  fill: red;
`;

export interface FormData {
  childItemContent: string;
}

export type OnClearChildItems = ({
  parentItemId,
}: {
  parentItemId: string;
}) => void;

export type OnAddChildItem = ({
  parentItemId,
  value,
}: {
  parentItemId: string;
  value: string;
}) => void;

export type BoardMainProps = {
  boardListId: string;
  parentItem: ParentItem;
  direction: "horizontal" | "vertical";
  childItemAdderInputScrollDownStepSize?: number;
  childItemAdderInputScrollDownBehavior?: ScrollBehavior;
  childItemAdderInputScrollUpStepSize?: number;
  childItemAdderInputScrollUpBehavior?: ScrollBehavior;
  onClearChildItems?: OnClearChildItems;
  onAddChildItemSuccess?: OnAddChildItem;
} & StyledComponentProps<"div">;

export const BoardMain = withMemoAndRef<"div", HTMLDivElement, BoardMainProps>({
  displayName: "BoardMain",
  Component: (
    {
      boardListId,
      parentItem,
      direction,
      childItemAdderInputScrollDownStepSize = 22,
      childItemAdderInputScrollDownBehavior = "smooth",
      childItemAdderInputScrollUpStepSize = 22,
      childItemAdderInputScrollUpBehavior = "smooth",
      onClearChildItems: _onClearChildItems,
      onAddChildItemSuccess: _onAddChildItemSuccess,
      children,
      ...otherProps
    },
    ref,
  ) => {
    const refChildItemAdderInput = useRef<TextAreaRef | null>(null);

    const childItemAdderInputScrollDownHandler = useCallback<
      React.MouseEventHandler<SVGElement>
    >(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        refChildItemAdderInput.current?.resizableTextArea?.textArea.scrollBy({
          top: childItemAdderInputScrollDownStepSize,
          behavior: childItemAdderInputScrollDownBehavior,
        });
      },
      [
        childItemAdderInputScrollDownStepSize,
        childItemAdderInputScrollDownBehavior,
      ],
    );

    const childItemAdderInputScrollUpHandler = useCallback<
      React.MouseEventHandler<SVGElement>
    >(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        refChildItemAdderInput.current?.resizableTextArea?.textArea.scrollBy({
          top: -childItemAdderInputScrollUpStepSize,
          behavior: childItemAdderInputScrollUpBehavior,
        });
      },
      [
        childItemAdderInputScrollUpStepSize,
        childItemAdderInputScrollUpBehavior,
      ],
    );

    const onClearChildItems = useCallback<React.MouseEventHandler<SVGElement>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        _onClearChildItems?.({ parentItemId: parentItem.id });
      },
      [parentItem.id, _onClearChildItems],
    );

    const {
      register,
      handleSubmit,
      // setValue,
      reset,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      formState: { errors },
    } = useForm<FormData>();

    const formRegisterProps = useMemo(() => {
      return register("childItemContent", {
        required: true,
      });
    }, [register]);
    const {
      ref: innerRef,
      onChange,
      ...otherFormRegisterProps
    } = formRegisterProps;

    const idOnClearChildItemInput = useMemoizeCallbackId();
    const onClearChildItemInput = useCallback(
      (params?: { shouldUseAlert?: boolean }) =>
        memoizeCallback({
          id: idOnClearChildItemInput,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fn: (event?: React.MouseEvent<SVGElement>) => {
            const { shouldUseAlert = true } = params ?? {};
            if (shouldUseAlert) {
              const result = confirm("Do you want to clear the input?");
              if (!result) {
                return;
              }
            }

            reset({
              childItemContent: "",
            });

            if (
              typeof refChildItemAdderInput.current?.resizableTextArea?.textArea
                .value === "undefined"
            ) {
              return;
            }

            setStateChildItemContent("");
            refChildItemAdderInput.current.focus();
          },
          deps: [params?.shouldUseAlert, idOnClearChildItemInput, reset],
        }),
      [idOnClearChildItemInput, reset],
    );

    const childItemAdderInputCbRef = (instance: TextAreaRef | null) => {
      refChildItemAdderInput.current = instance;
      innerRef(instance?.resizableTextArea?.textArea);
    };

    const [stateChildItemContent, setStateChildItemContent] =
      useState<string>("");

    const onValid = useCallback<SubmitHandler<FormData>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (data: FormData, event) => {
        console.log(data.childItemContent);

        _onAddChildItemSuccess?.({
          parentItemId: parentItem.id,
          value: data.childItemContent,
        });

        onClearChildItemInput({ shouldUseAlert: false })();
      },
      [parentItem.id, _onAddChildItemSuccess, onClearChildItemInput],
    );

    const onChangeChildItemInput = useCallback<
      React.ChangeEventHandler<HTMLTextAreaElement>
    >(
      (event) => {
        setStateChildItemContent(event.target.value);
        onChange(event);
      },
      [setStateChildItemContent, onChange],
    );

    const scrollContainerCustomAttributes: ScrollContainerCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-scroll-container-id": parentItem.id,
      };

    const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-droppable-id": parentItem.id,
    };

    const draggablesContainerCustomAttributes: DraggablesContainerCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-draggables-container-id": parentItem.id,
      };

    return (
      <BoardMainBase ref={ref} {...otherProps}>
        <BoardMainContentContainer>
          <Droppable
            droppableId={parentItem.id}
            direction={direction}
            type="child"
            ignoreContainerClipping={true}
            // ㄴ Allows the droppable to accept draggables even if the draggable is outside the visible bounds of the droppable container.
            // ㄴ Use Case: for scenarios where items might extend outside the container (e.g., nested scroll areas).

            // getContainerForClone={() => document.body}
            // ㄴ Specifies a custom DOM node where the clone of the draggable will be rendered. By default, the clone is rendered in the body.
            // ㄴUseful for scenarios where you need the clone to stay inside a specific container for styling or context isolation.

            // renderClone={(
            //   draggableProvided,
            //   draggableStateSnapshot,
            //   draggableRubric,
            // ) => {
            //   return (
            //     <div
            //       ref={draggableProvided.innerRef}
            //       {...draggableProvided.draggableProps}
            //       {...draggableProvided.dragHandleProps}
            //     >
            //       Custom Overlay
            //     </div>
            //   );
            // }}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
            {(droppableProvided, droppableStateSnapshot) => {
              // console.log(droppableStateSnapshot.draggingFromThisWith);
              // ㄴ This property in the snapshot object indicates the draggableId of the item being dragged from this droppable. It is null if no item is currently being dragged from this droppable.
              // ㄴ Use this to detect when a drag starts from the current droppable and customize behavior or appearance accordingly.

              // console.log(droppableStateSnapshot.draggingOverWith); // The `draggableId` of the item currently being dragged over the droppable.

              // console.log(droppableStateSnapshot.isDraggingOver); // true if a draggable is currently over the droppable area.

              // console.log(droppableStateSnapshot.isUsingPlaceholder);

              return (
                <BoardMainContent
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  {...droppableCustomAttributes}
                  {...scrollContainerCustomAttributes}
                >
                  <BoardMainContentMinusMargin
                    {...draggablesContainerCustomAttributes}
                    isDraggingOver={droppableStateSnapshot.isDraggingOver}
                  >
                    {children}
                    {getPlaceholder({
                      boardListId,
                      droppableId: parentItem.id,
                      placeholder: droppableProvided.placeholder,
                      gapVerticalLength: 10,
                    })}
                  </BoardMainContentMinusMargin>
                </BoardMainContent>
              );
            }}
          </Droppable>
        </BoardMainContentContainer>
        <ChildItemForm onSubmit={handleSubmit(onValid)}>
          <ChildItemAdder>
            <ChildItemAdderInput
              ref={childItemAdderInputCbRef}
              rows={3}
              placeholder={`Add a task on "${parentItem.title}"`}
              value={stateChildItemContent}
              onChange={onChangeChildItemInput}
              {...otherFormRegisterProps}
            />
          </ChildItemAdder>
          <ToolbarButtons>
            <BoardControllers>
              <ScrollDownButton
                onClick={childItemAdderInputScrollDownHandler}
              />
              <ScrollUpButton onClick={childItemAdderInputScrollUpHandler} />
              <ClearChildItemsButton onClick={onClearChildItems} />
            </BoardControllers>
            <CardInputControllers>
              <ChildItemAddButton as="button" type="submit">
                <ChildItemAddButtonIcon />
              </ChildItemAddButton>
              <ChildItemAdderInputClearButton
                onClick={onClearChildItemInput()}
              />
            </CardInputControllers>
          </ToolbarButtons>
        </ChildItemForm>
      </BoardMainBase>
    );
  },
});
BoardMain.displayName = "BoardMain";
