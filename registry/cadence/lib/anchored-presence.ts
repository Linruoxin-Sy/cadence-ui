"use client";

import { bindMotionParameters, motionMilliseconds, presenceExit, presencePopup } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type AnchoredPresenceCommit = {
  /** Semantic open state owned by the native primitive. Never inferred from paint. */
  open: boolean;
  /** A genuine entrance (a later open), not an already-visible initial render. */
  enter?: boolean;
  cm: CadenceMotion;
};

/**
 * The panel approaches from the anchor side of its resting box: it starts on the
 * edge that touches the trigger and arrives at its placed position. Four cases,
 * expressed as a unit direction on the visual layer only.
 */
const approach: Record<string, readonly [number, number]> = {
  top: [0, 1],
  bottom: [0, -1],
  left: [1, 0],
  right: [-1, 0],
};

/** Resolve a physical or logical side to its approach direction. A logical side
 * uses the panel's own committed direction, so RTL travels the other way. */
function approachDirection(node: HTMLElement) {
  const side = node.getAttribute("data-side") ?? "bottom";
  if (!side.startsWith("inline-")) return approach[side] ?? approach.bottom;
  const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === "rtl";
  const inlineStart = side === "inline-start";
  return approach[inlineStart === !rtl ? "left" : "right"] ?? approach.bottom;
}

/** A caller transition/transform family keeps its own paint; this layer yields. */
function callerOwnsPaint(node: HTMLElement, css: CSSStyleDeclaration, owned: readonly Animation[]) {
  if (node.style.opacity || node.style.transform) return true;
  const family = css.transitionProperty.split(",").map((property) => property.trim());
  const times = css.transitionDuration.split(",").map((time) => Number.parseFloat(time));
  if (
    family.some(
      (property, index) =>
        ["all", "opacity", "transform", "scale", "translate"].includes(property) &&
        (times[index % times.length] ?? 0) > 0,
    )
  )
    return true;
  return (node.getAnimations?.() ?? []).some(
    (handle) =>
      !owned.includes(handle) &&
      (handle.effect as KeyframeEffect | null)
        ?.getKeyframes()
        .some((frame) => "opacity" in frame || "transform" in frame),
  );
}

/**
 * One anchored-popup visual layer. Opacity and the short anchor-side approach are
 * the only properties written, on the panel only: the positioner keeps its own
 * coordinates, `sideOffset`/`alignOffset` are never animated, and a collision flip
 * settles placement immediately instead of interpolating across the new side.
 * Base UI keeps mounting, positioning, focus and the actual unmount completion.
 */
export function createAnchoredPresence(node: HTMLElement) {
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let current: AnchoredPresenceCommit | null = null;
  let handles: Animation[] = [];
  let lease: MotionLease | null = null;
  let alive = true;
  let blocked = false;
  let epoch = 0;

  const cancel = () => {
    epoch++;
    for (const handle of handles) handle.cancel();
    handles = [];
    lease?.cancel();
    lease = null;
  };

  // An actual in-panel focus target is never faded or displaced; a caller policy
  // that keeps focus elsewhere retains a decorative entrance.
  const settleEntry = () => {
    if (current?.open) cancel();
  };
  const entryEvents = ["focusin", "pointerdown", "keydown", "click", "beforematch"];
  for (const type of entryEvents) node.addEventListener(type, settleEntry, true);
  // A resolved-side change retires the obsolete approach direction: the native
  // placement is already correct, so the entry settles on the new side.
  const sides = new MutationObserver(() => {
    if (current?.open && handles.length) cancel();
  });
  sides.observe(node, { attributes: true, attributeFilter: ["data-side"] });
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && current?.cm.mode === "full")) cancel();
  });

  return {
    commit(input: AnchoredPresenceCommit) {
      const previous = current;
      current = input;
      const enter = input.cm.parameters(bindMotionParameters(presencePopup, "popup.anchored/presence"));
      const exit = input.cm.parameters(bindMotionParameters(presenceExit, "exit.fade/opacity"));
      if (!alive || enter.kind !== "visual" || exit.kind !== "visual") return;
      const changed = previous ? previous.open !== input.open : input.enter === true;
      const downgraded = previous?.cm.mode === "full" && input.cm.reduced;
      const halted = input.cm.disabled || input.cm.timeScale === 0;
      // A live downgrade or halt settles an in-flight entry without replaying it.
      if (!changed && !downgraded && !(halted && handles.length)) return;
      const css = node.ownerDocument.defaultView?.getComputedStyle(node);
      if (!css) return;
      const from = handles.length ? Number.parseFloat(css.opacity) : undefined;
      cancel();
      if (typeof node.animate !== "function" || css.visibility === "hidden" || css.display === "none") return;
      const clock = input.open ? enter : exit;
      const immediate = blocked || halted || clock.opacity.duration === 0;
      // A default open may focus a child or the popup itself. Never delay that.
      if (input.open && (immediate || node.contains(node.ownerDocument.activeElement))) return;
      const travel = input.open && !immediate && enter.distance > 0 ? approachDirection(node) : null;
      const spatial = travel && css.transform === "none" && css.translate === "none" && css.scale === "none";
      if (callerOwnsPaint(node, css, handles)) return;
      const revision = transaction.revision("presence", input.open, node);
      const generation = ++epoch;
      lease = owner.begin(revision, spatial ? ["opacity", "transform"] : ["opacity"], {}, () => {
        for (const handle of handles) handle.cancel();
        handles = [];
      });
      if (!lease?.current()) return;
      const owned = lease;
      handles = [
        node.animate(
          [
            { opacity: immediate ? 0 : (from ?? (input.open ? 0 : Number.parseFloat(css.opacity) || 1)) },
            { opacity: input.open ? Number.parseFloat(css.opacity) || 1 : 0 },
          ],
          {
            duration: motionMilliseconds(immediate ? 0 : Number(clock.opacity.duration)),
            delay: motionMilliseconds(immediate ? 0 : Number(clock.opacity.delay ?? 0)),
            easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`,
            fill: "both",
          },
        ),
      ];
      if (spatial && travel)
        handles.push(
          node.animate(
            [
              {
                transform:
                  travel[0] === 0
                    ? `translateY(${travel[1] * enter.distance}px)`
                    : `translateX(${travel[0] * enter.distance}px)`,
              },
              { transform: "none" },
            ],
            {
              duration: motionMilliseconds(Number(enter.spatial.duration)),
              delay: motionMilliseconds(Number(enter.spatial.delay ?? 0)),
              easing: `cubic-bezier(${input.cm.scope.tokens.ease.out.join(",")})`,
              fill: "both",
            },
          ),
        );
      const batch = [...handles];
      void Promise.allSettled(batch.map((handle) => handle.finished)).then(
        () => {
          if (!alive || generation !== epoch || !owned.current()) return;
          // An entrance settles at the resting paint; a closing surface keeps its
          // zero-opacity envelope until the primitive's own completion unmounts it.
          if (input.open) cancel();
        },
        () => {},
      );
    },
    /** Release the entry envelope without touching the semantic open state. */
    settle() {
      cancel();
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      sides.disconnect();
      unsubscribe();
      for (const type of entryEvents) node.removeEventListener(type, settleEntry, true);
    },
  };
}
