import { useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
	atomCategory,
	selectorSpecificCategoryToDos,
	ToDoCategoryMapping,
	ToDoCategoryType,
	ToDoCategoryTypes,
} from "@/atoms";
import ToDo from "./ToDo";
import ToDoAdder from "./ToDoAdder";

export function ToDoList() {
	const [stateCategory, setStateCategory] = useRecoilState(atomCategory);
	const stateSpecificCategoryToDos = useRecoilValue(
		selectorSpecificCategoryToDos
	);

	const selectCategoryHandler: React.FormEventHandler<HTMLSelectElement> =
		useCallback((event) => {
			if (
				!(ToDoCategoryTypes as readonly string[]).includes(
					event.currentTarget.value
				)
			) {
				return;
			}
			setStateCategory(event.currentTarget.value as ToDoCategoryType);
		}, []);

	return (
		<div>
			<ToDoAdder />
			<hr />
			<select value={stateCategory} onInput={selectCategoryHandler}>
				<option value={ToDoCategoryMapping["to-do"]}>To Do</option>
				<option value={ToDoCategoryMapping["doing"]}>Doing</option>
				<option value={ToDoCategoryMapping["done"]}>Done</option>
			</select>
			<h1>List of "to-do"</h1>
			<ul>
				{stateSpecificCategoryToDos.map((toDo) => (
					<ToDo key={toDo.id} {...toDo} />
				))}
			</ul>
			<hr />
		</div>
	);
}

export default ToDoList;
