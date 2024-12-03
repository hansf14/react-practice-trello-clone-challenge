import {
  arrayMoveElement,
  createKebabToCamelMapping,
  createKeyValueMapping,
  KebabToCamel,
  MultiMap,
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
  arr: ["indexer-atom"],
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

export type IndexerKey = string[];

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

export class Indexer extends MultiMap<IndexerKey, string | Category | Task> {
  getCategoryIdList() {
    return this.get({
      keys: ["CategoryIdList"],
    }) as string[] | undefined;
  }

  getCategoryList__MutableCategory() {
    const categoryIdList = this.getCategoryIdList();
    if (!categoryIdList) {
      console.warn("[getCategoryList__MutableCategory] !categoryIdList");
      return categoryIdList;
    }

    // TODO: change to map
    const categoryList: Category[] = [];
    categoryIdList.forEach((categoryId) => {
      const category = this.getCategory({ categoryId });
      if (category) {
        categoryList.push(category);
      }
    });
    return categoryList;
  }

  getCategory({ categoryId }: { categoryId: string }) {
    const category = (
      this.get({
        keys: ["CategoryId", categoryId],
      }) as Category[] | undefined
    )?.[0];
    // if (!category) {
    //   console.warn(`[getCategory] Category "${categoryId}" is undefined.`);
    // }
    return category;
  }

  getTaskIdListFromCategoryId({ categoryId }: { categoryId: string }) {
    return this.get({
      keys: ["CategoryId", categoryId, "TaskIdList"],
    }) as string[] | undefined;
  }

  // TODO: change to map
  getTaskListFromCategoryId__MutableTask({
    categoryId,
  }: {
    categoryId: string;
  }) {
    const taskIdList = this.getTaskIdListFromCategoryId({ categoryId });
    if (!taskIdList) {
      console.warn("[getTaskListFromCategoryId__MutableTask] !taskIdList");
      return taskIdList;
    }

    const taskList: Task[] = [];
    taskIdList.forEach((taskId) => {
      const task = this.getTask({ taskId });
      if (task) {
        taskList.push(task);
      }
    });
    return taskList;
  }

  getTask({ taskId }: { taskId: string }) {
    const task = (
      this.get({
        keys: ["TaskId", taskId],
      }) as Task[] | undefined
    )?.[0];
    // if (!task) {
    //   console.warn(
    //     `[getTask] Key "${this.serializeMultiKey({
    //       keys: ["TaskId", taskId],
    //     })}" is undefined.`,
    //   );
    // }
    return task;
  }

  getCategoryIdFromTaskId({ taskId }: { taskId: string }) {
    return this.get({
      keys: ["TaskId", taskId, "CategoryId"],
    }) as string[] | undefined;
  }

  createTask({
    categoryId,
    task,
    shouldAppend,
  }: {
    categoryId: string;
    task: Task;
    shouldAppend?: boolean;
  }) {
    if (
      this.has({
        keys: ["TaskId", task.id],
      })
    ) {
      console.warn(
        `[createTask] Key "${this.serializeMultiKey({
          keys: ["TaskId", task.id],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: ["TaskId", task.id],
      value: [task],
    });

    const taskIdList = this.getTaskIdListFromCategoryId({ categoryId });
    if (!taskIdList) {
      return;
    }
    // this.set({
    //   keys: ["CategoryId", categoryId, "TaskIdList"],
    //   value: !(shouldAppend ?? false)
    //     ? [task.id, ...taskIdList]
    //     : [...taskIdList, task.id],
    // });
    !(shouldAppend ?? false)
      ? taskIdList.unshift(task.id)
      : taskIdList.push(task.id);

    if (
      this.has({
        keys: ["TaskId", task.id, "CategoryId"],
      })
    ) {
      console.warn(
        `[createTask] Key "${this.serializeMultiKey({
          keys: ["TaskId", task.id, "CategoryId"],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: ["TaskId", task.id, "CategoryId"],
      value: [categoryId],
    });
  }

  // taskId (prev) and task.id (new) can be different.
  updateTask({ taskId, task }: { taskId: string; task: Task }) {
    const taskWrappedByArr = this.get({
      keys: ["TaskId", taskId],
    });
    if (!taskWrappedByArr) {
      console.warn("[updateTask] !taskWrappedByArr");
      return;
    }

    if (taskId === task.id) {
      taskWrappedByArr[0] = task;
      // this.set({
      //   keys: ["TaskId", task.id],
      //   value: [task],
      // });
    } else {
      const categoryIdWrappedByArr = this.getCategoryIdFromTaskId({ taskId });
      if (!categoryIdWrappedByArr) {
        console.warn("[updateTask] !categoryIdWrappedByArr");
        return;
      }
      const categoryId = categoryIdWrappedByArr[0];
      this.delete({
        keys: ["TaskId", taskId, "CategoryId"],
      });
      if (this.getCategoryIdFromTaskId({ taskId: task.id })) {
        console.warn("[updateTask] this.getCategoryIdFromTaskId");
        return;
      }
      this.set({
        keys: ["TaskId", task.id, "CategoryId"],
        value: [categoryId],
      });

      const taskIdList = this.getTaskIdListFromCategoryId({
        categoryId,
      });
      if (!taskIdList) {
        console.warn("[updateTask] !taskIdList");
        return;
      }
      // const taskIdListClone = [...taskIdList];
      // const targetIdx = taskIdListClone.findIndex(
      //   (_taskId) => _taskId === taskId,
      // );
      // taskIdListClone[targetIdx] = task.id;
      // this.set({
      //   keys: ["CategoryId", categoryId, "TaskIdList"],
      //   value: taskIdListClone,
      // });
      const targetIdx = taskIdList.findIndex((_taskId) => _taskId === taskId);
      if (targetIdx === -1) {
        console.warn("[updateTask] targetIdx === -1");
        return;
      }
      taskIdList[targetIdx] = task.id;

      if (
        !this.has({
          keys: ["TaskId", taskId],
        })
      ) {
        console.warn(
          `[updateTask] Key "${this.serializeMultiKey({
            keys: ["TaskId", taskId],
          })}" doesn't exist.`,
        );
        return;
      }
      this.delete({
        keys: ["TaskId", taskId],
      });
      if (
        this.has({
          keys: ["TaskId", task.id],
        })
      ) {
        console.warn(
          `[updateTask] Key "${this.serializeMultiKey({
            keys: ["TaskId", task.id],
          })}" already exists.`,
        );
        return;
      }
      this.set({
        keys: ["TaskId", task.id],
        value: [task],
      });
    }
  }

  removeTask({ taskId }: { taskId: string }) {
    const categoryIdWrappedByArr = this.getCategoryIdFromTaskId({
      taskId,
    });
    if (!categoryIdWrappedByArr) {
      console.warn("[removeTask] !categoryIdWrappedByArr");
      return;
    }
    const categoryId = categoryIdWrappedByArr[0];
    this.delete({
      keys: ["TaskId", taskId, "CategoryId"],
    });

    const taskIdList = this.getTaskIdListFromCategoryId({
      categoryId,
    });
    if (!taskIdList) {
      console.warn("[removeTask] !taskIdList");
      return;
    }
    // this.set({
    //   keys: ["CategoryId", categoryId, "TaskIdList"],
    //   value: taskIdList.filter((_taskId) => _taskId !== taskId),
    // });
    const targetIdx = taskIdList.findIndex((_taskId) => _taskId === taskId);
    if (targetIdx === -1) {
      console.warn("[removeTask] targetIdx === -1");
      return;
    }
    taskIdList.splice(targetIdx, 1);

    if (
      !this.has({
        keys: ["TaskId", taskId],
      })
    ) {
      console.warn(
        `[removeTask] Key "${this.serializeMultiKey({
          keys: ["TaskId", taskId],
        })}" doesn't exist.`,
      );
      return;
    }
    this.delete({
      keys: ["TaskId", taskId],
    });
  }

  createCategory({
    category,
    shouldAppend,
  }: {
    category: Category;
    shouldAppend?: boolean;
  }) {
    if (
      this.has({
        keys: ["CategoryId", category.id],
      })
    ) {
      console.warn(
        `[createCategory] Key "${this.serializeMultiKey({
          keys: ["CategoryId", category.id],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: ["CategoryId", category.id],
      value: [category],
    });

    const categoryIdList = this.getCategoryIdList();
    if (!categoryIdList) {
      console.warn("[createCategory] !categoryIdList");
      return;
    }
    // this.set({
    //   keys: ["CategoryIdList"],
    //   value: !(shouldAppend ?? false)
    //     ? [category, ...categoryList]
    //     : [...categoryList, category],
    // });
    !(shouldAppend ?? false)
      ? categoryIdList.unshift(category.id)
      : categoryIdList.push(category.id);

    if (
      this.getTaskIdListFromCategoryId({
        categoryId: category.id,
      })
    ) {
      console.warn("[createCategory] this.getTaskIdListFromCategoryId");
      return;
    }
    this.set({
      keys: ["CategoryId", category.id, "TaskIdList"],
      value: [],
    });
  }

  // categoryId (prev) and category.id (new) can be different.
  updateCategory({
    categoryId,
    category,
  }: {
    categoryId: string;
    category: Category;
  }) {
    const categoryWrappedByArr = this.get({
      keys: ["CategoryId", categoryId],
    });
    if (!categoryWrappedByArr) {
      console.warn("[updateCategory] !categoryWrappedByArr");
      return;
    }

    if (categoryId === category.id) {
      categoryWrappedByArr[0] = category;
      // this.set({
      //   keys: ["CategoryId", category.id],
      //   value: [category],
      // });
    } else {
      const categoryIdList = this.getCategoryIdList();
      if (!categoryIdList) {
        console.warn("[updateCategory] !categoryIdList");
        return;
      }
      // const categoryIdListClone = [...categoryIdList];
      // const targetIdx = categoryIdListClone.findIndex(
      //   (_categoryId) => _categoryId === categoryId,
      // );
      // categoryIdListClone[targetIdx] = category.id;
      // this.set({
      //   keys: ["CategoryIdList"],
      //   value: categoryIdListClone,
      // });
      const targetIdx = categoryIdList.findIndex(
        (_categoryId) => _categoryId === categoryId,
      );
      if (targetIdx === -1) {
        console.warn("[updateCategory] targetIdx === -1");
        return;
      }
      categoryIdList[targetIdx] = category.id;

      const taskIdList = this.getTaskIdListFromCategoryId({
        categoryId,
      });
      if (!taskIdList) {
        console.warn("[updateCategory] !taskIdList");
        return;
      }
      this.delete({
        keys: ["CategoryId", categoryId, "TaskIdList"],
      });
      if (this.getTaskIdListFromCategoryId({ categoryId: category.id })) {
        console.warn("[updateCategory] this.getTaskIdListFromCategoryId");
      }
      this.set({
        keys: ["CategoryId", category.id, "TaskIdList"],
        value: taskIdList,
      });

      if (
        !this.has({
          keys: ["CategoryId", categoryId],
        })
      ) {
        console.warn(
          `[updateCategory] Key "${this.serializeMultiKey({
            keys: ["CategoryId", categoryId],
          })}" doesn't exist.`,
        );
        return;
      }
      this.delete({
        keys: ["CategoryId", categoryId],
      });
      if (
        this.has({
          keys: ["CategoryId", category.id],
        })
      ) {
        console.warn(
          `[updateCategory] Key "${this.serializeMultiKey({
            keys: ["CategoryId", category.id],
          })}" already exists.`,
        );
        return;
      }
      this.set({
        keys: ["CategoryId", category.id],
        value: [category],
      });

      taskIdList.forEach((taskId) => {
        const categoryIdWrappedByArr = this.getCategoryIdFromTaskId({
          taskId,
        });
        if (!categoryIdWrappedByArr) {
          console.warn("[updateCategory] !categoryIdWrappedByArr");
          return;
        }
        categoryIdWrappedByArr[0] = category.id;
        // this.set({
        //   keys: ["TaskId", taskId, "CategoryId"],
        //   value: [category.id],
        // });
      });
    }
  }

  removeCategory({ categoryId }: { categoryId: string }) {
    const categoryIdList = this.getCategoryIdList();
    if (!categoryIdList) {
      console.warn(`[removeCategory] !categoryIdList`);
      return;
    }
    // this.set({
    //   keys: ["CategoryIdList"],
    //   value: categoryIdList.filter((_categoryId) => _categoryId !== categoryId),
    // });
    const targetIdx = categoryIdList.findIndex(
      (_categoryId) => _categoryId === categoryId,
    );
    if (targetIdx === -1) {
      console.warn("[removeCategory] targetIdx === -1");
      return;
    }
    categoryIdList.splice(targetIdx, 1);

    const taskIdList = this.getTaskIdListFromCategoryId({
      categoryId,
    });
    if (!taskIdList) {
      console.warn("[removeCategory] !taskIdList");
      return;
    }
    this.delete({
      keys: ["CategoryId", categoryId, "TaskIdList"],
    });

    if (
      !this.has({
        keys: ["CategoryId", categoryId],
      })
    ) {
      console.warn(
        `[removeCategory] Key "${this.serializeMultiKey({
          keys: ["CategoryId", categoryId],
        })}" doesn't exist.`,
      );
      return;
    }
    this.delete({
      keys: ["CategoryId", categoryId],
    });

    taskIdList.forEach((taskId) => {
      const categoryIdWrappedByArr = this.getCategoryIdFromTaskId({
        taskId,
      });
      if (!categoryIdWrappedByArr) {
        console.warn("[updateCategory] !categoryIdWrappedByArr");
        return;
      }
      this.delete({
        keys: ["TaskId", taskId, "CategoryId"],
      });
    });
  }

  moveCategory({ idxFrom, idxTo }: { idxFrom: number; idxTo: number }) {
    const categoryIdList = this.getCategoryIdList();
    if (!categoryIdList) {
      console.warn("[moveCategory] !categoryIdList");
      return;
    }
    arrayMoveElement({
      arr: categoryIdList,
      idxFrom,
      idxTo,
    });
  }

  moveTask({
    categoryIdFrom,
    categoryIdTo,
    idxFrom,
    idxTo,
  }: {
    categoryIdFrom: string;
    categoryIdTo: string;
    idxFrom: number;
    idxTo: number;
  }) {
    const taskIdListFrom = this.getTaskIdListFromCategoryId({
      categoryId: categoryIdFrom,
    });
    if (!taskIdListFrom) {
      return;
    }

    if (categoryIdFrom === categoryIdTo) {
      arrayMoveElement({
        arr: taskIdListFrom,
        idxFrom,
        idxTo,
      });
    } else {
      const taskIdListFrom = this.getTaskIdListFromCategoryId({
        categoryId: categoryIdFrom,
      });
      if (!taskIdListFrom) {
        console.warn("[moveTask] !taskIdListFrom");
        return;
      }
      const [targetTaskId] = taskIdListFrom.splice(idxFrom, 1);

      const taskIdListTo = this.getTaskIdListFromCategoryId({
        categoryId: categoryIdTo,
      });
      if (!taskIdListTo) {
        console.warn("[moveTask] !taskIdListTo");
        return;
      }
      taskIdListTo.splice(idxTo, 0, targetTaskId);

      const categoryIdWrappedByArr = this.getCategoryIdFromTaskId({
        taskId: targetTaskId,
      });
      if (!categoryIdWrappedByArr) {
        console.warn("[moveTask] !categoryIdWrappedByArr");
        return;
      }
      categoryIdWrappedByArr[0] = categoryIdTo;

      // this.removeTask({
      //   taskId: targetTask.id,
      // });
      // this.createTask({
      //   categoryId: categoryIdTo,
      //   task: targetTask,
      //   shouldAppend: false,
      // });
      // arrayMoveElement({
      //   arr: taskIdListTo,
      //   idxFrom: 0,
      //   idxTo: idxTo + 1,
      // });
    }
  }
}

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

export const indexerAtom = atom<Indexer>({
  key: recoilKeys["indexer-atom"],
  default: new Indexer({ entries: initialEntries }),
});
