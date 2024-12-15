import React from "react";
import { ExecutionProps, styled } from "styled-components";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";

const BoardFooterBase = styled.div``;

export type BoardFooterProps = {} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardFooter = withMemoAndRef({
  displayName: "BoardFooter",
  Component: (props: BoardFooterProps, ref) => {
    return <BoardFooterBase ref={ref} {...props} />;
  },
});
