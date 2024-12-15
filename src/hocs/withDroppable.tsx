import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";
import { withMemoAndRef } from "@/hocs/withMemoAndRef";
import { dndGlobalState } from "@/components/UseDndRoot";

export type DroppableHandle = {
  remove: ({ index }: { index: number }) => void;
  add: ({
    index,
    newItem,
  }: {
    index: number;
    newItem: React.ReactNode;
  }) => void;
  move: ({
    indexOld,
    indexNew,
  }: {
    indexOld: number;
    indexNew: number;
  }) => void;
  // groupKey: string;
  // setGroupKey: ({ groupKey }: { groupKey: string }) => void;
  elements: (HTMLElement | null)[];
  baseElement: HTMLElement | null;
};

export type DroppableProps<P> = {
  children: React.ReactNode;
  contextId: string;
  droppableId: string;
  tagKeysAcceptable: string[];
} & P;

export function withDroppable<
  E extends
    keyof React.JSX.IntrinsicElements = keyof React.JSX.IntrinsicElements,
  Ref extends DroppableHandle = DroppableHandle,
  BaseProps extends object = {},
  Props extends DroppableProps<BaseProps> = DroppableProps<BaseProps>,
>({
  displayName,
  BaseComponent,
}: {
  displayName?: string;
  BaseComponent: React.ForwardRefRenderFunction<
    Ref,
    React.PropsWithoutRef<React.PropsWithChildren<Props>>
  >;
}) {
  return withMemoAndRef<E, Ref, Props>({
    displayName,
    Component: (
      { children, contextId, droppableId, tagKeysAcceptable, ...otherProps },
      ref,
    ) => {
      // const refGroupKey = useRef<string>("");
      const refItems = useRef<(HTMLElement | null)[]>([]);
      const refHandle = useRef<Ref | null>(null);
      const refBase = useRef<HTMLElement | null>(null);

      const setBaseElementAttributes = useCallback(() => {
        if (!refBase.current) {
          return;
        }
        refBase.current.classList.add("droppable");

        refBase.current.setAttribute("data-droppable", "true");
        refBase.current.setAttribute("data-context-id", contextId);
        refBase.current.setAttribute("data-droppable-id", droppableId);
        refBase.current.setAttribute(
          "data-droppable-tag-keys-acceptable",
          JSON.stringify(tagKeysAcceptable).replaceAll(/"/g, "'"),
        );

        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[setBaseElementAttributes] !dndState");
          return;
        }

        // We won't observe the droppable via IntersectionObserver.
        // We will get the active droppable manually from "pointermove".
        // dndState.dndRootElementsPendingToBeObserved.set(
        //   refBase.current,
        //   refBase.current,
        // );
      }, [contextId, droppableId, tagKeysAcceptable]);

      const copyChildrenAndInjectRefs = useCallback(
        ({ children }: { children: React.ReactNode }) => {
          return (
            React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                if ((child as any).ref) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    ref: (el: HTMLElement | null) => {
                      refItems.current[index] = el;

                      if (typeof (child as any).ref === "function") {
                        (child as any).ref(el);
                      }
                    },
                  });
                }
                return child;
              }
              return child; // Return other valid elements (like strings or portals) as-is
            }) ?? []
          );
        },
        [],
      );

      useIsomorphicLayoutEffect(() => {
        const dndState = dndGlobalState.getDndContext({ contextId });
        if (!dndState) {
          console.warn("[useIsomorphicLayoutEffect] !dndState");
        } else {
          if (refHandle.current) {
            dndState.droppableHandles.set(droppableId, refHandle.current);
          }
        }
      }, [contextId, droppableId]);

      const [stateChildren, setStateChildren] = useState<React.ReactNode[]>(
        () => copyChildrenAndInjectRefs({ children }),
      );
      useIsomorphicLayoutEffect(() => {
        setStateChildren(copyChildrenAndInjectRefs({ children }));
      }, [children, copyChildrenAndInjectRefs]);

      useImperativeHandle(ref, () => {
        refHandle.current = {
          remove: ({ index }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              newItems.splice(index, 1);
              return newItems;
            });

            refItems.current.splice(index, 1);
          },
          add: ({ index, newItem }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              newItems.splice(
                index,
                0,
                React.isValidElement(newItem)
                  ? (newItem as any).ref
                    ? React.cloneElement(newItem as React.ReactElement<any>, {
                        ref: (el: HTMLElement | null) => {
                          refItems.current.splice(index, 0, el);

                          if (typeof (newItem as any).ref === "function") {
                            (newItem as any).ref(el);
                          }
                        },
                      })
                    : newItem
                  : newItem,
              );
              return newItems;
            });
          },
          move: ({ indexOld, indexNew }) => {
            setStateChildren((curItems) => {
              const newItems = [...curItems];
              const [target] = newItems.splice(indexOld, 1);
              newItems.splice(indexNew, 0, target);
              return newItems;
            });

            const [targetElement] = refItems.current.splice(indexOld, 1);
            refItems.current.splice(indexNew, 0, targetElement);
          },
          // groupKey: refGroupKey.current,
          // setGroupKey: ({ groupKey }) => {
          //   refGroupKey.current = groupKey;
          // },
          elements: refItems.current,
          baseElement: refBase.current,
        } as Ref;
        // console.log(refHandle.current);
        return refHandle.current;
      });

      useIsomorphicLayoutEffect(() => {
        setBaseElementAttributes();
      }, [setBaseElementAttributes]);

      const memoizedChildren = useMemo(
        () => copyChildrenAndInjectRefs({ children: stateChildren }),
        [stateChildren, copyChildrenAndInjectRefs],
      );

      return (
        <BaseComponent
          ref={refBase}
          {...(otherProps as React.PropsWithoutRef<
            React.PropsWithChildren<Props>
          >)}
        >
          {memoizedChildren}
        </BaseComponent>
      );
    },
  });
}
