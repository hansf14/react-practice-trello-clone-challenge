import { useCallback, useEffect, useRef, useState } from "react";

// Do some stuff when the dispatch is completely done.
export const useStateWithCb = <T>({
  initialState,
}: {
  initialState: T | (() => T);
}) => {
  const refHandlerCb = useRef<Function>(() => {});
  const [state, setState] = useState(initialState);

  const customSetState = useCallback(
    (params: {
      newStateOrSetStateAction: React.SetStateAction<T>;
      cb?: Function;
    }) => {
      const { newStateOrSetStateAction, cb = () => {} } = params;
      // console.log("newStateOrSetStateAction:", newStateOrSetStateAction);
      setState(newStateOrSetStateAction);
      refHandlerCb.current = cb;
    },
    [],
  );

  useEffect(() => {
    refHandlerCb.current();
  }, [state]);

  return {
    state,
    setState: customSetState,
  };
};
