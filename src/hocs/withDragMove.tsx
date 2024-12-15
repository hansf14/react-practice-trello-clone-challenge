import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import parse from "html-react-parser";
import { useDnd } from "@/hooks/useDnd";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";

export type WithDragMoveParams<
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref = React.ElementRef<E>,
  Props extends object = {},
> = {
  displayName?: string;
  Component: React.ForwardRefRenderFunction<Ref, React.PropsWithoutRef<Props>>;
};

export const withDragMove = <
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref = React.ElementRef<E>,
  Props extends object = {},
>({
  displayName,
  Component,
}: WithDragMoveParams<E, Ref, Props>) =>
  withMemoAndRef<E, Ref, Props>({
    displayName,
    Component: (props, ref) => {
      const refBase = useRef<Ref | null>(null);
      useImperativeHandle(ref, () => {
        return refBase as Ref;
      });

      // useDnd({});

      return <Component ref={refBase} {...props} />;
    },
  });
