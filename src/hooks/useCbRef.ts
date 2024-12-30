import { useRef, useCallback, useState, useEffect } from "react";

// T can be also Handle, so shouldn't write `T extends HTMLElement`.
export type CbRefCb<T> = ({ instance }: { instance: T | null }) => void;

export const useCbRef = <T>() => {
  const ref = useRef<T | null>(null);

  const setRef = useCallback(
    (params?: { cb?: CbRefCb<T> }) => (instance: T | null) => {
      if (instance) {
        ref.current = instance;
        params?.cb?.({ instance: instance });
      }
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRefSet, setIsRefSet] = useState(false); // State to track if ref is set

  useEffect(() => {
    if (ref.current) {
      setIsRefSet(true); // Trigger a re-render when the ref is set
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]); // Effect runs when the ref changes

  return {
    ref,
    setRef,
  };
};
