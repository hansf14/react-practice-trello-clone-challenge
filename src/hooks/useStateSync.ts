// Warn to use: (Dangerous hook) possible infinite function call
import { useForceRenderWithOptionalCb } from "@/hooks/useForceRenderWithOptionalCb";
import { useCallback, useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

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
  const { forceRender } = useForceRenderWithOptionalCb();

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
