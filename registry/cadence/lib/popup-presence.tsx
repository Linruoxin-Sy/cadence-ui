"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cssDurationFor, cssEasing } from "./motion";
import { createPresentationScope, MotionPresentation } from "./motion-presence";
import { createMotionTransaction } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

type Part = HTMLElement | SVGElement;
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const surfaces = new WeakMap<Part, readonly string[]>();
const listeners = new WeakMap<Part, Set<() => void>>();
export function cssTransitionList(value: string) {
  return value.match(/(?:[^,(]|\([^)]*\))+/g)?.map((part) => part.trim()) ?? [value];
}
const colorFamilies = new WeakMap<Part, Set<{ properties: readonly string[]; current(): boolean }>>();
export function registerColorTransition(node: Part, properties: readonly string[], current: () => boolean) {
  let records = colorFamilies.get(node);
  if (!records) {
    records = new Set();
    colorFamilies.set(node, records);
  }
  const record = { properties, current };
  records.add(record);
  return () => {
    records.delete(record);
  };
}
export function knownPresenceProperties(node: Part) {
  return surfaces.get(node);
}
export function subscribePresenceProperties(node: Part, notify: () => void) {
  let set = listeners.get(node);
  if (!set) {
    set = new Set();
    listeners.set(node, set);
  }
  set.add(notify);
  return () => {
    set.delete(notify);
  };
}
function publish(node: Part) {
  for (const notify of listeners.get(node) ?? []) notify();
}

/** Native Base UI still owns visibility, completion, portal, modality and focus. */
export function usePopupPresence(
  ref: RefObject<Part | null>,
  properties: readonly string[],
  callerFamily: boolean,
  cm: CadenceMotion,
  clock: "base" | "fast",
) {
  const timing = useRef(cm);
  committed(() => {
    timing.current = cm;
  });
  const [scope] = useState(() => createPresentationScope(ref));
  const [transaction] = useState(createMotionTransaction);
  const connection = useRef<{ node: Part; dispose(retire?: boolean): void; signature: string } | null>(null);
  const signature = JSON.stringify([properties, callerFamily]);
  committed(() => {
    const node = ref.current;
    if (node === connection.current?.node && signature === connection.current.signature) return;
    const old = connection.current;
    connection.current = null;
    old?.dispose(old.node !== node);
    if (!node) return;
    let alive = true;
    let open: boolean | undefined;
    let entry = false;
    const owner = transaction.register(node);
    let lease: ReturnType<typeof owner.begin>;
    const handles = new Set<Animation>();
    const canonical = node.ownerDocument.createElement("span").style;
    if (!callerFamily) {
      surfaces.set(node, properties);
      publish(node);
    }
    const ownsFamily = () => {
      if (callerFamily) return false;
      const css = node.ownerDocument.defaultView?.getComputedStyle(node);
      if (
        (node.getAnimations?.() ?? []).some((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          return (
            !("transitionProperty" in animation) &&
            effect?.target === node &&
            effect.getKeyframes().some((frame) => properties.some((property) => property in frame))
          );
        })
      )
        return false;
      if (!css || css.transitionProperty === "none") return true;
      const colors = new Set<string>();
      for (const record of colorFamilies.get(node) ?? [])
        if (record.current()) for (const property of record.properties) colors.add(property);
      const family = css.transitionProperty.split(",").map((property) => property.trim());
      const durations = cssTransitionList(css.transitionDuration);
      const delays = css.transitionDelay.split(",").map((time) => Number.parseFloat(time));
      const curves = cssTransitionList(css.transitionTimingFunction);
      // Detached CSSOM serialization matches computed timing precision without
      // changing live styles or interrupting a native transition.
      canonical.transitionDuration = `${cssDurationFor(clock, timing.current.mode, timing.current.timeScale, timing.current.scope)}s`;
      const expected = canonical.transitionDuration;
      canonical.transitionTimingFunction = `cubic-bezier(${timing.current.scope.tokens.ease.out.join(",")})`;
      const expectedCurve = canonical.transitionTimingFunction;
      return family.every(
        (property, index) =>
          colors.has(property) ||
          (properties.includes(property) &&
            durations[index % durations.length] === expected &&
            (() => {
              const curve = curves[index % curves.length] ?? "ease";
              const keyword = cssEasing[curve];
              canonical.transitionTimingFunction = keyword ? `cubic-bezier(${keyword.join(",")})` : curve;
              return canonical.transitionTimingFunction === expectedCurve;
            })() &&
            (delays[index % delays.length] ?? 0) === 0),
      );
    };
    const animations = () =>
      (ownsFamily() ? (node.getAnimations?.() ?? []) : []).filter((animation) => {
        const effect = animation.effect as KeyframeEffect | null;
        return (
          "transitionProperty" in animation &&
          effect?.target === node &&
          !effect.pseudoElement &&
          properties.includes(String(animation.transitionProperty))
        );
      });
    const settle = () => {
      if (
        !ownsFamily() ||
        !alive ||
        ref.current !== node ||
        !entry ||
        !lease?.current() ||
        node.hasAttribute("data-closed") ||
        node.hasAttribute("data-ending-style")
      )
        return;
      node.setAttribute("data-cadence-entry-settled", "");
      // Flush the new natural cascade, then cancel just this entry's transitions.
      // Disabled/caller opacity and required placement remain the resting target.
      if (!callerFamily)
        for (const animation of animations()) {
          if (!alive || !lease.current()) break;
          animation.cancel();
        }
    };
    const revise = (crossedClose = false) => {
      if (!alive || ref.current !== node) return;
      const next = !node.hasAttribute("data-closed") && !node.hasAttribute("data-ending-style");
      if (next === open && !crossedClose) return;
      open = next;
      entry = next;
      // Only descendants of this surface retire. A visible external trigger has
      // a different scope and keeps its independent value/colour/width work.
      if (!next || crossedClose) scope.transaction.close();
      if (next) scope.transaction.open();
      if (!alive || next !== (!node.hasAttribute("data-closed") && !node.hasAttribute("data-ending-style"))) return;
      node.removeAttribute("data-cadence-entry-settled");
      const revision = transaction.revision("presence", {});
      lease = owner.begin(revision, callerFamily ? [] : properties, {}, () => {
        for (const handle of handles) handle.cancel();
        handles.clear();
      });
      if (next && node.contains(node.ownerDocument.activeElement)) settle();
    };
    const run = (event: Event) => {
      if (!alive || ref.current !== node || event.target !== node || !lease?.current()) return;
      if (entry && node.contains(node.ownerDocument.activeElement)) settle();
      const current = lease;
      for (const animation of animations()) {
        if (handles.has(animation)) continue;
        handles.add(animation);
        void animation.finished.then(
          () => {
            if (!alive || ref.current !== node || !current.current()) return;
            handles.delete(animation);
            if (!handles.size) entry = false;
          },
          () => {},
        );
      }
    };
    const observer = new MutationObserver((records) => {
      if (!alive || ref.current !== node) return;
      revise(records.some((record) => record.attributeName === "data-closed" && record.oldValue !== null));
    });
    observer.observe(node, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-open", "data-closed", "data-ending-style"],
    });
    for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
      node.addEventListener(type, settle, true);
    const selection = () => {
      const selected = node.ownerDocument.getSelection()?.anchorNode;
      if (alive && ref.current === node && selected && node.contains(selected)) settle();
    };
    node.ownerDocument.addEventListener("selectionchange", selection);
    node.addEventListener("transitionrun", run);
    revise();
    connection.current = {
      node,
      signature,
      dispose(retire = true) {
        alive = false;
        owner.dispose();
        if (retire) scope.transaction.close();
        observer.disconnect();
        node.ownerDocument.removeEventListener("selectionchange", selection);
        node.removeEventListener("transitionrun", run);
        for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
          node.removeEventListener(type, settle, true);
        node.removeAttribute("data-cadence-entry-settled");
        if (surfaces.get(node) === properties) {
          surfaces.delete(node);
          publish(node);
        }
      },
    };
  });
  useInsertionEffect(
    () => () => {
      const old = connection.current;
      connection.current = null;
      old?.dispose();
    },
    [],
  );
  return (children: ReactNode) => <MotionPresentation scope={scope}>{children}</MotionPresentation>;
}

/** Explicit family props yield; opaque classes retain their ordinary cascade. */
export function hasCallerTransition(className: unknown, style: unknown) {
  return (
    (typeof className === "string" && /(?:^|[:\s])(?:transition|duration|delay|ease)(?:-|\s|$)/.test(className)) ||
    Boolean(
      style && typeof style === "object" && Object.keys(style).some((key) => /^(?:transition|animation)/.test(key)),
    )
  );
}
