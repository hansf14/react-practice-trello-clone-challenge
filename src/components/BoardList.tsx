import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import parse from "html-react-parser";
import { CssScrollbar } from "@/csses/scrollbar";
import {
  getElementOffsetOnDocument,
  SmartMerge,
  StyledComponentProps,
} from "@/utils";
import {
  DroppableCustomAttributesKvObj,
  ScrollContainerCustomAttributesKvObj,
  BoardListContextIndexer,
  BoardListContextValue,
  BoardListContextParams,
  useBoardListContext,
  getDroppable,
  getDraggables,
  DraggablesContainerCustomAttributesKvObj,
  getDraggablesContainer,
  getScrollContainer,
} from "@/components/BoardContext";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { createPortal } from "react-dom";
import {
  scrollToPlaceholderWhenIntersect,
  DragScrollConfig,
  UseDragScroll,
  useDragScroll,
  ScrollContainerToElementConfigs,
  getPlaceholderRef,
  getPlaceholder,
} from "@/hooks/useDragScroll";
import {
  DragDropContext,
  DragUpdate,
  Droppable,
  OnDragEndResponder,
  OnDragStartResponder,
  OnDragUpdateResponder,
} from "@hello-pangea/dnd";

const BoardListBase = styled.div`
  ${CssScrollbar}
  max-width: 100dvw;
  width: 100%;
  height: 100%;
  padding: 10px;
`;

type BoardListDropAreaProps = {
  isDropTarget?: boolean;
};

const BoardListDropArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDropTarget"].includes(prop),
})<BoardListDropAreaProps>`
  min-width: max-content;
  width: 100%;
  // ㄴ min-width: max-content; width: 100%;
  // ㄴ DropArea => 마치 max(max-content, 100%)처럼 가능함
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

  width: 100%;
  height: 100%;

  display: flex;
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

    const parentItemIdList = useMemo(() => {
      return parentItems.map((parentItem) => parentItem.id);
    }, [parentItems]);

    const { addDragScrollConfig, removeDragScrollConfig } = useDragScroll({
      isDragging,
    });

    useEffect(() => {
      addDragScrollConfig({
        boardListId,
        scrollContainerId: boardListId,
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
          scrollContainerId: boardListId,
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

    const onDragStart = useCallback<OnDragStartResponder>(
      (start, responderProvided) => {
        // console.log(start);
        // console.log(responderProvided);

        setIsDragging(true);
      },
      [],
    );

    const [stateDragPositionPreview, setStateDragPositionPreview] =
      useState<React.ReactElement | null>(null);

    const setDragPositionPreview = useCallback(
      ({
        src,
        dst,
        direction,
      }: {
        src: DragUpdate["source"];
        dst: NonNullable<DragUpdate["destination"]>;
        direction: "horizontal" | "vertical";
      }) => {
        const { droppableId: srcDroppableId, index: srcDraggableIndex } = src;
        const { droppableId: dstDroppableId, index: dstDraggableIndex } = dst;

        const { draggables: srcDraggables } = getDraggables({
          boardListId,
          droppableId: srcDroppableId,
        });
        const { draggables: dstDraggables } = getDraggables({
          boardListId,
          droppableId: dstDroppableId,
        });

        const activeDraggable = srcDraggables[srcDraggableIndex];

        // if (direction === "horizontal") {
        //   if (srcDroppableId === dstDroppableId) {
        //     offsetXStart =
        //       dstDraggableIndex === dstDraggables.length
        //         ? 0
        //         : -activeDraggable.offsetWidth;

        //     // offsetXStart = -activeDraggable.offsetWidth;
        //   } else {
        //     offsetXStart = -activeDraggable.offsetWidth;
        //   }
        // }

        const offsetDraggables =
          srcDroppableId === dstDroppableId
            ? [...dstDraggables.slice(dstDraggableIndex)]
            : [activeDraggable, ...dstDraggables.slice(dstDraggableIndex)];

        let offsets: {
          left: number;
          right: number;
          width: number;
          height: number;
          top: number;
          bottom: number;
        }[] = offsetDraggables.map((dstDraggable) => {
          const style: React.CSSProperties =
            (dstDraggable as any).currentStyle ??
            window.getComputedStyle(dstDraggable);
          const marginLeft = parseFloat((style.marginLeft ?? 0).toString());
          const marginRight = parseFloat((style.marginRight ?? 0).toString());
          const marginTop = parseFloat((style.marginTop ?? 0).toString());
          const marginBottom = parseFloat((style.marginBottom ?? 0).toString());

          return {
            left: marginLeft,
            right: marginRight,
            top: marginTop,
            bottom: marginBottom,
            width: dstDraggable.offsetWidth,
            height: dstDraggable.offsetHeight,
          };
        });

        const [marginLeft, marginRight] =
          direction === "horizontal"
            ? offsets.reduceRight(
                (acc, cur, index, arr) => {
                  const isLast = index === arr.length - 1;
                  const marginLeft = cur.left;
                  const marginRight = isLast
                    ? -cur.width + cur.left
                    : acc[1] - cur.width - arr[index + 1].left - cur.right;
                  // Last: (-cur.w + cur.marginLeft)
                  // Not last: (acc -cur.w - prev.marginLeft - cur.marginRight)
                  return [marginLeft, marginRight];
                },
                [0, 0],
              )
            : [offsets[0].left, offsets[0].right];
        // console.log([marginLeft, marginRight]);

        const [marginTop, marginBottom] =
          direction === "vertical"
            ? offsets.reduceRight(
                (acc, cur, index, arr) => {
                  const isLast = index === arr.length - 1;
                  const marginTop = cur.top;
                  const marginBottom = isLast
                    ? -cur.height + cur.left
                    : acc[1] - cur.height - arr[index + 1].top - cur.bottom;
                  return [marginTop, marginBottom];
                },
                [0, 0],
              )
            : [offsets[0].top, offsets[0].bottom];

        const activeDraggableClone = activeDraggable.cloneNode(
          true,
        ) as HTMLElement;

        // Remove all `data-*` attributes
        Array.from(activeDraggableClone.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-")) {
            activeDraggableClone.removeAttribute(attr.name);
          }
        });

        let dragPositionPreview = parse(
          activeDraggableClone.outerHTML,
        ) as React.ReactElement;
        dragPositionPreview = React.cloneElement(dragPositionPreview, {
          style: {
            position: "relative",
            top: 0,
            left: 0,
            // margin: `${marginTop}px ${marginLeft}px ${marginBottom}px ${marginRight}px`,
            // margin: `0 5px 0 -295px`,
            // transform: `translate3d(${x}px, ${y}px, 0)`,
            transform: `translate3d(${marginLeft}px, ${marginBottom}px, 0)`,
            // width: offsetWidth,
            // height: offsetHeight,
            opacity: 0.7,
          },
        });

        const { draggablesContainer: dstDraggablesContainer } =
          getDraggablesContainer({
            boardListId,
            draggablesContainerId: dstDroppableId,
          });
        if (!dstDraggablesContainer) {
          console.warn("[setDragPositionPreview] !dstDraggablesContainer");
          return;
        }

        dragPositionPreview = createPortal(
          dragPositionPreview,
          dstDraggablesContainer,
        );
        setStateDragPositionPreview(dragPositionPreview);
      },
      [boardListId],
    );

    const onDragUpdate = useCallback<OnDragUpdateResponder>(
      (update, responderProvided) => {
        // console.log("[onDragUpdate]");
        // console.log(update);

        const {
          source: src,
          destination: dst,
          type,
          draggableId: srcDraggableId,
        } = update;
        if (!dst) {
          setStateDragPositionPreview(null);
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

        setDragPositionPreview({
          src,
          dst,
          direction: "vertical",
        });
      },
      [boardListId, parentItemIdList, setDragPositionPreview],
    );

    const onDragEnd = useCallback<OnDragEndResponder>(
      (result, responderProvided) => {
        // console.log("[onDragEnd]");
        // console.log(result);
        // console.log(responderProvided);

        setIsDragging(false);
        // setStateDragPositionPreview(null);

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
      [boardListId, setStateBoardListContext],
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
        {stateDragPositionPreview}

        <Droppable
          droppableId={boardListId}
          direction={direction}
          // type="parent"
        >
          {(droppableProvided, droppableStateSnapshot) => {
            return (
              <BoardListBase
                // ref={refBase} // TODO:
                ref={droppableProvided.innerRef}
                style={{
                  backgroundColor: droppableStateSnapshot.isDraggingOver
                    ? "rgba(0, 0, 0, 0.3)"
                    : "",
                }}
                {...droppableProvided.droppableProps}
                {...droppableCustomAttributes}
                {...otherProps}
              >
                <BoardListDropArea
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
                </BoardListDropArea>
              </BoardListBase>
            );
          }}
        </Droppable>
      </DragDropContext>
    );
  },
});
