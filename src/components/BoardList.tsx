import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
  OnDragStartResponder,
  OnDragUpdateResponder,
} from "@hello-pangea/dnd";
import { SmartMerge, StyledComponentProps } from "@/utils";
import {
  DroppableCustomAttributesKvObj,
  BoardListContextIndexer,
  BoardListContextValue,
  BoardListContextParams,
  useBoardListContext,
  DraggablesContainerCustomAttributesKvObj,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import {
  scrollToPlaceholderWhenIntersect,
  DragScrollConfig,
  UseDragScroll,
  useDragScroll,
  ScrollContainerToElementConfigs,
  getPlaceholder,
} from "@/hooks/useDragScroll";
import {
  DragPositionPreviewConfig,
  useDragPositionPreview,
} from "@/hooks/useDragPositionPreview";

const BoardListBase = styled.div`
  height: 100%;
  padding: 10px;
`;

type BoardListDropAreaProps = {
  isDropTarget?: boolean;
};

const BoardListDropPreviewArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDropTarget"].includes(prop),
})<BoardListDropAreaProps>`
  height: 100%;
  padding: 10px;
`;
// ${({ isDropTarget }) =>
//   (isDropTarget ?? false)
//     ? css`
//         background-color: rgb(0, 0, 0, 0.5);
//       `
//     : ""}

const BoardListDropAreaMinusMargin = styled.div`
  margin: 0 -5px;
  // ㄴ To deduct the flex item's margin

  min-width: max-content;
  width: 100%;
  height: 100%;

  // https://stackoverflow.com/questions/26888428/display-flex-loses-right-padding-when-overflowing
  // Padding collapse at the end item
  &::after {
    content: "";
    min-width: 10px;
  }

  display: inline-flex;
  justify-content: stretch;
  align-items: center;
  border-radius: 10px;
`;

export type BoardListProps = SmartMerge<
  BoardListContextParams & {
    direction: "horizontal" | "vertical";
  }
> &
  StyledComponentProps<"div">;

export type BoardListInternalProps = BoardListContextParams &
  StyledComponentProps<"div">;

export type BoardListExtendProps = BoardListContextValue;

export const BoardList = withMemoAndRef<"div", HTMLDivElement, BoardListProps>({
  displayName: "BoardList",
  Component: (
    {
      boardListId,
      parentKeyName,
      childKeyName,
      direction,
      children,
      ...otherProps
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);

    const refBase = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => {
      return refBase.current as HTMLDivElement;
    });

    const boardListContextParams = useMemo(
      () => ({
        boardListId,
        parentKeyName,
        childKeyName,
      }),
      [boardListId, parentKeyName, childKeyName],
    );
    const {
      parentItems__Immutable: parentItems,
      stateBoardListContext,
      setStateBoardListContext,
    } = useBoardListContext(boardListContextParams);

    const parentItemIdList = useMemo(() => {
      return parentItems.map((parentItem) => parentItem.id);
    }, [parentItems]);

    const { addDragScrollConfig, removeDragScrollConfig } = useDragScroll({
      isDragging,
    });

    const horizontalDragScrollConfig = useMemo(
      () => ({ scrollSpeed: 6 }) satisfies DragScrollConfig,
      [],
    );
    const verticalDragScrollConfig = useMemo(
      () =>
        ({
          scrollSpeed: 3,
          // scrollBehavior: "smooth",
        }) satisfies DragScrollConfig,
      [],
    );

    useEffect(() => {
      addDragScrollConfig({
        boardListId,
        scrollContainerId: null,
        config: horizontalDragScrollConfig,
      });
      parentItemIdList.forEach((parentItemId) => {
        addDragScrollConfig({
          boardListId,
          scrollContainerId: parentItemId,
          config: verticalDragScrollConfig,
        });
      });
      return () => {
        removeDragScrollConfig({
          boardListId,
          scrollContainerId: null,
        });
        parentItemIdList.forEach((parentItemId) => {
          removeDragScrollConfig({
            boardListId,
            scrollContainerId: parentItemId,
          });
        });
      };
    }, [
      boardListId,
      parentItemIdList,
      horizontalDragScrollConfig,
      verticalDragScrollConfig,
      addDragScrollConfig,
      removeDragScrollConfig,
    ]);

    const horizontalDragPositionPreviewConfig = useMemo(
      () =>
        ({
          direction: "horizontal",
          shouldUseMargin: true,
        }) satisfies DragPositionPreviewConfig,
      [],
    );

    const verticalDragPositionPreviewConfig = useMemo(
      () =>
        ({
          direction: "vertical",
          shouldUseMargin: false,
        }) satisfies DragPositionPreviewConfig,
      [],
    );

    const {
      dragPositionPreview,
      addDragPositionPreviewConfig,
      removeDragPositionPreviewConfig,
      showDragPositionPreview,
      hideDragPositionPreview,
    } = useDragPositionPreview();

    useEffect(() => {
      addDragPositionPreviewConfig({
        boardListId,
        droppableId: boardListId,
        config: horizontalDragPositionPreviewConfig,
      });
      parentItemIdList.forEach((parentItemId) => {
        addDragPositionPreviewConfig({
          boardListId,
          droppableId: parentItemId,
          config: verticalDragPositionPreviewConfig,
        });
      });
      return () => {
        removeDragPositionPreviewConfig({
          boardListId,
          droppableId: boardListId,
        });
        parentItemIdList.forEach((parentItemId) => {
          removeDragPositionPreviewConfig({
            boardListId,
            droppableId: parentItemId,
          });
        });
      };
    }, [
      boardListId,
      parentItemIdList,
      horizontalDragPositionPreviewConfig,
      verticalDragPositionPreviewConfig,
      addDragPositionPreviewConfig,
      removeDragPositionPreviewConfig,
    ]);

    const onDragStart = useCallback<OnDragStartResponder>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (start, responderProvided) => {
        // console.log(start);
        // console.log(responderProvided);

        setIsDragging(true);
      },
      [],
    );

    const onDragUpdate = useCallback<OnDragUpdateResponder>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (update, responderProvided) => {
        // console.log("[onDragUpdate]");
        // console.log(update);

        const {
          source: src,
          destination: dst,
          // type,
          draggableId: srcDraggableId,
        } = update;
        if (!dst) {
          hideDragPositionPreview();
          return;
        }

        const scrollContainerToElementConfigs: ScrollContainerToElementConfigs =
          {
            fallback: {
              containerHorizontalAlign: "right",
              elementHorizontalAlign: "right",
            },
            custom: parentItemIdList.reduce<
              ScrollContainerToElementConfigs["custom"]
            >((acc, parentItemId) => {
              return {
                ...acc,
                [parentItemId]: {
                  containerVerticalAlign: "bottom",
                  elementVerticalAlign: "bottom",
                },
              };
            }, {}),
          };

        const { droppableId: srcDroppableId } = src;
        const { droppableId: dstDroppableId } = dst;

        scrollToPlaceholderWhenIntersect({
          boardListId,
          srcDraggableId,
          srcDroppableId,
          dstDroppableId,
          scrollContainerToElementConfigs,
        });

        showDragPositionPreview({
          boardListId,
          src,
          dst,
        });
      },
      [
        boardListId,
        parentItemIdList,
        showDragPositionPreview,
        hideDragPositionPreview,
      ],
    );

    const onDragEnd = useCallback<OnDragEndResponder>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (result, responderProvided) => {
        // console.log("[onDragEnd]");
        // console.log(result);
        // console.log(responderProvided);

        setIsDragging(false);
        hideDragPositionPreview();

        const { source, destination, type } = result;
        if (!destination) {
          return;
        }
        // console.log(type);
        // console.log(source);
        // console.log(destination);

        const { droppableId: srcDroppableId, index: srcDraggableIndex } =
          source;
        const { droppableId: dstDroppableId, index: dstDraggableIndex } =
          destination;

        if (type === "parent") {
          requestAnimationFrame(() => {
            setStateBoardListContext((curBoardListContext) => {
              const newBoardListContextIndexer = new BoardListContextIndexer(
                curBoardListContext.indexer,
              );
              newBoardListContextIndexer.moveParent({
                indexFrom: srcDraggableIndex,
                indexTo: dstDraggableIndex,
                shouldKeepRef: false,
              });
              return {
                boardListId,
                indexer: newBoardListContextIndexer,
              };
            });
          });
          return;
        }

        if (type === "child") {
          setStateBoardListContext((curBoardListContext) => {
            const newBoardListContextIndexer = new BoardListContextIndexer(
              curBoardListContext.indexer,
            );
            newBoardListContextIndexer.moveChild({
              parentIdFrom: srcDroppableId,
              parentIdTo: dstDroppableId,
              indexFrom: srcDraggableIndex,
              indexTo: dstDraggableIndex,
              shouldKeepRef: false,
            });
            return {
              boardListId,
              indexer: newBoardListContextIndexer,
            };
          });
        }
      },
      [boardListId, setStateBoardListContext, hideDragPositionPreview],
    );

    const childItemIdList = useMemo(() => {
      return parentItems.reduce<string[]>((acc, curParentItem) => {
        const childIdList = (curParentItem.items ?? []).map(
          (childItem) => childItem.id,
        );
        return acc.concat(...childIdList);
      }, []);
    }, [parentItems]);

    const droppableCustomAttributes: DroppableCustomAttributesKvObj = {
      "data-board-list-id": boardListId,
      "data-droppable-id": boardListId,
    };

    const draggablesContainerCustomAttributes: DraggablesContainerCustomAttributesKvObj =
      {
        "data-board-list-id": boardListId,
        "data-draggables-container-id": boardListId,
      };

    return (
      <DragDropContext
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
        autoScrollerOptions={{
          disabled: true,
        }}
      >
        <UseDragScroll />
        {dragPositionPreview}

        <Droppable
          droppableId={boardListId}
          direction={direction}
          type="parent"
        >
          {(droppableProvided, droppableStateSnapshot) => {
            return (
              <BoardListBase
                // ref={refBase} // TODO:
                ref={droppableProvided.innerRef}
                // style={{
                //   backgroundColor: droppableStateSnapshot.isDraggingOver
                //     ? "rgba(0, 0, 0, 0.3)"
                //     : "",
                // }}
                {...droppableProvided.droppableProps}
                {...droppableCustomAttributes}
                {...otherProps}
              >
                <BoardListDropPreviewArea
                  style={{
                    backgroundColor: droppableStateSnapshot.isDraggingOver
                      ? "rgba(0, 0, 0, 0.3)"
                      : "",
                  }}
                >
                  <BoardListDropAreaMinusMargin
                    {...draggablesContainerCustomAttributes}
                  >
                    {children}
                    {getPlaceholder({
                      boardListId,
                      droppableId: boardListId,
                      placeholder: droppableProvided.placeholder,
                      gapHorizontalLength: 10,
                    })}
                  </BoardListDropAreaMinusMargin>
                </BoardListDropPreviewArea>
              </BoardListBase>
            );
          }}
        </Droppable>
      </DragDropContext>
    );
  },
});
