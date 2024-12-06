import { MultiRefMap } from "@/multimap";
import React from "react";
import { v4 as uuidv4 } from "uuid";

export type IsNever<T> = [T] extends [never] ? true : false;

export type KeyOf<
  T,
  I extends PropertyKey = PropertyKey,
  AllowNever extends boolean = false,
> = T extends any
  ? IsNever<T> extends true
    ? AllowNever extends true
      ? keyof never // string | number | symbol
      : never
    : {
          [K in keyof T]: K extends any ? K : never;
        }[keyof T] extends infer IndexType
      ? IndexType extends I
        ? IndexType
        : never
      : never
  : never;

export type StringUnion<T extends string> = `${T}`;

export type SmartOmit<T, K extends keyof T> = SmartMerge<{
  [P in keyof T as Exclude<P, K>]: T[P];
}>;

export type SmartPick<
  O,
  K extends KeyOf<O, I, false>,
  E extends KeyOf<O, I, false> = never,
  I extends PropertyKey = PropertyKey,
> = {
  [P in keyof O as P extends K
    ? IsNever<E> extends true
      ? P
      : P extends E
        ? never
        : P
    : never]: O[P];
} extends infer Tmp
  ? Tmp
  : {};

export type SmartMerge<O, I extends PropertyKey = PropertyKey> = SmartPick<
  O,
  KeyOf<O, I>,
  never,
  I
>;

export type KeyValueMapping<U extends StringUnion<string>> = SmartMerge<{
  [K in U]: K;
}>;

export function createKeyValueMapping<K extends readonly string[]>({
  arr,
}: {
  arr: K | readonly [...K];
}) {
  const keyValuePairs = arr.map((item) => [item, item]);
  const keyValueMapping: KeyValueMapping<K[number]> =
    Object.fromEntries(keyValuePairs);
  return keyValueMapping;
}

export function convertKebabToCamelV2({ str }: { str: string }): string {
  return str.trim().replace(/(-)([0-9]*)([a-z])/g, (x, ...args) => {
    // console.group(x);
    const capturedGroups = args.slice(0, 3);
    // console.log(capturedGroups);
    const res =
      capturedGroups[1] +
      (capturedGroups[2] === "" ? "" : capturedGroups[2][0].toUpperCase());
    // console.log(res);
    // console.groupEnd();
    return res;
  });
}

export type KebabToCamel<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<KebabToCamel<R>>}`
  : S;

export type KebabToCamelMapping<U extends StringUnion<string>> = {
  [K in U]: KebabToCamel<K>;
};

export function createKebabToCamelMapping<
  K extends string[] | readonly string[],
>({ arr }: { arr: K | readonly [...K] }) {
  const keyValueArr = arr.map((item) => [
    item,
    convertKebabToCamelV2({ str: item }),
  ]);
  const result: KebabToCamelMapping<K[number]> =
    Object.fromEntries(keyValueArr);
  return result;
}

export const generateUniqueRandomId = (): string => {
  return uuidv4();
};

export const generateUniqueRandomIds = function* ({
  count,
}: {
  count: number;
}): Generator<string, void, undefined> {
  if (count < 0) {
    // console.log("Warning: generateUniqueRandomIds - cnt value is invalid");
  }

  for (let i = 0; i < count; i++) {
    yield uuidv4();
  }
};

export function arrayMoveElement({
  arr,
  idxFrom,
  idxTo,
}: {
  arr: any[];
  idxFrom: number;
  idxTo: number;
}) {
  const [target] = arr.splice(idxFrom, 1);
  arr.splice(idxTo, 0, target);
}

export type KeyMapping<T> = {
  [K in keyof T]: K;
};

// export type Indexer<T> = {
//   [Key: string]: T;
// };
// export type Indexer<T extends Record<Index, string>, Index extends keyof T> = {
//   [Key: string]: T | undefined;
// };
// ㄴ constraint: T[Index] should be string.
// ex)
// export interface Category {
//   text: string; // unique (index)(key)
//   taskKeyList: Task["id"][];
// }
// export type CategoryIndexer = Indexer<Category, "text">;
// export type CategoryIndexerBad = Indexer<Category, "taskKeyList">;
// export function listToIndexer<
//   T extends Record<Index, string>,
//   Index extends keyof T,
// >(list: T[], indexName: Index) {
//   return list.reduce<Indexer<T, Index>>((acc, cur) => {
//     acc[cur[indexName]] = cur;
//     return acc;
//   }, {});
// }
// ex)
// // export interface CategoryIndexer {
// //   [text: Category["text"]]: Category;
// // }
// export type CategoryIndexer = Indexer<Category, "text">;
// export type CategoryMapping = KeyMapping<Category>;

// export type NameType<Name extends string, Type> = [Name, Type];
// export const nameType = <Name extends string, Value>(
//   name: Name,
//   value: Value,
// ): NameType<Name, Value> => {
//   return [name, value];
// };
// const a = 42;
// const b = "hello";
// type AType = NameType<"a", typeof a>; // ["a", 42]
// type BType = NameType<"b", typeof b>; // ["b", "hello"]

export const memoizeCallbackCache = new MultiRefMap<unknown[], Function>();

export type MemoizeCallback<F> = F extends (...args: infer P) => infer R
  ? (...args: P) => R
  : never;

export const memoizeCallback = <F extends Function, D extends unknown>({
  fn,
  id,
  deps,
}: {
  fn: F;
  id: string;
  deps: D[];
}) => {
  const keys = [id, fn.toString(), ...deps];
  if (memoizeCallbackCache.has(keys)) {
    return memoizeCallbackCache.get(keys)! as MemoizeCallback<F>;
  }

  memoizeCallbackCache.set(keys, fn);
  // console.log(memoizedCallbackCache);
  return fn as unknown as MemoizeCallback<F>;
};

// Not tested
export function cloneCssPropertiesToCssStyleDeclaration(
  cssProperties: React.CSSProperties,
  styleDeclaration: CSSStyleDeclaration,
) {
  Object.entries(cssProperties).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const cssKey = key.replace(
        /[A-Z]/g,
        (match) => `-${match.toLowerCase()}`,
      ); // Convert camelCase to kebab-case
      styleDeclaration.setProperty(cssKey, String(value));
    }
  });
}

export function getElementRelativePos({
  fromElement,
  toElement,
}: {
  fromElement: HTMLElement;
  toElement: HTMLElement;
}) {
  const rectFrom = fromElement.getBoundingClientRect();
  const rectTo = toElement.getBoundingClientRect();
  const x = rectTo.left - rectFrom.left;
  const y = rectTo.top - rectFrom.top;
  return { x, y };
}

export function getCursorRelativePosToElement({
  cursorPos,
  element,
}: {
  cursorPos: { x: number; y: number };
  element: HTMLElement;
}): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const x = cursorPos.x - rect.x;
  const y = cursorPos.y - rect.y;
  return { x, y };
}
