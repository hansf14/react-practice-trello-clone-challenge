import { Indexer, IndexerKey } from "@/indexer";
import {
  arrayMoveElement,
  createKebabToCamelMapping,
  createKeyValueMapping,
  KebabToCamel,
} from "@/utils";
import { atom } from "recoil";
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

const { persistAtom } = recoilPersist({
  key: "recoilPersist", // this key is using to store data in local storage
  storage: localStorage, // configure which storage will be used to store the data
  converter: JSON, // configure how values will be serialized/deserialized in storage
});

const recoilKeys = createKeyValueMapping({
  arr: ["indexer-category-task-atom"],
});

export interface Category {
  id: string; // unique (index)(key)
  text: string;
  // taskList: Task[];
  // taskKeyList: Task["id"][];
}

// export type CategoryIndexer = Indexer<Category, "id">;

// export type CategoryMapping = KeyMapping<Category>;

export interface Task {
  id: string; // unique (index)(key)
  text: string;
  // categoryId: Category["id"];
}

// export type TaskIndexer = Indexer<Task, "id">;

// export type TaskKeyMapping = KeyMapping<Task>;

const defaultToDoTaskList: Task[] = [
  {
    id: "ffbde292-895d-47c8-bd6d-da6fe93dc946",
    text: "ffbde292-895d-47c8-bd6d-da6fe93dc946",
  },
  {
    id: "7c1ff38e-d7de-4093-bcda-16fcfd1644d0",
    text: "7c1ff38e-d7de-4093-bcda-16fcfd1644d0",
  },
  {
    id: "1288c3bd-5a96-46cd-8eb8-28d191f11da9",
    text: "1288c3bd-5a96-46cd-8eb8-28d191f11da9",
  },
  {
    id: "16def70c-2057-4ad5-9261-cb833728f30a",
    text: "16def70c-2057-4ad5-9261-cb833728f30a",
  },
  {
    id: "0cd50106-6130-4da0-b0a0-39e0496da2ca",
    text: "0cd50106-6130-4da0-b0a0-39e0496da2ca",
  },
  {
    id: "5f3cf3e9-0a7a-4445-b571-74a1c64c996e",
    text: "5f3cf3e9-0a7a-4445-b571-74a1c64c996e",
  },
];

const defaultDoingTaskList: Task[] = [
  {
    id: "0ee29112-68ff-4b65-9f1b-00fdd0902e0d",
    text: "0ee29112-68ff-4b65-9f1b-00fdd0902e0d",
  },
  {
    id: "087af1ed-4512-4e7e-a304-7d3e9514fb15",
    text: "087af1ed-4512-4e7e-a304-7d3e9514fb15",
  },
  {
    id: "2de48379-73a6-4cc1-8663-baf47d12af9d",
    text: "2de48379-73a6-4cc1-8663-baf47d12af9d",
  },
  {
    id: "d5c0ba6f-2eb3-4511-8234-d528c60ab154",
    text: "d5c0ba6f-2eb3-4511-8234-d528c60ab154",
  },
  {
    id: "fc6eb2f6-8ed8-47e6-a164-f9bd804aec88",
    text: "fc6eb2f6-8ed8-47e6-a164-f9bd804aec88",
  },
];

const defaultDoneTaskList: Task[] = [
  {
    id: "77d2ba3a-d639-480c-b735-2a11b17b24cb",
    text: "77d2ba3a-d639-480c-b735-2a11b17b24cb",
  },
  {
    id: "0c352776-4a3b-4a9c-aace-8765dd6c0f7a",
    text: "0c352776-4a3b-4a9c-aace-8765dd6c0f7a",
  },
  {
    id: "d78baa56-4f74-46ff-9193-c6068aec8524",
    text: "d78baa56-4f74-46ff-9193-c6068aec8524",
  },
  {
    id: "82734eea-6208-4750-a52c-6f5c1c99ade4",
    text: "82734eea-6208-4750-a52c-6f5c1c99ade4",
  },
];

const defaultToDoCategory: Category = {
  id: "ba605f3e-b99e-4450-aa0a-ddd0ec22ad71",
  text: "To Do",
};

const defaultDoingCategory: Category = {
  id: "3a378c16-536b-4bf0-ad85-b0528137fae9",
  text: "Doing",
};

const defaultDoneCategory: Category = {
  id: "1860aa7e-5f76-4843-9ee4-60a177b8e3a5",
  text: "Done",
};

const initialEntries: [IndexerKey, any[]][] = [
  [
    ["CategoryIdList"],
    [defaultToDoCategory.id, defaultDoingCategory.id, defaultDoneCategory.id],
  ],
  [
    ["CategoryId", defaultToDoCategory.id, "TaskIdList"],
    defaultToDoTaskList.map((task) => task.id),
  ],
  [
    ["CategoryId", defaultDoingCategory.id, "TaskIdList"],
    defaultDoingTaskList.map((task) => task.id),
  ],
  [
    ["CategoryId", defaultDoneCategory.id, "TaskIdList"],
    defaultDoneTaskList.map((task) => task.id),
  ],
  [["CategoryId", defaultToDoCategory.id], [defaultToDoCategory]],
  [["CategoryId", defaultDoingCategory.id], [defaultDoingCategory]],
  [["CategoryId", defaultDoneCategory.id], [defaultDoneCategory]],
  ...defaultToDoTaskList.map<[IndexerKey, string[]]>((task) => [
    ["TaskId", task.id, "CategoryId"],
    [defaultToDoCategory.id],
  ]),
  ...defaultDoingTaskList.map<[IndexerKey, string[]]>((task) => [
    ["TaskId", task.id, "CategoryId"],
    [defaultDoingCategory.id],
  ]),
  ...defaultDoneTaskList.map<[IndexerKey, string[]]>((task) => [
    ["TaskId", task.id, "CategoryId"],
    [defaultDoneCategory.id],
  ]),
  ...defaultToDoTaskList.map<[IndexerKey, Task[]]>((task) => [
    ["TaskId", task.id],
    [task],
  ]),
  ...defaultDoingTaskList.map<[IndexerKey, Task[]]>((task) => [
    ["TaskId", task.id],
    [task],
  ]),
  ...defaultDoneTaskList.map<[IndexerKey, Task[]]>((task) => [
    ["TaskId", task.id],
    [task],
  ]),
];
// console.log(initialEntries);

export const indexerCategoryTaskAtom = atom<Indexer<Category, Task>>({
  key: recoilKeys["indexer-category-task-atom"],
  default: new Indexer({
    parentKeyName: "Category",
    childKeyName: "Task",
    entries: initialEntries,
  }),
  // default: new Indexer({ entries: initialEntries }),
});
