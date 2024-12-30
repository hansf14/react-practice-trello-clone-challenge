// Warn to use: (Dangerous hook) possible infinite function call
import { useCallback, useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { useForceRender } from "@/hooks/useForceRender";

export type OnSyncCb = ({}) => void;

export const useStateSync = <T>({
  stateSrc,
  onSyncCb,
  onSyncCbType = "useEffect",
}: {
  stateSrc: T;
  onSyncCb?: OnSyncCb;
  onSyncCbType?: "useEffect" | "useIsomorphicLayoutEffect";
}) => {
  const refState = useRef<T>(stateSrc);
  const { forceRender } = useForceRender();

  const effectHook =
    onSyncCbType === "useEffect" ? useEffect : useIsomorphicLayoutEffect;

  const setState = useCallback(
    ({
      stateOrSetStateAction,
    }: {
      stateOrSetStateAction: T | (({ cur }: { cur: T }) => T);
    }) => {
      if (typeof stateOrSetStateAction === "function") {
        const newState = (stateOrSetStateAction as ({ cur }: { cur: T }) => T)({
          cur: refState.current,
        });
        refState.current = newState;
      } else {
        refState.current = stateOrSetStateAction;
      }
      forceRender();
    },
    [forceRender],
  );

  effectHook(() => {
    if (onSyncCbType === "useEffect") {
      onSyncCb?.({
        oldState: refState.current,
        newState: stateSrc,
      });
      refState.current = stateSrc;
      forceRender();
    }
  }, [stateSrc, onSyncCbType, onSyncCb]);

  return {
    state: refState.current,
    setState,
  };
};
