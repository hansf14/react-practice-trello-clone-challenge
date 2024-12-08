import React from "react";
import { ExecutionProps, styled } from "styled-components";

const BoardFooterBase = styled.div``;

export type BoardFooterProps = {} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardFooter = React.memo(
  React.forwardRef<HTMLDivElement, BoardFooterProps>(
    (props: BoardFooterProps, ref) => {
      return <BoardFooterBase ref={ref} {...props} />;
    },
  ),
);
BoardFooter.displayName = "BoardFooter";
