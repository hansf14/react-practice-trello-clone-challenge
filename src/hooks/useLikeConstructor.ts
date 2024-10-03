import { useRef } from "react";

export const useLikeConstructor = (constructor = () => {}) => {
	const hasBeenCalled = useRef(false);
	if (!hasBeenCalled.current) {
		constructor();
		hasBeenCalled.current = true;
	}
};
