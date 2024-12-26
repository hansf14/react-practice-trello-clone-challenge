import { createContext, useEffect, useMemo } from "react";
import {
  atomFamily,
  RecoilRoot,
  useRecoilCallback,
  useRecoilState,
} from "recoil";
import { recoilPersist } from "recoil-persist";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { NestedIndexer, NestedIndexerBaseItem } from "@/indexer";
import { createKeyValueMapping, SmartMerge } from "@/utils";

export function getDroppable({
  boardListId,
  droppableId,
}: {
  boardListId: string;
  droppableId: string;
}) {
  const droppable = document.querySelector(
    `[${DroppableCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DroppableCustomAttributesKvMapping["data-droppable-id"]}="${droppableId}"]`,
  ) as HTMLElement | null;
  return { droppable };
}

export function getDraggables({
  boardListId,
  droppableId,
}: {
  boardListId: string;
  droppableId: string;
}) {
  const draggables = [
    ...document.querySelectorAll(
      `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}="${boardListId}"][${DraggableCustomAttributesKvMapping["data-droppable-id"]}="${droppableId}"][${DraggableCustomAttributesKvMapping["data-draggable-id"]}][${DraggableCustomAttributesKvMapping["data-draggable-index"]}]`,
    ),
  ] as HTMLElement[];
  return { draggables };
}

export function getDraggablesContainer({
  boardListId,
  draggablesContainerId,
}: {
  boardListId: string;
  draggablesContainerId: string;
}) {
  const draggablesContainer = document.querySelector(
    `[${DraggablesContainerCustomAttributesKvMapping["data-board-list-id"]}="${boardListId}"][${DraggablesContainerCustomAttributesKvMapping["data-draggables-container-id"]}="${draggablesContainerId}"]`,
  ) as HTMLElement | null;
  return { draggablesContainer };
}

export function getDraggable(
  params:
    | {
        boardListId: string;
        draggableId: string;
      }
    | {
        boardListId: string;
        droppableId: string;
        draggableIndex: number;
      },
): {
  draggable: HTMLElement | null;
  draggableId: string | null;
} {
  const { boardListId, draggableId, droppableId, draggableIndex } = params as {
    boardListId: string;
    draggableId: string;
  } & {
    boardListId: string;
    droppableId: string;
    draggableIndex: number;
  };
  if ("draggableId" in params) {
    const draggable = document.querySelector(
      `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}="${boardListId}"][${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
    ) as HTMLElement | null;
    return {
      draggable,
      draggableId,
    };
  } else if ("droppableId" in params && "draggableIndex" in params) {
    const draggable = document.querySelector(
      `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}="${boardListId}"][${DraggableCustomAttributesKvMapping["data-droppable-id"]}="${droppableId}"][${DraggableCustomAttributesKvMapping["data-draggable-index"]}="${draggableIndex}"]`,
    ) as HTMLElement | null;
    const draggableId = !draggable
      ? null
      : draggable.getAttribute(
          DraggableCustomAttributesKvMapping["data-draggable-id"],
        );
    return {
      draggable,
      draggableId,
    };
  }
  return { draggable: null, draggableId: null };
}

export function getDndContextInfoFromData({
  boardListContext,
  data,
}: {
  boardListContext: BoardListContext;
  data: DndDataInterfaceCustom;
}): {
  draggableId: string | null;
  droppableId: string | null;
  indexOfDraggable: number;
  parentAsDroppableOfChild: {
    droppableId: string | null;
    droppableLength: number;
  } | null;
} {
  const boardListId = data.customData.boardListId;
  const draggableId = data.customData.item.id;
  if (boardListId !== boardListContext.boardListId) {
    return {
      draggableId: null,
      droppableId: null,
      indexOfDraggable: -1,
      parentAsDroppableOfChild: null,
    };
  }

  if (isParentItemData(data)) {
    // const parentIdList = boardListContext.indexer.getParentIdList() ?? null;
    // const indexOfDraggable = !parentIdList
    //   ? -1
    //   : parentIdList?.findIndex((parentId) => parentId === draggableId);
    // const childIdList =
    //   boardListContext.indexer.getChildIdListOfParentId({
    //     parentId: draggableId,
    //   }) ?? null;
    // return {
    //   draggableId,
    //   droppableId: boardListId,
    //   indexOfDraggable,
    //   parentAsDroppableOfChild: {
    //     droppableId: draggableId,
    //     droppableLength: !childIdList ? -1 : childIdList.length,
    //   },
    // };

    const _data = data as DndDataInterfaceActive | DndDataInterfaceOver;
    const indexOfDraggable = _data.sortable.index;
    return {
      draggableId,
      droppableId: boardListId,
      indexOfDraggable,
      parentAsDroppableOfChild: {
        droppableId: draggableId,
        droppableLength: _data.sortable.items.length,
      },
    };
  } else if (isChildItemData(data)) {
    // const childIdList = !droppableId
    //   ? null
    //   : boardListContext.indexer.getChildIdListOfParentId({
    //       parentId: droppableId,
    //     });
    // const indexOfDraggable = !childIdList
    //   ? -1
    //   : childIdList.findIndex((childId) => childId === draggableId);
    // return {
    //   draggableId,
    //   droppableId,
    //   indexOfDraggable,
    //   parentAsDroppableOfChild: null,
    // };

    const _data = data as DndDataInterfaceActive | DndDataInterfaceOver;
    const droppableId = _data.sortable.containerId;
    const indexOfDraggable = _data.sortable.index;
    return {
      draggableId,
      droppableId,
      indexOfDraggable,
      parentAsDroppableOfChild: null,
    };
  } else {
    return {
      draggableId: null,
      droppableId: null,
      indexOfDraggable: -1,
      parentAsDroppableOfChild: null,
    };
  }
}

export function getDndContextInfoFromActivator({
  boardListId,
  activator,
}: {
  boardListId: string;
  activator: HTMLElement;
}): {
  draggableHandleElement: HTMLElement | null;
  draggableHandleId: string | null;
  draggableElement: HTMLElement | null;
  draggableId: string | null;
} {
  if (!activator) {
    return {
      draggableHandleElement: null,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableHandle = activator.closest(
    `[${DraggableHandleCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
  ) as HTMLElement | null;
  // ㄴ Assumes that draggable handle is always self/closest ancestor of the activator.
  // console.log(draggableHandle);
  if (!draggableHandle) {
    return {
      draggableHandleElement: null,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableHandleId = draggableHandle.getAttribute(
    DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"],
  );
  // console.log(draggableHandleId);
  if (!draggableHandleId) {
    return {
      draggableHandleElement: draggableHandle,
      draggableHandleId: null,
      draggableElement: null,
      draggableId: null,
    };
  }

  const draggableId = draggableHandleId;

  const draggable = draggableHandle.closest(
    `[${DraggableCustomAttributesKvMapping["data-board-list-id"]}=${boardListId}][${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
  ) as HTMLElement | null;
  // ㄴ Assumes that draggable is always self/closest ancestor of the handle.
  // console.log(draggable);
  if (!draggable) {
    return {
      draggableHandleElement: draggableHandle,
      draggableHandleId: draggableHandleId,
      draggableElement: null,
      draggableId: draggableId,
    };
  }
  return {
    draggableHandleElement: draggableHandle,
    draggableHandleId: draggableHandleId,
    draggableElement: draggable,
    draggableId: draggableId,
  };
}

///////////////////////////////////////

export type BoardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  // draggableHandleAttributes: DraggableAttributes | undefined;
  // draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const BoardContext = createContext<BoardContextValue>({
  setActivatorNodeRef: undefined,
  // draggableHandleAttributes: undefined,
  // draggableHandleListeners: undefined,
});

export const BoardContextProvider = ({
  value,
  children,
}: {
  value: BoardContextValue;
  children: React.ReactNode;
}) => {
  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
};

///////////////////////////////////////

export type CardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  // draggableHandleAttributes: DraggableAttributes | undefined;
  // draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const CardContext = createContext<CardContextValue>({
  setActivatorNodeRef: undefined,
  // draggableHandleAttributes: undefined,
  // draggableHandleListeners: undefined,
});

export const CardContextProvider = ({
  value,
  children,
}: {
  value: CardContextValue;
  children: React.ReactNode;
}) => {
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

///////////////////////////////////////

export type DndDataInterfaceCustom = {
  customData: {
    boardListId: string;
    type: string;
    item: NestedIndexerBaseItem;
  };
};

export function isCustomItemData(
  value: unknown,
): value is DndDataInterfaceCustom {
  return Boolean(value && typeof value === "object" && "customData" in value);
}

export function isParentItemData(
  value: unknown,
): value is DndDataInterfaceCustomGeneric<"parent"> {
  return isCustomItemData(value) && value.customData.type === "parent";
}

export function isChildItemData(
  value: unknown,
): value is DndDataInterfaceCustomGeneric<"child"> {
  return isCustomItemData(value) && value.customData.type === "child";
}

export const DndDataItemTypes = ["parent", "child"] as const;
export type DndDataItemType = (typeof DndDataItemTypes)[number];
export const DndDataItemTypeKvMapping = createKeyValueMapping({
  arr: DndDataItemTypes,
});

export type DndDataInterfaceCustomGeneric<
  T extends DndDataItemType = DndDataItemType,
> = {
  customData: {
    boardListId: string;
    type: string;
    item: T extends "parent"
      ? ParentItem
      : T extends "child"
        ? ChildItem
        : null;
  };
};

export type DndDataInterfaceActive<
  T extends DndDataItemType = DndDataItemType,
> = SmartMerge<
  DndDataInterfaceCustomGeneric<T> & {
    sortable: {
      containerId: string;
      index: number;
      items: string[];
    };
  }
>;
export type DndDataInterfaceOver<T extends DndDataItemType = DndDataItemType> =
  DndDataInterfaceActive<T>;

///////////////////////////////////////

export const CurrentActiveCustomAttributes = [
  "data-active-scroll-container",
  "data-active-draggable",
] as const;
export type CurrentActiveCustomAttributeType =
  (typeof CurrentActiveCustomAttributes)[number];
export const CurrentActiveCustomAttributesKvMapping = createKeyValueMapping({
  arr: CurrentActiveCustomAttributes,
});
export type CurrentActiveCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof CurrentActiveCustomAttributesKvMapping)["data-active-scroll-container"]]: "true";
  } & {
    [P in (typeof CurrentActiveCustomAttributesKvMapping)["data-active-draggable"]]: "true";
  }
>;

export const DragOverlayCustomAttributes = [
  "data-board-list-id",
  "data-drag-overlay",
] as const;
export type DragOverlayCustomAttributeType =
  (typeof DragOverlayCustomAttributes)[number];
export const DragOverlayCustomAttributesKvMapping = createKeyValueMapping({
  arr: DragOverlayCustomAttributes,
});
export type DragOverlayCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DragOverlayCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DragOverlayCustomAttributesKvMapping)["data-drag-overlay"]]: "true";
  }
>;

export const ScrollContainerCustomAttributes = [
  "data-board-list-id",
  "data-scroll-container-id",
  "data-scroll-container-allowed-types",
] as const;
export type ScrollContainerCustomAttributeType =
  (typeof ScrollContainerCustomAttributes)[number];
export const ScrollContainerCustomAttributesKvMapping = createKeyValueMapping({
  arr: ScrollContainerCustomAttributes,
});
export type ScrollContainerCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-id"]]: string;
  } & {
    [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-allowed-types"]]: string;
  }
>;

export const DroppableCustomAttributes = [
  "data-board-list-id",
  "data-droppable-id",
  "data-droppable-allowed-types",
] as const;
export type DroppableCustomAttributeType =
  (typeof DroppableCustomAttributes)[number];
export const DroppableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DroppableCustomAttributes,
});
export type DroppableCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-id"]]: string;
  } & {
    [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-allowed-types"]]: string;
  }
>;

export function serializeAllowedTypes({
  allowedTypes,
}: {
  allowedTypes: DndDataItemType[];
}) {
  return JSON.stringify(allowedTypes).replaceAll(/\"/g, "'");
}

export function deserializeAllowedTypes({
  serializedAllowedTypes,
}: {
  serializedAllowedTypes: string;
}) {
  return JSON.parse(
    serializedAllowedTypes.replaceAll(/'/g, '"'),
  ) as DndDataItemType[];
}

export const DraggableCustomAttributes = [
  "data-board-list-id",
  "data-draggable-id",
  "data-draggable-index",
  "data-droppable-id",
] as const;
export type DraggableCustomAttributeType =
  (typeof DraggableCustomAttributes)[number];
export const DraggableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableCustomAttributes,
});
export type DraggableCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-draggable-id"]]: string;
  } & {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-draggable-index"]]: string;
  } & {
    [P in (typeof DraggableCustomAttributesKvMapping)["data-droppable-id"]]: string;
  }
>;

export const DraggablesContainerCustomAttributes = [
  "data-board-list-id",
  "data-draggables-container-id",
] as const;
export type DraggablesContainerCustomAttributeType =
  (typeof DraggablesContainerCustomAttributes)[number];
export const DraggablesContainerCustomAttributesKvMapping =
  createKeyValueMapping({
    arr: DraggablesContainerCustomAttributes,
  });
export type DraggablesContainerCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DraggablesContainerCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DraggablesContainerCustomAttributesKvMapping)["data-draggables-container-id"]]: string;
  }
>;

export const DraggableHandleCustomAttributes = [
  "data-board-list-id",
  "data-draggable-handle-id",
] as const;
export type DraggableHandleCustomAttributeType =
  (typeof DraggableHandleCustomAttributes)[number];
export const DraggableHandleCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableHandleCustomAttributes,
});
export type DraggableHandleCustomAttributesKvObj = SmartMerge<
  {
    [P in (typeof DraggableHandleCustomAttributesKvMapping)["data-board-list-id"]]: string;
  } & {
    [P in (typeof DraggableHandleCustomAttributesKvMapping)["data-draggable-handle-id"]]: string;
  }
>;

///////////////////////////////////////

const { persistAtom } = recoilPersist({
  key: "recoilPersist", // this key is using to store data in local storage
  storage: localStorage, // configure which storage will be used to store the data
  converter: JSON, // configure how values will be serialized/deserialized in storage
});

const recoilKeys = createKeyValueMapping({
  arr: ["boardListContextAtomFamily"],
});

export type ParentItem = SmartMerge<
  NestedIndexerBaseItem & {
    title: string;
    items?: ChildItem[];
  }
> &
  Record<any, any>;

export type ChildItem = SmartMerge<
  NestedIndexerBaseItem & {
    content: string;
  }
> &
  Record<any, any>;

export class BoardListContextIndexer extends NestedIndexer<
  ParentItem,
  ChildItem
> {}

export type BoardListContextParams = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
};

export type BoardListContext = {
  boardListId: string;
  indexer: BoardListContextIndexer;
};

export type BoardListContextValue = {
  boardListId: string;
  parentKeyName: string;
  childKeyName: string;
  defaultItems?: ParentItem[];
};

export type UseBoardContextParams = BoardListContextParams;

export const boardListContextAtomFamily = atomFamily<
  BoardListContext,
  BoardListContextParams
>({
  key: recoilKeys["boardListContextAtomFamily"],
  default: ({ boardListId, parentKeyName, childKeyName }) => {
    return {
      boardListId,
      indexer: new BoardListContextIndexer({
        parentKeyName,
        childKeyName,
      }),
    };
  },
  // dangerouslyAllowMutability: true,
  effects_UNSTABLE: [persistAtom],
  effects: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ setSelf, onSet }) => {
      // const localStorageKey = recoilKeys["nestedIndexerAtom"];

      // // Load initial value from localStorage (if available)
      // const storedValue = localStorage.getItem(localStorageKey);
      // if (storedValue) {
      //   try {
      //     const parsedValue = JSON.parse(storedValue);
      //     setSelf(new NestedIndexer(parsedValue));
      //   } catch (error) {
      //     console.error("Error parsing localStorage value:", error);
      //   }
      // }

      // Save value to localStorage whenever it changes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onSet((newValue) => {
        // console.log(JSON.stringify(newValue.toPlain()));
        // console.log(JSON.stringify(newValue.toString()));
        // try {
        //   localStorage.setItem(localStorageKey, JSON.stringify(newValue));
        // } catch (error) {
        //   console.error("Error saving to localStorage:", error);
        // }
      });
    },
  ],
});

export const BoardListContextProvider__Internal = ({
  value: { boardListId, parentKeyName, childKeyName, defaultItems },
  children,
}: {
  value: BoardListContextValue;
  children: React.ReactNode;
}) => {
  const boardListContextParams = useMemo(
    () => ({
      boardListId,
      parentKeyName,
      childKeyName,
    }),
    [boardListId, parentKeyName, childKeyName],
  );

  const initBoardListContext = useRecoilCallback(
    ({ set }) =>
      ({ parentItems }: { parentItems: ParentItem[] }) => {
        const newDefaultBoardListContextIndexer = new BoardListContextIndexer({
          parentKeyName,
          childKeyName,
          parentItems,
        });
        // console.log(
        //   "newDefaultBoardListContextIndexer:",
        //   newDefaultBoardListContextIndexer,
        // );

        set(boardListContextAtomFamily(boardListContextParams), {
          boardListId,
          indexer: newDefaultBoardListContextIndexer,
        });
      },
    [boardListContextParams, boardListId, parentKeyName, childKeyName],
  );

  useIsomorphicLayoutEffect(() => {
    initBoardListContext({ parentItems: defaultItems ?? [] });
  }, [defaultItems, initBoardListContext]);

  return <>{children}</>;
};

export const BoardListContextProvider = ({
  value,
  children,
}: {
  value: BoardListContextValue;
  children: React.ReactNode;
}) => {
  return (
    <RecoilRoot>
      <BoardListContextProvider__Internal value={value}>
        {children}
      </BoardListContextProvider__Internal>
    </RecoilRoot>
  );
};

export const useBoardContext = ({
  boardListId,
  parentKeyName,
  childKeyName,
}: BoardListContextParams) => {
  const boardListContextParams = useMemo(
    () => ({
      boardListId,
      parentKeyName,
      childKeyName,
    }),
    [boardListId, parentKeyName, childKeyName],
  );

  const [stateBoardListContext, setStateBoardListContext] = useRecoilState(
    boardListContextAtomFamily(boardListContextParams),
  );

  const parentItems = stateBoardListContext.indexer.parentItems;

  return {
    parentItems__Immutable: parentItems,
    stateBoardListContext,
    setStateBoardListContext,
  };
};
