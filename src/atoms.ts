import {
  createKebabToCamelMapping,
  createKeyValueMapping,
  Indexer,
  KebabToCamel,
  KeyMapping,
} from "@/utils";
import { atom, RecoilState, selectorFamily } from "recoil";
import { recoilPersist } from "recoil-persist";

export const DefaultCategoryTextTypes = ["to-do", "doing", "done"] as const;
export type DefaultCategoryTextType = (typeof DefaultCategoryTextTypes)[number];
export const DefaultCategoryTextMapping = createKeyValueMapping({
  arr: DefaultCategoryTextTypes,
});
export type DefaultCategoryTextCamelType =
  KebabToCamel<DefaultCategoryTextType>;
export const DefaultCategoryTextCamelMapping = createKebabToCamelMapping({
  arr: DefaultCategoryTextTypes,
});

export interface Categories {
  [categoryText: Category["text"]]: RecoilState<Category>;
}

const { persistAtom } = recoilPersist({
  key: "recoilPersist", // this key is using to store data in local storage
  storage: localStorage, // configure which storage will be used to store the data
  converter: JSON, // configure how values will be serialized/deserialized in storage
});

const recoilKeys = createKeyValueMapping({
  arr: [
    "categoryListAtom",
    "categoryIndexerSelector",
    "taskListAtom",
    "taskIndexerSelector",
    "categorySelectorFamily",
  ],
});

export interface Category {
  text: string; // unique (index)(key)
  // taskKeyList: Task["id"][];
  taskList: Task[];
}

export type CategoryIndexer = Indexer<Category, "text">;

export type CategoryMapping = KeyMapping<Category>;

export interface Task {
  id: string; // unique (index)(key)
  text: string;
  categoryKey: Category["text"];
}
export type TaskIndexer = Indexer<Task, "id">;

export type TaskKeyMapping = KeyMapping<Task>;

const defaultTaskList: Task[] = [
  {
    id: "ffbde292-895d-47c8-bd6d-da6fe93dc946",
    text: "ToDo01",
    categoryKey: "To Do",
  },
  {
    id: "7c1ff38e-d7de-4093-bcda-16fcfd1644d0",
    text: "ToDo02",
    categoryKey: "To Do",
  },
  {
    id: "1288c3bd-5a96-46cd-8eb8-28d191f11da9",
    text: "ToDo03",
    categoryKey: "To Do",
  },
  {
    id: "16def70c-2057-4ad5-9261-cb833728f30a",
    text: "ToDo04",
    categoryKey: "To Do",
  },
  {
    id: "0cd50106-6130-4da0-b0a0-39e0496da2ca",
    text: "ToDo05",
    categoryKey: "To Do",
  },
  {
    id: "5f3cf3e9-0a7a-4445-b571-74a1c64c996e",
    text: "ToDo06",
    categoryKey: "To Do",
  },
  {
    id: "0ee29112-68ff-4b65-9f1b-00fdd0902e0d",
    text: "Doing01",
    categoryKey: "Doing",
  },
  {
    id: "087af1ed-4512-4e7e-a304-7d3e9514fb15",
    text: "Doing02",
    categoryKey: "Doing",
  },
  {
    id: "2de48379-73a6-4cc1-8663-baf47d12af9d",
    text: "Doing03",
    categoryKey: "Doing",
  },
  {
    id: "d5c0ba6f-2eb3-4511-8234-d528c60ab154",
    text: "Doing04",
    categoryKey: "Doing",
  },
  {
    id: "fc6eb2f6-8ed8-47e6-a164-f9bd804aec88",
    text: "Doing05",
    categoryKey: "Doing",
  },
  {
    id: "77d2ba3a-d639-480c-b735-2a11b17b24cb",
    text: "Done01",
    categoryKey: "Done",
  },
  {
    id: "0c352776-4a3b-4a9c-aace-8765dd6c0f7a",
    text: "Done02",
    categoryKey: "Done",
  },
  {
    id: "d78baa56-4f74-46ff-9193-c6068aec8524",
    text: "Done03",
    categoryKey: "Done",
  },
  {
    id: "82734eea-6208-4750-a52c-6f5c1c99ade4",
    text: "Done04",
    categoryKey: "Done",
  },
];

const defaultCategoryList = Object.values(
  defaultTaskList.reduce<{
    [text: Category["text"]]: Category;
  }>((acc, cur) => {
    if (acc[cur.categoryKey]) {
      acc[cur.categoryKey].taskList.push(cur);
      // acc[cur.categoryKey].taskKeyList.push(cur.id);
    } else {
      acc[cur.categoryKey] = {
        text: cur.categoryKey,
        taskList: [cur],
        // taskKeyList: [cur.id],
      };
    }
    return acc;
  }, {}),
);

export const categoryListAtom = atom<Category[]>({
  key: recoilKeys["categoryListAtom"],
  default: defaultCategoryList,
  // effects_UNSTABLE: [persistAtom],
});

// export const categoryIndexerSelector = selector<CategoryIndexer>({
//   key: recoilKeys["categoryIndexerSelector"],
//   get: ({ get }) => {
//     const categoryList = get(categoryListAtom);
//     return listToIndexer(categoryList, "text");
//   },
// });

export const categorySelectorFamily = selectorFamily<
  Category | undefined,
  Category["text"]
>({
  key: recoilKeys["categorySelectorFamily"],
  get:
    (text) =>
    ({ get }) => {
      return get(categoryListAtom).find((category) => category.text === text);
    },
  set:
    (text) =>
    ({ set, get }, newValue) => {
      if (!newValue) {
        return;
      }
      const categoryList = get(categoryListAtom);
      const targetIdx = categoryList.findIndex(
        (category) => category.text === text,
      );
      if (targetIdx === -1) {
        return;
      }
      const categoryListClone = [...categoryList];
      categoryListClone[targetIdx] = newValue as Category;
      set(categoryListAtom, categoryListClone);
    },
});

// export const taskListAtom = atom<Task[]>({
//   key: recoilKeys["taskListAtom"],
//   default: defaultTaskList,
//   effects_UNSTABLE: [persistAtom],
// });

// export const taskIndexerSelector = selector<TaskIndexer>({
//   key: recoilKeys["taskIndexerSelector"],
//   get: ({ get }) => {
//     const taskList = get(taskListAtom);
//     return listToIndexer(taskList, "id");
//   },
// });

// const categoryAtom = selectorFamily<Category | undefined, Category["text"]>({
//   key: "categoryAtom",
//   // default: {
//   //   text: "New",
//   //   taskKeyList: [],
//   // } satisfies Category,
//   get:
//     (text) =>
//     ({ get }) => {
//       return {
//         text,
//         taskKeyList: categoryMap[text]?.taskKeyList,
//       } satisfies Category;
//     },
//   effects: [
//     ({ onSet, node, getLoadable }) => {
//       console.log("Atom initialized!");
//       console.log(node);
//       const selfLoadable = getLoadable(node);
//       console.log(selfLoadable);
//       const self = selfLoadable.contents as Category | undefined;
//       if (!self) console.log(self);

//       const categoryMapClone = {
//         ...categoryMap,
//       };
//       categoryMapClone[self.text] = self;
//       categoryMap = categoryMapClone;
//       console.log(categoryMap);

//       onSet((newValue, oldValue, isReset) => {
//         console.log("newValue:", newValue);
//         if (newValue === oldValue) {
//           return;
//         }
//         const categoryMapClone = {
//           ...categoryMap,
//         };
//         categoryMapClone[newValue.text] = newValue;
//         delete categoryMapClone[(oldValue as Category).text];
//         categoryMap = categoryMapClone;
//         console.log(categoryMap);
//       });
//     },
//   ],
// });

// const taskAtom = atom<Task>({
//   key: "taskAtom",
//   default: {
//     id: generateUniqueRandomId(),
//     text: "",
//     categoryKey: "New",
//   } satisfies Task,
//   effects: [
//     ({ onSet, node, getLoadable }) => {
//       const selfLoadable = getLoadable(node);
//       const self = selfLoadable.contents as Task;

//       const taskMapClone = {
//         ...taskMap,
//       };
//       taskMapClone[self.text] = self;
//       taskMap = taskMapClone;
//       console.log(taskMap);

//       onSet((newValue, oldValue, isReset) => {
//         console.log("newValue:", newValue);
//         if (newValue === oldValue) {
//           return;
//         }
//         const taskMapClone = {
//           ...taskMap,
//         };
//         taskMapClone[newValue.text] = newValue;
//         delete taskMapClone[(oldValue as Task).text];
//         taskMap = taskMapClone;
//         console.log(taskMap);
//       });
//     },
//   ],
// });

// // Atom family to manage individual category states
// export const categoryAtomFamily = atomFamily<Category, string>({
//   key: "categoryAtomFamily",
//   default: (text) => ({
//     text,
//     taskIdList: [],
//   }),
// });

// // Atom family to manage individual task states
// export const taskAtomFamily = atomFamily<Task, string>({
//   key: "taskAtomFamily",
//   default: (id) => ({
//     id,
//     text: "",
//     category: categoryAtomFamily("defaultCategory"), // Default category
//   }),
// });

// export const atomCategory = atom<Category | null>({
//   key: recoilKeys["atomCategory"],
//   default: null,
//   effects_UNSTABLE: [persistAtom],
// });

// export const atomCategories = atom<Categories>({
//   key: recoilKeys["atomCategories"],
//   default: {} satisfies Categories,
//   effects_UNSTABLE: [persistAtom],
// });

// export const atomCategories = atom<Categories>({
// 	key: recoilKeys["atomCategories"],
// 	default: Object.create(null, {
// 		a: {
// 		}, b: {}
// 	}),
// 	effects_UNSTABLE: [persistAtom],
// });

// const atomTasks = atom<Tasks>({
// 	key: "atom-tasks",
// 	default: {
// 		toDo: {
// 			"e35cb02c-99d8-4a02-9844-f627e91efed1": {
// 				id: "e35cb02c-99d8-4a02-9844-f627e91efed1",
// 				text: "a",
// 			},
// 			"6a46297d-e668-453f-93d4-95e4af0b4867": {
// 				id: "6a46297d-e668-453f-93d4-95e4af0b4867",
// 				text: "b",
// 			},
// 		},
// 		doing: {
// 			"d126b488-1f0a-4cac-9fa7-27cde99f1bd1": {
// 				id: "d126b488-1f0a-4cac-9fa7-27cde99f1bd1",
// 				text: "c",
// 			},
// 			"687aac3d-925e-49a6-af8f-9fe509930d2e": {
// 				id: "687aac3d-925e-49a6-af8f-9fe509930d2e",
// 				text: "d",
// 			},
// 			"f6562a61-bd55-438b-b060-9c1727316b49": {
// 				id: "f6562a61-bd55-438b-b060-9c1727316b49",
// 				text: "e",
// 			},
// 		},
// 		done: {
// 			"1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc": {
// 				id: "1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc",
// 				text: "f",
// 			},
// 		},
// 	},
// });

// const atomTaskOrder = atom<TaskOrders>({
// 	key: "atom-task-order",
// 	default: {
// 		toDo: [
// 			"e35cb02c-99d8-4a02-9844-f627e91efed1",
// 			"6a46297d-e668-453f-93d4-95e4af0b4867",
// 		],
// 		doing: [
// 			"d126b488-1f0a-4cac-9fa7-27cde99f1bd1",
// 			"687aac3d-925e-49a6-af8f-9fe509930d2e",
// 			"f6562a61-bd55-438b-b060-9c1727316b49",
// 		],
// 		done: ["1770cd3d-f62b-4b61-b4f3-9ccc8bd218bc"],
// 	},
// });

// export const selectorTasks = selector<Tasks>({
// 	key: "selector-tasks",
// 	get: ({ get }) => {
// 		return get(atomTasks);
// 	},
// });

// export const selectorTaskOrder = selector<TaskOrders>({
// 	key: "selector-task-order",
// 	get: ({ get }) => {
// 		return get(atomTaskOrder);
// 	},
// });

// export const selectorOrderedTasksOfType = selectorFamily<Task[], DefaultCategoryTextCamelType>(
// 	{
// 		key: "selector-ordered-tasks-of-type",
// 		get:
// 			(taskType) =>
// 			({ get }) => {
// 				const stateTasks = get(atomTasks)[taskType] || {};
// 				const stateTaskOrder = get(atomTaskOrder)[taskType] || [];
// 				return stateTaskOrder.map((id) => stateTasks[id]);
// 			},
// 		set:
// 			(taskType) =>
// 			({ set, get }, newOrderedTasks) => {
// 				const stateTaskOrder = get(atomTaskOrder);
// 				const newTaskOrderOfType: TaskId[] = (newOrderedTasks as Task[]).map(
// 					(task) => task.id
// 				);
// 				const newTaskOrder: TaskOrders = {
// 					...stateTaskOrder,
// 					[taskType]: newTaskOrderOfType,
// 				};

// 				set(atomTaskOrder, newTaskOrder);

// 				const stateTasks = get(atomTasks);
// 				const newTasksOfType: TaskIdValuePair = (
// 					newOrderedTasks as Task[]
// 				).reduce<TaskIdValuePair>((tasks, task) => {
// 					tasks[task.id] = task;
// 					return tasks;
// 				}, {});
// 				const newTasks: Tasks = {
// 					...stateTasks,
// 					[taskType]: newTasksOfType,
// 				};
// 				set(atomTasks, newTasks);
// 			},
// 	}
// );

// export const selectorOrderedTasks = selector<OrderedTasks>({
// 	key: "selector-ordered-tasks",
// 	get: ({ get }) => {
// 		return {
// 			toDo: get(selectorOrderedTasksOfType("toDo")),
// 			doing: get(selectorOrderedTasksOfType("doing")),
// 			done: get(selectorOrderedTasksOfType("done")),
// 		};
// 	},
// });

//////////////////////////////////////

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
