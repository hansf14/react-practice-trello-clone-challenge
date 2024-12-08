import "reflect-metadata";
import { Expose, instanceToPlain } from "class-transformer";
import { MultiMap } from "@/multimap";
import { arrayMoveElement } from "@/utils";

export type IndexerKey = string[];

export type IndexerBaseItem = {
  id: string;
} & Record<any, any>;

export type IndexerEntry<T extends IndexerBaseItem> = [
  NestedIndexerKey,
  string[] | T[],
];

export class Indexer<T extends IndexerBaseItem> extends MultiMap<
  IndexerKey,
  string | T
> {
  @Expose()
  itemKeyName: string;

  constructor({
    itemKeyName,
    entries,
  }: {
    itemKeyName: string;
    entries?: IndexerEntry<T>[];
  });
  constructor(original: Indexer<T>);

  constructor(
    params:
      | {
          itemKeyName: string;
          entries?: IndexerEntry<T>[];
        }
      | Indexer<T>,
  ) {
    if (params instanceof Indexer) {
      super(params);
    } else {
      super({ entries: params.entries ?? [] });
    }
    this.itemKeyName = params.itemKeyName;
  }

  // Convert to a plain object
  override toPlain(): object {
    return instanceToPlain(this, { strategy: "excludeAll" });
  }

  // Convert to a JSON string
  override toString(): string {
    return JSON.stringify(this.toPlain());
  }

  getItemIdList() {
    return this.get({
      keys: [`${this.itemKeyName}IdList`],
    }) as string[] | undefined;
  }

  getItemList__MutableItem() {
    const itemIdList = this.getItemIdList();
    if (!itemIdList) {
      console.warn("[getItemList__MutableItem] !parentIdList");
      return itemIdList;
    }

    const itemList: T[] = [];
    itemIdList.forEach((itemId) => {
      const item = this.getItem({ itemId });
      if (item) {
        itemList.push(item);
      } else {
        console.warn("[getItemList__MutableItem] !item");
      }
    });
    return itemList;
  }

  getItem({ itemId }: { itemId: string }) {
    const item = (
      this.get({
        keys: [`${this.itemKeyName}Id`, itemId],
      }) as T[] | undefined
    )?.[0];
    return item;
  }

  createItem({ item, shouldAppend }: { item: T; shouldAppend?: boolean }) {
    if (
      this.has({
        keys: [`${this.itemKeyName}Id`, item.id],
      })
    ) {
      console.warn(
        `[createItem] Key "${this.serializeMultiKey({
          keys: [`${this.itemKeyName}Id`, item.id],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: [`${this.itemKeyName}Id`, item.id],
      value: [item],
    });

    const itemIdList = this.getItemIdList();
    if (!itemIdList) {
      console.warn("[createItem] !itemIdList");
      return;
    }
    !(shouldAppend ?? false)
      ? itemIdList.unshift(item.id)
      : itemIdList.push(item.id);
  }

  // itemId (prev) and item.id (new) can be different.
  updateItem({ itemId, item }: { itemId: string; item: T }) {
    const itemWrappedByArr = this.get({
      keys: [`${this.itemKeyName}Id`, itemId],
    });
    if (!itemWrappedByArr) {
      console.warn("[updateItem] !itemWrappedByArr");
      return;
    }

    if (itemId === item.id) {
      itemWrappedByArr[0] = item;
    } else {
      const itemIdList = this.getItemIdList();
      if (!itemIdList) {
        console.warn("[updateItem] !itemIdList");
        return;
      }
      const targetIdx = itemIdList.findIndex((_itemId) => _itemId === itemId);
      if (targetIdx === -1) {
        console.warn("[updateItem] targetIdx === -1");
        return;
      }
      itemIdList[targetIdx] = item.id;

      if (
        !this.has({
          keys: [`${this.itemKeyName}Id`, itemId],
        })
      ) {
        console.warn(
          `[updateItem] Key "${this.serializeMultiKey({
            keys: [`${this.itemKeyName}Id`, itemId],
          })}" doesn't exist.`,
        );
        return;
      }
      this.delete({
        keys: [`${this.itemKeyName}Id`, itemId],
      });
      if (
        this.has({
          keys: [`${this.itemKeyName}Id`, item.id],
        })
      ) {
        console.warn(
          `[updateItem] Key "${this.serializeMultiKey({
            keys: [`${this.itemKeyName}Id`, item.id],
          })}" already exists.`,
        );
        return;
      }
      this.set({
        keys: [`${this.itemKeyName}Id`, item.id],
        value: [item],
      });
    }
  }

  removeItem({ itemId }: { itemId: string }) {
    const itemIdList = this.getItemIdList();
    if (!itemIdList) {
      console.warn(`[removeItem] !itemIdList`);
      return;
    }
    const targetIdx = itemIdList.findIndex((_itemId) => _itemId === itemId);
    if (targetIdx === -1) {
      console.warn("[removeItem] targetIdx === -1");
      return;
    }
    itemIdList.splice(targetIdx, 1);

    if (
      !this.has({
        keys: [`${this.itemKeyName}Id`, itemId],
      })
    ) {
      console.warn(
        `[removeItem] Key "${this.serializeMultiKey({
          keys: [`${this.itemKeyName}Id`, itemId],
        })}" doesn't exist.`,
      );
      return;
    }
    this.delete({
      keys: [`${this.itemKeyName}Id`, itemId],
    });
  }

  moveItem({ idxFrom, idxTo }: { idxFrom: number; idxTo: number }) {
    const itemIdList = this.getItemIdList();
    if (!itemIdList) {
      console.warn("[moveItem] !itemIdList");
      return;
    }
    arrayMoveElement({
      arr: itemIdList,
      idxFrom,
      idxTo,
    });
  }
}

export type NestedIndexerKey = IndexerKey;

export type NestedIndexerBaseItem = IndexerBaseItem & {};
// ㄴ {}: For intellisense

export type NestedIndexerEntry<
  Parent extends NestedIndexerBaseItem,
  Child extends NestedIndexerBaseItem,
> = [NestedIndexerKey, string[] | Parent[] | Child[]];

export class NestedIndexer<
  Parent extends NestedIndexerBaseItem,
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
  }: {
    parentKeyName: string;
    childKeyName: string;
    entries?: NestedIndexerEntry<Parent, Child>[];
  });
  constructor(original: NestedIndexer<Parent, Child>);

  constructor(
    params:
      | {
          parentKeyName: string;
          childKeyName: string;
          entries?: NestedIndexerEntry<Parent, Child>[];
        }
      | NestedIndexer<Parent, Child>,
  ) {
    if (params instanceof NestedIndexer) {
      super(params);
    } else {
      super({ entries: params.entries ?? [] });
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

  getParentList__MutableParent() {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[getParentList__MutableParent] !parentIdList");
      return parentIdList;
    }

    // return parentIdList.map((parentId) => this.getParent({ parentId }));
    const parentList: Parent[] = [];
    parentIdList.forEach((parentId) => {
      const parent = this.getParent({ parentId });
      if (parent) {
        parentList.push(parent);
      } else {
        console.warn("[getParentList__MutableParent] !parent");
      }
    });
    return parentList;
  }

  getParent({ parentId }: { parentId: string }) {
    const parent = (
      this.get({
        keys: [`${this.parentKeyName}Id`, parentId],
      }) as Parent[] | undefined
    )?.[0];
    // if (!parent) {
    //   console.warn(`[getParent] Parent "${parentId}" is undefined.`);
    // }
    return parent;
  }

  getChildIdListFromParentId({ parentId }: { parentId: string }) {
    return this.get({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    }) as string[] | undefined;
  }

  getChildListFromParentId__MutableChild({ parentId }: { parentId: string }) {
    const childIdList = this.getChildIdListFromParentId({ parentId });
    if (!childIdList) {
      console.warn("[getChildListFromParentId__MutableChild] !childIdList");
      return childIdList;
    }

    // return childIdList.map((childId) => this.getChild({ childId }));
    const childList: Child[] = [];
    childIdList.forEach((childId) => {
      const child = this.getChild({ childId });
      if (child) {
        childList.push(child);
      } else {
        console.warn("[getChildListFromParentId__MutableChild] !child");
      }
    });
    return childList;
  }

  getChild({ childId }: { childId: string }) {
    const child = (
      this.get({
        keys: [`${this.childKeyName}Id`, childId],
      }) as Child[] | undefined
    )?.[0];
    // if (!child) {
    //   console.warn(
    //     `[getChild] Key "${this.serializeMultiKey({
    //       keys: [`${this.childKeyName}Id`, childId],
    //     })}" is undefined.`,
    //   );
    // }
    return child;
  }

  getParentIdFromChildId({ childId }: { childId: string }) {
    return this.get({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
    }) as string[] | undefined;
  }

  createChild({
    parentId,
    child,
    shouldAppend,
  }: {
    parentId: string;
    child: Child;
    shouldAppend?: boolean;
  }) {
    if (
      this.has({
        keys: [`${this.childKeyName}Id`, child.id],
      })
    ) {
      console.warn(
        `[createChild] Key "${this.serializeMultiKey({
          keys: [`${this.childKeyName}Id`, child.id],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: [`${this.childKeyName}Id`, child.id],
      value: [child],
    });

    const childIdList = this.getChildIdListFromParentId({ parentId });
    if (!childIdList) {
      console.warn("[createChild] !childIdList");
      return;
    }
    // this.set({
    //   keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    //   value: !(shouldAppend ?? false)
    //     ? [child.id, ...childIdList]
    //     : [...childIdList, child.id],
    // });
    !(shouldAppend ?? false)
      ? childIdList.unshift(child.id)
      : childIdList.push(child.id);

    if (
      this.has({
        keys: [`${this.childKeyName}Id`, child.id, `${this.parentKeyName}Id`],
      })
    ) {
      console.warn(
        `[createChild] Key "${this.serializeMultiKey({
          keys: [`${this.childKeyName}Id`, child.id, `${this.parentKeyName}Id`],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: [`${this.childKeyName}Id`, child.id, `${this.parentKeyName}Id`],
      value: [parentId],
    });
  }

  // childId (prev) and child.id (new) can be different.
  updateChild({ childId, child }: { childId: string; child: Child }) {
    const childWrappedByArr = this.get({
      keys: [`${this.childKeyName}Id`, childId],
    });
    if (!childWrappedByArr) {
      console.warn("[updateChild] !childWrappedByArr");
      return;
    }

    if (childId === child.id) {
      childWrappedByArr[0] = child;
      // this.set({
      //   keys: [`${this.childKeyName}Id`, child.id],
      //   value: [child],
      // });
    } else {
      const parentIdWrappedByArr = this.getParentIdFromChildId({ childId });
      if (!parentIdWrappedByArr) {
        console.warn("[updateChild] !parentIdWrappedByArr");
        return;
      }
      const parentId = parentIdWrappedByArr[0];
      this.delete({
        keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
      });
      if (this.getParentIdFromChildId({ childId: child.id })) {
        console.warn("[updateChild] this.getParentIdFromChildId");
        return;
      }
      this.set({
        keys: [`${this.childKeyName}Id`, child.id, `${this.parentKeyName}Id`],
        value: [parentId],
      });

      const childIdList = this.getChildIdListFromParentId({
        parentId,
      });
      if (!childIdList) {
        console.warn("[updateChild] !childIdList");
        return;
      }
      // const childIdListClone = [...childIdList];
      // const targetIdx = childIdListClone.findIndex(
      //   (_childId) => _childId === childId,
      // );
      // childIdListClone[targetIdx] = child.id;
      // this.set({
      //   keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
      //   value: childIdListClone,
      // });
      const targetIdx = childIdList.findIndex(
        (_childId) => _childId === childId,
      );
      if (targetIdx === -1) {
        console.warn("[updateChild] targetIdx === -1");
        return;
      }
      childIdList[targetIdx] = child.id;

      if (
        !this.has({
          keys: [`${this.childKeyName}Id`, childId],
        })
      ) {
        console.warn(
          `[updateChild] Key "${this.serializeMultiKey({
            keys: [`${this.childKeyName}Id`, childId],
          })}" doesn't exist.`,
        );
        return;
      }
      this.delete({
        keys: [`${this.childKeyName}Id`, childId],
      });
      if (
        this.has({
          keys: [`${this.childKeyName}Id`, child.id],
        })
      ) {
        console.warn(
          `[updateChild] Key "${this.serializeMultiKey({
            keys: [`${this.childKeyName}Id`, child.id],
          })}" already exists.`,
        );
        return;
      }
      this.set({
        keys: [`${this.childKeyName}Id`, child.id],
        value: [child],
      });
    }
  }

  removeChild({ childId }: { childId: string }) {
    const parentIdWrappedByArr = this.getParentIdFromChildId({
      childId,
    });
    if (!parentIdWrappedByArr) {
      console.warn("[removeChild] !parentIdWrappedByArr");
      return;
    }
    const parentId = parentIdWrappedByArr[0];
    this.delete({
      keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
    });

    const childIdList = this.getChildIdListFromParentId({
      parentId,
    });
    if (!childIdList) {
      console.warn("[removeChild] !childIdList");
      return;
    }
    // this.set({
    //   keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    //   value: childIdList.filter((_childId) => _childId !== childId),
    // });
    const targetIdx = childIdList.findIndex((_childId) => _childId === childId);
    if (targetIdx === -1) {
      console.warn("[removeChild] targetIdx === -1");
      return;
    }
    childIdList.splice(targetIdx, 1);

    if (
      !this.has({
        keys: [`${this.childKeyName}Id`, childId],
      })
    ) {
      console.warn(
        `[removeChild] Key "${this.serializeMultiKey({
          keys: [`${this.childKeyName}Id`, childId],
        })}" doesn't exist.`,
      );
      return;
    }
    this.delete({
      keys: [`${this.childKeyName}Id`, childId],
    });
  }

  createParent({
    parent,
    shouldAppend,
  }: {
    parent: Parent;
    shouldAppend?: boolean;
  }) {
    if (
      this.has({
        keys: [`${this.parentKeyName}Id`, parent.id],
      })
    ) {
      console.warn(
        `[createParent] Key "${this.serializeMultiKey({
          keys: [`${this.parentKeyName}Id`, parent.id],
        })}" already exists.`,
      );
      return;
    }
    this.set({
      keys: [`${this.parentKeyName}Id`, parent.id],
      value: [parent],
    });

    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[createParent] !parentIdList");
      return;
    }
    // this.set({
    //   keys: [`${this.parentKeyName}IdList`],
    //   value: !(shouldAppend ?? false)
    //     ? [parent, ...parentList]
    //     : [...parentList, parent],
    // });
    !(shouldAppend ?? false)
      ? parentIdList.unshift(parent.id)
      : parentIdList.push(parent.id);

    if (
      this.getChildIdListFromParentId({
        parentId: parent.id,
      })
    ) {
      console.warn("[createParent] this.getChildIdListFromParentId");
      return;
    }
    this.set({
      keys: [
        `${this.parentKeyName}Id`,
        parent.id,
        `${this.childKeyName}IdList`,
      ],
      value: [],
    });
  }

  // parentId (prev) and parent.id (new) can be different.
  updateParent({ parentId, parent }: { parentId: string; parent: Parent }) {
    const parentWrappedByArr = this.get({
      keys: [`${this.parentKeyName}Id`, parentId],
    });
    if (!parentWrappedByArr) {
      console.warn("[updateParent] !parentWrappedByArr");
      return;
    }

    if (parentId === parent.id) {
      parentWrappedByArr[0] = parent;
      // this.set({
      //   keys: [`${this.parentKeyName}Id`, parent.id],
      //   value: [parent],
      // });
    } else {
      const parentIdList = this.getParentIdList();
      if (!parentIdList) {
        console.warn("[updateParent] !parentIdList");
        return;
      }
      // const parentIdListClone = [...parentIdList];
      // const targetIdx = parentIdListClone.findIndex(
      //   (_parentId) => _parentId === parentId,
      // );
      // parentIdListClone[targetIdx] = parent.id;
      // this.set({
      //   keys: [`${this.parentKeyName}IdList`],
      //   value: parentIdListClone,
      // });
      const targetIdx = parentIdList.findIndex(
        (_parentId) => _parentId === parentId,
      );
      if (targetIdx === -1) {
        console.warn("[updateParent] targetIdx === -1");
        return;
      }
      parentIdList[targetIdx] = parent.id;

      const childIdList = this.getChildIdListFromParentId({
        parentId,
      });
      if (!childIdList) {
        console.warn("[updateParent] !childIdList");
        return;
      }
      this.delete({
        keys: [
          `${this.parentKeyName}Id`,
          parentId,
          `${this.childKeyName}IdList`,
        ],
      });
      if (this.getChildIdListFromParentId({ parentId: parent.id })) {
        console.warn("[updateParent] this.getChildIdListFromParentId");
      }
      this.set({
        keys: [
          `${this.parentKeyName}Id`,
          parent.id,
          `${this.childKeyName}IdList`,
        ],
        value: childIdList,
      });

      if (
        !this.has({
          keys: [`${this.parentKeyName}Id`, parentId],
        })
      ) {
        console.warn(
          `[updateParent] Key "${this.serializeMultiKey({
            keys: [`${this.parentKeyName}Id`, parentId],
          })}" doesn't exist.`,
        );
        return;
      }
      this.delete({
        keys: [`${this.parentKeyName}Id`, parentId],
      });
      if (
        this.has({
          keys: [`${this.parentKeyName}Id`, parent.id],
        })
      ) {
        console.warn(
          `[updateParent] Key "${this.serializeMultiKey({
            keys: [`${this.parentKeyName}Id`, parent.id],
          })}" already exists.`,
        );
        return;
      }
      this.set({
        keys: [`${this.parentKeyName}Id`, parent.id],
        value: [parent],
      });

      childIdList.forEach((childId) => {
        const parentIdWrappedByArr = this.getParentIdFromChildId({
          childId,
        });
        if (!parentIdWrappedByArr) {
          console.warn("[updateParent] !parentIdWrappedByArr");
          return;
        }
        parentIdWrappedByArr[0] = parent.id;
        // this.set({
        //   keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
        //   value: [parent.id],
        // });
      });
    }
  }

  removeParent({ parentId }: { parentId: string }) {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn(`[removeParent] !parentIdList`);
      return;
    }
    // this.set({
    //   keys: [`${this.parentKeyName}IdList`],
    //   value: parentIdList.filter((_parentId) => _parentId !== parentId),
    // });
    const targetIdx = parentIdList.findIndex(
      (_parentId) => _parentId === parentId,
    );
    if (targetIdx === -1) {
      console.warn("[removeParent] targetIdx === -1");
      return;
    }
    parentIdList.splice(targetIdx, 1);

    const childIdList = this.getChildIdListFromParentId({
      parentId,
    });
    if (!childIdList) {
      console.warn("[removeParent] !childIdList");
      return;
    }
    this.delete({
      keys: [`${this.parentKeyName}Id`, parentId, `${this.childKeyName}IdList`],
    });

    if (
      !this.has({
        keys: [`${this.parentKeyName}Id`, parentId],
      })
    ) {
      console.warn(
        `[removeParent] Key "${this.serializeMultiKey({
          keys: [`${this.parentKeyName}Id`, parentId],
        })}" doesn't exist.`,
      );
      return;
    }
    this.delete({
      keys: [`${this.parentKeyName}Id`, parentId],
    });

    childIdList.forEach((childId) => {
      const parentIdWrappedByArr = this.getParentIdFromChildId({
        childId,
      });
      if (!parentIdWrappedByArr) {
        console.warn("[removeParent] !parentIdWrappedByArr");
        return;
      }
      this.delete({
        keys: [`${this.childKeyName}Id`, childId, `${this.parentKeyName}Id`],
      });
    });
  }

  moveParent({ idxFrom, idxTo }: { idxFrom: number; idxTo: number }) {
    const parentIdList = this.getParentIdList();
    if (!parentIdList) {
      console.warn("[moveParent] !parentIdList");
      return;
    }
    arrayMoveElement({
      arr: parentIdList,
      idxFrom,
      idxTo,
    });
  }

  moveChild({
    parentIdFrom,
    parentIdTo,
    idxFrom,
    idxTo,
  }: {
    parentIdFrom: string;
    parentIdTo: string;
    idxFrom: number;
    idxTo: number;
  }) {
    const childIdListFrom = this.getChildIdListFromParentId({
      parentId: parentIdFrom,
    });
    if (!childIdListFrom) {
      return;
    }

    if (parentIdFrom === parentIdTo) {
      arrayMoveElement({
        arr: childIdListFrom,
        idxFrom,
        idxTo,
      });
    } else {
      const childIdListFrom = this.getChildIdListFromParentId({
        parentId: parentIdFrom,
      });
      if (!childIdListFrom) {
        console.warn("[moveChild] !childIdListFrom");
        return;
      }
      const [targetChildId] = childIdListFrom.splice(idxFrom, 1);

      const childIdListTo = this.getChildIdListFromParentId({
        parentId: parentIdTo,
      });
      if (!childIdListTo) {
        console.warn("[moveChild] !childIdListTo");
        return;
      }
      childIdListTo.splice(idxTo, 0, targetChildId);

      const parentIdWrappedByArr = this.getParentIdFromChildId({
        childId: targetChildId,
      });
      if (!parentIdWrappedByArr) {
        console.warn("[moveChild] !parentIdWrappedByArr");
        return;
      }
      parentIdWrappedByArr[0] = parentIdTo;

      // this.removeChild({
      //   childId: targetChild.id,
      // });
      // this.createChild({
      //   parentId: parentIdTo,
      //   child: targetChild,
      //   shouldAppend: false,
      // });
      // arrayMoveElement({
      //   arr: childIdListTo,
      //   idxFrom: 0,
      //   idxTo: idxTo + 1,
      // });
    }
  }
}
