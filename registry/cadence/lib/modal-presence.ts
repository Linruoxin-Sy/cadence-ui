"use client";

import type { Transition } from "motion/react";
import { bindMotionParameters, motionMilliseconds, presenceExit, presenceSurface } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type ModalPresenceCommit = {
  /** Semantic open state owned by the native primitive. Never inferred from paint. */
  open: boolean;
  /** A genuine entrance (a later open), not an already-visible initial render. */
  enter?: boolean;
  cm: CadenceMotion;
};

/**
 * One modal surface paint owner. The panel and its backdrop use separate instances,
 * so opacity and the optional scale envelope each have exactly one writer. Base UI
 * keeps mounting, modality, focus and the actual unmount completion.
 */
export function createModalPresence(node: HTMLElement, options: { spatial?: boolean } = {}) {
  const spatial = options.spatial === true;
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

  /** An explicit caller clock/animation keeps its own family; the panel never doubles it. */
  const callerOwnsPaint = (css: CSSStyleDeclaration) => {
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
        !handles.includes(handle) &&
        (handle.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => "opacity" in frame || "transform" in frame),
    );
  };

  const clocks = (open: boolean, cm: CadenceMotion): Transition | null => {
    const parameters = cm.parameters(
      open
        ? bindMotionParameters(presenceSurface, spatial ? "enter.pop/surface" : "enter.pop/opacity")
        : bindMotionParameters(presenceExit, "exit.fade/opacity"),
    );
    return parameters.kind === "visual" ? parameters.opacity : null;
  };

  const play = (fromOpacity: number | undefined) => {
    const input = current;
    if (!alive || !input) return;
    const clock = clocks(input.open, input.cm);
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (!clock || !css || css.display === "none" || css.visibility === "hidden") return;
    const immediate = blocked || input.cm.disabled || input.cm.timeScale === 0 || clock.duration === 0;
    if (typeof node.animate !== "function") return;
    if (callerOwnsPaint(css)) return;
    // Never delay or fade an actual focus target; a real entrance may settle while
    // the independently owned backdrop keeps its own clock.
    if (input.open && (immediate || node.contains(node.ownerDocument.activeElement))) return;
    const parameters = input.cm.parameters(
      bindMotionParameters(presenceSurface, spatial ? "enter.pop/surface" : "enter.pop/opacity"),
    );
    const spatialOpen =
      input.open && !immediate && !input.cm.reduced && css.transform === "none" && css.scale === "none";
    const revision = transaction.revision("presence", input.open, node);
    const generation = ++epoch;
    lease = owner.begin(revision, spatialOpen ? ["opacity", "transform"] : ["opacity"], {}, () => {
      for (const handle of handles) handle.cancel();
      handles = [];
    });
    if (!lease?.current()) return;
    const owned = lease;
    const opacity = input.open ? Number.parseFloat(css.opacity) : 0;
    const start = fromOpacity ?? (input.open ? 0 : Number.parseFloat(css.opacity) || 1);
    handles = [
      node.animate([{ opacity: start }, { opacity }], {
        duration: motionMilliseconds(Number(clock.duration)),
        delay: motionMilliseconds(Number(clock.delay ?? 0)),
        easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`,
        fill: "both",
      }),
    ];
    if (spatialOpen && parameters.kind === "visual")
      handles.push(
        node.animate([{ transform: `scale(${parameters.scale})` }, { transform: "none" }], {
          duration: motionMilliseconds(Number(parameters.spatial.duration)),
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
      const from = handles.length
        ? Number.parseFloat(node.ownerDocument.defaultView?.getComputedStyle(node).opacity ?? "1")
        : undefined;
      cancel();
      play(from);
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
