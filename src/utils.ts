import { MultiMap, MultiRefMap } from "@/multimap";
import React from "react";
import { ExecutionProps } from "styled-components";
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
  indexFrom,
  indexTo,
}: {
  arr: any[];
  indexFrom: number;
  indexTo: number;
}) {
  const [target] = arr.splice(indexFrom, 1);
  arr.splice(indexTo, 0, target);
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

export type StyledComponentProps<E extends React.ElementType> =
  React.ComponentPropsWithoutRef<E> & ExecutionProps;

///////////////////////////////////////////

export type MemoizeCallback<F> = F extends (...args: infer P) => infer R
  ? (...args: P) => R
  : never;

const memoizeCallbackCache = new MultiRefMap<any, Function>();
export const memoizeCallback = <F extends Function, D extends any[] = any[]>({
  id,
  fn,
  deps,
}: {
  id: string;
  fn: F;
  deps: D;
}) => {
  const keys = [id, ...deps];
  // console.log(keys);
  if (!memoizeCallbackCache.has(keys)) {
    memoizeCallbackCache.set(keys, fn);
  } else {
    // console.log("[memoizeCallback] Cache hit");
  }
  const cb = memoizeCallbackCache.get(keys)!;
  return cb as F;
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

export function getElementOffsetOnDocument({
  element,
}: {
  element: HTMLElement;
}) {
  let offsetX = element.offsetLeft;
  let offsetY = element.offsetTop;
  let offsetParent = element.offsetParent as HTMLElement | null;
  while (offsetParent) {
    offsetX += offsetParent.offsetLeft;
    offsetY += offsetParent.offsetTop;
    offsetParent = offsetParent.offsetParent as HTMLElement | null;
  }
  return {
    x: offsetX,
    y: offsetY,
  };
}

export function getCursorScrollOffsetOnElement({
  element,
  event,
  offsetType,
}: {
  element: HTMLElement;
  event: PointerEvent | MouseEvent | TouchEvent;
  offsetType: "scroll" | "no-scroll";
}) {
  let xOffsetOnDocumentOfCursor = 0;
  let yOffsetOnDocumentOfCursor = 0;
  if ((event as TouchEvent).touches) {
    xOffsetOnDocumentOfCursor = (event as TouchEvent).touches[0].pageX;
    yOffsetOnDocumentOfCursor = (event as TouchEvent).touches[0].pageY;
  } else {
    xOffsetOnDocumentOfCursor = (event as PointerEvent | MouseEvent).pageX;
    yOffsetOnDocumentOfCursor = (event as PointerEvent | MouseEvent).pageY;
  }
  const { x: xOffsetOnDocumentOfElement, y: yOffsetOnDocumentOfElement } =
    getElementOffsetOnDocument({ element });
  const xOffsetOnElementOfCursor =
    xOffsetOnDocumentOfCursor - xOffsetOnDocumentOfElement;
  const yOffsetOnElementOfCursor =
    yOffsetOnDocumentOfCursor - yOffsetOnDocumentOfElement;
  if (offsetType === "no-scroll") {
    return {
      x: xOffsetOnElementOfCursor,
      y: yOffsetOnElementOfCursor,
    };
  } else if (offsetType === "scroll") {
    const { scrollLeft: xOffsetOfScroll, scrollTop: yOffsetOfScroll } = element;
    return {
      x: xOffsetOnElementOfCursor + xOffsetOfScroll,
      y: yOffsetOnElementOfCursor + yOffsetOfScroll,
    };
  }
  return null;
}

export type ScrollbarCondition =
  | "horizontal"
  | "vertical"
  | "or"
  | "xor"
  | "and";
export const checkHasScrollbar = ({
  element,
  condition = "or",
}: {
  element: HTMLElement;
  condition?: ScrollbarCondition;
}) => {
  const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;
  const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
  if (condition === "horizontal") {
    return hasHorizontalScrollbar;
  }
  if (condition === "vertical") {
    return hasVerticalScrollbar;
  }
  if (condition === "or") {
    return hasHorizontalScrollbar || hasVerticalScrollbar;
  }
  if (condition === "xor") {
    return (
      (hasHorizontalScrollbar && !hasVerticalScrollbar) ||
      (!hasHorizontalScrollbar && hasVerticalScrollbar)
    );
  }
  if (condition === "and") {
    return hasHorizontalScrollbar && hasVerticalScrollbar;
  }
  console.warn("[checkHasScrollbar] Wrong condition type.");
  return false;
};

export type ObserveUserAgentChangeCb = ({
  prevUserAgent,
  curUserAgent,
}: {
  prevUserAgent: string;
  curUserAgent: string;
}) => void;

export function getClosestScrollableParent({
  element,
  scrollbarCondition = "or",
  additionalCondition = () => true,
}: {
  element: HTMLElement;
  scrollbarCondition?: ScrollbarCondition;
  additionalCondition?: ({ subject }: { subject: HTMLElement }) => boolean;
}) {
  let parent: HTMLElement | null =
    element.parentElement ?? document.documentElement;
  while (parent) {
    const doesHaveScrollbar = checkHasScrollbar({
      element: parent,
      condition: scrollbarCondition,
    });
    if (!doesHaveScrollbar || !additionalCondition({ subject: parent })) {
      parent = element.parentElement;
      continue;
    } else {
      break;
    }
  }
  return parent;
}

let lastUserAgent = navigator.userAgent;
export function observeUserAgentChange({
  cb,
}: {
  cb: ObserveUserAgentChangeCb;
}) {
  const intervalId = setInterval(() => {
    if (navigator.userAgent !== lastUserAgent) {
      // console.log("userAgent changed:", navigator.userAgent);
      cb({ prevUserAgent: lastUserAgent, curUserAgent: navigator.userAgent });
      lastUserAgent = navigator.userAgent;
    }
  }, 1000);
  return () => {
    clearInterval(intervalId);
  };
}

export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      }
      // else if (ref && typeof ref === "object") {
      //   (ref as React.MutableRefObject<T | null>).current = value;
      // }
    });
  };
}

export function isReactPortal(node: React.ReactNode) {
  return (
    node != null &&
    typeof node === "object" &&
    (node as any).$$typeof === Symbol.for("react.portal")
  );
}

export function getAllNodesAtSameHierarchy(
  element: HTMLElement,
): HTMLElement[] {
  if (!element) {
    return [];
  }
  if (!element.parentNode) {
    // <html>
    return [document.documentElement];
  }
  return Array.from(element.parentNode.children) as HTMLElement[];
}

export type IsFunction<T> = T extends (...args: any[]) => any ? T : never;

export const isFunction = <T extends {}>(value: T): value is IsFunction<T> =>
  typeof value === "function";

const emptyArray = Object.freeze<any[]>([]);
export function getEmptyArray<T>() {
  return emptyArray as T[];
}

const memoizedArrayMap = new MultiMap<string[], unknown>();
export function getMemoizedArray<T, R extends string>({
  arr,
  keys,
}: {
  arr: T[];
  keys: R[];
}) {
  if (!memoizedArrayMap.has({ keys })) {
    memoizedArrayMap.set({
      keys,
      value: arr,
    });
  } else {
    // console.log("[getMemoizedArray] Cache hit");
  }
  return memoizedArrayMap.get({ keys }) as T[] | undefined;
}

export const emptyFunction = () => {};
