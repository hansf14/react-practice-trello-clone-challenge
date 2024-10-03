import { useCallback, useMemo } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { atomCategory, atomToDos } from "@/atoms";
import { generateUniqueRandomId } from "@/utils";

export interface ToDoFormData {
	toDoText: string;
}

function ToDoAdder() {
	const setStateToDos = useSetRecoilState(atomToDos);
	const stateCategory = useRecoilValue(atomCategory);

	const { register, handleSubmit, reset } = useForm<ToDoFormData>({
		defaultValues: {
			toDoText: "",
		},
	});

	const onValid: SubmitHandler<ToDoFormData> = useCallback(
		({ toDoText }) => {
			reset({ toDoText: "" });

			const id = generateUniqueRandomId();
			setStateToDos((current) => ({
				...current,
				[id]: {
					id,
					category: stateCategory,
					text: toDoText,
				},
			}));
		},
		[stateCategory]
	);

	const submitHandler = useMemo(() => {
		return handleSubmit(onValid);
	}, [handleSubmit, onValid]);

	// console.log(stateToDos);

	return (
		<form onSubmit={submitHandler}>
			<input
				placeholder="Write a to-do."
				{...register("toDoText", {
					required: "Please write a to-do.",
				})}
			/>
			<button>Add</button>
		</form>
	);
}

export default ToDoAdder;
