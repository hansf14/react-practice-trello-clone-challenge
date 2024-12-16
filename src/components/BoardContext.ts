import { atom, atomFamily } from "recoil";
import { recoilPersist } from "recoil-persist";
import {
  NestedIndexer,
  NestedIndexerBaseItem,
  NestedIndexerEntry,
} from "@/indexer";
import { createKeyValueMapping, SmartMerge } from "@/utils";

export type DndDataInterface = {
  type: "parent" | "child";
  item: ParentItem | ChildItem;
};

export type DndActiveDataInterface = SmartMerge<
  DndDataInterface & {
    sortable: {
      containerId: string;
      index: number;
      items: string[];
    };
  }
>;
export type DndOverDataInterface = DndActiveDataInterface;

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
  [P in (typeof DroppableCustomAttributesKvMapping)["data-droppable-allowed-types"]]: DndDataInterface["type"];
};

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
    ({ setSelf, onSet }) => {
      const localStorageKey = recoilKeys["nestedIndexerAtom"];

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

export const boardDragHandlesAtom = atom<{
  [id: string]: HTMLDivElement | null;
}>({
  key: "boardDragHandlesAtom",
  default: {},
});

export const dataAttributes = [
  "data-board-list-id",
  "data-item-list-type",
  "data-item-list-id",
  "data-item-type",
  "data-item-id",
] as const;
export type dataAttributeType = (typeof dataAttributes)[number];
export const dataAttributeKvMapping = createKeyValueMapping({
  arr: dataAttributes,
});

////////////////////////////////////

export const dataAttributeItemListTypeValues = ["parents", "children"] as const;
export type DataAttributeItemListTypeValueType =
  (typeof dataAttributeItemListTypeValues)[number];
export const dataAttributeItemListTypeKvMapping = createKeyValueMapping({
  arr: dataAttributeItemListTypeValues,
});

export type DataAttributesOfItemList = SmartMerge<
  {
    [K in (typeof dataAttributeKvMapping)["data-board-list-id"]]: string;
  } & {
    [K in (typeof dataAttributeKvMapping)["data-item-list-type"]]: DataAttributeItemListTypeValueType;
  } & {
    [K in (typeof dataAttributeKvMapping)["data-item-list-id"]]:
      | "root"
      | string;
  }
>;

////////////////////////////////////

export const dataAttributeItemTypeValues = ["parent", "child"] as const;
export type DataAttributeItemTypeValueType =
  (typeof dataAttributeItemTypeValues)[number];
export const dataAttributeItemTypeKvMapping = createKeyValueMapping({
  arr: dataAttributeItemTypeValues,
});

export type DataAttributesOfItem = SmartMerge<
  {
    [K in (typeof dataAttributeKvMapping)["data-board-list-id"]]: string;
  } & {
    [K in (typeof dataAttributeKvMapping)["data-item-type"]]: DataAttributeItemTypeValueType;
  } & {
    [K in (typeof dataAttributeKvMapping)["data-item-id"]]: string;
  }
>;

////////////////////////////////////

export const boardClassNames = [
  "board-sortable-handle",
  "board-sortable-drag",
  "board-sortable-ghost",
] as const;
export type boardClassNameType = (typeof boardClassNames)[number];
export const boardClassNameKvMapping = createKeyValueMapping({
  arr: boardClassNames,
});

export const cardClassNames = [
  "card-sortable-handle",
  "card-sortable-drag",
  "card-sortable-ghost",
] as const;
export type cardClassNameType = (typeof cardClassNames)[number];
export const cardClassNameKvMapping = createKeyValueMapping({
  arr: cardClassNames,
});

export const grabbingClassNames = ["sortable-grabbing"] as const;
export type grabbingClassNameType = (typeof grabbingClassNames)[number];
export const grabbingClassNameKvMapping = createKeyValueMapping({
  arr: grabbingClassNames,
});
