import "reflect-metadata";
import { Expose, instanceToPlain } from "class-transformer";
import { MultiMap } from "@/multimap";
import { arrayMoveElement, SmartMerge } from "@/utils";

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

export type NestedIndexerBaseItem = IndexerBaseItem & {};
// ㄴ {}: For intellisense

export type NestedIndexerItem = SmartMerge<
  NestedIndexerBaseItem & {
    items?: NestedIndexerBaseItem[];
  }
>;

export type NestedIndexerEntry<
  Parent extends NestedIndexerItem,
  Child extends NestedIndexerBaseItem,
> = [NestedIndexerKey, string[] | [string] | [Parent] | [Child]];

export class NestedIndexer<
  Parent extends NestedIndexerItem,
  Child extends NestedIndexerBaseItem,
> extends MultiMap<NestedIndexerKey, string | Parent | Child> {
  @Expose()
  parentKeyName: string;
  @Expose()
  childKeyName: string;

  constructor({
    parentKeyName,
    childKeyName,
    entries,
    items,
  }: {
    parentKeyName: string;
    childKeyName: string;
    entries?: NestedIndexerEntry<Parent, Child>[];
    items?: Parent[];
  });
  constructor(original: NestedIndexer<Parent, Child>);

  constructor(
    params:
      | {
          parentKeyName: string;
          childKeyName: string;
          entries?: NestedIndexerEntry<Parent, Child>[];
          items?: Parent[];
        }
      | NestedIndexer<Parent, Child>,
  ) {
    if (params instanceof NestedIndexer) {
      super(params);
    } else {
      if (params.entries) {
        super({ entries: params.entries ?? [] });
      } else if (params.items) {
        const parents = params.items;

        const parentKeyName = params.parentKeyName;
        const childKeyName = params.childKeyName;
        const entries: NestedIndexerEntry<Parent, Child>[] = [];

        const parentIdList = [
          [`${parentKeyName}IdList`],
          parents.map((parent) => parent.id),
        ] as [[string], string[]];
        entries.push(parentIdList);

        parents.forEach((parent) => {
          entries.push([[`${parentKeyName}Id`, parent.id], [parent]] as [
            string[],
            [Parent],
          ]);

          if (parent.items) {
            entries.push([
              [`${parentKeyName}Id`, parent.id, `${childKeyName}IdList`],
              parent.items.map((child) => child.id),
            ] as [string[], string[]]);

            parent.items.forEach((child) => {
              entries.push([[`${childKeyName}Id`, child.id], [child]] as [
                string[],
                [Child],
              ]);

              entries.push([
                [`${childKeyName}Id`, child.id, `${parentKeyName}Id`],
                [parent.id],
              ] as [string[], [string]]);
            });
          }
        });

        super({ entries });
      } else {
        super();
      }
    }
    this.parentKeyName = params.parentKeyName;
    this.childKeyName = params.childKeyName;
  }

  // Convert to a plain object
  override toPlain(): object {
    return instanceToPlain(
      this,
      //{ strategy: "excludeAll" }
    );
  }

  // Convert to a JSON string
  override toString(): string {
    return JSON.stringify(this.toPlain());
  }

  getParentIdList() {
    return this.get({
      keys: [`${this.parentKeyName}IdList`],
    }) as string[] | undefined;
  }

  _setParentIdList({
    parentIdList,
    shouldMutate = true,
  }: {
    parentIdList: string[];
    shouldMutate?: boolean;
  }) {
    const _parentIdList =
      (this.getParentIdList() as string[] | undefined) ?? [];

    this.set({
      keys: [`${this.parentKeyName}IdList`],
      value: shouldMutate
        ? _parentIdList.splice(0, _parentIdList.length, ...parentIdList)
        : parentIdList,
    });
  }

  _removeParentFromParentIdList({
    parentId,
    shouldMutate = true,
  }: {
    parentId: string;
    shouldMutate?: boolean;
  }) {
    const parentIdList = this.getParentIdList() ?? [];
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
      shouldMutate,
    });
  }

  getParentList__MutableParent() {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[getParentList__MutableParent] !parentIdList");
      return parentIdList;
    }

    return parentIdList.map((parentId) => this.getParent({ parentId }));
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
    shouldMutate = true,
  }: {
    parentId: string;
    childIdListOfParentId: string[];
    shouldMutate?: boolean;
  }) {
    const oldChildIdListOfParentId =
      (this.getChildIdListOfParentId({ parentId }) as string[] | undefined) ??
      [];

    return this.set({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
      value: shouldMutate
        ? oldChildIdListOfParentId.splice(
            0,
            oldChildIdListOfParentId.length,
            ...childIdListOfParentId,
          )
        : childIdListOfParentId,
    });
  }

  _removeChildIdListOfParentId({ parentId }: { parentId: string }) {
    this.delete({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    });
  }

  getChildListOfParentId__MutableChild({ parentId }: { parentId: string }) {
    const childIdListOfParentId = this.getChildIdListOfParentId({ parentId });
    if (!childIdListOfParentId) {
      console.warn(
        "[getChildListOfParentId__MutableChild] !childIdListOfParentId",
      );
      return childIdListOfParentId;
    }

    return childIdListOfParentId.map((childId) => this.getChild({ childId }));
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
    shouldMutate = true,
  }: {
    childId: string;
    parentIdListOfChildId: string[];
    shouldMutate?: boolean;
  }) {
    const _parentIdListOfChild =
      (this.getParentIdListOfChildId({ childId }) as string[] | undefined) ??
      [];
    this.set({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
      value: shouldMutate
        ? _parentIdListOfChild.splice(
            0,
            _parentIdListOfChild.length,
            ...parentIdListOfChildId,
          )
        : parentIdListOfChildId,
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
    shouldMutate = true,
  }: {
    parent: Parent;
    shouldAppend?: boolean;
    shouldMutate?: boolean;
  }) {
    this._setParent({ parent });

    this._setChildIdListOfParentId({
      parentId: parent.id,
      childIdListOfParentId: [],
      shouldMutate,
    });

    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[createParent] !parentIdList");
      return;
    }
    !shouldAppend
      ? parentIdList.unshift(parent.id)
      : parentIdList.push(parent.id);
    if (shouldMutate) {
      this._setParentIdList({ parentIdList, shouldMutate });
    }
  }

  // `parentId` (prev) and `parent.id` (new) can be different. (updating parent's id is allowed.)
  updateParent({
    oldParentId,
    newParent,
    shouldMutate = true,
  }: {
    oldParentId: string;
    newParent: Parent;
    shouldMutate?: boolean;
  }) {
    const oldParent = this.getParent({ parentId: oldParentId });
    if (!oldParent) {
      console.warn("[updateParent] !oldParent");
      return;
    }

    if (oldParentId === newParent.id) {
      this._setParent({ parent: newParent });
    } else {
      this._removeParent({ parentId: oldParentId });
      this._setParent({ parent: newParent });

      const parentIdList = this.getParentIdList() ?? [];
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
        shouldMutate,
      });

      const childIdListOfOldParentId =
        this.getChildIdListOfParentId({
          parentId: oldParentId,
        }) ?? [];
      this._removeChildIdListOfParentId({ parentId: oldParentId });
      this._setChildIdListOfParentId({
        parentId: newParent.id,
        childIdListOfParentId: childIdListOfOldParentId,
        shouldMutate,
      });

      childIdListOfOldParentId.forEach((childId) => {
        const parentIdListOfChildId =
          this.getParentIdListOfChildId({
            childId,
          }) ?? [];
        const parentIndex = parentIdListOfChildId.findIndex(
          (parentId) => parentId === oldParentId,
        );
        if (parentIndex === -1) {
          console.warn("[updateParent] parentIndex === -1");
          return;
        }
        parentIdListOfChildId[parentIndex] = newParent.id;
        this._setParentIdListOfChildId({
          childId,
          parentIdListOfChildId,
          shouldMutate,
        });
      });
    }
  }

  removeParent({
    parentId,
    shouldMutate = true,
  }: {
    parentId: string;
    shouldMutate?: boolean;
  }) {
    this._removeParent({ parentId });

    this._removeParentFromParentIdList({
      parentId,
      shouldMutate,
    });

    this._removeChildIdListOfParentId({ parentId });

    const childIdListOfParentId =
      this.getChildIdListOfParentId({
        parentId,
      }) ?? [];
    childIdListOfParentId.forEach((childId) => {
      const parentIdListOfChildId =
        this.getParentIdListOfChildId({
          childId,
        }) ?? [];
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
        shouldMutate,
      });
    });
  }

  createChild({
    parentId,
    child,
    shouldAppend = false,
    shouldMutate = true,
  }: {
    parentId: string;
    child: Child;
    shouldAppend?: boolean;
    shouldMutate?: boolean;
  }) {
    this._setChild({ child: child });

    this._setParentIdListOfChildId({
      childId: child.id,
      parentIdListOfChildId: [],
      shouldMutate,
    });

    const childIdListOfParentId = this.getChildIdListOfParentId({ parentId });
    if (!childIdListOfParentId) {
      console.warn("[createChild] !childIdList");
      return;
    }
    !shouldAppend
      ? childIdListOfParentId.unshift(child.id)
      : childIdListOfParentId.push(child.id);
    if (shouldMutate) {
      this._setChildIdListOfParentId({
        parentId,
        childIdListOfParentId,
        shouldMutate,
      });
    }
  }

  // `childId` (prev) and `child.id` (new) can be different. (updating child's id is allowed.)
  updateChild({
    oldChildId,
    newChild,
    shouldMutate = true,
  }: {
    oldChildId: string;
    newChild: Child;
    shouldMutate?: boolean;
  }) {
    const oldChild = this.getChild({ childId: oldChildId });
    if (!oldChild) {
      console.warn("[updateChild] !oldChild");
      return;
    }

    if (oldChildId === newChild.id) {
      this._setChild({ child: newChild });
    } else {
      this._removeChild({ childId: oldChildId });
      this._setChild({ child: newChild });

      const parentIdListOfOldChildId =
        this.getParentIdListOfChildId({ childId: oldChildId }) ?? [];
      this._removeParentIdListOfChildId({ childId: oldChildId });
      this._setParentIdListOfChildId({
        childId: newChild.id,
        parentIdListOfChildId: parentIdListOfOldChildId,
        shouldMutate,
      });

      parentIdListOfOldChildId.forEach((parentId) => {
        const childIdListOfParentId =
          this.getChildIdListOfParentId({
            parentId,
          }) ?? [];
        const childIndex = childIdListOfParentId.findIndex(
          (childId) => childId === oldChildId,
        );
        if (childIndex === -1) {
          console.warn("[updateChild] childIndex === -1");
          return;
        }
        childIdListOfParentId[childIndex] = newChild.id;
        this._setChildIdListOfParentId({
          parentId,
          childIdListOfParentId,
          shouldMutate,
        });
      });
    }
  }

  removeChild({
    childId,
    shouldMutate = true,
  }: {
    childId: string;
    shouldMutate?: boolean;
  }) {
    this._removeChild({ childId });

    this._removeParentIdListOfChildId({ childId });

    const parentIdListOfChildId =
      this.getParentIdListOfChildId({
        childId,
      }) ?? [];
    parentIdListOfChildId.forEach((parentId) => {
      const childIdListOfParentId =
        this.getChildIdListOfParentId({
          parentId,
        }) ?? [];
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
        shouldMutate,
      });
    });
  }

  moveParent({ indexFrom, indexTo }: { indexFrom: number; indexTo: number }) {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[moveParent] !parentIdList");
      return;
    }
    arrayMoveElement({
      arr: parentIdList,
      indexFrom: indexFrom,
      indexTo: indexTo,
    });
  }

  moveChild({
    parentIdFrom,
    parentIdTo,
    indexFrom,
    indexTo,
  }: {
    parentIdFrom: string;
    parentIdTo: string;
    indexFrom: number;
    indexTo: number;
  }) {
    const childIdListFrom = this.getChildIdListOfParentId({
      parentId: parentIdFrom,
    });
    if (!childIdListFrom) {
      return;
    }

    if (parentIdFrom === parentIdTo) {
      arrayMoveElement({
        arr: childIdListFrom,
        indexFrom: indexFrom,
        indexTo: indexTo,
      });
    } else {
      const childIdListFrom = this.getChildIdListOfParentId({
        parentId: parentIdFrom,
      });
      if (!childIdListFrom) {
        console.warn("[moveChild] !childIdListFrom");
        return;
      }
      const [targetChildId] = childIdListFrom.splice(indexFrom, 1);

      const parentIdWrappedByArr = this.getParentIdListOfChildId({
        childId: targetChildId,
      });
      if (!parentIdWrappedByArr) {
        console.warn("[moveChild] !parentIdWrappedByArr");
        return;
      }
      parentIdWrappedByArr[0] = parentIdTo;

      const childIdListTo = this.getChildIdListOfParentId({
        parentId: parentIdTo,
      });
      if (!childIdListTo) {
        console.warn("[moveChild] !childIdListTo");
        return;
      }
      childIdListTo.splice(indexTo, 0, targetChildId);
    }
  }

  clearChildListOfParentId({ parentId }: { parentId: string }) {
    const childIdList = this.getChildIdListOfParentId({ parentId });
    if (!childIdList) {
      console.warn("[clearChildListOfParentId] !childIdList");
      return childIdList;
    }

    childIdList.forEach((childId) => {
      this.delete({
        keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
      });
      this.delete({
        keys: [`${this.childKeyName}Id`, childId],
      });
    });

    this.clear({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    });
  }

  clearAll() {
    super.clearAll();
  }
}
