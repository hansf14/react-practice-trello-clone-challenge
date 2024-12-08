import { createKeyValueMapping, SmartMerge } from "@/utils";

export const customDataAttributeNames = [
  "data-item-list-type",
  "data-item-list-id",
  "data-item-type",
  "data-item-id",
] as const;
export type customDataAttributeNameType =
  (typeof customDataAttributeNames)[number];
export const customDataAttributeNameKvMapping = createKeyValueMapping({
  arr: customDataAttributeNames,
});

export const dataItemListTypeValues = ["categories", "tasks"] as const;
export type DataItemListTypeValueType = (typeof dataItemListTypeValues)[number];
export const dataItemListTypeValueKvMapping = createKeyValueMapping({
  arr: dataItemListTypeValues,
});

export const dataItemTypeValues = ["category", "task"] as const;
export type DataItemTypeValueType = (typeof dataItemTypeValues)[number];
export const dataItemTypeValueKvMapping = createKeyValueMapping({
  arr: dataItemTypeValues,
});

export type ItemListCustomDataAttributes = SmartMerge<
  {
    [K in (typeof customDataAttributeNameKvMapping)["data-item-list-type"]]: DataItemListTypeValueType;
  } & {
    [K in (typeof customDataAttributeNameKvMapping)["data-item-list-id"]]:
      | "root"
      | string;
  }
>;

export type ItemCustomDataAttributes = SmartMerge<
  {
    [K in (typeof customDataAttributeNameKvMapping)["data-item-type"]]: DataItemTypeValueType;
  } & {
    [K in (typeof customDataAttributeNameKvMapping)["data-item-id"]]: string;
  }
>;
