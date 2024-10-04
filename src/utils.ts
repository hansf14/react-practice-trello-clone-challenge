import { v4 as uuidv4 } from "uuid";

export type IsNever<T> = [T] extends [never] ? true : false;

export type KeyOf<
	T,
	I extends PropertyKey = PropertyKey,
	AllowNever extends boolean = false
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
	I extends PropertyKey = PropertyKey
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
