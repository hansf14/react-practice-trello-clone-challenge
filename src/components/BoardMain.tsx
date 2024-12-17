import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExecutionProps, styled } from "styled-components";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { Category, Task } from "@/atoms";
import { Card } from "@/components/Card";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  checkHasScrollbar,
  generateUniqueRandomId,
  memoizeCallback,
  SmartOmit,
  StyledComponentProps,
} from "@/utils";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { CssScrollbar } from "@/csses/scrollbar";
import { throttle } from "lodash-es";
import {
  ChildItem,
  DataAttributesOfItem,
  DataAttributesOfItemList,
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  Droppable,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
const { TextArea } = Input;

const BoardMainBase = styled.div`
  min-height: 0;
  height: 100%;
  gap: 10px;
  display: flex;
  flex-direction: column;
`;

const BoardMainContentContainer = styled.div`
  min-height: 0;
  height: 100%;
  /* margin-top: 10px; */
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

const BoardMainContent = styled.div`
  ${CssScrollbar}

  max-width: 100%;
  /* margin-right: 10px; */
  /* padding-right: 10px; */

  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  // border: 1px solid white;

  &::-webkit-scrollbar {
    padding-right: 10px;
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

export const cardsContainerAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "cardsContainerAtom",
  default: {},
});

export type ForEachChildItem = ({
  // key,
  idx,
  item,
  items,
}: {
  // key: React.Key;
  idx: number;
  item: ChildItem;
  items: ChildItem[];
}) => React.ReactNode; //React.ReactElement<typeof Card>;

export type BoardMainProps = {
  boardListId: string;
  parentItem: ParentItem;
  children?: ({
    droppablePlaceholder,
    droppableStateSnapshot,
  }: {
    droppablePlaceholder: React.ReactNode;
    droppableStateSnapshot: DroppableStateSnapshot;
  }) => React.ReactNode;
} & SmartOmit<StyledComponentProps<"div">, "children">;

export const BoardMain = withMemoAndRef<"div", HTMLDivElement, BoardMainProps>({
  displayName: "BoardMain",
  Component: ({ boardListId, parentItem, children }, ref) => {
    // const setStateCardsContainer = useSetRecoilState(cardsContainerAtom);
    // const refCardsContainer = useRef<HTMLDivElement | null>(null);
    // useIsomorphicLayoutEffect(() => {
    //   if (refCardsContainer.current) {
    //     setStateCardsContainer((cur) => ({
    //       ...cur,
    //       [parentItem.id]: refCardsContainer.current,
    //     }));
    //   }
    // }, [parentItem.id, setStateCardsContainer]);

    // const taskList = useMemo<ChildItem[]>(
    //   () =>
    //     stateNestedIndexer.getChildListFromParentId__MutableChild({
    //       parentId: parentItem.id,
    //     }) ?? [],
    //   [parentItem.id, stateNestedIndexer],
    // );

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

    // const customDataAttributes: DataAttributesOfItemList = {
    //   "data-board-list-id": boardListId,
    //   "data-item-list-type": "children",
    //   "data-item-list-id": parentItem.id,
    // };

    return (
      <BoardMainBase ref={ref}>
        <BoardMainContentContainer>
          <Droppable
            droppableId={parentItem.id}
            direction="vertical"
            type="child"
          >
            {(droppableProvided, droppableStateSnapshot) => {
              return (
                <BoardMainContent
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  //  {...customDataAttributes}
                >
                  {children?.({
                    droppablePlaceholder: droppableProvided.placeholder,
                    droppableStateSnapshot,
                  })}
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
