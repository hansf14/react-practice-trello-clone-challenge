import { useEffect, useRef } from "react";

// https://stackoverflow.com/a/77151986/11941803
export function useWhichPropsChanged(props: { [prop: string]: unknown }) {
  // cache the last set of props
  const prev = useRef(props);

  useEffect(() => {
    // check each prop to see if it has changed
    const changed = Object.entries(props).reduce(
      (acc, [key, prop]: [string, unknown]) => {
        if (prev.current[key] === prop) return acc;
        return {
          ...acc,
          [key]: {
            prev: prev.current[key],
            next: prop,
          },
        };
      },
      {} as { [k: string]: any },
    );

    if (Object.keys(changed).length > 0) {
      console.group("Props That Changed");
      console.log(changed);
      console.groupEnd();
    }

    prev.current = props;
  }, [props]);
}
