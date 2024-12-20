import { atomFamily } from "recoil";
import { recoilPersist } from "recoil-persist";
import { NestedIndexer, NestedIndexerBaseItem } from "@/indexer";
import { createKeyValueMapping, SmartMerge } from "@/utils";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { createContext } from "react";

export function getDndContextInfo({ activator }: { activator: HTMLElement }): {
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
    `[${DraggableHandleCustomAttributesKvMapping["data-draggable-handle-id"]}]`,
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
    `[${DraggableCustomAttributesKvMapping["data-draggable-id"]}="${draggableId}"]`,
  ) as HTMLElement;
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

export type BoardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  draggableHandleAttributes: DraggableAttributes | undefined;
  draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const BoardContext = createContext<BoardContextValue>({
  setActivatorNodeRef: undefined,
  draggableHandleAttributes: undefined,
  draggableHandleListeners: undefined,
});

export const BoardProvider = ({
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

export type CardContextValue = {
  setActivatorNodeRef: ((el: HTMLElement | null) => void) | undefined;
  draggableHandleAttributes: DraggableAttributes | undefined;
  draggableHandleListeners: SyntheticListenerMap | undefined;
};

export const CardContext = createContext<CardContextValue>({
  setActivatorNodeRef: undefined,
  draggableHandleAttributes: undefined,
  draggableHandleListeners: undefined,
});

export const CardProvider = ({
  value,
  children,
}: {
  value: CardContextValue;
  children: React.ReactNode;
}) => {
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

export type DndDataInterfaceUnknown = {
  type: unknown;
  item: unknown;
};

export function isParentItemData(
  value: DndDataInterfaceUnknown,
): value is DndDataInterface<"parent"> {
  return value.type === "parent";
}

export function isChildItemData(
  value: DndDataInterfaceUnknown,
): value is DndDataInterface<"child"> {
  return value.type === "child";
}

export const DndDataItemTypes = ["parent", "child"] as const;
export type DndDataItemType = (typeof DndDataItemTypes)[number];
export const DndDataItemTypeKvMapping = createKeyValueMapping({
  arr: DndDataItemTypes,
});

export type DndDataInterface<T extends DndDataItemType> = {
  type: T;
  item: T extends "parent" ? ParentItem : T extends "child" ? ChildItem : never;
};

export type DndActiveDataInterface<T extends DndDataItemType> = SmartMerge<
  DndDataInterface<T> & {
    sortable: {
      containerId: string;
      index: number;
      items: string[];
    };
  }
>;
export type DndOverDataInterface<T extends DndDataItemType> =
  DndActiveDataInterface<T>;

export const ScrollContainerCustomAttributes = [
  "data-scroll-container-id",
  "data-scroll-container-allowed-types",
] as const;
export type ScrollContainerCustomAttributeType =
  (typeof ScrollContainerCustomAttributes)[number];
export const ScrollContainerCustomAttributesKvMapping = createKeyValueMapping({
  arr: ScrollContainerCustomAttributes,
});
export type ScrollContainerCustomAttributesKvObj = {
  [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-id"]]: string;
} & {
  [P in (typeof ScrollContainerCustomAttributesKvMapping)["data-scroll-container-allowed-types"]]: string;
};

export const DroppableCustomAttributes = [
  "data-droppable-id",
  "data-droppable-allowed-types",
] as const;
export type DroppableCustomAttributeType =
  (typeof DroppableCustomAttributes)[number];
export const DroppableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DroppableCustomAttributes,
});
export type DroppableCustomAttributesKvObj = {
  [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-id"]]: string;
} & {
  [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-allowed-types"]]: string;
};

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

export const DraggableCustomAttributes = ["data-draggable-id"] as const;
export type DraggableCustomAttributeType =
  (typeof DraggableCustomAttributes)[number];
export const DraggableCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableCustomAttributes,
});
export type DraggableCustomAttributesKvObj = Record<
  DraggableCustomAttributeType,
  string
>;

export const DraggableHandleCustomAttributes = [
  "data-draggable-handle-id",
] as const;
export type DraggableHandleCustomAttributeType =
  (typeof DraggableHandleCustomAttributes)[number];
export const DraggableHandleCustomAttributesKvMapping = createKeyValueMapping({
  arr: DraggableHandleCustomAttributes,
});
export type DraggableHandleCustomAttributesKvObj = Record<
  DraggableHandleCustomAttributeType,
  string
>;

const { persistAtom } = recoilPersist({
  key: "recoilPersist", // this key is using to store data in local storage
  storage: localStorage, // configure which storage will be used to store the data
  converter: JSON, // configure how values will be serialized/deserialized in storage
});

const recoilKeys = createKeyValueMapping({
  arr: ["nestedIndexerAtom"],
});

export type ParentItem = NestedIndexerBaseItem & {
  title: string;
  items?: ChildItem[];
} & Record<any, any>;
export type ChildItem = NestedIndexerBaseItem & {
  content: string;
} & Record<any, any>;
export type NestedIndexerAtomParams = {
  parentKeyName: string;
  childKeyName: string;
  items: ParentItem[];
};

export const nestedIndexerAtom = atomFamily<
  NestedIndexer<ParentItem, ChildItem>,
  NestedIndexerAtomParams
>({
  key: recoilKeys["nestedIndexerAtom"],
  default: ({ parentKeyName, childKeyName, items }) =>
    new NestedIndexer({
      parentKeyName,
      childKeyName,
      items,
    }),
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
