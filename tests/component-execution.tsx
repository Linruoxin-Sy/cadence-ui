import { createHmac } from "node:crypto";
import { cloneElement, type ReactElement, type Ref, useLayoutEffect, useRef } from "react";
import { onTestFinished } from "vitest";

const evidenceKey = "__CADENCE_TEST_EVIDENCE_KEY__";

export type NativeExecution = {
  item: string;
  exports: readonly string[];
  module: string;
  digest: string;
  slots: string[];
  live: boolean;
};
declare module "vitest" {
  interface TaskMeta {
    cadenceNativeExecutions?: NativeExecution[];
    cadenceNativeSigned?: { test: string; kind: string; rows: NativeExecution[]; signature: string }[];
  }
}

export const mountedComponents = new Map<object, string>();
export const mountedExports = new Map<object, string>();
export const executionModules = new Map<string, string>();
const authoredParents = new WeakMap<object, Execution>();
export const authoredExecution = (props: object) => authoredParents.get(props);
export function registerExecutionModule(module: string, digest: string) {
  executionModules.set(module, digest);
}

export type Execution = {
  item: string;
  part: string;
  exports: readonly string[];
  committed: boolean;
  module: string;
  digest: string;
  parent?: Execution;
  hosts: Map<Element, { site: string; module: string; digest: string }>;
  run<T>(callback: () => T): T;
  host<T>(element: T, site: string, module?: string, digest?: string): T;
  child<T>(element: T): T;
};

let current: Execution | undefined;
export const currentExecution = () => current;
let activeController: object | undefined;
export const currentController = () => activeController;
export function withController<T>(controller: object, callback: () => T): T {
  const previous = activeController;
  activeController = controller;
  try {
    return callback();
  } finally {
    activeController = previous;
  }
}
const unobserved = {
  run: <T,>(callback: () => T) => callback(),
  host: <T,>(element: T) => element,
  child: <T,>(element: T) => element,
};
export function useCadenceDelegateExecution(props?: object) {
  return (props ? authoredParents.get(props) : undefined) ?? unobserved;
}

/** Capture the invoking component for effects in shared hooks. No React type,
 * dependency list, effect timing, event handler or caller callback is replaced. */
export function bindCurrentExecution<T extends (...args: never[]) => unknown>(callback: T): T {
  const origin = current;
  if (!origin) return callback;
  return ((...args: never[]) => origin.run(() => callback(...args))) as T;
}

export function executionHost(origin: Execution | undefined, node: Element) {
  return origin?.committed && node.isConnected ? origin.hosts.get(node)?.site : undefined;
}

function withExecution<T>(origin: Execution, callback: () => T): T {
  const previous = current;
  current = origin;
  try {
    return callback();
  } finally {
    current = previous;
  }
}

/** Test compiler instrumentation; keeps component identity and native props intact. */
export function useCadenceTestExecution(
  item: string,
  part: string,
  exports: readonly string[] = [part],
  module = "",
  digest = "",
  props?: object,
) {
  const identity = useRef<Execution | null>(null);
  if (!identity.current) {
    // Cache by source site AND original ref. Unchanged refs remain unchanged
    // across rerenders; cleanup belongs to the exact attached node/lifetime.
    const absentRef = {};
    const refs = new Map<string, WeakMap<object, (node: Element | null) => (() => void) | undefined>>();
    const origin: Execution = {
      item,
      part,
      exports,
      committed: false,
      module,
      digest,
      child(element) {
        const value = element as ReactElement;
        if (value && typeof value === "object" && value.props) authoredParents.set(value.props as object, origin);
        return element;
      },
      hosts: new Map(),
      run: (callback) => withExecution(origin, callback),
      host(element, site, hostModule = module, hostDigest = digest) {
        const value = element as ReactElement<{ ref?: Ref<Element> }>;
        if (!value || typeof value !== "object" || !value.props) return element;
        const external = value.props.ref;
        const refKey = external ?? absentRef;
        let siteRefs = refs.get(site);
        if (!siteRefs) {
          siteRefs = new WeakMap();
          refs.set(site, siteRefs);
        }
        let ref = siteRefs.get(refKey);
        if (!ref) {
          ref = (node) => {
            if (!node) return;
            const physical = node instanceof Element;
            const connection = { site, module: hostModule, digest: hostDigest };
            if (physical) origin.hosts.set(node, connection);
            let cleanup: (() => void) | undefined;
            try {
              if (typeof external === "function") cleanup = external(node) || undefined;
              else if (external) external.current = node;
            } catch (error) {
              if (physical) origin.hosts.delete(node);
              throw error;
            }
            return () => {
              if (physical && origin.hosts.get(node) === connection) origin.hosts.delete(node);
              if (cleanup) cleanup();
              else if (typeof external === "function") external(null);
              else if (external && external.current === node) external.current = null;
            };
          };
          siteRefs.set(refKey, ref);
        }
        // Keep type/key and every native/render prop; never add a wrapper or
        // recursively clone caller content (Base UI inspects original types).
        return cloneElement(value, { ref }) as typeof element;
      },
    };
    identity.current = origin;
  }
  const origin = identity.current;
  origin.parent = props ? authoredParents.get(props) : undefined;
  useLayoutEffect(() => {
    origin.committed = true;
    mountedComponents.set(origin, item);
    mountedExports.set(origin, `${item}#${part}`);
    const native: NativeExecution = {
      item,
      exports: origin.exports,
      module: origin.module,
      digest: origin.digest,
      slots: [...origin.hosts.keys()]
        .filter((node) => node.isConnected)
        .map((node) => node.getAttribute("data-slot") ?? ""),
      live: true,
    };
    onTestFinished(({ task }) => {
      task.meta.cadenceNativeExecutions ??= [];
      task.meta.cadenceNativeExecutions.push(native);
      const payload = { test: task.id, kind: "native", rows: [native] };
      task.meta.cadenceNativeSigned ??= [];
      task.meta.cadenceNativeSigned.push({
        ...payload,
        signature: createHmac("sha256", evidenceKey).update(JSON.stringify(payload)).digest("hex"),
      });
    });
    return () => {
      origin.committed = false;
      mountedComponents.delete(origin);
      mountedExports.delete(origin);
    };
  }, [origin, item, part]);
  return origin;
}
