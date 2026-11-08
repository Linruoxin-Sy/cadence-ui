"use client";

import { type Ref, useCallback, useEffect, useInsertionEffect, useLayoutEffect, useRef } from "react";

export type MotionHostRef<T extends Element = Element> = {
  current: T | null;
  identity?: object;
  invalidate?: () => void;
};

/** Separate physical owner identity from the caller's React 19 ref registration. */
export function useMotionHostRef<T extends Element>(external?: Ref<T>) {
  const node = useRef<T | null>(null) as MotionHostRef<T>;
  const desired = useRef(external);
  const physical = useRef<{ element: T } | null>(null);
  const binding = useRef<{ element: T; source: Ref<T> | undefined; release(): void } | null>(null);
  const callerGeneration = useRef(0);
  useInsertionEffect(() => {
    desired.current = external;
  }, [external]);
  const disconnect = useCallback(() => {
    callerGeneration.current++;
    const old = binding.current;
    binding.current = null;
    node.identity = {};
    node.current = null;
    node.invalidate?.();
    old?.release();
  }, []);
  const connect = useCallback((lifetime: { element: T }) => {
    const epoch = ++callerGeneration.current;
    const old = binding.current;
    binding.current = null;
    old?.release();
    if (physical.current !== lifetime || callerGeneration.current !== epoch) return;
    const { element } = lifetime;
    const source = desired.current;
    let active = true,
      ready = false,
      cleaned = false;
    let cleanup: undefined | (() => void);
    const release = () => {
      if (!ready || cleaned) return;
      cleaned = true;
      if (typeof cleanup === "function") cleanup();
      else if (typeof source === "function") source(null);
      else if (
        source &&
        source.current === element &&
        (binding.current?.source !== source || binding.current.element !== element)
      )
        source.current = null;
    };
    const record = {
      element,
      source,
      release() {
        active = false;
        release();
      },
    };
    binding.current = record;
    try {
      if (typeof source === "function") {
        const returned = source(element);
        cleanup = typeof returned === "function" ? returned : undefined;
      } else if (source) source.current = element;
      ready = true;
      if (!active) release();
    } catch (error) {
      if (binding.current === record) {
        binding.current = null;
      }
      throw error;
    }
  }, []);
  const ref = useCallback(
    (element: T | null) => {
      const lifetime = element ? { element } : null;
      physical.current = lifetime;
      disconnect();
      if (lifetime && physical.current === lifetime) {
        node.identity = lifetime;
        node.current = element;
        connect(lifetime);
      }
      return () => {
        if (physical.current !== lifetime) return;
        physical.current = null;
        disconnect();
      };
    },
    [connect, disconnect],
  );
  const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
  // Motion keeps its physical ref stable when only the caller ref changes.
  // Rebind that caller before controller layout work, without remounting Motion.
  committed(() => {
    const lifetime = physical.current;
    if (lifetime && binding.current?.source !== external) connect(lifetime);
  }, [external, connect]);
  return { node, ref };
}
