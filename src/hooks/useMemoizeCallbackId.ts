import useUniqueRandomId from "@/hooks/useUniqueRandomId";

export const useMemoizeCallbackId = () => {
  return useUniqueRandomId();
};
