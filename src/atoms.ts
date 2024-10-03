import { createKeyValueMapping } from "@/utils";
import { atom, selector } from "recoil";

export const ToDoCategoryTypes = ["to-do", "doing", "done"] as const;
export type ToDoCategoryType = (typeof ToDoCategoryTypes)[number];
export const ToDoCategoryMapping = createKeyValueMapping({
	arr: ToDoCategoryTypes,
});

export interface ToDoData {
	id: string;
	category: ToDoCategoryType;
	text: string;
}

export interface ToDosData {
	[id: string]: ToDoData;
}

export const atomToDos = atom<ToDosData>({
	key: "atom-to-dos",
	default: {},
});

export const selectorAllToDos = selector({
	key: "selector-all-to-dos",
	get: ({ get }) => Object.values(get(atomToDos)),
});

export const selectorCategorizedToDos = selector<{
	[category in ToDoCategoryType]: ToDoData[];
}>({
	key: "selector-categorized-to-dos",
	get: ({ get }) => {
		const stateToDos = get(atomToDos);
		return {
			"to-do": Object.values(stateToDos).filter(
				(toDo) => toDo.category === "to-do"
			),
			doing: Object.values(stateToDos).filter(
				(toDo) => toDo.category === "doing"
			),
			done: Object.values(stateToDos).filter(
				(toDo) => toDo.category === "done"
			),
		};
	},
});

export const selectorSpecificCategoryToDos = selector({
	key: "selector-specific-category-to-dos",
	get: ({ get }) => {
		const stateCategorizedToDos = get(selectorCategorizedToDos);
		const stateCategory = get(atomCategory);
		return stateCategorizedToDos[stateCategory];
	},
});

export const atomCategory = atom<ToDoData["category"]>({
	key: "atom-category",
	default: "to-do",
});
