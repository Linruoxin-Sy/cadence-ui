"use client";

import { bindMotionParameters, motionMilliseconds, presenceInline } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type InlinePresenceCommit = {
  present: boolean;
  enter: boolean;
  cm: CadenceMotion;
};

/** Entrance opacity only, on the original group host. Never writes a resting opacity. */
export function createInlineEntrance(node: HTMLElement) {
  const transaction = createMotionTransaction();
  const owner = transaction.register(node);
  let current: InlinePresenceCommit | null = null;
  let lease: MotionLease | null = null;
  let animation: Animation | null = null;
  let alive = true;
  let blocked = false;
  let generation = 0;
  let signature = "";
  const cancel = () => {
    generation++;
    animation?.cancel();
    animation = null;
    lease?.cancel();
    lease = null;
  };
  const settle = () => {
    cancel();
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
    if (!input.present) {
      settle();
      return;
    }
    const parameters = input.cm.parameters(bindMotionParameters(presenceInline, "data.transition/opacity"));
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
    handle = node.animate([{ opacity: from ?? 0 }, { opacity: css.opacity }], {
      duration: motionMilliseconds(immediate ? 0 : Number(clock.duration)),
      delay: motionMilliseconds(immediate ? 0 : Number(clock.delay ?? 0)),
      easing: `cubic-bezier(${input.cm.scope.tokens.ease.out.join(",")})`,
      fill: "both",
    });
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
        settle();
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
      settle();
    }
  });
  return {
    commit(input: InlinePresenceCommit) {
      const previous = current;
      current = input;
      // Resolve the exact entrance clock on every committed policy, including native baselines.
      const parameters = input.cm.parameters(bindMotionParameters(presenceInline, "data.transition/opacity"));
      const clock = JSON.stringify(parameters);
      const retime = signature !== clock;
      signature = clock;
      const change = previous ? previous.present !== input.present : input.enter || !input.present;
      if (change) {
        const from = animation ? node.ownerDocument.defaultView?.getComputedStyle(node).opacity : undefined;
        cancel();
        play(from);
      } else if (input.cm.disabled || input.cm.timeScale === 0) {
        settle();
      } else if (retime && animation) {
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
