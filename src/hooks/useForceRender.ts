import { useCallback, useState } from "react";

export const useForceRender = () => {
  const callNextRenderCycle = useState<number>(0)[1];

  const forceRender = useCallback(
    (params?: { cb?: () => void }) => {
      const { cb = () => {} } = params ?? {};
      requestAnimationFrame(() => {
        cb();
      });
      callNextRenderCycle((prev) => (prev > 10000 ? 0 : prev + 1));
    },
    [callNextRenderCycle],
  );

  return {
    forceRender,
  };
};
