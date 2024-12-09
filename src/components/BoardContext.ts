import {
  NestedIndexer,
  NestedIndexerBaseItem,
  NestedIndexerKey,
} from "@/indexer";
import { createKeyValueMapping, SmartMerge } from "@/utils";
import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

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

// TODO: parentKeyName, childKeyName => atomFamily
export const nestedIndexerAtom = atom<NestedIndexer<ParentItem, ChildItem>>({
  key: recoilKeys["nestedIndexerAtom"],
  default: new NestedIndexer({
    parentKeyName: "Parent",
    childKeyName: "Child",
    entries: [],
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
        console.log(JSON.stringify(newValue.toPlain()));
        console.log(JSON.stringify(newValue.toString()));
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

export const dataAttributeItemListTypeValues = ["categories", "tasks"] as const;
export type DataAttributeItemListTypeValueType =
  (typeof dataAttributeItemListTypeValues)[number];
export const dataAttributeItemListTypeValueKvMapping = createKeyValueMapping({
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

export const dataAttributeItemTypeValues = ["category", "task"] as const;
export type DataAttributeItemTypeValueType =
  (typeof dataAttributeItemTypeValues)[number];
export const dataAttributeItemTypeValueKvMapping = createKeyValueMapping({
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
