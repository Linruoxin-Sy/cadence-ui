"use client";

import { bindMotionParameters, motionMilliseconds, presenceExit, presenceSurface } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type SurfacePresenceCommit = {
  present: boolean;
  enter: boolean;
  cm: CadenceMotion;
  complete?: () => void;
};

/** Opacity only, on the original retained host. Never writes a resting opacity. */
export function createSurfacePresence(node: HTMLElement) {
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let current: SurfacePresenceCommit | null = null;
  let lease: MotionLease | null = null;
  let animation: Animation | null = null;
  let alive = true;
  let blocked = false;
  let generation = 0;
  const cancel = () => {
    generation++;
    animation?.cancel();
    animation = null;
    lease?.cancel();
    lease = null;
  };
  const settle = () => {
    cancel();
    if (alive && current?.present === false) current.complete?.();
  };
  const callerOpacity = (css = node.ownerDocument.defaultView?.getComputedStyle(node)) => {
    if (!css) return false;
    const family = css.transitionProperty.split(",").map((property) => property.trim());
    const times = css.transitionDuration.split(",").map((time) => Number.parseFloat(time));
    return (
      family.some(
        (property, index) => ["all", "opacity"].includes(property) && (times[index % times.length] ?? 0) > 0,
      ) ||
      (node.getAnimations?.() ?? []).some(
        (handle) =>
          handle !== animation &&
          (handle.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "opacity" in frame),
      )
    );
  };
  const play = (from?: string, forceImmediate = false) => {
    const input = current;
    if (!alive || !input) return;
    const parameters = input.cm.parameters(
      input.present
        ? bindMotionParameters(presenceSurface, "enter.pop/opacity")
        : bindMotionParameters(presenceExit, "exit.fade/opacity"),
    );
    if (parameters.kind !== "visual") return;
    const clock = parameters.opacity;
    const immediate = forceImmediate || blocked || clock.duration === 0;
    if (
      (immediate && input.present) ||
      !node.isConnected ||
      typeof node.animate !== "function" ||
      (input.present && node.contains(node.ownerDocument.activeElement))
    ) {
      settle();
      return;
    }
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (!css || css.display === "none" || css.visibility === "hidden") {
      settle();
      return;
    }
    if (callerOpacity(css)) {
      settle();
      return;
    }
    const epoch = ++generation;
    const revision = transaction.revision("presence", input.present, node);
    let handle: Animation | null = null;
    lease = owner.begin(revision, ["opacity"], {}, () => handle?.cancel());
    if (!lease?.current()) return;
    const owned = lease;
    handle = node.animate(
      [{ opacity: from ?? (input.present ? 0 : css.opacity) }, { opacity: input.present ? css.opacity : 0 }],
      {
        duration: motionMilliseconds(immediate ? 0 : Number(clock.duration)),
        delay: motionMilliseconds(immediate ? 0 : Number(clock.delay ?? 0)),
        easing: `cubic-bezier(${input.cm.scope.tokens.ease[input.present ? "out" : "in"].join(",")})`,
        fill: "both",
      },
    );
    animation = handle;
    void handle.finished.then(
      () => {
        if (
          !alive ||
          !node.isConnected ||
          epoch !== generation ||
          !owned.current() ||
          current?.present !== input.present
        )
          return;
        // An independently retained descendant may still be exiting. Keep this
        // finished zero-opacity envelope until unmount/re-entry, rather than
        // exposing the root again while the parent waits for that descendant.
        if (input.present) settle();
        else input.complete?.();
      },
      () => {},
    );
    if (immediate) handle.finish();
  };
  const interact = () => {
    if (current?.present) settle();
  };
  for (const event of ["focusin", "pointerdown", "keydown", "click", "beforematch"])
    node.addEventListener(event, interact, true);
  const opacityStyle = () => {
    const style = node.style;
    return JSON.stringify([
      style.opacity,
      style.animation,
      /(?:^|,)\s*(?:all|opacity)\s*(?:,|$)/.test(style.transitionProperty) ? style.transition : "",
      Array.from(style)
        .filter((name) => name.startsWith("--") && !/^--(?:cadence-|motion-|ease-cadence)/.test(name))
        .map((name) => [name, style.getPropertyValue(name)]),
    ]);
  };
  let callerStyle = opacityStyle();
  const observer = new MutationObserver((records) => {
    const next = opacityStyle();
    // Scoped colour clocks and inherited Cadence tokens are another owned
    // family. Only potentially conflicting caller paint revokes this channel.
    if (
      (next !== callerStyle || records.some((record) => record.attributeName !== "style")) &&
      (current?.present || callerOpacity())
    )
      settle();
    callerStyle = next;
  });
  observer.observe(node, { attributes: true, attributeFilter: ["class", "style", "disabled", "aria-disabled"] });
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && animation && current?.cm.mode === "full")) {
      if (current?.present === false) {
        cancel();
        play(undefined, true);
      } else settle();
    }
  });
  return {
    settleEntrance: interact,
    commit(input: SurfacePresenceCommit) {
      const previous = current;
      current = input;
      // Resolve both clocks on every committed policy, including static baselines.
      input.cm.parameters(bindMotionParameters(presenceSurface, "enter.pop/opacity"));
      input.cm.parameters(bindMotionParameters(presenceExit, "exit.fade/opacity"));
      const change = previous ? previous.present !== input.present : input.enter || !input.present;
      if (change) {
        const from = animation ? node.ownerDocument.defaultView?.getComputedStyle(node).opacity : undefined;
        cancel();
        play(from);
      } else if (input.cm.disabled || input.cm.timeScale === 0) {
        if (input.present) settle();
        else if (animation?.effect?.getTiming().duration !== 0) {
          cancel();
          play();
        }
      } else if (previous?.cm.mode === "full" && input.cm.reduced && animation) {
        const from = node.ownerDocument.defaultView?.getComputedStyle(node).opacity;
        cancel();
        play(from);
      }
    },
    dispose() {
      alive = false;
      cancel();
      owner.dispose();
      observer.disconnect();
      unsubscribe();
      for (const event of ["focusin", "pointerdown", "keydown", "click", "beforematch"])
        node.removeEventListener(event, interact, true);
    },
  };
}
