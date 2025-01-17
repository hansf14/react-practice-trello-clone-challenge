// https://codesandbox.io/p/sandbox/suttp
// https://medium.com/@Dedanade/how-to-add-a-custom-placeholder-for-more-than-one-column-react-beautiful-dnd-3d59b64fe2d2
import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DragUpdate } from "@hello-pangea/dnd";
import parse from "html-react-parser";
import {
  getDraggables,
  getDraggablesContainer,
} from "@/components/BoardContext";
import { SmartOmit } from "@/utils";

export type DragPositionPreviewConfig = {
  direction: "horizontal" | "vertical";
  shouldUseMargin?: boolean;
};

export type DragPositionPreviewConfigs = {
  [boardListId: string]: {
    [droppableId: string]: DragPositionPreviewConfig;
  };
};

export type AddDragPositionPreviewConfigParams = {
  boardListId: string;
  droppableId: string;
  config: DragPositionPreviewConfig;
};

export type RemoveDragPositionPreviewConfigParams = SmartOmit<
  AddDragPositionPreviewConfigParams,
  "config"
>;

export const useDragPositionPreview = () => {
  const [stateDragPositionPreview, setStateDragPositionPreview] =
    useState<React.ReactElement | null>(null);

  const refConfigs = useRef<DragPositionPreviewConfigs>({});

  const addDragPositionPreviewConfig = useCallback(
    ({
      boardListId,
      droppableId,
      config,
    }: AddDragPositionPreviewConfigParams) => {
      if (!refConfigs.current[boardListId]) {
        refConfigs.current[boardListId] = {};
      }
      refConfigs.current[boardListId][droppableId] = config;
    },
    [],
  );

  const removeDragPositionPreviewConfig = useCallback(
    ({ boardListId, droppableId }: RemoveDragPositionPreviewConfigParams) => {
      if (!refConfigs.current[boardListId]) {
        return;
      }
      delete refConfigs.current[boardListId][droppableId];
    },
    [],
  );

  const hideDragPositionPreview = useCallback(() => {
    setStateDragPositionPreview(null);
  }, []);

  const showDragPositionPreview = useCallback(
    ({
      boardListId,
      src,
      dst,
    }: {
      boardListId: string;
      src: DragUpdate["source"];
      dst: NonNullable<DragUpdate["destination"]>;
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

      const config = refConfigs.current[boardListId][dstDroppableId];
      if (!config) {
        console.warn("[showDragPositionPreview] !config");
        return;
      }
      const { direction, shouldUseMargin: _shouldUseMargin } = config;
      if (
        typeof _shouldUseMargin === "undefined" &&
        direction !== "horizontal" &&
        direction !== "vertical"
      ) {
        console.warn("[setDragPositionPreview] Invalid config");
        return;
      }

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
                  ? -cur.width
                  : acc[1] - cur.width - arr[index + 1].left - cur.right;
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
                  ? -cur.height
                  : acc[1] - cur.height - arr[index + 1].top - cur.bottom;
                return [marginTop, marginBottom];
              },
              [0, 0],
            )
          : [offsets[0].top, offsets[0].bottom];

      // const activeDraggableClone = activeDraggable.cloneNode(
      //   true,
      // ) as HTMLElement;

      // Array.from([
      //   activeDraggableClone,
      //   ...activeDraggableClone.querySelectorAll("*"),
      // ]).forEach((element) => {
      //   Array.from(element.attributes).forEach((attr) => {
      //     if (attr.name.startsWith("data-rfd")) {
      //       // console.log(attr);
      //       activeDraggableClone.removeAttribute(attr.name);
      //     }
      //   });
      // });
      // outerHTML not updating/reflecting when detached.

      // data-rfd-draggable-context-id=":r0:"
      // data-rfd-draggable-id="0cd50106-6130-4da0-b0a0-39e0496da2ca"
      // data-board-list-id="category-task-board"
      // data-draggable-id="0cd50106-6130-4da0-b0a0-39e0496da2ca"
      // data-draggable-index="5"
      // data-droppable-id="ba605f3e-b99e-4450-aa0a-ddd0ec22ad71"
      // data-board-list-id="category-task-board"
      // data-draggable-handle-id="0cd50106-6130-4da0-b0a0-39e0496da2ca"
      // data-rfd-drag-handle-draggable-id="0cd50106-6130-4da0-b0a0-39e0496da2ca"
      // data-rfd-drag-handle-context-id=":r0:"

      let updatedHtmlString = activeDraggable.outerHTML.replace(
        /\s*data-rfd-[^=]+="(?:[^"\\]|\\.)*"/g,
        "",
      );
      updatedHtmlString = updatedHtmlString.replace(
        /\s*data-board-list-id="(?:[^"\\]|\\.)*"/g,
        "",
      );
      updatedHtmlString = updatedHtmlString.replace(
        /\s*data-draggable-[^=]+="(?:[^"\\]|\\.)*"/g,
        "",
      );
      updatedHtmlString = updatedHtmlString.replace(
        /\s*data-droppable-[^=]+="(?:[^"\\]|\\.)*"/g,
        "",
      );
      // console.log(updatedHtmlString);

      const shouldUseMargin =
        typeof _shouldUseMargin === "undefined"
          ? direction === "horizontal"
            ? true
            : direction === "vertical"
              ? false
              : false // never
          : _shouldUseMargin;
      // If direction is "vertical", `_shouldUseMargin` defaults to `false`, due to CSS margin collapsing which makes margin of no use.

      const offsetStyle: React.CSSProperties = shouldUseMargin
        ? direction === "horizontal"
          ? {
              margin: `${marginTop}px ${-offsets[0].width - offsets[0].right}px ${marginBottom}px ${marginLeft}px`,
              transform: `translate3d(${marginRight}px, 0px, 0)`,
            }
          : direction === "vertical"
            ? {
                margin: `${marginTop}px ${marginLeft}px ${marginBottom}px ${marginRight}px`,
              }
            : {} // never
        : {
            transform: `translate3d(${marginRight}px, ${marginBottom}px, 0)`,
          };
      // console.log(_shouldUseMargin, offsetStyle);

      const style: React.CSSProperties = {
        position: "relative",
        top: 0,
        left: 0,
        opacity: 0.7,
        pointerEvents: "none",
        touchAction: "none",
        userSelect: "none",
        ...offsetStyle,
      };

      // let dragPositionPreview = parse(activeDraggableClone.outerHTML) as React.ReactElement;
      let dragPositionPreview = parse(updatedHtmlString) as React.ReactElement;
      dragPositionPreview = React.cloneElement(dragPositionPreview, {
        style,
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
    [],
  );

  return {
    dragPositionPreview: stateDragPositionPreview,
    addDragPositionPreviewConfig,
    removeDragPositionPreviewConfig,
    showDragPositionPreview,
    hideDragPositionPreview,
  };
};
