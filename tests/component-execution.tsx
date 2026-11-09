import { useLayoutEffect, useRef } from "react";

export const mountedComponents = new Map<object, string>();
export const mountedExports = new Map<object, string>();

/** Test compiler instrumentation; keeps component identity and native props intact. */
export function useCadenceTestExecution(item: string, part: string) {
  const identity = useRef({}).current;
  useLayoutEffect(() => {
    mountedComponents.set(identity, item);
    mountedExports.set(identity, `${item}#${part}`);
    return () => {
      mountedComponents.delete(identity);
      mountedExports.delete(identity);
    };
  }, [identity, item, part]);
}
