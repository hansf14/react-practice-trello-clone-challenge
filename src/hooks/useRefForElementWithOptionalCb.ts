import { useRef, useCallback, useState, useEffect } from "react";

// T can be also Handle, so shouldn't write `T extends HTMLElement`.
export type Cb<T> = ({ el }: { el: T | null }) => void;

export const useRefForElementWithOptionalCb = <T>() => {
  const refElement = useRef<T | null>(null);

  const setElementRef = useCallback(
    ({ cb }: { cb?: Cb<T> }) =>
      (el: T | null) => {
        if (el) {
          refElement.current = el;
          cb?.({ el });
        }
      },
    [],
  );

  const [refSet, setRefSet] = useState(false); // State to track if ref is set

  useEffect(() => {
    if (refElement.current) {
      setRefSet(true); // Trigger a re-render when the ref is set
    }
  }, [refElement.current]); // Effect runs when the ref changes

  return {
    ref: refElement,
    setElementRef,
  };
};
