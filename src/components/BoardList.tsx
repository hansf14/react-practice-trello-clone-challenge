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
import { Floppy2Fill } from "react-bootstrap-icons";
import { Button, Modal } from "antd";
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
  recoilKeys,
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
import { TextArea, TextAreaHandle, useTextArea } from "@/components/TextArea";
import { useAntdModal } from "@/hooks/useAntdModal";

const BoardListBase = styled.div`
  height: 100%;
  padding: 10px;

  display: flex;
  align-items: center;
`;

const BoardListControllers = styled.div`
  margin: 0 25px;

  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const cssBoardListButton = css`
  transform-style: preserve-3d;
  cursor: pointer;

  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 50%;
  background: transparent;
  box-shadow:
    -1px -1px 3px white,
    1px 1px 3px black;
  transition: all 0.2s ease-in-out;

  &:active {
    box-shadow:
      -1px -1px 3px white,
      1px 1px 3px black,
      inset -1px -1px 3px white,
      inset 1px 1px 3px black;
    transform: scale(0.94);
  }
`;

const BoardAdder = styled.div`
  ${cssBoardListButton}
`;

const BoardAdderIcon = styled(PlusCircleFilled)`
  transform: translateZ(10px);
  svg {
    width: 30px;
    height: 30px;
  }

  color: white;
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
`;

const SaveCurrentBoardListLocalStorage = styled.div`
  ${cssBoardListButton}
`;

const SaveCurrentBoardListLocalStorageIcon = styled(Floppy2Fill)`
  transform: translateZ(10px);
  width: 30px;
  height: 30px;

  color: #a8ffcf;
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
`;

const ResetCurrentBoardListLocalStorage = styled.div`
  ${cssBoardListButton}
`;

const ResetCurrentBoardListLocalStorageIconBase = styled.svg`
  transform: translateZ(10px);
  width: 30px;
  height: 30px;

  fill: tomato;
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
`;

const ResetCurrentBoardListLocalStorageIcon = () => {
  return (
    <ResetCurrentBoardListLocalStorageIconBase
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M390.5 144.1l12.83-12.83c6.25-6.25 6.25-16.37 0-22.62s-16.37-6.25-22.62 0L367.9 121.5l-35.24-35.17c-8.428-8.428-22.09-8.428-30.52 0l-22.58 22.58C257.2 100.7 233.2 96 208 96C93.13 96 0 189.1 0 304S93.13 512 208 512S416 418.9 416 304c0-25.18-4.703-49.21-12.9-71.55l22.58-22.58c8.428-8.428 8.428-22.09 0-30.52L390.5 144.1zM208 192C146.3 192 96 242.3 96 304C96 312.8 88.84 320 80 320S64 312.8 64 304C64 224.6 128.6 160 208 160C216.8 160 224 167.2 224 176S216.8 192 208 192zM509.1 59.21l-39.73-16.57L452.8 2.918c-1.955-3.932-7.652-3.803-9.543 0l-16.57 39.72l-39.73 16.57c-3.917 1.961-3.786 7.648 0 9.543l39.73 16.57l16.57 39.72c1.876 3.775 7.574 3.96 9.543 0l16.57-39.72l39.73-16.57C512.9 66.86 513 61.17 509.1 59.21z" />
    </ResetCurrentBoardListLocalStorageIconBase>
  );
};

const BoardAdderModalHeaderTitle = styled.div`
  margin-bottom: 20px;
`;

const BoardAdderModalBody = styled.div`
  margin-bottom: 15px;

  background-color: rgb(212, 238, 236, 0.5);
`;

const BoardAdderModalBodyTextArea = styled(TextArea)`
  &&& {
    max-height: 74px;
  }
`;

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

    // Error: "Cannot stop drag when no active drag"
    // https://github.com/atlassian/react-beautiful-dnd/issues/1778#issuecomment-836542941
    // ㄴ When I conditionally add a new Droppable
    // https://github.com/atlassian/react-beautiful-dnd/issues/1778#issuecomment-872999853
    // ㄴ onBeforeDragStart
    // ㄴ 나의 경우: 에러 그대로 뜸
    // https://github.com/atlassian/react-beautiful-dnd/issues/1761#issuecomment-593292029
    // ㄴ onBeforeCapture
    // ㄴ 나의 경우: 에러 그대로 뜸
    // const [stateCurDraggableType, setStateCurDraggableType] =
    // useState<ItemType | null>(null);
    const onDragStart = useCallback<OnDragStartResponder>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (start, responderProvided) => {
        console.log(start);
        // console.log(responderProvided);

        // const { type } = start;
        // setStateCurDraggableType(type as ItemType);
        // ㄴ Error: "Cannot stop drag when no active drag"
        // ㄴ Happens when I drag a BoardCard over the TrashCan

        setIsDragging(true);

        const { source: src } = start;
        showDragPositionPreview({
          boardListId,
          src,
          dst: src,
        });
      },
      [boardListId, showDragPositionPreview],
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

        // console.log(dst);
        if (
          !dst
          //  || ["trash-can-parent", "trash-can-child"].includes(dst.droppableId)
        ) {
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
    const { openModalFixup, closeModalFixup } = useAntdModal();

    const openModal = useCallback(() => {
      setIsModalOpen(true);

      setTimeout(() => {
        const textarea =
          refBoardAdderTextArea.current?.resizableTextArea?.textArea;
        // console.log(textarea);
        if (!textarea) {
          return;
        }

        openModalFixup({
          refAnyInnerElement: textarea,
          cb: () => {
            textarea.focus();
          },
        });
      }, 1);
    }, [openModalFixup]);

    const closeModal = useCallback(() => {
      setIsModalOpen(false);

      setTimeout(() => {
        const textarea =
          refBoardAdderTextArea.current?.resizableTextArea?.textArea;
        // console.log(textarea);
        if (!textarea) {
          return;
        }

        closeModalFixup({
          refAnyInnerElement: textarea,
        });
      }, 1);
    }, [closeModalFixup]);

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isEditMode,
      value: stateBoardTitle,
      setValue: setStateBoardTitle,
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

    const onAddBoard = useCallback<React.MouseEventHandler<HTMLElement>>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event) => {
        setStateBoardListContext((curBoardListContext) => {
          if (!refBoardAdderTextArea.current) {
            return curBoardListContext;
          }

          const newBoardListContextIndexer = new BoardListContextIndexer(
            curBoardListContext.indexer,
          );
          const newParentItem = {
            id: generateUniqueRandomId(),
            title: refBoardAdderTextArea.current.value,
            items: [],
          } satisfies ParentItem;
          newBoardListContextIndexer.createParent({
            parent: newParentItem,
            shouldAppend: false,
            shouldKeepRef: false,
          });
          return {
            boardListId,
            indexer: newBoardListContextIndexer,
          };
        });

        // if (refBoardAdderTextArea.current?.resizableTextArea?.textArea) {
        //   refBoardAdderTextArea.current.value = ""; // Not works (because it's a state value)
        //   refBoardAdderTextArea.current.resizableTextArea.textArea.value = ""; // Not works (because it's a state value)
        // }

        setStateBoardTitle("");
        closeModal();
      },
      [boardListId, setStateBoardListContext, setStateBoardTitle, closeModal],
    );

    const saveCurrentBoardListLocalStorage = useCallback(() => {
      const result = confirm(
        "This will save all the current board data permanently at your device.\nWould you like to proceed?",
      );
      if (!result) {
        return;
      }

      setStateBoardListContext((curBoardListContext) => {
        return {
          boardListId,
          indexer: curBoardListContext.indexer,
        };
      });
    }, [boardListId, setStateBoardListContext]);

    const resetCurrentBoardListLocalStorage = useCallback(() => {
      const result = confirm(
        "This will remove all the currently saved board data and load with the default dummy data at the next load.\nThe only way to revert this is to click the green save button and confirm before your next load.\nAre you sure you want to proceed?",
      );
      if (!result) {
        return;
      }

      const localStorageKey = `${recoilKeys["boardListContextAtomFamily"]}__${boardListId}__${parentKeyName}__${childKeyName}`;
      localStorage.removeItem(localStorageKey);
    }, [boardListId, parentKeyName, childKeyName]);

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
          ignoreContainerClipping={true}
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
                <BoardListControllers>
                  <BoardAdder onClick={openModal}>
                    <BoardAdderIcon />
                  </BoardAdder>
                  <SaveCurrentBoardListLocalStorage>
                    <SaveCurrentBoardListLocalStorageIcon
                      onClick={saveCurrentBoardListLocalStorage}
                    />
                  </SaveCurrentBoardListLocalStorage>
                  <ResetCurrentBoardListLocalStorage
                    onClick={resetCurrentBoardListLocalStorage}
                  >
                    <ResetCurrentBoardListLocalStorageIcon />
                  </ResetCurrentBoardListLocalStorage>
                </BoardListControllers>
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
                    <Button key="submit" type="primary" onClick={onAddBoard}>
                      Submit
                    </Button>,
                    <Button key="back" onClick={closeModal}>
                      Cancel
                    </Button>,
                  ]}
                  onCancel={closeModal}
                >
                  <BoardAdderModalBody>
                    <BoardAdderModalBodyTextArea
                      ref={refBoardAdderTextArea}
                      rows={2}
                      value={stateBoardTitle}
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

// cf> https://github.com/atlassian/react-beautiful-dnd/issues/1761#issuecomment-590827636
// HOC to support multiple drop type
// /**
//  * 1. Specify the accepted types.
//  */
// const types = ['red', 'blue', 'green']

// /**
//  * 2. Create a nested Droppable component, each of which contains
//  *    the different type that it can accept.
//  */
// const DropConditions = types.reduce((Wrapper, type, index) => ({children}) => (
//   <Wrapper>
//     <Droppable type={type} droppableId={`droppable-${index}`}>
//       {provided => (
//         <div
//           {...provided.droppableProps}
//           ref={provided.innerRef}
//        >
//           {children}
//           {provided.placeholder}
//         </div>
//       )}
//     </Droppable>
//   </Wrapper>
// ), React.Fragment)

// /**
//  *  3. Usage.
//  */
// const Palette = () => (
//   <DropConditions>
//     <Droppable
//        droppableId="palette"
//        /**
//         * Optional:
//         * Set this to true only for when you strictly want the specified types
//         * to get in, else then even the 'DEFAULT' types will go through.
//         */
//        isDropDisabled={true}
//     >
//        ...
//     </Droppable>
//   </DropConditions>
// )

// * TrashCan
// const TrashCanParentDropZone = styled.div``;

// const TrashCanChildDropZone = styled.div``;

// const TrashCan = styled.div`
//   transform-style: preserve-3d;
//   position: relative;
//   cursor: pointer;
//   width: 60px;
//   height: 60px;

//   &::before {
//     content: "";
//     position: absolute;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     border: 3px solid white;
//     border-radius: 50%;
//     background-color: orange;

//     pointer-events: none;
//   }
// `;

// const TrashCanIcon = styled(Trash3Fill)`
//   transform: translate3d(-50%, -50%, 10px);
//   width: 40px;
//   height: 40px;
//   color: #111;

//   position: absolute;
//   top: 50%;
//   left: 50%;
// `;

// <Droppable
// droppableId="trash-can-parent"
// direction="horizontal"
// type={"parent"}
// ignoreContainerClipping={false}
// >
// {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
// {(droppableProvided1, droppableStateSnapshot1) => {
//   return (
//     <Droppable
//       droppableId="trash-can-child"
//       direction="horizontal"
//       type={"child"}
//       ignoreContainerClipping={false}
//     >
//       {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
//       {(droppableProvided2, droppableStateSnapshot2) => {
//         return (
//           // https://github.com/atlassian/react-beautiful-dnd/issues/1761#issuecomment-590827636

//           <TrashCanParentDropZone
//             ref={droppableProvided1.innerRef}
//             {...droppableProvided1.droppableProps}
//           >
//             <TrashCanChildDropZone
//               ref={droppableProvided2.innerRef}
//               {...droppableProvided2.droppableProps}
//             >
//               <TrashCan>
//                 <TrashCanIcon />
//                 {droppableProvided1.placeholder}
//                 {droppableProvided2.placeholder}
//               </TrashCan>
//             </TrashCanChildDropZone>
//           </TrashCanParentDropZone>
//         );
//       }}
//     </Droppable>
//   );
// }}
// </Droppable>
