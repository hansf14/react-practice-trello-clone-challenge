import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { css, styled } from "styled-components";
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
  OnDragStartResponder,
  OnDragUpdateResponder,
} from "@hello-pangea/dnd";
import {
  generateUniqueRandomId,
  SmartMerge,
  StyledComponentProps,
} from "@/utils";
import {
  DroppableCustomAttributesKvObj,
  BoardListContextIndexer,
  BoardListContextValue,
  BoardListContextParams,
  useBoardListContext,
  DraggablesContainerCustomAttributesKvObj,
  ParentItem,
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
import { useRfd } from "@/hooks/useRfd";
import { PlusCircleFilled } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { TextArea, TextAreaHandle, useTextArea } from "@/components/TextArea";
import { useAntdModal } from "@/hooks/useAntdModal";

const BoardListBase = styled.div`
  height: 100%;
  padding: 10px;

  display: flex;
  align-items: center;
`;

const BoardAdder = styled.div`
  position: relative;
  margin: 0 25px;

  &::after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    border: 3px solid white;
    border-radius: 50%;

    pointer-events: none;
  }
`;

const BoardAdderIcon = styled(PlusCircleFilled)`
  width: 60px;
  height: 60px;
  font-size: 60px;
  color: #157a6b;
  cursor: pointer;

  clip-path: circle(47%);
  background-color: white;
`;

const BoardAdderModalHeaderTitle = styled.div`
  margin-bottom: 25px;
`;

const BoardAdderModalBody = styled.div`
  margin-bottom: 15px;

  background-color: rgb(212, 238, 236, 0.5);
`;

const BoardAdderModalBodyTextArea = styled(TextArea)``;

type BoardListDropPreviewAreaProps = {
  isDraggingOver?: boolean;
};

const BoardListDropPreviewArea = styled.div.withConfig({
  shouldForwardProp: (prop) => !["isDraggingOver"].includes(prop),
})<BoardListDropPreviewAreaProps>`
  height: 100%;
  padding: 10px;

  ${({ isDraggingOver }) => {
    return css`
      ${(isDraggingOver ?? false)
        ? `
        background-color: rgba(0, 0, 0, 0.3);
      `
        : ""}
    `;
  }}
`;

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
    addBoardModalTitle?: string;
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
      addBoardModalTitle = "Add Board",
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

    const refBoardAdderTextArea = useRef<TextAreaHandle | null>(null);

    const { cbRefForDroppable } = useRfd();

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { setModalOpen, setModalClose } = useAntdModal();

    const openModalHandler = useCallback(() => {
      setIsModalOpen(true);

      setTimeout(() => {
        const textarea =
          refBoardAdderTextArea.current?.resizableTextArea?.textArea;
        // console.log(textarea);
        if (!textarea) {
          return;
        }

        setModalOpen({
          refAnyInnerElement: textarea,
          cb: () => {
            textarea.focus();
          },
        });
      }, 1);
    }, [setModalOpen]);

    const closeModalHandler = useCallback(() => {
      setIsModalOpen(false);

      setTimeout(() => {
        const textarea =
          refBoardAdderTextArea.current?.resizableTextArea?.textArea;
        // console.log(textarea);
        if (!textarea) {
          return;
        }

        setModalClose({
          refAnyInnerElement: textarea,
        });
      }, 1);
    }, [setModalClose]);

    const {
      isEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      disableEditMode,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      toggleEditMode,
      onEditStart,
      onEditCancel,
      onEditChange,
      onEditFinish,
    } = useTextArea({
      initialIsEditMode: false,
    });

    // const onAddBoard = useCallback<On>(
    //   (event) => {
    //     setStateBoardListContext((curBoardListContext) => {
    //       const newBoardListContextIndexer = new BoardListContextIndexer(
    //         curBoardListContext.indexer,
    //       );
    //       const newParentItem = {
    //         id: generateUniqueRandomId(),
    //         title: value,
    //         items: []
    //       } satisfies ParentItem;
    //       newBoardListContextIndexer.createParent({
    //         parent:newParentItem,
    //         shouldAppend: false,
    //         shouldKeepRef: false,
    //       });
    //       return {
    //         boardListId,
    //         indexer: newBoardListContextIndexer,
    //       };
    //     });
    //   },
    //   [boardListId, setStateBoardListContext],
    // );

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
                ref={cbRefForDroppable({
                  refDroppable: refBase,
                  droppableProvidedInnerRef: droppableProvided.innerRef,
                })}
                {...droppableProvided.droppableProps}
                {...droppableCustomAttributes}
                {...otherProps}
              >
                <BoardAdder onClick={openModalHandler}>
                  <BoardAdderIcon />
                </BoardAdder>
                <Modal
                  // centered
                  width={"min(80%, 350px)"}
                  open={isModalOpen}
                  title={
                    <BoardAdderModalHeaderTitle>
                      {addBoardModalTitle}
                    </BoardAdderModalHeaderTitle>
                  }
                  footer={[
                    <Button key="submit" type="primary" onClick={() => {}}>
                      Submit
                    </Button>,
                    <Button key="back" onClick={closeModalHandler}>
                      Cancel
                    </Button>,
                  ]}
                  onOk={() => {}}
                  onCancel={closeModalHandler}
                >
                  <BoardAdderModalBody>
                    <BoardAdderModalBodyTextArea
                      ref={refBoardAdderTextArea}
                      rows={2}
                      onEditStart={onEditStart}
                      onEditCancel={onEditCancel}
                      onEditChange={onEditChange}
                      onEditFinish={onEditFinish}
                    />
                  </BoardAdderModalBody>
                </Modal>
                <BoardListDropPreviewArea
                  isDraggingOver={droppableStateSnapshot.isDraggingOver}
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
