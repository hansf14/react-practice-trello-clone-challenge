import "reflect-metadata";
import { Expose, instanceToPlain } from "class-transformer";
import { MultiMap } from "@/multimap";
import { arrayMoveElement, mutateCopyDeep, SmartMerge } from "@/utils";

export type IndexerKey = string[];

export type IndexerBaseItem = {
  id: string;
}; // & Record<any, any>;

// TODO: implement and test `Indexer` when needed
// export type IndexerEntry<T extends IndexerBaseItem> = [
//   NestedIndexerKey,
//   string[] | T[],
// ];

// export class Indexer<T extends IndexerBaseItem> extends MultiMap<
//   IndexerKey,
//   string | T
// > {
//   @Expose()
//   itemKeyName: string;

//   constructor({
//     itemKeyName,
//     entries,
//   }: {
//     itemKeyName: string;
//     entries?: IndexerEntry<T>[];
//   });
//   constructor(original: Indexer<T>);

//   constructor(
//     params:
//       | {
//           itemKeyName: string;
//           entries?: IndexerEntry<T>[];
//         }
//       | Indexer<T>,
//   ) {
//     if (params instanceof Indexer) {
//       super(params);
//     } else {
//       super({ entries: params.entries ?? [] });
//     }
//     this.itemKeyName = params.itemKeyName;
//   }

//   // Convert to a plain object
//   override toPlain(): object {
//     return instanceToPlain(this, { strategy: "excludeAll" });
//   }

//   // Convert to a JSON string
//   override toString(): string {
//     return JSON.stringify(this.toPlain());
//   }

//   getItemIdList() {
//     return this.get({
//       keys: [`${this.itemKeyName}IdList`],
//     }) as string[] | undefined;
//   }

//   getItemList__MutableItem() {
//     const itemIdList = this.getItemIdList();
//     if (!itemIdList) {
//       console.warn("[getItemList__MutableItem] !parentIdList");
//       return itemIdList;
//     }

//     const itemList: T[] = [];
//     itemIdList.forEach((itemId) => {
//       const item = this.getItem({ itemId });
//       if (item) {
//         itemList.push(item);
//       } else {
//         console.warn("[getItemList__MutableItem] !item");
//       }
//     });
//     return itemList;
//   }

//   getItem({ itemId }: { itemId: string }) {
//     const item = (
//       this.get({
//         keys: [`${this.itemKeyName}Id`, itemId],
//       }) as T[] | undefined
//     )?.[0];
//     return item;
//   }

//   createItem({ item, shouldAppend }: { item: T; shouldAppend?: boolean }) {
//     if (
//       this.has({
//         keys: [`${this.itemKeyName}Id`, item.id],
//       })
//     ) {
//       console.warn(
//         `[createItem] Key "${this.serializeMultiKey({
//           keys: [`${this.itemKeyName}Id`, item.id],
//         })}" already exists.`,
//       );
//       return;
//     }
//     this.set({
//       keys: [`${this.itemKeyName}Id`, item.id],
//       value: [item],
//     });

//     const itemIdList = this.getItemIdList();
//     if (!itemIdList) {
//       console.warn("[createItem] !itemIdList");
//       return;
//     }
//     !(shouldAppend ?? false)
//       ? itemIdList.unshift(item.id)
//       : itemIdList.push(item.id);
//   }

//   // itemId (prev) and item.id (new) can be different.
//   updateItem({ itemId, item }: { itemId: string; item: T }) {
//     const itemWrappedByArr = this.get({
//       keys: [`${this.itemKeyName}Id`, itemId],
//     });
//     if (!itemWrappedByArr) {
//       console.warn("[updateItem] !itemWrappedByArr");
//       return;
//     }

//     if (itemId === item.id) {
//       itemWrappedByArr[0] = item;
//     } else {
//       const itemIdList = this.getItemIdList();
//       if (!itemIdList) {
//         console.warn("[updateItem] !itemIdList");
//         return;
//       }
//       const targetIdx = itemIdList.findIndex((_itemId) => _itemId === itemId);
//       if (targetIdx === -1) {
//         console.warn("[updateItem] targetIdx === -1");
//         return;
//       }
//       itemIdList[targetIdx] = item.id;

//       if (
//         !this.has({
//           keys: [`${this.itemKeyName}Id`, itemId],
//         })
//       ) {
//         console.warn(
//           `[updateItem] Key "${this.serializeMultiKey({
//             keys: [`${this.itemKeyName}Id`, itemId],
//           })}" doesn't exist.`,
//         );
//         return;
//       }
//       this.delete({
//         keys: [`${this.itemKeyName}Id`, itemId],
//       });
//       if (
//         this.has({
//           keys: [`${this.itemKeyName}Id`, item.id],
//         })
//       ) {
//         console.warn(
//           `[updateItem] Key "${this.serializeMultiKey({
//             keys: [`${this.itemKeyName}Id`, item.id],
//           })}" already exists.`,
//         );
//         return;
//       }
//       this.set({
//         keys: [`${this.itemKeyName}Id`, item.id],
//         value: [item],
//       });
//     }
//   }

//   removeItem({ itemId }: { itemId: string }) {
//     const itemIdList = this.getItemIdList();
//     if (!itemIdList) {
//       console.warn(`[removeItem] !itemIdList`);
//       return;
//     }
//     const targetIdx = itemIdList.findIndex((_itemId) => _itemId === itemId);
//     if (targetIdx === -1) {
//       console.warn("[removeItem] targetIdx === -1");
//       return;
//     }
//     itemIdList.splice(targetIdx, 1);

//     if (
//       !this.has({
//         keys: [`${this.itemKeyName}Id`, itemId],
//       })
//     ) {
//       console.warn(
//         `[removeItem] Key "${this.serializeMultiKey({
//           keys: [`${this.itemKeyName}Id`, itemId],
//         })}" doesn't exist.`,
//       );
//       return;
//     }
//     this.delete({
//       keys: [`${this.itemKeyName}Id`, itemId],
//     });
//   }

//   moveItem({ idxFrom, idxTo }: { idxFrom: number; idxTo: number }) {
//     const itemIdList = this.getItemIdList();
//     if (!itemIdList) {
//       console.warn("[moveItem] !itemIdList");
//       return;
//     }
//     arrayMoveElement({
//       arr: itemIdList,
//       idxFrom,
//       idxTo,
//     });
//   }
// }

// export const initialEntries: [
//   NestedIndexerKey,
//   string[] | ParentItem[] | ChildItem[],
// ][] = [
//   [
//     ["CategoryIdList"],
//     [defaultToDoCategory.id, defaultDoingCategory.id, defaultDoneCategory.id],
//   ],
//   [
//     ["CategoryId", defaultToDoCategory.id, "TaskIdList"],
//     defaultToDoTaskList.map((task) => task.id),
//   ],
//   [
//     ["CategoryId", defaultDoingCategory.id, "TaskIdList"],
//     defaultDoingTaskList.map((task) => task.id),
//   ],
//   [
//     ["CategoryId", defaultDoneCategory.id, "TaskIdList"],
//     defaultDoneTaskList.map((task) => task.id),
//   ],
//   [["CategoryId", defaultToDoCategory.id], [defaultToDoCategory]],
//   [["CategoryId", defaultDoingCategory.id], [defaultDoingCategory]],
//   [["CategoryId", defaultDoneCategory.id], [defaultDoneCategory]],
//   ...defaultToDoTaskList.map<[NestedIndexerKey, string[]]>((task) => [
//     ["TaskId", task.id, "CategoryId"],
//     [defaultToDoCategory.id],
//   ]),
//   ...defaultDoingTaskList.map<[NestedIndexerKey, string[]]>((task) => [
//     ["TaskId", task.id, "CategoryId"],
//     [defaultDoingCategory.id],
//   ]),
//   ...defaultDoneTaskList.map<[NestedIndexerKey, string[]]>((task) => [
//     ["TaskId", task.id, "CategoryId"],
//     [defaultDoneCategory.id],
//   ]),
//   ...defaultToDoTaskList.map<[NestedIndexerKey, ChildItem[]]>((task) => [
//     ["TaskId", task.id],
//     [task],
//   ]),
//   ...defaultDoingTaskList.map<[NestedIndexerKey, ChildItem[]]>((task) => [
//     ["TaskId", task.id],
//     [task],
//   ]),
//   ...defaultDoneTaskList.map<[NestedIndexerKey, ChildItem[]]>((task) => [
//     ["TaskId", task.id],
//     [task],
//   ]),
// ];

export type NestedIndexerKey = IndexerKey;

export type NestedIndexerBaseItem = SmartMerge<IndexerBaseItem>;

export type NestedIndexerItem = SmartMerge<
  NestedIndexerBaseItem & {
    items?: NestedIndexerBaseItem[];
  }
>;

export type NestedIndexerChildItem = SmartMerge<NestedIndexerBaseItem>;

export type NestedIndexerParentItem = SmartMerge<
  NestedIndexerBaseItem & {
    items?: NestedIndexerChildItem[];
  }
>;

export type NestedIndexerEntry<
  Parent extends NestedIndexerParentItem = NestedIndexerParentItem,
  Child extends NestedIndexerChildItem = NestedIndexerChildItem,
> = [NestedIndexerKey, string[] | Parent[] | Child[]];

export class NestedIndexer<
  Parent extends NestedIndexerParentItem = NestedIndexerParentItem,
  Child extends NestedIndexerChildItem = NestedIndexerChildItem,
> extends MultiMap<
  NestedIndexerKey,
  string | Parent | Child,
  string[] | Parent[] | Child[]
> {
  @Expose()
  parentKeyName: string;

  @Expose()
  childKeyName: string;

  @Expose()
  parentItems: Parent[];

  constructor({
    parentKeyName,
    childKeyName,
    entries,
    parentItems,
  }: {
    parentKeyName: string;
    childKeyName: string;
    entries?: NestedIndexerEntry<Parent, Child>[];
    parentItems?: Parent[];
  });
  constructor(original: NestedIndexer<Parent, Child>);

  constructor(
    params:
      | {
          parentKeyName: string;
          childKeyName: string;
          entries?: NestedIndexerEntry<Parent, Child>[];
          parentItems?: Parent[];
        }
      | NestedIndexer<Parent, Child>,
  ) {
    if (params instanceof NestedIndexer || params.parentItems) {
      super();

      this.parentKeyName = params.parentKeyName;
      this.childKeyName = params.childKeyName;

      const parentItems: Parent[] = [];
      mutateCopyDeep({
        target: parentItems,
        source: params.parentItems ?? [],
      });
      // params instanceof NestedIndexer ? params.parentItems : params.parentItems
      // const parentItems = cloneDeep(params.parentItems);
      // ㄴ If not deep clone, the copied `parentItems` and/or `parentItems[0]`, etc. would be immutable when params is from RecoilState (immutable).

      this.parentKeyName = params.parentKeyName;
      this.childKeyName = params.childKeyName;

      // Prone to infinite loop if not cautious.
      this.parentItems = [];
      // ㄴ To prevent infinite loop (because `this.createParent` mutates the `this.parentItems`)
      const parents = parentItems;
      for (const parent of parents) {
        this.createParent({
          parent,
          shouldAppend: true,
          shouldKeepRef: false,
        });

        const children = [...(parent.items ?? [])];
        // ㄴ To prevent infinite loop (because `this.createChild` mutates the `parent.items`)

        // console.log(Object.getOwnPropertyDescriptor(parent, "items"));
        parent.items = [];
        // ㄴ Without this, children count will be exactly twice the original source (because it children will get assigned once from `createParent`, and again from `createChild`).

        for (const child of children) {
          this.createChild({
            parentId: parent.id,
            child: child as Child,
            shouldAppend: true,
            shouldKeepRef: false,
          });
        }
      }
    } else if (params.entries) {
      const entries = params.entries ?? [];
      super({ entries });

      this.parentKeyName = params.parentKeyName;
      this.childKeyName = params.childKeyName;

      const parents = this._getParentList__MutableParent() ?? [];
      for (const parent of parents) {
        parent.items =
          this._getChildListOfParentId__MutableChild({
            parentId: parent.id,
          }) ?? [];
      }
      this.parentItems = parents;
    } else {
      super();

      this.parentKeyName = params.parentKeyName;
      this.childKeyName = params.childKeyName;

      this.parentItems = [];
    }

    // console.log(Object.getOwnPropertyDescriptor(this, "parentKeyName"));
    // console.log(Object.getOwnPropertyDescriptor(this, "childKeyName"));
    // console.log(Object.getOwnPropertyDescriptor(this, "parentItems"));
  }

  // Convert to a plain object
  override toJSON(): object {
    return instanceToPlain(this);
  }

  // static fromJSON<
  //   Parent extends NestedIndexerParentItem = NestedIndexerParentItem,
  //   Child extends NestedIndexerChildItem = NestedIndexerChildItem,
  // >(json: string): NestedIndexer<Parent, Child> {
  //   return plainToInstance(NestedIndexer<Parent, Child>, json);
  // }
  // ㄴ No need to define
  // Base class `MultiMap` has Polymorphic `this` Type converting `fromJSON` static method.

  // Convert to a JSON string
  override toString(): string {
    return JSON.stringify(this.toJSON());
  }

  getParentIdList() {
    return this.get({
      keys: [`${this.parentKeyName}IdList`],
    }) as string[] | undefined;
  }

  _setParentIdList({
    parentIdList,
    shouldKeepRef = true,
  }: {
    parentIdList: string[];
    shouldKeepRef?: boolean;
  }) {
    const _parentIdList =
      (this.getParentIdList() as string[] | undefined) ?? [];

    if (shouldKeepRef) {
      _parentIdList.splice(0, _parentIdList.length, ...parentIdList);
    }
    this.set({
      keys: [`${this.parentKeyName}IdList`],
      value: shouldKeepRef ? _parentIdList : parentIdList,
    });
  }

  _removeParentFromParentIdList({
    parentId,
    shouldKeepRef = true,
  }: {
    parentId: string;
    shouldKeepRef?: boolean;
  }) {
    const parentIdList = [...(this.getParentIdList() ?? [])];
    const parentIndex = parentIdList.findIndex(
      (_parentId) => _parentId === parentId,
    );
    if (parentIndex === -1) {
      console.warn("[removeParent] parentIndex === -1");
      return;
    }
    parentIdList.splice(parentIndex, 1);
    this._setParentIdList({
      parentIdList,
      shouldKeepRef,
    });
  }

  _getParentList__MutableParent() {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[getParentList__MutableParent] !parentIdList");
      return parentIdList;
    }

    return parentIdList
      .map((parentId) => this.getParent({ parentId }))
      .filter((parent) => {
        !parent && console.warn("[getParentList__MutableParent] !parent");
        return !!parent;
      });
  }

  getParent({ parentId }: { parentId: string }) {
    const parent = (
      this.get({
        keys: [`${this.parentKeyName}Id`, parentId],
      }) as Parent[] | undefined
    )?.[0];
    return parent;
  }

  _setParent({ parent }: { parent: Parent }) {
    this.set({
      keys: [`${this.parentKeyName}Id`, parent.id],
      value: [parent],
    });
  }

  _removeParent({ parentId }: { parentId: string }) {
    this.delete({
      keys: [`${this.parentKeyName}Id`, parentId],
    });
  }

  getChildIdListOfParentId({ parentId }: { parentId: string }) {
    return this.get({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    }) as string[] | undefined;
  }

  _setChildIdListOfParentId({
    parentId,
    childIdListOfParentId,
    shouldKeepRef = true,
  }: {
    parentId: string;
    childIdListOfParentId: string[];
    shouldKeepRef?: boolean;
  }) {
    const _childIdListOfParentId =
      (this.getChildIdListOfParentId({ parentId }) as string[] | undefined) ??
      [];

    if (shouldKeepRef) {
      _childIdListOfParentId.splice(
        0,
        _childIdListOfParentId.length,
        ...childIdListOfParentId,
      );
    }
    this.set({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
      value: shouldKeepRef ? _childIdListOfParentId : childIdListOfParentId,
    });
  }

  _removeChildIdListOfParentId({ parentId }: { parentId: string }) {
    this.delete({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    });
  }

  _getChildListOfParentId__MutableChild({ parentId }: { parentId: string }) {
    const childIdListOfParentId = this.getChildIdListOfParentId({ parentId });
    if (!childIdListOfParentId) {
      console.warn(
        "[getChildListOfParentId__MutableChild] !childIdListOfParentId",
      );
      return childIdListOfParentId;
    }

    return childIdListOfParentId
      .map((childId) => this.getChild({ childId }))
      .filter((child) => {
        !child && console.warn("[getChildListOfParentId__MutableChild] !child");
        return !!child;
      });
  }

  getChild({ childId }: { childId: string }) {
    const child = (
      this.get({
        keys: [`${this.childKeyName}Id`, childId],
      }) as Child[] | undefined
    )?.[0];
    return child;
  }

  _setChild({ child }: { child: Child }) {
    this.set({
      keys: [`${this.childKeyName}Id`, child.id],
      value: [child],
    });
  }

  _removeChild({ childId }: { childId: string }) {
    this.delete({
      keys: [`${this.childKeyName}Id`, childId],
    });
  }

  getParentIdListOfChildId({ childId }: { childId: string }) {
    return this.get({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
    }) as string[] | undefined;
  }

  _setParentIdListOfChildId({
    childId,
    parentIdListOfChildId,
    shouldKeepRef = true,
  }: {
    childId: string;
    parentIdListOfChildId: string[];
    shouldKeepRef?: boolean;
  }) {
    const _parentIdListOfChild =
      (this.getParentIdListOfChildId({ childId }) as string[] | undefined) ??
      [];

    if (shouldKeepRef) {
      _parentIdListOfChild.splice(
        0,
        _parentIdListOfChild.length,
        ...parentIdListOfChildId,
      );
    }
    this.set({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
      value: shouldKeepRef ? _parentIdListOfChild : parentIdListOfChildId,
    });
  }

  _removeParentIdListOfChildId({ childId }: { childId: string }) {
    this.delete({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
    });
  }

  createParent({
    parent,
    shouldAppend = false,
    shouldKeepRef = true,
  }: {
    parent: Parent;
    shouldAppend?: boolean;
    shouldKeepRef?: boolean;
  }) {
    !shouldAppend
      ? this.parentItems.unshift(parent)
      : this.parentItems.push(parent);
    if (!shouldKeepRef) {
      this.parentItems = [...this.parentItems];
    }

    this._setParent({ parent });

    this._setChildIdListOfParentId({
      parentId: parent.id,
      childIdListOfParentId: [],
      shouldKeepRef,
    });

    let parentIdList = this.getParentIdList();
    if (!parentIdList) {
      this._setParentIdList({
        parentIdList: [],
        shouldKeepRef,
      });
    }
    parentIdList = [...(this.getParentIdList() ?? [])];
    !shouldAppend
      ? parentIdList.unshift(parent.id)
      : parentIdList.push(parent.id);
    this._setParentIdList({ parentIdList, shouldKeepRef });
  }

  // `parentId` (prev) and `parent.id` (new) can be different. (updating parent's id is allowed.)
  updateParent({
    oldParentId,
    newParent,
    shouldKeepRef = true,
  }: {
    oldParentId: string;
    newParent: Parent;
    shouldKeepRef?: boolean;
  }) {
    const oldParent = this.getParent({ parentId: oldParentId });
    if (!oldParent) {
      console.warn("[updateParent] !oldParent");
      return;
    }

    const targetParentIndex = this.parentItems.findIndex(
      (parent) => parent.id === oldParentId,
    );
    if (targetParentIndex === -1) {
      console.warn("[updateParent] targetParentIndex === -1");
      return;
    }
    this.parentItems[targetParentIndex] = newParent;
    if (!shouldKeepRef) {
      this.parentItems = [...this.parentItems];
    }

    if (oldParentId === newParent.id) {
      this._setParent({ parent: newParent });
    } else {
      this._removeParent({ parentId: oldParentId });
      this._setParent({ parent: newParent });

      const parentIdList = [...(this.getParentIdList() ?? [])];
      const oldParentIndex = parentIdList.findIndex(
        (parentId) => parentId === oldParentId,
      );
      if (oldParentIndex === -1) {
        console.warn("[updateParent] oldParentIndex === -1");
        return;
      }
      parentIdList[oldParentIndex] = newParent.id;
      this._setParentIdList({
        parentIdList,
        shouldKeepRef,
      });

      const childIdListOfOldParentId = [
        ...(this.getChildIdListOfParentId({
          parentId: oldParentId,
        }) ?? []),
      ];

      childIdListOfOldParentId.forEach((childId) => {
        const parentIdListOfChildId = [
          ...(this.getParentIdListOfChildId({
            childId,
          }) ?? []),
        ];
        const oldParentIndex = parentIdListOfChildId.findIndex(
          (parentId) => parentId === oldParentId,
        );
        if (oldParentIndex === -1) {
          console.warn("[updateParent] parentIndex === -1");
          return;
        }
        parentIdListOfChildId[oldParentIndex] = newParent.id;
        this._setParentIdListOfChildId({
          childId,
          parentIdListOfChildId,
          shouldKeepRef,
        });
      });

      this._removeChildIdListOfParentId({ parentId: oldParentId });

      this._setChildIdListOfParentId({
        parentId: newParent.id,
        childIdListOfParentId: childIdListOfOldParentId,
        shouldKeepRef,
      });
    }
  }

  removeParent({
    parentId,
    shouldKeepRef = true,
  }: {
    parentId: string;
    shouldKeepRef?: boolean;
  }) {
    const targetParentIndex = this.parentItems.findIndex(
      (parent) => parent.id === parentId,
    );
    if (targetParentIndex === -1) {
      console.warn("[updateParent] targetParentIndex === -1");
      return;
    }
    this.parentItems.splice(targetParentIndex, 1);
    if (!shouldKeepRef) {
      this.parentItems = [...this.parentItems];
    }

    this._removeParent({ parentId });

    this._removeParentFromParentIdList({
      parentId,
      shouldKeepRef,
    });

    const childIdListOfParentId =
      this.getChildIdListOfParentId({
        parentId,
      }) ?? [];
    childIdListOfParentId.forEach((childId) => {
      const parentIdListOfChildId = [
        ...(this.getParentIdListOfChildId({
          childId,
        }) ?? []),
      ];
      const parentIndex = parentIdListOfChildId.findIndex(
        (_parentId) => _parentId === parentId,
      );
      if (parentIndex === -1) {
        console.warn("[removeParent] parentIndex === -1");
        return;
      }
      parentIdListOfChildId.splice(parentIndex, 1);
      this._setParentIdListOfChildId({
        childId,
        parentIdListOfChildId,
        shouldKeepRef,
      });
    });

    this._removeChildIdListOfParentId({ parentId });
  }

  createChild({
    parentId,
    child,
    shouldAppend = false,
    shouldKeepRef = true,
  }: {
    parentId: string;
    child: Child;
    shouldAppend?: boolean;
    shouldKeepRef?: boolean;
  }) {
    const targetParentIndex = this.parentItems.findIndex(
      (parent) => parent.id === parentId,
    );
    if (targetParentIndex === -1) {
      console.warn("[updateParent] targetParentIndex === -1");
      return;
    }
    const targetParent = this.parentItems[targetParentIndex];
    if (!targetParent.items) {
      targetParent.items = [];
    }
    !shouldAppend
      ? targetParent.items.unshift(child)
      : targetParent.items.push(child);
    if (!shouldKeepRef) {
      this.parentItems[targetParentIndex].items = [...targetParent.items];
      this.parentItems = [...this.parentItems];
    }

    this._setChild({ child });

    const parentIdListOfChildId =
      this.getParentIdListOfChildId({
        childId: child.id,
      }) ?? [];
    this._setParentIdListOfChildId({
      childId: child.id,
      parentIdListOfChildId: [...parentIdListOfChildId, parentId],
      shouldKeepRef,
    });

    const childIdListOfParentId = [
      ...(this.getChildIdListOfParentId({ parentId }) ?? []),
    ];
    !shouldAppend
      ? childIdListOfParentId.unshift(child.id)
      : childIdListOfParentId.push(child.id);
    this._setChildIdListOfParentId({
      parentId,
      childIdListOfParentId,
      shouldKeepRef,
    });
  }

  // `childId` (prev) and `child.id` (new) can be different. (updating child's id is allowed.)
  updateChild({
    oldChildId,
    newChild,
    shouldKeepRef = true,
  }: {
    oldChildId: string;
    newChild: Child;
    shouldKeepRef?: boolean;
  }) {
    this.parentItems.forEach((parent, parentIndex) => {
      if (parent.items) {
        const targetChildIndex = parent.items.findIndex(
          (child) => child.id === oldChildId,
        );
        if (targetChildIndex !== -1) {
          parent.items[targetChildIndex] = newChild;
          if (!shouldKeepRef) {
            this.parentItems[parentIndex].items = [...parent.items];
            this.parentItems = [...this.parentItems];
          }
        }
      }
    });

    if (oldChildId === newChild.id) {
      this._setChild({ child: newChild });
    } else {
      this._removeChild({ childId: oldChildId });
      this._setChild({ child: newChild });

      const parentIdListOfChildId = [
        ...(this.getParentIdListOfChildId({ childId: oldChildId }) ?? []),
      ];

      parentIdListOfChildId.forEach((parentId) => {
        const childIdListOfParentId = [
          ...(this.getChildIdListOfParentId({
            parentId,
          }) ?? []),
        ];
        const oldChildIndex = childIdListOfParentId.findIndex(
          (childId) => childId === oldChildId,
        );
        if (oldChildIndex === -1) {
          console.warn("[updateChild] childIndex === -1");
          return;
        }
        childIdListOfParentId[oldChildIndex] = newChild.id;
        this._setChildIdListOfParentId({
          parentId,
          childIdListOfParentId,
          shouldKeepRef,
        });
      });

      this._removeParentIdListOfChildId({ childId: oldChildId });

      this._setParentIdListOfChildId({
        childId: newChild.id,
        parentIdListOfChildId: parentIdListOfChildId,
        shouldKeepRef,
      });
    }
  }

  removeChild({
    childId,
    shouldKeepRef = true,
  }: {
    childId: string;
    shouldKeepRef?: boolean;
  }) {
    this.parentItems.forEach((parent, parentIndex) => {
      if (parent.items) {
        const targetChildIndex = parent.items.findIndex(
          (child) => child.id === childId,
        );
        if (targetChildIndex !== -1) {
          parent.items.splice(targetChildIndex, 1);
          if (!shouldKeepRef) {
            this.parentItems[parentIndex].items = [...parent.items];
            this.parentItems = [...this.parentItems];
          }
        }
      }
    });

    this._removeChild({ childId });

    const parentIdListOfChildId =
      this.getParentIdListOfChildId({
        childId,
      }) ?? [];
    parentIdListOfChildId.forEach((parentId) => {
      const childIdListOfParentId = [
        ...(this.getChildIdListOfParentId({
          parentId,
        }) ?? []),
      ];
      const childIndex = childIdListOfParentId.findIndex(
        (_childId) => _childId === childId,
      );
      if (childIndex === -1) {
        console.warn("[removeChild] childIndex === -1");
        return;
      }
      childIdListOfParentId.splice(childIndex, 1);
      this._setChildIdListOfParentId({
        parentId,
        childIdListOfParentId,
        shouldKeepRef,
      });
    });

    this._removeParentIdListOfChildId({ childId });
  }

  moveParent({
    indexFrom,
    indexTo,
    shouldKeepRef = true,
  }: {
    indexFrom: number;
    indexTo: number;
    shouldKeepRef?: boolean;
  }) {
    // console.log(Object.getOwnPropertyDescriptor(this, "parentItems"));
    // console.log(Object.getOwnPropertyDescriptor(this.parentItems[0], "items"));

    if (!shouldKeepRef) {
      const parentItems = [...this.parentItems];
      arrayMoveElement({
        arr: parentItems,
        indexFrom,
        indexTo,
      });

      this.parentItems = parentItems;
    } else {
      arrayMoveElement({
        arr: this.parentItems,
        indexFrom,
        indexTo,
      });
    }

    const parentIdList = shouldKeepRef
      ? (this.getParentIdList() ?? [])
      : [...(this.getParentIdList() ?? [])];
    arrayMoveElement({
      arr: parentIdList,
      indexFrom: indexFrom,
      indexTo: indexTo,
    });
    this._setParentIdList({
      parentIdList,
      shouldKeepRef,
    });
  }

  moveChild({
    parentIdFrom,
    parentIdTo,
    indexFrom,
    indexTo,
    shouldKeepRef = true,
  }: {
    parentIdFrom: string;
    parentIdTo: string;
    indexFrom: number;
    indexTo: number;
    shouldKeepRef?: boolean;
  }) {
    const childIdListOfParentIdFrom = [
      ...(this.getChildIdListOfParentId({
        parentId: parentIdFrom,
      }) ?? []),
    ];
    const childIdListOfParentIdTo = [
      ...(this.getChildIdListOfParentId({
        parentId: parentIdTo,
      }) ?? []),
    ];

    if (parentIdFrom === parentIdTo) {
      const targetParentIndex = this.parentItems.findIndex(
        (parent) => parent.id === parentIdFrom,
      );
      if (targetParentIndex === -1) {
        console.warn("[moveChild] targetParentIndex === -1");
        return;
      }
      if (!this.parentItems[targetParentIndex].items) {
        console.warn("[moveChild] !this.items[targetParentIndex].items");
        return;
      }
      if (!shouldKeepRef) {
        const childItems = [...this.parentItems[targetParentIndex].items];
        arrayMoveElement({
          arr: childItems,
          indexFrom,
          indexTo,
        });

        this.parentItems[targetParentIndex].items = childItems;
      } else {
        arrayMoveElement({
          arr: this.parentItems[targetParentIndex].items,
          indexFrom,
          indexTo,
        });
      }

      arrayMoveElement({
        arr: childIdListOfParentIdFrom,
        indexFrom,
        indexTo,
      });
      this._setChildIdListOfParentId({
        parentId: parentIdFrom,
        childIdListOfParentId: childIdListOfParentIdFrom,
        shouldKeepRef,
      });
    } else {
      const targetParentIndexOfParentIdFrom = this.parentItems.findIndex(
        (parent) => parent.id === parentIdFrom,
      );
      if (targetParentIndexOfParentIdFrom === -1) {
        console.warn("[moveChild] targetParentIndexOfParentIdFrom === -1");
        return;
      }
      if (!this.parentItems[targetParentIndexOfParentIdFrom].items) {
        console.warn(
          "[moveChild] !this.items[targetParentIndexOfParentIdFrom].items",
        );
        return;
      }

      const targetParentIndexOfParentIdTo = this.parentItems.findIndex(
        (parent) => parent.id === parentIdTo,
      );
      if (targetParentIndexOfParentIdTo === -1) {
        console.warn("[moveChild] targetParentIndexOfParentIdTo === -1");
        return;
      }
      if (!this.parentItems[targetParentIndexOfParentIdTo].items) {
        console.warn(
          "[moveChild] !this.items[targetParentIndexOfParentIdTo].items",
        );
        return;
      }

      if (!shouldKeepRef) {
        const childListFrom = [
          ...this.parentItems[targetParentIndexOfParentIdFrom].items,
        ];
        const childListTo = [
          ...this.parentItems[targetParentIndexOfParentIdTo].items,
        ];
        const [targetChild] = childListFrom.splice(indexFrom, 1);
        childListTo.splice(indexTo, 0, targetChild);

        this.parentItems[targetParentIndexOfParentIdFrom].items = childListFrom;
        this.parentItems[targetParentIndexOfParentIdTo].items = childListTo;
      } else {
        const [targetChild] = this.parentItems[
          targetParentIndexOfParentIdFrom
        ].items.splice(indexFrom, 1);
        this.parentItems[targetParentIndexOfParentIdTo].items.splice(
          indexTo,
          0,
          targetChild,
        );
      }

      const [targetChildId] = childIdListOfParentIdFrom.splice(indexFrom, 1);
      childIdListOfParentIdTo.splice(indexTo, 0, targetChildId);
      this._setChildIdListOfParentId({
        parentId: parentIdFrom,
        childIdListOfParentId: childIdListOfParentIdFrom,
        shouldKeepRef,
      });
      this._setChildIdListOfParentId({
        parentId: parentIdTo,
        childIdListOfParentId: childIdListOfParentIdTo,
        shouldKeepRef,
      });

      const parentIdListOfTargetChildId = [
        ...(this.getParentIdListOfChildId({
          childId: targetChildId,
        }) ?? []),
      ];
      const indexParentIdFrom = parentIdListOfTargetChildId.findIndex(
        (parentId) => parentId === parentIdFrom,
      );
      parentIdListOfTargetChildId[indexParentIdFrom] = parentIdTo;
      this._setParentIdListOfChildId({
        childId: targetChildId,
        parentIdListOfChildId: parentIdListOfTargetChildId,
        shouldKeepRef,
      });
    }
  }

  clearChildIdListOfParentId({
    parentId,
    shouldKeepRef = true,
  }: {
    parentId: string;
    shouldKeepRef?: boolean;
  }) {
    const targetParentIndex = this.parentItems.findIndex(
      (parent) => parent.id === parentId,
    );
    if (targetParentIndex === -1) {
      console.warn("[updateParent] targetParentIndex === -1");
      return;
    }
    this.parentItems[targetParentIndex].items = [];
    if (!shouldKeepRef) {
      this.parentItems = [...this.parentItems];
    }

    const childIdListOfParentId =
      this.getChildIdListOfParentId({ parentId }) ?? [];
    childIdListOfParentId.forEach((childId) => {
      this.removeChild({
        childId,
        shouldKeepRef,
      });
    });
  }

  clearAll() {
    super.clearAll();
  }
}
