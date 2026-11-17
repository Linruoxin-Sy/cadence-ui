"use client";

import { bindMotionParameters, motionMilliseconds, presenceTooltip } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type TooltipPresenceCommit = {
  /** Semantic open state owned by the native primitive. Never inferred from paint. */
  open: boolean;
  /** A genuine entrance (a later open), not an already-visible initial render. */
  enter?: boolean;
  cm: CadenceMotion;
};

/** A caller transition family on the properties this layer writes keeps its own
 * paint; the tooltip yields instead of double-writing opacity. */
function callerOwnsPaint(node: HTMLElement, css: CSSStyleDeclaration, owned: readonly Animation[]) {
  if (node.style.opacity) return true;
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
 * One short hint layer. Opacity is the only property this owner writes, on the
 * tooltip's own popup: the hint never travels or scales, the positioner and arrow
 * keep Base UI's placement, and the provider's intent delay is untouched. Base UI
 * retains mounting, hover/focus intent, the accessible description and the actual
 * unmount completion, which observes this animation instead of a CSS family.
 */
export function createTooltipPresence(node: HTMLElement) {
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let current: TooltipPresenceCommit | null = null;
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

  // Browser find and other supported "present now" paths must not wait for a
  // decorative envelope; the semantic hint stays exactly as announced.
  const reveal = () => {
    if (current?.open) cancel();
  };
  node.addEventListener("beforematch", reveal);
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && current?.cm.mode === "full")) cancel();
  });

  return {
    commit(input: TooltipPresenceCommit) {
      const previous = current;
      current = input;
      // Both phases are the tooltip's own short opacity pair: there is no travel,
      // no scale and no second ending recipe borrowed from another surface.
      const clock = input.cm.parameters(
        bindMotionParameters(
          presenceTooltip,
          input.open ? "popup.anchored/opacity-enter" : "popup.anchored/opacity-exit",
        ),
      );
      if (!alive || clock.kind !== "visual") return;
      const changed = previous ? previous.open !== input.open : input.enter === true;
      const downgraded = previous?.cm.mode === "full" && input.cm.reduced;
      const halted = input.cm.disabled || input.cm.timeScale === 0;
      // A live downgrade or halt settles an in-flight envelope without replaying it.
      if (!changed && !downgraded && !(halted && handles.length)) return;
      const css = node.ownerDocument.defaultView?.getComputedStyle(node);
      if (!css) return;
      const from = handles.length ? Number.parseFloat(css.opacity) : undefined;
      cancel();
      if (typeof node.animate !== "function" || css.visibility === "hidden" || css.display === "none") return;
      const immediate = blocked || halted || clock.opacity.duration === 0;
      if (callerOwnsPaint(node, css, handles)) return;
      const revision = transaction.revision("presence", input.open, node);
      const generation = ++epoch;
      lease = owner.begin(revision, ["opacity"], {}, () => {
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
      const batch = [...handles];
      void Promise.allSettled(batch.map((handle) => handle.finished)).then(
        () => {
          if (!alive || generation !== epoch || !owned.current()) return;
          // An entrance settles at the resting paint; a closing hint keeps its
          // zero-opacity envelope until the primitive's own completion unmounts it.
          if (input.open) cancel();
        },
        () => {},
      );
    },
    /** Release the current envelope without touching the semantic open state. */
    settle() {
      cancel();
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      unsubscribe();
      node.removeEventListener("beforematch", reveal);
    },
  };
}
