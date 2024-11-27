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
export type Indexer<T extends Record<Index, string>, Index extends keyof T> = {
  [Key: string]: T | undefined;
};
// ㄴ constraint: T[Index] should be string.
// ex)
// export interface Category {
//   text: string; // unique (index)(key)
//   taskKeyList: Task["id"][];
// }
// export type CategoryIndexer = Indexer<Category, "text">;
// export type CategoryIndexerBad = Indexer<Category, "taskKeyList">;

export function listToIndexer<
  T extends Record<Index, string>,
  Index extends keyof T,
>(list: T[], keyName: Index) {
  return list.reduce<Indexer<T, Index>>((acc, cur) => {
    acc[cur[keyName]] = cur;
    return acc;
  }, {});
}
// ex)
// // export interface CategoryIndexer {
// //   [text: Category["text"]]: Category;
// // }
// export type CategoryIndexer = Indexer<Category, "text">;
// export type CategoryMapping = KeyMapping<Category>;

// const categoryIndexerSelector = selector<CategoryIndexer>({
//   key: "categoryIndexerSelector",
//   get: ({ get }) => {
//     const categoryList = get(categoryListAtom);
//     return categoryList.reduce<CategoryIndexer>((acc, cur) => {
//       acc[cur.text] = cur;
//       return acc;
//     }, {});
//   },
// });
// const categoryIndexerSelector = selector<CategoryIndexer>({
//   key: "categoryIndexerSelector",
//   get: ({ get }) => {
//     const categoryList = get(categoryListAtom);
//     return listToIndexer(categoryList, "text");
//   },
// });
