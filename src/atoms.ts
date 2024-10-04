import { createKeyValueMapping } from "@/utils";
import { atom, selector } from "recoil";

export const ToDoCategoryTypes = ["to-do", "doing", "done"] as const;
export type ToDoCategoryType = (typeof ToDoCategoryTypes)[number];
export const ToDoCategoryMapping = createKeyValueMapping({
	arr: ToDoCategoryTypes,
});

export interface ToDoData {
	id: string;
	text: string;
}

export interface ToDosData {
	[id: string]: ToDoData;
}

const atomToDos = atom<ToDosData>({
	key: "atom-to-dos",
	default: {
		"e35cb02c-99d8-4a02-9844-f627e91efed1": {
			id: "e35cb02c-99d8-4a02-9844-f627e91efed1",
			text: "a",
		},
		"6a46297d-e668-453f-93d4-95e4af0b4867": {
			id: "6a46297d-e668-453f-93d4-95e4af0b4867",
			text: "b",
		},
		"d126b488-1f0a-4cac-9fa7-27cde99f1bd1": {
			id: "d126b488-1f0a-4cac-9fa7-27cde99f1bd1",
			text: "c",
		},
		"687aac3d-925e-49a6-af8f-9fe509930d2e": {
			id: "687aac3d-925e-49a6-af8f-9fe509930d2e",
			text: "d",
		},
		"f6562a61-bd55-438b-b060-9c1727316b49": {
			id: "f6562a61-bd55-438b-b060-9c1727316b49",
			text: "e",
		},
		"1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc": {
			id: "1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc",
			text: "f",
		},
	},
});

const atomToDosOrder = atom<ToDoData["id"][]>({
	key: "atom-to-dos-order",
	default: [
		"e35cb02c-99d8-4a02-9844-f627e91efed1",
		"6a46297d-e668-453f-93d4-95e4af0b4867",
		"d126b488-1f0a-4cac-9fa7-27cde99f1bd1",
		"687aac3d-925e-49a6-af8f-9fe509930d2e",
		"f6562a61-bd55-438b-b060-9c1727316b49",
		"1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc",
	],
});

export const selectorToDos = selector<ToDosData>({
	key: "selector-to-dos",
	get: ({ get }) => {
		return get(atomToDos);
	},
});

export const selectorOrderedListToDos = selector<ToDoData[]>({
	key: "selector-list-to-dos",
	get: ({ get }) => {
		const stateToDos = get(atomToDos);
		const stateToDosOrder = get(atomToDosOrder);
		return stateToDosOrder.map((id) => stateToDos[id]);
	},
	set: ({ set }, newOrderedListToDos) => {
		const newToDosOrder: ToDoData["id"][] = (
			newOrderedListToDos as ToDoData[]
		).map((toDo) => toDo.id);
		set(atomToDosOrder, newToDosOrder);

		const newToDos: ToDosData = (
			newOrderedListToDos as ToDoData[]
		).reduce<ToDosData>((acc, cur) => {
			acc[cur.id] = cur;
			return acc;
		}, {});
		set(atomToDos, newToDos);
	},
});

// export const selectorAllToDos = selector({
// 	key: "selector-all-to-dos",
// 	get: ({ get }) => Object.values(get(atomToDos)),
// });

// export const selectorCategorizedToDos = selector<{
// 	[category in ToDoCategoryType]: ToDoData[];
// }>({
// 	key: "selector-categorized-to-dos",
// 	get: ({ get }) => {
// 		const stateToDos = get(atomToDos);
// 		return {
// 			"to-do": Object.values(stateToDos).filter(
// 				(toDo) => toDo.category === "to-do"
// 			),
// 			doing: Object.values(stateToDos).filter(
// 				(toDo) => toDo.category === "doing"
// 			),
// 			done: Object.values(stateToDos).filter(
// 				(toDo) => toDo.category === "done"
// 			),
// 		};
// 	},
// });

// export const selectorSpecificCategoryToDos = selector({
// 	key: "selector-specific-category-to-dos",
// 	get: ({ get }) => {
// 		const stateCategorizedToDos = get(selectorCategorizedToDos);
// 		const stateCategory = get(atomCategory);
// 		return stateCategorizedToDos[stateCategory];
// 	},
// });

// export const atomCategory = atom<ToDoData["category"]>({
// 	key: "atom-category",
// 	default: "to-do",
// });
