"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motionMilliseconds, type Recipe, transitionFor } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
export function createPresentationScope(node?: RefObject<HTMLElement | SVGElement | null>) {
  return {
    transaction: createMotionTransaction(),
    presented: false,
    node,
    available: () =>
      !node ||
      Boolean(
        node.current?.isConnected &&
          !node.current.hasAttribute("data-closed") &&
          !node.current.hasAttribute("data-ending-style"),
      ),
  };
}
type PresentationScope = ReturnType<typeof createPresentationScope>;
const Context = createContext<PresentationScope | null>(null);
const documents = new WeakMap<Document, PresentationScope>();
export function documentPresentation(doc: Document) {
  let scope = documents.get(doc);
  if (!scope) {
    scope = createPresentationScope();
    documents.set(doc, scope);
  }
  return scope;
}

/** No host or lifecycle retention. Children commit before this initial baseline. */
export function MotionPresentation({ children, scope: supplied }: { children: ReactNode; scope?: PresentationScope }) {
  const [local] = useState(createPresentationScope);
  const scope = supplied ?? local;
  committed(() => {
    scope.presented = true;
  });
  return <Context.Provider value={scope}>{children}</Context.Provider>;
}

export function usePresentationScope() {
  return useContext(Context);
}

/** Later insertion enhancement. SSR, hydration and the first CSR commit stay natural. */
export function usePresenceEntrance(
  ref: RefObject<HTMLElement | null>,
  cm: CadenceMotion,
  recipe: Recipe,
  spatial = false,
) {
  const parent = usePresentationScope();
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const [hydrated] = useState(hydration);
  const consumed = useRef(false);
  const connection = useRef<{
    node: HTMLElement;
    dispose(): void;
    restrict(cm: CadenceMotion): void;
  } | null>(null);
  useEffect(() => {
    // The fallback is a document presentation baseline, not an application event
    // bus. All siblings' layout work precedes this first passive commit.
    if (!parent && ref.current) documentPresentation(ref.current.ownerDocument).presented = true;
  });
  committed(() => {
    const node = ref.current;
    if (node === connection.current?.node) {
      connection.current.restrict(cm);
      return;
    }
    const old = connection.current;
    connection.current = null;
    old?.dispose();
    if (!node) return;
    const scope = parent ?? documentPresentation(node.ownerDocument);
    const later =
      !consumed.current &&
      !hydrated &&
      scope.presented &&
      scope.available() &&
      !scope.node?.current?.hasAttribute("data-starting-style");
    consumed.current = true;
    let alive = true;
    let current = cm;
    let animation: Animation | null = null;
    let lease: MotionLease | null = null;
    let mode = cm.mode;
    const registration = scope.transaction.register(node);
    const revision = scope.transaction.revision("presence", node, node);
    const finish = () => {
      if (alive) lease?.cancel();
    };
    const play = (from?: string, reduced = current.reduced) => {
      if (!alive || !scope.available() || node.contains(node.ownerDocument.activeElement)) return;
      const clock = transitionFor(
        recipe,
        reduced ? "reduced" : current.mode,
        { timeScale: current.timeScale },
        current.scope,
      );
      if (clock.duration === 0 || typeof node.animate !== "function") return;
      const css = node.ownerDocument.defaultView?.getComputedStyle(node);
      if (!css) return;
      const travel = spatial && !reduced && css.transform === "none";
      const properties = ["opacity", ...(travel ? ["transform"] : [])];
      const end: Keyframe = { opacity: css.opacity };
      const start: Keyframe = { opacity: from ?? 0 };
      if (travel) {
        Object.assign(start, { transform: `translateY(${current.distance.lg}px)` });
        Object.assign(end, { transform: css.transform });
      }
      let handle: Animation | null = null;
      const next = registration.begin(revision, properties, {}, () => handle?.cancel());
      if (!next?.current() || !alive) return;
      lease = next;
      handle = node.animate([start, end], {
        duration: motionMilliseconds(Number(clock.duration)),
        easing: `cubic-bezier(${current.scope.tokens.ease.out.join(",")})`,
      });
      animation = handle;
      void handle.finished.then(
        () => {
          if (!alive || !next.current()) return;
          next.finish();
          handle?.cancel();
        },
        () => {},
      );
    };
    const reduce = () => {
      if (!alive || !lease?.current() || !animation) return;
      const opacity = node.ownerDocument.defaultView?.getComputedStyle(node).opacity;
      finish();
      if (alive && opacity !== undefined) play(opacity, true);
    };
    const restrict = (next: CadenceMotion) => {
      current = next;
      if (next.disabled || next.timeScale === 0) finish();
      else if (mode === "full" && next.reduced) reduce();
      mode = next.mode;
    };
    for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
      node.addEventListener(type, finish, true);
    const selection = () => {
      const selected = node.ownerDocument.getSelection()?.anchorNode;
      if (alive && selected && node.contains(selected)) finish();
    };
    node.ownerDocument.addEventListener("selectionchange", selection);
    const observer = new MutationObserver(() => {
      if (alive) finish();
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-disabled", "disabled"],
    });
    let blocked = false;
    const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
      if (!alive) return;
      blocked = environment.hidden || environment.immediate;
      if (blocked) finish();
      else if (environment.reduced) reduce();
    });
    connection.current = {
      node,
      restrict,
      dispose() {
        alive = false;
        registration.dispose();
        observer.disconnect();
        node.ownerDocument.removeEventListener("selectionchange", selection);
        for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
          node.removeEventListener(type, finish, true);
        unsubscribe();
      },
    };
    if (later && !blocked) play();
  });
  useInsertionEffect(
    () => () => {
      const old = connection.current;
      connection.current = null;
      old?.dispose();
    },
    [],
  );
}
