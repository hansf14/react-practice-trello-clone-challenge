import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { atomToDos, ToDoData } from "@/atoms";

function ToDo({ category, text, id }: ToDoData) {
	const setStateToDos = useSetRecoilState(atomToDos);

	const changeCategoryHandler = useCallback(
		(newCategory: ToDoData["category"]) => {
			return useCallback(() => {
				setStateToDos((curStateToDos) => {
					const targetTodo = curStateToDos[id];
					return {
						...curStateToDos,
						[id]: {
							...targetTodo,
							category: newCategory,
						},
					};
				});
			}, [newCategory]);
		},
		[]
	);

	return (
		<li>
			<span>{text}</span>
			{category !== "to-do" && (
				<button onClick={changeCategoryHandler("to-do")}>To Do</button>
			)}
			{category !== "doing" && (
				<button onClick={changeCategoryHandler("doing")}>Doing</button>
			)}
			{category !== "done" && (
				<button onClick={changeCategoryHandler("done")}>Done</button>
			)}
		</li>
	);
}

export default ToDo;
