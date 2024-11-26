import {
	createKebabToCamelMapping,
	createKeyValueMapping,
	KebabToCamel,
} from "@/utils";
import { atom, selector, selectorFamily } from "recoil";

export const TaskTypes = ["to-do", "doing", "done"] as const;
export type TaskType = (typeof TaskTypes)[number];
export const TaskMapping = createKeyValueMapping({
	arr: TaskTypes,
});
export type TaskTypeCamel = KebabToCamel<TaskType>;
export const TaskCamelMapping = createKebabToCamelMapping({
	arr: TaskTypes,
});

export interface Task {
	id: string;
	text: string;
}

export type TaskIdValuePair = {
	[id: string]: Task;
};

export type TaskId = Task["id"];

export type TasksId = TaskTypeCamel;

export type Tasks = Record<TaskTypeCamel, TaskIdValuePair>;

export type TaskOrders = Record<TaskTypeCamel, TaskId[]>;

export type OrderedTasks = Record<TaskTypeCamel, Task[]>;

const atomTasks = atom<Tasks>({
	key: "atom-tasks",
	default: {
		toDo: {
			"e35cb02c-99d8-4a02-9844-f627e91efed1": {
				id: "e35cb02c-99d8-4a02-9844-f627e91efed1",
				text: "a",
			},
			"6a46297d-e668-453f-93d4-95e4af0b4867": {
				id: "6a46297d-e668-453f-93d4-95e4af0b4867",
				text: "b",
			},
		},
		doing: {
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
		},
		done: {
			"1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc": {
				id: "1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc",
				text: "f",
			},
		},
	},
});

const atomTaskOrder = atom<TaskOrders>({
	key: "atom-task-order",
	default: {
		toDo: [
			"e35cb02c-99d8-4a02-9844-f627e91efed1",
			"6a46297d-e668-453f-93d4-95e4af0b4867",
		],
		doing: [
			"d126b488-1f0a-4cac-9fa7-27cde99f1bd1",
			"687aac3d-925e-49a6-af8f-9fe509930d2e",
			"f6562a61-bd55-438b-b060-9c1727316b49",
		],
		done: ["1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc"],
	},
});

export const selectorTasks = selector<Tasks>({
	key: "selector-tasks",
	get: ({ get }) => {
		return get(atomTasks);
	},
});

export const selectorTaskOrder = selector<TaskOrders>({
	key: "selector-task-order",
	get: ({ get }) => {
		return get(atomTaskOrder);
	},
});

export const selectorOrderedTasksOfType = selectorFamily<Task[], TaskTypeCamel>(
	{
		key: "selector-ordered-tasks-of-type",
		get:
			(taskType) =>
			({ get }) => {
				const stateTasks = get(atomTasks)[taskType] || {};
				const stateTaskOrder = get(atomTaskOrder)[taskType] || [];
				return stateTaskOrder.map((id) => stateTasks[id]);
			},
		set:
			(taskType) =>
			({ set, get }, newOrderedTasks) => {
				const stateTaskOrder = get(atomTaskOrder);
				const newTaskOrderOfType: TaskId[] = (newOrderedTasks as Task[]).map(
					(task) => task.id
				);
				const newTaskOrder: TaskOrders = {
					...stateTaskOrder,
					[taskType]: newTaskOrderOfType,
				};

				set(atomTaskOrder, newTaskOrder);

				const stateTasks = get(atomTasks);
				const newTasksOfType: TaskIdValuePair = (
					newOrderedTasks as Task[]
				).reduce<TaskIdValuePair>((tasks, task) => {
					tasks[task.id] = task;
					return tasks;
				}, {});
				const newTasks: Tasks = {
					...stateTasks,
					[taskType]: newTasksOfType,
				};
				set(atomTasks, newTasks);
			},
	}
);

export const selectorOrderedTasks = selector<OrderedTasks>({
	key: "selector-ordered-tasks",
	get: ({ get }) => {
		return {
			toDo: get(selectorOrderedTasksOfType("toDo")),
			doing: get(selectorOrderedTasksOfType("doing")),
			done: get(selectorOrderedTasksOfType("done")),
		};
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
