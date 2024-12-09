import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ExecutionProps, styled } from "styled-components";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { Category, Task } from "@/atoms";
import { Card } from "@/components/Card";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import {
  ArrowDownCircleFill,
  ArrowUpCircleFill,
  PlusCircleFill,
} from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  checkHasScrollbar,
  generateUniqueRandomId,
  memoizeCallback,
  StyledComponentProps,
  withMemoAndRef,
} from "@/utils";
import { NestedIndexer } from "@/indexer";
import { Input } from "antd";
import { useMemoizeCallbackId } from "@/hooks/useMemoizeCallbackId";
import { CssScrollbar } from "@/css/scrollbar";
import { throttle } from "lodash-es";
import {
  ChildItem,
  DataAttributesOfItem,
  DataAttributesOfItemList,
  nestedIndexerAtom,
  ParentItem,
} from "@/components/BoardContext";
const { TextArea } = Input;

const BoardMainBase = styled.div`
  contain: size;
  height: 100%;
  gap: 10px;
  display: flex;
  flex-direction: column;
`;

const BoardMainContentContainer = styled.div`
  overflow: hidden;
  height: 100%;
  /* margin-top: 10px; */
  padding: 10px;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

const BoardMainContent = styled.div`
  ${CssScrollbar}

  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toolbar = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
`;

const TaskAdder = styled.form`
  flex-grow: 1;
`;

const TaskAdderInput = styled(TextArea)`
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
  gap: 6px;
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
  justify-content: center;
`;

const TaskAddButton = styled(PlusCircleFill)`
  width: 25px;
  height: 25px;
  cursor: pointer;
`;

export interface FormData {
  taskText: string;
}

export const cardsContainerAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "cardsContainerAtom",
  default: {},
});

export type ForEachChildItem = ({
  idx,
  item,
  items,
}: {
  idx: number;
  item: ChildItem;
  items: ChildItem[];
}) => React.ReactElement<typeof Card>;

export type BoardMainProps = {
  boardListId: string;
  forEachChildItem: ForEachChildItem;
  parentItem: ParentItem;
} & StyledComponentProps<"div">;

export const BoardMain = withMemoAndRef<"div", HTMLDivElement, BoardMainProps>({
  displayName: "BoardMain",
  Component: ({ boardListId, parentItem, forEachChildItem }, ref) => {
    const [stateNestedIndexer, setNestedStateIndexer] =
      useRecoilState(nestedIndexerAtom);

    const setStateCardsContainer = useSetRecoilState(cardsContainerAtom);
    const refCardsContainer = useRef<HTMLDivElement | null>(null);
    useIsomorphicLayoutEffect(() => {
      if (refCardsContainer.current) {
        setStateCardsContainer((cur) => ({
          ...cur,
          [parentItem.id]: refCardsContainer.current,
        }));
      }
    }, [parentItem.id, setStateCardsContainer]);

    const taskList = useMemo<ChildItem[]>(
      () =>
        stateNestedIndexer.getChildListFromParentId__MutableChild({
          parentId: parentItem.id,
        }) ?? [],
      [parentItem.id, stateNestedIndexer],
    );

    const {
      register,
      handleSubmit,
      // setValue,
      reset, // setValue("taskText", "")
      formState: { errors },
    } = useForm<FormData>();

    const onValid = useCallback<SubmitHandler<FormData>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (data: FormData, event) => {
        // console.log(data);

        setNestedStateIndexer((cur) => {
          const newItem = {
            id: generateUniqueRandomId(),
            content: data.taskText,
          } satisfies ChildItem;

          const newIndexer = new NestedIndexer(cur);
          newIndexer.createChild({
            parentId: parentItem.id,
            child: newItem,
            shouldAppend: false,
          });
          return newIndexer;
        });

        reset();
      },
      [parentItem.id, setNestedStateIndexer, reset],
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scrollDownHandler = useCallback<React.MouseEventHandler>((event) => {
      refCardsContainer.current?.scrollBy({
        top: 50,
        behavior: "smooth",
      });
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scrollUpHandler = useCallback<React.MouseEventHandler>((event) => {
      refCardsContainer.current?.scrollBy({
        top: -50,
        behavior: "smooth",
      });
    }, []);

    const idCheckHasVerticalScrollbar = useMemoizeCallbackId();
    const checkHasVerticalScrollbar = useCallback(
      ({ element }: { element: HTMLElement }) =>
        memoizeCallback({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          fn: throttle(
            ((entries, observer) => {
              const hasVerticalScrollbar = checkHasScrollbar({
                element,
                condition: "vertical",
              });
              if (hasVerticalScrollbar) {
                element.style.setProperty("padding-right", "10px");
              } else {
                element.style.removeProperty("padding-right");
              }
            }) satisfies ResizeObserverCallback,
            17,
          ),
          id: idCheckHasVerticalScrollbar,
          deps: [element, idCheckHasVerticalScrollbar],
        }),
      [idCheckHasVerticalScrollbar],
    );

    useEffect(() => {
      let resizeObserver: ResizeObserver | null = null;
      if (refCardsContainer.current) {
        // resizeObserver = new ResizeObserver(checkHasVerticalScrollbar);
        resizeObserver = new ResizeObserver(
          checkHasVerticalScrollbar({ element: refCardsContainer.current }),
        );
        resizeObserver.observe(refCardsContainer.current, {
          box: "border-box",
        });
      }
      return () => {
        resizeObserver?.disconnect();
      };
    }, [checkHasVerticalScrollbar]);

    const customDataAttributes: DataAttributesOfItemList = {
      "data-board-list-id": boardListId,
      "data-item-list-type": "tasks",
      "data-item-list-id": parentItem.id,
    };

    return (
      <BoardMainBase ref={ref}>
        <BoardMainContentContainer>
          <BoardMainContent ref={refCardsContainer} {...customDataAttributes}>
            {!taskList || taskList.length === 0 ? (
              <div>Empty!</div>
            ) : (
              taskList.map((task, idx) => {
                const customDataAttributes: DataAttributesOfItem = {
                  "data-board-list-id": boardListId,
                  "data-item-type": "task",
                  "data-item-id": task.id,
                };
                return React.Children.map(
                  forEachChildItem({ idx, item: task, items: taskList }),
                  (child) =>
                    React.isValidElement(child)
                      ? React.cloneElement(
                          child as React.ReactElement,
                          customDataAttributes,
                        )
                      : child,
                );
              })
            )}
          </BoardMainContent>
        </BoardMainContentContainer>
        <Toolbar>
          <TaskAdder onSubmit={handleSubmit(onValid)}>
            <TaskAdderInput
              rows={2}
              placeholder={`Add a task on ${parentItem.title}`}
              {...register("taskText", {
                required: true,
              })}
            />
          </TaskAdder>
          <ToolbarButtons>
            <ScrollButtons>
              <ScrollDownButton onClick={scrollDownHandler} />
              <ScrollUpButton onClick={scrollUpHandler} />
            </ScrollButtons>
            <TaskButtons>
              <TaskAddButton />
            </TaskButtons>
          </ToolbarButtons>
        </Toolbar>
      </BoardMainBase>
    );
  },
});
BoardMain.displayName = "BoardMain";
