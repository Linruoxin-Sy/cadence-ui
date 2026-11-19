"use client";

import {
  bindMotionParameters,
  motionMilliseconds,
  presenceExit,
  presenceSheet,
  presenceSheetExit,
  presenceSurface,
} from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type ModalEdge = "top" | "right" | "bottom" | "left";

/** The panel's own extent in the direction it leaves the viewport. Percentages
 * resolve against the rendered border box, never a cached or viewport distance. */
function edgeOffset(side: ModalEdge) {
  return side === "right"
    ? "translateX(100%)"
    : side === "left"
      ? "translateX(-100%)"
      : side === "top"
        ? "translateY(-100%)"
        : "translateY(100%)";
}

export type ModalPresenceCommit = {
  /** Semantic open state owned by the native primitive. Never inferred from paint. */
  open: boolean;
  /** A genuine entrance (a later open), not an already-visible initial render. */
  enter?: boolean;
  cm: CadenceMotion;
};

/**
 * One modal surface paint owner. The panel and its backdrop use separate instances,
 * so opacity and the optional scale/edge envelope each have exactly one writer. Base UI
 * keeps mounting, modality, focus and the actual unmount completion.
 *
 * `edge` selects the panel's own edge flight instead of a scale envelope: the
 * travel distance is the panel's current extent, so a side sheet needs no distance
 * token and no per-side tuning. A caller transform keeps its own family and drops
 * the travel rather than double-writing the property.
 */
export function createModalPresence(
  node: HTMLElement,
  options: {
    spatial?: boolean;
    edge?: () => ModalEdge;
    /**
     * The host already carries a primitive-owned `transform` family (a swipe
     * gesture's inline displacement). The scale envelope then owns `transform`
     * only for its own frames and yields to that gesture, rather than treating the
     * family as a caller paint that would cancel the envelope altogether.
     */
    compose?: boolean;
  } = {},
) {
  const spatial = options.spatial === true;
  const edge = options.edge;
  const compose = options.compose === true;
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let current: ModalPresenceCommit | null = null;
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

  const settleEntry = () => {
    if (current?.open) cancel();
  };
  for (const type of ["focusin", "pointerdown", "keydown", "click", "beforematch"])
    node.addEventListener(type, settleEntry, true);
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && current?.cm.mode === "full")) cancel();
  });

  /** An explicit caller clock/animation keeps its own family; the panel never doubles it.
   * A composed host leaves its primitive-owned gesture family to that gesture. */
  const callerOwnsPaint = (css: CSSStyleDeclaration) => {
    if (node.style.opacity) return true;
    const family = css.transitionProperty.split(",").map((property) => property.trim());
    const times = css.transitionDuration.split(",").map((time) => Number.parseFloat(time));
    const families = compose ? ["all", "opacity"] : ["all", "opacity", "transform", "scale", "translate"];
    if (family.some((property, index) => families.includes(property) && (times[index % times.length] ?? 0) > 0))
      return true;
    return (node.getAnimations?.() ?? []).some(
      (handle) =>
        !handles.includes(handle) &&
        (handle.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => "opacity" in frame || (!compose && "transform" in frame)),
    );
  };

  const clocks = (open: boolean, cm: CadenceMotion) => {
    const parameters = cm.parameters(
      edge
        ? bindMotionParameters(
            open ? presenceSheet : presenceSheetExit,
            open ? "popup.anchored/edge" : "popup.anchored/edge-exit",
          )
        : bindMotionParameters(
            open ? presenceSurface : presenceExit,
            open ? (spatial ? "enter.pop/surface" : "enter.pop/opacity") : "exit.fade/opacity",
          ),
    );
    if (parameters.kind !== "visual") return null;
    return {
      opacity: parameters.opacity,
      // One parameter resolution owns both properties; reduced/none resolve the
      // spatial half to a zero clock instead of inventing a second recipe.
      spatial: parameters.spatial,
      scale: parameters.scale,
    };
  };

  const play = (fromOpacity: number | undefined, fromTransform: string | undefined) => {
    const input = current;
    if (!alive || !input) return;
    const clock = clocks(input.open, input.cm);
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (!clock || !css || css.display === "none" || css.visibility === "hidden") return;
    const immediate = blocked || input.cm.disabled || input.cm.timeScale === 0 || clock.opacity.duration === 0;
    if (typeof node.animate !== "function") return;
    if (callerOwnsPaint(css)) return;
    // Never delay or fade an actual focus target; a real entrance may settle while
    // the independently owned backdrop keeps its own clock.
    if (input.open && (immediate || node.contains(node.ownerDocument.activeElement))) return;
    const side = edge?.();
    // A caller transform keeps that family; the presence then writes only opacity.
    const ownsTransform = css.transform === "none" || fromTransform !== undefined;
    const revision = transaction.revision("presence", input.open, node);
    const generation = ++epoch;
    lease = owner.begin(revision, side && ownsTransform ? ["opacity", "transform"] : ["opacity"], {}, () => {
      for (const handle of handles) handle.cancel();
      handles = [];
    });
    if (!lease?.current()) return;
    const owned = lease;
    const opacity = input.open ? Number.parseFloat(css.opacity) : 0;
    const start = fromOpacity ?? (input.open ? 0 : Number.parseFloat(css.opacity) || 1);
    const ease = `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`;
    handles = [
      node.animate([{ opacity: start }, { opacity }], {
        duration: motionMilliseconds(Number(clock.opacity.duration)),
        delay: motionMilliseconds(Number(clock.opacity.delay ?? 0)),
        easing: ease,
        fill: "both",
      }),
    ];
    if (side && ownsTransform && !immediate && !input.cm.reduced && (clock.spatial.duration ?? 0) > 0) {
      const offset = edgeOffset(side);
      // A reversal continues from the paint that is actually on screen; a settled
      // panel starts from its resting placement, never from a cached distance.
      const from = fromTransform ?? (css.transform === "none" ? (input.open ? offset : "none") : css.transform);
      handles.push(
        node.animate([{ transform: from }, { transform: input.open ? "none" : offset }], {
          duration: motionMilliseconds(Number(clock.spatial.duration)),
          delay: motionMilliseconds(Number(clock.spatial.delay ?? 0)),
          easing: ease,
          fill: "both",
        }),
      );
    } else if (
      !side &&
      spatial &&
      input.open &&
      !immediate &&
      !input.cm.reduced &&
      (compose || css.transform === "none") &&
      css.scale === "none"
    )
      handles.push(
        node.animate([{ transform: `scale(${clock.scale})` }, { transform: "none" }], {
          duration: motionMilliseconds(Number(clock.spatial.duration)),
          easing: `cubic-bezier(${input.cm.scope.tokens.ease.out.join(",")})`,
          fill: "both",
        }),
      );
    const batch = [...handles];
    void Promise.allSettled(batch.map((handle) => handle.finished)).then(
      () => {
        if (!alive || generation !== epoch || !owned.current()) return;
        // An entrance settles at the current resting paint. A closing surface keeps
        // its zero-opacity envelope until the primitive's own completion unmounts it.
        if (input.open) cancel();
      },
      () => {},
    );
  };

  return {
    commit(input: ModalPresenceCommit) {
      const previous = current;
      current = input;
      // Resolve both owned clocks on every committed policy, including static ones.
      clocks(true, input.cm);
      clocks(false, input.cm);
      if (!alive) return;
      const changed = previous ? previous.open !== input.open : input.open && input.enter === true;
      const downgraded = previous?.cm.mode === "full" && input.cm.reduced;
      const halted = input.cm.disabled || input.cm.timeScale === 0;
      if (!changed && !downgraded && !(halted && handles.length)) return;
      const css = handles.length ? node.ownerDocument.defaultView?.getComputedStyle(node) : undefined;
      const from = css ? Number.parseFloat(css.opacity) : undefined;
      // Captured before the cancel: a reversal starts from the visible paint.
      const fromTransform = css && css.transform !== "none" ? css.transform : undefined;
      cancel();
      play(from, fromTransform);
    },
    /** Release the entry envelope without touching the semantic state. */
    settle() {
      cancel();
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      unsubscribe();
      for (const type of ["focusin", "pointerdown", "keydown", "click", "beforematch"])
        node.removeEventListener(type, settleEntry, true);
    },
  };
}
