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

    // function handleDragOver(event) {
    //   const { active, over, draggingRect } = event;
    //   const { id } = active;
    //   let overId;
    //   if (over) {
    //     overId = over.id;
    //   }

    //   const overParent = findParent(overId);
    //   const overIsContainer = isContainer(overId);
    //   const activeIsContainer = isContainer(activeId);
    //   if (overIsContainer) {
    //     const overIsRow = isRow(overId);
    //     const activeIsRow = isRow(activeId);
    //     // only columns to be added to rows
    //     if (overIsRow) {
    //       if (activeIsRow) {
    //         return;
    //       }

    //       if (!activeIsContainer) {
    //         return;
    //       }
    //     } else if (activeIsContainer) {
    //       return;
    //     }
    //   }

    //   setData((prev) => {
    //     const activeIndex = data.items.findIndex((item) => item.id === id);
    //     const overIndex = data.items.findIndex((item) => item.id === overId);

    //     let newIndex = overIndex;
    //     const isBelowLastItem =
    //       over &&
    //       overIndex === prev.items.length - 1 &&
    //       draggingRect.offsetTop > over.rect.offsetTop + over.rect.height;

    //     const modifier = isBelowLastItem ? 1 : 0;

    //     newIndex =
    //       overIndex >= 0 ? overIndex + modifier : prev.items.length + 1;

    //     let nextParent;
    //     if (overId) {
    //       nextParent = overIsContainer ? overId : overParent;
    //     }

    //     prev.items[activeIndex].parent = nextParent;
    //     const nextItems = arrayMove(prev.items, activeIndex, newIndex);

    //     return {
    //       items: nextItems,
    //     };
    //   });
    // }

    const horizontalDragScrollConfig = useMemo(
      () => ({ scrollSpeed: 6 }) satisfies DragScrollConfig,
      [],
    );
    const verticalDragScrollConfig = useMemo(
      () => ({ scrollSpeed: 3 }) satisfies DragScrollConfig,
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
        srcDraggableId,
        dst,
        direction,
      }: {
        src: DragUpdate["source"];
        srcDraggableId: string;
        dst: NonNullable<DragUpdate["destination"]>;
        direction: "horizontal" | "vertical";
      }) => {
        const { droppableId: srcDroppableId, index: srcDraggableIndex } = src;
        const { droppableId: dstDroppableId, index: dstDraggableIndex } = dst;
        const { droppable: dstDroppable } = getDroppable({
          boardListId,
          droppableId: dstDroppableId,
        });
        if (!dstDroppable) {
          return;
        }
        const { draggables: srcDraggables } = getDraggables({
          boardListId,
          droppableId: srcDroppableId,
        });
        const { draggables: dstDraggables } = getDraggables({
          boardListId,
          droppableId: dstDroppableId,
        });

        const activeDraggable = srcDraggables[srcDraggableIndex];

        let offsetYStart = 0;

        let offsetDraggables: HTMLElement[] = [];
        if (srcDroppableId === dstDroppableId) {
          offsetYStart =
            dstDraggableIndex === dstDraggables.length
              ? 0
              : -activeDraggable.offsetHeight;

          offsetDraggables = [...dstDraggables.slice(dstDraggableIndex + 1)];
        } else {
          offsetYStart = -activeDraggable.offsetHeight;

          offsetDraggables =
            dstDraggableIndex === dstDraggables.length
              ? []
              : [
                  activeDraggable,
                  ...dstDraggables.slice(dstDraggableIndex + 1),
                ];
        }
        // console.log(updatedDraggables);

        const y =
          direction === "vertical"
            ? offsetYStart -
              offsetDraggables.reduce((acc, cur) => {
                const style: React.CSSProperties =
                  (cur as any).currentStyle ?? window.getComputedStyle(cur);
                const marginTop = parseFloat((style.marginTop ?? 0).toString());
                const marginBottom = parseFloat(
                  (style.marginBottom ?? 0).toString(),
                );
                // console.log(acc, marginTop, cur.offsetHeight, marginBottom);
                return acc + marginTop + cur.offsetHeight + marginBottom;
              }, 0)
            : offsetYStart;
        console.log(y);

        // let offsetParent: HTMLElement | null = null;
        // const dstDroppableComputedStyle = window.getComputedStyle(dstDroppable);
        // const dstDroppablePaddingLeft = parseFloat(
        //   dstDroppableComputedStyle.paddingLeft,
        // );
        // const dstDroppablePaddingTop = parseFloat(
        //   dstDroppableComputedStyle.paddingTop,
        // );

        // const refsPlaceholder = getPlaceholderRef({
        //   boardListId,
        //   droppableId: dstDroppableId,
        // });
        // if (!refsPlaceholder) {
        //   console.warn("[setDragPositionPreview] !refsPlaceholder");
        //   return;
        // }
        // const { refPlaceholderContainer } = refsPlaceholder;
        // if (!refPlaceholderContainer.current) {
        //   console.warn("[setDragPositionPreview] !refPlaceholderContainer");
        //   return;
        // }

        // if (dstDraggableIndex === dstDraggables.length) {
        //   offsetParent = refPlaceholderContainer.current;
        // } else {
        //   offsetParent = dstDraggables[dstDraggableIndex].parentElement;
        // }

        // if (!offsetParent) {
        //   console.warn("[setDragPositionPreview] !offsetParent");
        //   return;
        // }
        // console.log(offsetParent);

        // const { offsetLeft, offsetTop } = refPlaceholderContainer.current;
        // console.log("Placeholder:", offsetLeft, offsetTop);

        // const { offsetLeft, offsetTop } = dstDraggables[dstDraggableIndex];
        // console.log(offsetLeft, offsetTop);
        // const { offsetLeft = 0, offsetTop = 0 } = offsetParent ?? {};
        // console.log(offsetLeft, offsetTop);

        const { scrollContainer } =
          getScrollContainer({
            boardListId,
            scrollContainerId: dstDroppableId,
          }) ?? document.documentElement;

        const { scrollTop } = scrollContainer as HTMLElement;

        // const x =
        //   direction === "horizontal"
        //     ? offsetLeft +
        //       +offsetDraggables
        //         .slice(0, dstDraggableIndex)
        //         .reduce((acc, cur) => {
        //           const style: React.CSSProperties =
        //             (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           const marginLeft = parseFloat(
        //             (style.marginLeft ?? 0).toString(),
        //           );
        //           const marginRight = parseFloat(
        //             (style.marginRight ?? 0).toString(),
        //           );
        //           // console.log(marginLeft);

        //           // console.log(acc, offsetLeft, prevElementWidth);
        //           return acc + marginLeft + cur.offsetWidth + marginRight;

        //           // const style: React.CSSProperties =
        //           //   (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           // const marginLeft = parseFloat(
        //           //   (style.marginLeft ?? 0).toString(),
        //           // );
        //           // const marginRight = parseFloat(
        //           //   (style.marginRight ?? 0).toString(),
        //           // );
        //           // return acc + marginLeft + cur.clientHeight + marginRight;
        //         }, 0)
        //     : offsetLeft;
        // console.log(x);

        // const clientX =
        //   direction === "horizontal"
        //     ? dstDroppablePaddingLeft +
        //       updatedDraggables
        //         .slice(0, dstDraggableIndex)
        //         .reduce((acc, cur) => {
        //           const style: React.CSSProperties =
        //             (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           const marginLeft = parseFloat(
        //             (style.marginLeft ?? 0).toString(),
        //           );
        //           const marginRight = parseFloat(
        //             (style.marginRight ?? 0).toString(),
        //           );
        //           return acc + marginLeft + cur.clientHeight + marginRight;
        //         }, 0)
        //     : dstDroppablePaddingLeft;

        // const y =
        //   direction === "vertical"
        //     ? offsetTop +
        //       +updatedDraggables
        //         .slice(0, dstDraggableIndex)
        //         .reduce((acc, cur) => {
        //           const style: React.CSSProperties =
        //             (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           const marginTop = parseFloat(
        //             (style.marginTop ?? 0).toString(),
        //           );
        //           const marginBottom = parseFloat(
        //             (style.marginBottom ?? 0).toString(),
        //           );
        //           console.log(acc, marginTop, cur.offsetHeight, marginBottom);

        //           // console.log(acc, offsetLeft, prevElementWidth);
        //           return acc + marginTop + cur.offsetHeight + marginBottom;

        //           // const style: React.CSSProperties =
        //           //   (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           // const marginLeft = parseFloat(
        //           //   (style.marginLeft ?? 0).toString(),
        //           // );
        //           // const marginRight = parseFloat(
        //           //   (style.marginRight ?? 0).toString(),
        //           // );
        //           // return acc + marginLeft + cur.clientHeight + marginRight;
        //         }, 0)
        //     : offsetTop;

        // const y =
        //   direction === "vertical"
        //     ? dstDroppablePaddingTop +
        //       updatedDraggables
        //         .slice(0, dstDraggableIndex)
        //         .reduce((acc, cur) => {
        //           const style: React.CSSProperties =
        //             (cur as any).currentStyle ?? window.getComputedStyle(cur);
        //           const marginTop = parseFloat(
        //             (style.marginTop ?? 0).toString(),
        //           );
        //           const marginBottom = parseFloat(
        //             (style.marginBottom ?? 0).toString(),
        //           );
        //           return acc + marginTop + cur.clientHeight + marginBottom;
        //         }, 0)
        //     : dstDroppablePaddingTop;
        // console.log(y);

        const activeDraggableClone = activeDraggable.cloneNode(
          true,
        ) as HTMLElement;

        // Remove all `data-*` attributes
        Array.from(activeDraggableClone.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-")) {
            activeDraggableClone.removeAttribute(attr.name);
          }
        });

        const { clientHeight, clientWidth } = activeDraggable;
        let dragPositionPreview = parse(
          activeDraggableClone.outerHTML,
        ) as React.ReactElement;
        dragPositionPreview = React.cloneElement(dragPositionPreview, {
          style: {
            // position: "absolute",
            // position: "absolute",
            position: "relative",
            top: 0,
            left: 0,
            transform: `translate3d(0, ${y}px, 0)`,
            // transform: `translate3d(${x}px, ${y}px, 0)`,
            // margin: `-50px 0`, // TODO:
            // width: clientWidth,
            // height: clientHeight,
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
          srcDraggableId,
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
                    style={
                      {
                        // position: "relative",
                      }
                    }
                  >
                    {children}
                    {droppableProvided.placeholder}
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
