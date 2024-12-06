import React, { useMemo } from "react";
import { ExecutionProps, styled } from "styled-components";
import { useRecoilState } from "recoil";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import { Card } from "@/components/Card";

const BoardMainBase = styled.div`
  margin: 10px 0;
  padding: 10px;
  word-break: break-word;

  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(13.5px);
`;

export type BoardMainProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardMain = React.memo(
  React.forwardRef<HTMLDivElement, BoardMainProps>((props, ref) => {
    const { category } = props;
    const [stateIndexer, setStateIndexer] = useRecoilState(
      indexerCategoryTaskAtom,
    );

    const taskList = useMemo<Task[]>(
      () =>
        stateIndexer.getChildListFromParentId__MutableChild({
          parentId: category.id,
        }) ?? [],
      [category.id, stateIndexer],
    );

    return (
      <BoardMainBase ref={ref}>
        {!taskList || taskList.length === 0 ? (
          <div>Empty!</div>
        ) : (
          taskList.map((task) => {
            return <Card key={task.id} task={task} {...props} />;
          })
        )}
      </BoardMainBase>
    );
  }),
);
BoardMain.displayName = "BoardMain";
