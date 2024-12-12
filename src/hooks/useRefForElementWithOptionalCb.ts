// TODO: finish implementation
import { useForceRenderWithOptionalCb } from "./useForceRenderWithOptionalCb";
import { useRef, useCallback } from "react";

export type CallbackRef<T extends HTMLElement> = (node: T | null) => void;
export type Cb<T extends HTMLElement> = ({ node }: { node: T | null }) => void;

export type UseRefForElementWithOptionalCbParams<T extends HTMLElement> = {
  cb?: Cb<T>;
  callbackRefInternal?: Cb<T>;
};

export const useRefForElementWithOptionalCb = <T extends HTMLElement>(
  params?: UseRefForElementWithOptionalCbParams<T>,
) => {
  const { cb, callbackRefInternal } = params ?? {};

  const ref = useRef<T | null>(null) as React.MutableRefObject<T | null>;
  const refCallbackRefInternal = useRef<Cb<T> | undefined>(callbackRefInternal);
  const refCb = useRef<Cb<T> | undefined>(cb);

  refCallbackRefInternal.current = callbackRefInternal;

  const { forceRender } = useForceRenderWithOptionalCb();

  const callbackRef = useCallback((node: T | null) => {
    // console.log("Setting refs...");
    if (node) {
      ref.current = node;
      refCallbackRefInternal.current?.({ node });
    }
  }, []);

  const setNewCallbackRefInternal = useCallback(
    ({ newCb }: { newCb: Cb<T> }) => {
      refCallbackRefInternal.current = newCb;
    },
    [],
  );

  const setNewCb = useCallback(({ newDelayedCb }: { newDelayedCb: Cb<T> }) => {
    refCb.current = newDelayedCb;
  }, []);

  return {
    ref,
    callbackRef,
  };
};
