import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { ExecutionProps, styled } from "styled-components";
import { SubmitHandler, useForm } from "react-hook-form";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import { NestedIndexer } from "@/indexer";
import { generateUniqueRandomId } from "@/utils";

const BoardFooterBase = styled.div``;

export type BoardFooterProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardFooter = React.memo(
  React.forwardRef<HTMLDivElement, BoardFooterProps>(
    (props: BoardFooterProps, ref) => {
      const { category, ...otherProps } = props;

      return <BoardFooterBase ref={ref} {...otherProps}></BoardFooterBase>;
    },
  ),
);
BoardFooter.displayName = "BoardFooter";
