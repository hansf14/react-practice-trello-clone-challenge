import React, { PropsWithChildren } from "react";

export type WithMemoAndRef<
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref = React.ElementRef<E>,
  Props extends {} = {},
> = ({
  displayName,
  Component,
}: {
  displayName?: string;
  Component: React.ForwardRefRenderFunction<Ref, React.PropsWithoutRef<Props>>;
}) => ReturnType<
  typeof React.memo<ReturnType<typeof React.forwardRef<Ref, Props>>>
>;

// export const withMemoAndRef = <
//   E extends
//     keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
//   Ref = React.ForwardedRef<E>,
//   Props extends {} = {},
// >({
//   displayName,
//   Component,
// }: {
//   displayName?: string;
//   Component: React.ForwardRefRenderFunction<Ref, React.PropsWithoutRef<Props>>;
//   // ㄴ component: React Hook "useRef" is called in function "component" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".eslintreact-hooks/rules-of-hooks
// }) => {
//   const memoizedComponentWithRef = React.memo(
//     React.forwardRef<Ref, Props>(Component),
//   );
//   memoizedComponentWithRef.displayName = displayName;
//   return memoizedComponentWithRef as
//     | ReturnType<WithMemoAndRef<E, Ref, Props>>
//     | typeof Component;
// };

export const withMemoAndRef = <
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref = React.ElementRef<E>,
  Props = PropsWithChildren<object>,
>({
  displayName,
  Component,
}: {
  displayName?: string;
  Component: React.ForwardRefRenderFunction<Ref, React.PropsWithoutRef<Props>>;
  // ㄴ component: React Hook "useRef" is called in function "component" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".eslintreact-hooks/rules-of-hooks
}) => {
  const memoizedComponentWithRef = React.memo(
    React.forwardRef<Ref, Props>(Component),
  );
  memoizedComponentWithRef.displayName =
    displayName || Component.name || "Component";
  return memoizedComponentWithRef;
};
