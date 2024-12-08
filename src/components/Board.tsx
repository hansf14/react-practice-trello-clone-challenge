import React, {
  ComponentType,
  ForwardRefRenderFunction,
  FunctionComponent,
  FunctionComponentFactory,
  useImperativeHandle,
  useMemo,
} from "react";
import { BoardHeader } from "@/components/BoardHeader";
import { BoardMain } from "@/components/BoardMain";
import { ExecutionProps, styled } from "styled-components";
import { NestedIndexer, NestedIndexerBaseItem } from "@/indexer";
import { SmartMerge, WithMemoAndRef, withMemoAndRef } from "@/utils";
import { Category, initialEntries, Task } from "@/atoms";

const BoardBase = styled.div`
  flex-shrink: 0;
  height: 85%;
  width: min(100%, 300px);
  min-height: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  // Glassmorphism
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(13.5px);
  -webkit-backdrop-filter: blur(13.5px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);

  // DragOverlay
  &.sortable-drag {
    opacity: 0.7 !important;
  }

  // Ghost
  &.sortable-ghost {
    opacity: 0.7;
    border: 2px solid yellow;
  }
`;

export interface BoardItem {
  id: string;
  // text:
}

export type BoardProps<
  Parent extends NestedIndexerBaseItem,
  Child extends NestedIndexerBaseItem,
> = {
  indexer: NestedIndexer<Parent, Child>;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export type BoardType<
  Parent extends NestedIndexerBaseItem,
  Child extends NestedIndexerBaseItem,
> = WithMemoAndRef<"div", HTMLDivElement, BoardProps<Parent, Child>>;

export const Board = (<
  Parent extends NestedIndexerBaseItem,
  Child extends NestedIndexerBaseItem,
>() =>
  withMemoAndRef<"div", HTMLDivElement, BoardProps<Parent, Child>>(
    (
      props,
      ref,
    ) => {

      return (
        <BoardBase ref={ref} {...props}>
          {/* Add child components */}
          <BoardHeader category={indexer} />
          <BoardMain category={category} />
          {/* <BoardFooter category={category} /> */}
        </BoardBase>
      );
    },
  ) as <
    Parent extends NestedIndexerBaseItem,
    Child extends NestedIndexerBaseItem,
  >(
    props: BoardProps<Parent, Child> & React.RefAttributes<HTMLDivElement>,
  ) => React.ReactNode)();

// const B = () => (
//   <div>
//     <Board indexer={new NestedIndexer<Category, Task>()} />
//     {/* <A<{id: string;}, {id: string;}> /> */}
//   </div>
// );
