import "reflect-metadata";
export { default as MultiRefMap } from "many-keys-map";
import {
  Expose,
  instanceToPlain,
  plainToInstance,
  Type,
} from "class-transformer";

// Multi-key
// Multi-value
export class MultiMap<
  K extends string[] = string[],
  A extends any = any,
  V extends A[] = A[],
> {
  @Expose()
  @Type(() => Map)
  public _map = new Map<string, V>();

  constructor();
  constructor({ entries }: { entries: [K, V][] });
  constructor(original: MultiMap<K, A, V>);

  constructor(params?: { entries: [K, V][] } | MultiMap<K, A, V>) {
    this._map = new Map<string, V>();

    if (params instanceof MultiMap) {
      for (const [serializedKey, value] of params._map.entries()) {
        this._map.set(serializedKey, value);
      }
    } else if (params?.entries) {
      for (const [keys, value] of params.entries) {
        const serializedKey = this.serializeMultiKey({ keys });
        this._map.set(serializedKey, value);
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

  // Convert to a plain object
  toJSON(): object {
    return instanceToPlain(this);
    // return instanceToPlain(this, {
    //   strategy: "excludeAll",
    // });
    // The strategy option in the transformation settings controls the default behavior for including or excluding properties. The "excludeAll" strategy means only properties explicitly marked with @Expose will be included in the resulting plain object.
  }

  // T: Use of a Polymorphic `this` Type in the Base Class
  // We can make the base class’s `fromJSON` return an instance of the "current" class rather than `MultiMap` specifically. We do this via a bound `this` type on a static method.
  static fromJSON<
    K extends string[] = string[],
    A extends any = any,
    V extends A[] = A[],
    T extends MultiMap<K, A, V> = MultiMap<K, A, V>,
  >(this: new (...args: any[]) => T, json: string): MultiMap<K, A, V> {
    return plainToInstance(this, json) as T;
  }

  // Convert to a JSON string
  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  // unshift({ keys, value }: { keys: K; value: A | V }) {
  unshift({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });
    if (!this._map.has(serializedKey)) {
      this._map.set(serializedKey, [] as unknown as V);
    }

    this._map.get(serializedKey)?.unshift(...value);
    // if (Array.isArray(value)) {
    //   this.map.get(serializedKey)?.unshift(...value);
    // } else {
    //   this.map.get(serializedKey)?.unshift(value);
    // }
  }

  // push({ keys, value }: { keys: K; value: A | V }) {
  push({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });
    if (!this._map.has(serializedKey)) {
      this._map.set(serializedKey, [] as unknown as V);
    }

    this._map.get(serializedKey)?.push(...value);
    // if (Array.isArray(value)) {
    //   this.map.get(serializedKey)?.push(...value);
    // } else {
    //   this.map.get(serializedKey)?.push(value);
    // }
  }

  shift({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this._map.get(serializedKey)?.shift();
  }

  pop({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this._map.get(serializedKey)?.pop();
  }

  // set({ keys, value }: { keys: K; value: A | V }) {
  set({ keys, value }: { keys: K; value: V }) {
    const serializedKey = this.serializeMultiKey({ keys });

    this._map.set(serializedKey, value);
    // if (Array.isArray(value)) {
    //   this.map.set(serializedKey, value);
    // } else {
    //   this.map.set(serializedKey, [value] as unknown as V);
    // }
  }

  get({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this._map.get(serializedKey);
  }

  clear({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    this._map.set(serializedKey, [] as unknown as V);
  }

  clearAll() {
    this._map.forEach((value, key) => {
      this._map.set(key, [] as unknown as V);
    });
  }

  delete({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    this._map.delete(serializedKey);
  }

  deleteAll() {
    // this.map = new Map<string, V[]>();
    this._map.forEach((value, key) => {
      this._map.delete(key);
    });
  }

  has({ keys }: { keys: K }) {
    const serializedKey = this.serializeMultiKey({ keys });
    return this._map.has(serializedKey);
  }

  *entries(): IterableIterator<[K, V]> {
    for (const [serializedKey, value] of this._map.entries()) {
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
    for (const serializedKey of this._map.keys()) {
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
    yield* this._map.values();
  }
  // values(): V[] {
  //   return this.map.values();
  // }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
