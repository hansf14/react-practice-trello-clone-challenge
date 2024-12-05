export { default as MultiRefMap } from "many-keys-map";

// Multi-key
// Multi-value
export class MultiMap<K extends string[], A extends any, V extends A[] = A[]> {
  protected map = new Map<string, V>();

  constructor();
  constructor({ entries }: { entries: [K, V][] });
  constructor(original: MultiMap<K, A, V>);

  constructor(params?: { entries: [K, V][] } | MultiMap<K, A, V>) {
    this.map = new Map<string, V>();

    if (params instanceof MultiMap<K, A, V>) {
      for (const [serializedKey, value] of params.map.entries()) {
        this.map.set(serializedKey, value);
      }
    } else if (params?.entries) {
      for (const [keys, value] of params.entries) {
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
