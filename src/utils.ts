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
>(list: T[], indexName: Index) {
  return list.reduce<Indexer<T, Index>>((acc, cur) => {
    acc[cur[indexName]] = cur;
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

// Multi-key
// Multi-value
export class MultiMap<K extends string[], A extends any, V extends A[] = A[]> {
  protected map = new Map<string, V>();

  constructor();
  constructor({}: { entries: [K, V][] });
  constructor(original: MultiMap<K, A, V>);
  constructor(param?: { entries: [K, V][] } | MultiMap<K, A, V>) {
    this.map = new Map<string, V>();

    if (param instanceof MultiMap<K, A, V>) {
      for (const [serializedKey, value] of param.map.entries()) {
        this.map.set(serializedKey, value);
      }
    } else if (param?.entries) {
      for (const [keys, value] of param.entries) {
        const serializedKey = this.serializeMultiKey({ keys });
        this.map.set(serializedKey, value);
      }
    }
  }

  serializeMultiKey({ keys }: { keys: K }) {
    return JSON.stringify(keys);
    // const a = "key1";
    // const b = "key2";
    // undefined;
    // JSON.stringify([a, b]);
    // ('["key1","key2"]');
    //
    // const c = "key1";
    // const d = "key2";
    // undefined;
    // JSON.stringify([c, d]);
    // ('["key1","key2"]');
  }

  // unshift({ keys, value }: { keys: K; value: A | V }) {
  unshift({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });
    if (!this.map.has(serializedKey)) {
      this.map.set(serializedKey, [] as unknown as V);
    }

    this.map.get(serializedKey)?.unshift(...value);
    // if (Array.isArray(value)) {
    //   this.map.get(serializedKey)?.unshift(...value);
    // } else {
    //   this.map.get(serializedKey)?.unshift(value);
    // }
  }

  // push({ keys, value }: { keys: K; value: A | V }) {
  push({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });
    if (!this.map.has(serializedKey)) {
      this.map.set(serializedKey, [] as unknown as V);
    }

    this.map.get(serializedKey)?.push(...value);
    // if (Array.isArray(value)) {
    //   this.map.get(serializedKey)?.push(...value);
    // } else {
    //   this.map.get(serializedKey)?.push(value);
    // }
  }

  shift({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this.map.get(serializedKey)?.shift();
  }

  pop({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this.map.get(serializedKey)?.pop();
  }

  // set({ keys, value }: { keys: K; value: A | V }) {
  set({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });

    this.map.set(serializedKey, value);
    // if (Array.isArray(value)) {
    //   this.map.set(serializedKey, value);
    // } else {
    //   this.map.set(serializedKey, [value] as unknown as V);
    // }
  }

  get({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this.map.get(serializedKey);
  }

  clear({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    this.map.set(serializedKey, [] as unknown as V);
  }

  clearAll() {
    this.map.forEach((value, key) => {
      this.map.set(key, [] as unknown as V);
    });
  }

  delete({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    this.map.delete(serializedKey);
  }

  deleteAll() {
    // this.map = new Map<string, V[]>();
    this.map.forEach((value, key) => {
      this.map.delete(key);
    });
  }

  has({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this.map.has(serializedKey);
  }

  *entries(): IterableIterator<[K, V]> {
    for (const [serializedKey, value] of this.map.entries()) {
      const deserializedKey = JSON.parse(serializedKey) as K;
      yield [deserializedKey, value];
    }
  }
  // entries(): [K, V][] {
  //   const _entries: [K, V][] = [];
  //   for (const [serializedKey, value] of this.map.entries()) {
  //     const deserializedKey = JSON.parse(serializedKey) as K;
  //     _entries.push([deserializedKey, value]);
  //   }
  //   return _entries;
  // }

  *keys(): IterableIterator<K> {
    for (const serializedKey of this.map.keys()) {
      yield JSON.parse(serializedKey) as K;
    }
  }
  // keys(): K[] {
  //   const _keys: K[] = [];
  //   for (const serializedKey of this.map.keys()) {
  //     _keys.push(JSON.parse(serializedKey) as K);
  //   }
  //   return _keys;
  // }

  *values(): IterableIterator<V> {
    yield* this.map.values();
  }
  // values(): V[] {
  //   return this.map.values();
  // }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
