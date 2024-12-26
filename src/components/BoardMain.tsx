import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { styled } from "styled-components";
import { atom } from "recoil";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import { getEmptyArray, SmartOmit, StyledComponentProps } from "@/utils";
import { Input } from "antd";
import { CssScrollbar } from "@/csses/scrollbar";
import {
  ChildItem,
  DraggablesContainerCustomAttributesKvObj,
  DroppableCustomAttributesKvObj,
  ParentItem,
  ScrollContainerCustomAttributesKvObj,
  serializeAllowedTypes,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { Droppable } from "@hello-pangea/dnd";
import { MultiMap } from "@/multimap";
import { getPlaceholder, storeOfPlaceholderRefs } from "@/hooks/useDragScroll";
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
  /* margin-top: 10px; */
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  // backdrop-filter: blur(13.5px);
  // ㄴ Causes bug in dnd-kit
  // https://github.com/clauderic/dnd-kit/issues/1256
`;

const BoardMainContent = styled.div`
  ${CssScrollbar}

  width: 100%;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;
`;

const BoardMainContentMinusMargin = styled.div`
  margin: -5px 10px -5px 0;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

const BoardMainContentPlaceholderBase = styled.div`
  flex-grow: 1;
  height: 200px;

  min-height: 0px;
  // ㄴ 필수: 없으면 다른 Draggable Card 드래그시 DragGhost가 날라다닌다.

  pointer-events: none;
  touch-action: none;
  -webkit-touch-callout: none;

  &:not(:first-child) {
    margin-top: -10px;
  }
`;

const Toolbar = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
`;

const ChildItemAdder = styled.form`
  flex-grow: 1;
`;

const ChildItemAdderInput = styled(TextArea)`
  && {
    height: 56px;
    border: none;
    border-radius: 0;
    font-weight: bold;
    font-size: 14px;

    resize: none;
    transition: none;
  }
`;

const ToolbarButtons = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ScrollButtons = styled.div`
  display: flex;
`;

const ScrollDownButton = styled(ArrowDownCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const ScrollUpButton = styled(ArrowUpCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const TaskButtons = styled.div`
  display: flex;
`;

const ChildItemAddButton = styled(PlusCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const ChildItemAdderInputClearButton = styled(XCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

const ClearChildItemsButton = styled(XCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
  color: red;
  background-color: white;
  border-radius: 50%;
  overflow: hidden;
`;

export interface FormData {
  childItem: string;
}

export type BoardMainProps = {
  boardListId: string;
  parentItem: ParentItem;
} & StyledComponentProps<"div">;

export const BoardMain = withMemoAndRef<"div", HTMLDivElement, BoardMainProps>({
  displayName: "BoardMain",
  Component: ({ boardListId, parentItem, children, ...otherProps }, ref) => {
    // const [stateNestedIndexer, setNestedStateIndexer] =
    //   useRecoilState(nestedIndexerAtom);

    // const {
    //   register,
    //   handleSubmit,
    //   // setValue,
    //   reset,
    //   formState: { errors },
    // } = useForm<FormData>();
    // const [stateChildItemContent, setStateChildItemContent] =
    //   useState<string>("");

    // const onValid = useCallback<SubmitHandler<FormData>>(
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //   (data: FormData, event) => {
    //     console.log(data);

    //     setNestedStateIndexer((cur) => {
    //       const newItem = {
    //         id: generateUniqueRandomId(),
    //         content: data.childItem,
    //       } satisfies ChildItem;

    //       const newIndexer = new NestedIndexer(cur);
    //       newIndexer.createChild({
    //         parentId: parentItem.id,
    //         child: newItem,
    //         shouldAppend: false,
    //       });
    //       return newIndexer;
    //     });

    //     reset();
    //   },
    //   [parentItem.id, setNestedStateIndexer, reset],
    // );

    // const onChangeChildItemInput = useCallback<
    //   React.ChangeEventHandler<HTMLTextAreaElement>
    // >(
    //   (event) => {
    //     setStateChildItemContent(event.target.value);
    //   },
    //   [setStateChildItemContent],
    // );

    // const onClearChildItemInput = useCallback<
    //   React.MouseEventHandler<SVGElement>
    // >(() => {
    //   setStateChildItemContent("");
    // }, [setStateChildItemContent]);

    // const onAddChildItem = useCallback<React.MouseEventHandler<SVGElement>>(
    //   (event) => {
    //     setNestedStateIndexer((cur) => {
    //       const newItem = {
    //         id: generateUniqueRandomId(),
    //         content: stateChildItemContent,
    //       } satisfies ChildItem;
    //       const newIndexer = new NestedIndexer(cur);
    //       newIndexer.createChild({
    //         parentId: parentItem.id,
    //         child: newItem,
    //         shouldAppend: true,
    //       });
    //       return newIndexer;
    //     });
    //   },
    //   [parentItem.id, stateChildItemContent, setNestedStateIndexer],
    // );

    // const onClearChildItems = useCallback<
    //   React.MouseEventHandler<SVGElement>
    // >(() => {
    //   setNestedStateIndexer((cur) => {
    //     const newIndexer = new NestedIndexer(cur);
    //     newIndexer.clearChildListFromParentId({ parentId: parentItem.id });
    //     return newIndexer;
    //   });
    // }, [parentItem.id, setNestedStateIndexer]);

    // * ResizeObserver doesn't work for scrollHeight. It works for clientHeight.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const scrollDownHandler = useCallback<React.MouseEventHandler<SVGElement>>(
    //   (event) => {
    //     refCardsContainer.current?.scrollBy({
    //       top: 50,
    //       behavior: "smooth",
    //     });
    //   },
    //   [],
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const scrollUpHandler = useCallback<React.MouseEventHandler<SVGElement>>(
    //   (event) => {
    //     refCardsContainer.current?.scrollBy({
    //       top: -50,
    //       behavior: "smooth",
    //     });
    //   },
    //   [],
    // );

    const childIdList = useMemo(() => {
      // console.log("[childIdList]");
      return (parentItem.items ?? getEmptyArray<ChildItem>()).map(
        (parentItem) => parentItem.id ?? getEmptyArray<ParentItem>(),
      );
    }, [parentItem.items]);

    const scrollContainerCustomAttributes: ScrollContainerCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-scroll-container-id": parentItem.id,
        "data-scroll-container-allowed-types": serializeAllowedTypes({
          allowedTypes: ["child"],
        }),
      };

    const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-droppable-id": parentItem.id,
      "data-droppable-allowed-types": serializeAllowedTypes({
        allowedTypes: ["child"],
      }),
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
            direction="vertical"
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
                    style={{
                      position: "relative",
                    }}
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
        <Toolbar>
          <ChildItemAdder
          // onSubmit={handleSubmit(onValid)}
          >
            <ChildItemAdderInput
              rows={2}
              placeholder={`Add a task on ${parentItem.title}`}
              // {...register("childItem", {
              //   required: true,
              // })}
              // value={stateChildItemContent}
              // onChange={onChangeChildItemInput}
            />
          </ChildItemAdder>
          <ToolbarButtons>
            <ScrollButtons>
              <ScrollDownButton
              //  onClick={scrollDownHandler}
              />
              <ScrollUpButton
              // onClick={scrollUpHandler}
              />
              <ClearChildItemsButton
              // onClick={onClearChildItems}
              />
            </ScrollButtons>
            <TaskButtons>
              <ChildItemAddButton
              // onClick={onAddChildItem}
              />
              <ChildItemAdderInputClearButton
              //  onClick={onClearChildItemInput}
              />
            </TaskButtons>
          </ToolbarButtons>
        </Toolbar>
      </BoardMainBase>
    );
  },
});
BoardMain.displayName = "BoardMain";
