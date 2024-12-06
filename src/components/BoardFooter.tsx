import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { ExecutionProps, styled } from "styled-components";
import { SubmitHandler, useForm } from "react-hook-form";
import { Category, indexerCategoryTaskAtom, Task } from "@/atoms";
import { NestedIndexer } from "@/indexer";
import { generateUniqueRandomId } from "@/utils";

const BoardFooterForm = styled.form`
  width: 100%;

  input {
    width: 100%;
  }
`;

export interface FormData {
  taskText: string;
}

export type BoardFooterProps = {
  category: Category;
} & React.ComponentPropsWithoutRef<"div"> &
  ExecutionProps;

export const BoardFooter = React.memo(
  React.forwardRef<HTMLDivElement, BoardFooterProps>(
    (props: BoardFooterProps, ref) => {
      const { category, ...otherProps } = props;

      const [stateIndexerCategoryTask, setStateIndexerCategoryTask] =
        useRecoilState(indexerCategoryTaskAtom);

      const {
        register,
        handleSubmit,
        // setValue,
        reset, // setValue("taskText", "")
        formState: { errors },
      } = useForm<FormData>();

      const onValid = useCallback<SubmitHandler<FormData>>(
        (data: FormData, event) => {
          // console.log(data);

          setStateIndexerCategoryTask((curIndexer) => {
            const newTask = {
              id: generateUniqueRandomId(),
              text: data.taskText,
            } satisfies Task;

            const newIndexer = new NestedIndexer(curIndexer);
            newIndexer.createChild({
              parentId: category.id,
              child: newTask,
              shouldAppend: false,
            });
            return newIndexer;
          });

          reset();
        },
        [setStateIndexerCategoryTask, category.id, reset],
      );

      return (
        <div ref={ref} {...otherProps}>
          <BoardFooterForm onSubmit={handleSubmit(onValid)}>
            <input
              type="text"
              placeholder={`Add a task on ${category.text}`}
              {...register("taskText", {
                required: true,
              })}
            />
          </BoardFooterForm>
        </div>
      );
    },
  ),
);
BoardFooter.displayName = "BoardFooter";
