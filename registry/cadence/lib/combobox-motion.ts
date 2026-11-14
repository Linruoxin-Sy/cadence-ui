"use client";

import { bindMotionParameters, motionMilliseconds, presenceExit, presencePopup } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type ComboboxPopupCommit = {
  open: boolean;
  enter: boolean;
  cm: CadenceMotion;
};

/**
 * Parameter-backed popup paint for the combobox surface.
 *
 * Base UI still owns open/close, the portal, focus restoration, dismissal and
 * positioning; this adapter only writes the anchored entrance and the short
 * exit on the popup node it is given. One native writer owns `opacity` (and
 * `transform` when the resolved entrance includes the anchored scale), so no
 * caller CSS family can be animated twice. Unknown caller paint keeps its own
 * authority and the semantic target is applied immediately.
 */
export function createComboboxPopup(node: HTMLElement) {
  const transaction = createMotionTransaction(),
    owner = transaction.register(node);
  let current: ComboboxPopupCommit | null = null;
  let handles: Animation[] = [],
    alive = true,
    epoch = 0,
    blocked = false;
  let lease: ReturnType<typeof owner.begin>;
  const cancel = () => {
    epoch++;
    for (const handle of handles) handle.cancel();
    handles = [];
    lease?.cancel();
  };
  const settleEntry = () => {
    if (current?.open) cancel();
  };
  for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
    node.addEventListener(type, settleEntry, true);
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && current?.cm.mode === "full")) cancel();
  });
  return {
    commit(input: ComboboxPopupCommit) {
      const previous = current;
      current = input;
      const enter = input.cm.parameters(bindMotionParameters(presencePopup, "popup.anchored/presence"));
      const exit = input.cm.parameters(bindMotionParameters(presenceExit, "popup.anchored/ending"));
      if (!alive || enter.kind !== "visual" || exit.kind !== "visual") return;
      const changed = previous ? previous.open !== input.open : input.enter;
      const downgrade = previous?.cm.mode === "full" && input.cm.reduced;
      if (!changed && !downgrade && !input.cm.disabled && input.cm.timeScale !== 0) return;
      const css = node.ownerDocument.defaultView?.getComputedStyle(node) ?? null;
      if (!css) return;
      const opacity = handles.length ? css.opacity : undefined;
      cancel();
      const clocks = input.open ? enter : exit;
      const immediate = blocked || input.cm.disabled || input.cm.timeScale === 0 || clocks.opacity.duration === 0;
      if (
        typeof node.animate !== "function" ||
        (input.open && (immediate || node.contains(node.ownerDocument.activeElement)))
      )
        return;
      if ((!changed && !downgrade && !immediate) || css.visibility === "hidden" || css.display === "none") return;
      // Caller opacity/transform families retain their native authority.
      if (
        node.style.opacity ||
        css.transitionProperty
          .split(",")
          .some(
            (property, index) =>
              ["all", "opacity", "transform", "scale", "translate"].includes(property.trim()) &&
              Number.parseFloat(
                css.transitionDuration.split(",")[index % css.transitionDuration.split(",").length] ?? "0",
              ) > 0,
          ) ||
        node
          .getAnimations()
          .some((animation) =>
            (animation.effect as KeyframeEffect | null)
              ?.getKeyframes()
              .some((frame) => "opacity" in frame || "transform" in frame),
          )
      )
        return;
      const spatial = !immediate && !input.cm.reduced && css.transform === "none" && css.scale === "none";
      const revision = transaction.revision("presence", input.open, node),
        generation = epoch;
      lease = owner.begin(revision, spatial ? ["opacity", "transform"] : ["opacity"], {}, () => {
        for (const handle of handles) handle.cancel();
        handles = [];
      });
      if (!lease?.current()) return;
      handles = [
        node.animate(
          [
            { opacity: immediate ? 0 : (opacity ?? (input.open ? 0 : css.opacity)) },
            { opacity: input.open ? css.opacity : 0 },
          ],
          {
            duration: motionMilliseconds(immediate ? 0 : Number(clocks.opacity.duration)),
            easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`,
            fill: "both",
          },
        ),
      ];
      if (spatial)
        handles.push(
          node.animate(
            input.open
              ? [{ transform: `scale(${enter.scale})` }, { transform: "none" }]
              : [{ transform: "none" }, { transform: `scale(${enter.scale})` }],
            {
              duration: motionMilliseconds(immediate ? 0 : Number(enter.spatial.duration)),
              easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.open ? "out" : "in"].join(",")})`,
              fill: "both",
            },
          ),
        );
      void Promise.allSettled(handles.map((handle) => handle.finished)).then(() => {
        if (alive && generation === epoch && input.open) cancel();
      });
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      unsubscribe();
      for (const type of ["focusin", "pointerdown", "click", "keydown", "beforematch"])
        node.removeEventListener(type, settleEntry, true);
    },
  };
}
