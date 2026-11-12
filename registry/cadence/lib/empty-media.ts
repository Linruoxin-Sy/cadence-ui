"use client";

import { bindMotionParameters, dataUpdate, motionMilliseconds } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { nativeTextContext } from "./text-layout";

export type EmptyMediaCommit = {
  present: boolean;
  key: number;
  reduced: boolean;
  cm: CadenceMotion;
};

/** Local replacement opacity on the current artwork host. Never clones, delays media readiness, or re-enters the surrounding copy/actions. */
export function createEmptyMedia(node: HTMLElement, parent?: ReturnType<typeof createMotionTransaction>) {
  const transaction = parent ?? createMotionTransaction();
  const owner = transaction.register(node);
  let current: EmptyMediaCommit | null = null;
  let lease: MotionLease | null = null;
  let animation: Animation | null = null;
  let alive = true;
  let blocked = false;
  let generation = 0;
  let signature = "";
  let audit: number | null = null;
  const cancel = () => {
    generation++;
    if (audit !== null) node.ownerDocument.defaultView?.cancelAnimationFrame(audit);
    audit = null;
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
    const parameters = input.cm.parameters(bindMotionParameters(dataUpdate, "data.transition/opacity"));
    if (parameters.kind !== "visual") return;
    const clock = parameters.opacity;
    const immediate = forceImmediate || blocked || clock.duration === 0;
    if (
      nativeTextContext(node) ||
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
    const revision = transaction.revision("state", input.key, node);
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
    const inspect = () => {
      audit = null;
      if (!alive || epoch !== generation) return;
      if (!owned.current() || !node.isConnected || nativeTextContext(node) || callerOpacity()) settle();
      else audit = node.ownerDocument.defaultView?.requestAnimationFrame(inspect) ?? null;
    };
    audit = node.ownerDocument.defaultView?.requestAnimationFrame(inspect) ?? null;
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
  const classSignature = () =>
    node.className
      .split(/\s+/)
      .filter(
        (name) =>
          !["size-10", "rounded-lg", "[&_svg:not([class*='size-'])]:size-6"].includes(name) &&
          !/^(?:[\w-]+:)*(?:bg-(?:card|background|muted|transparent)|text-(?:foreground|card-foreground|muted-foreground|destructive))$/.test(
            name,
          ),
      )
      .sort()
      .join(" ");
  let callerClass = classSignature();
  const observer = new MutationObserver((records) => {
    const next = opacityStyle();
    const nextClass = classSignature();
    // Scoped colour clocks and inherited Cadence tokens are another owned
    // family. Only potentially conflicting caller paint revokes this channel.
    if (
      (next !== callerStyle ||
        nextClass !== callerClass ||
        records.some((record) => !["style", "class"].includes(record.attributeName ?? ""))) &&
      (current?.present || callerOpacity())
    )
      settle();
    callerStyle = next;
    callerClass = nextClass;
  });
  observer.observe(node, { attributes: true, attributeFilter: ["class", "style", "disabled", "aria-disabled"] });
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    blocked = environment.hidden || environment.immediate;
    if (blocked || (environment.reduced && animation && current?.cm.mode === "full")) {
      settle();
    }
  });
  return {
    commit(input: EmptyMediaCommit) {
      const previous = current;
      current = input;
      // Resolve the exact entrance clock on every committed policy, including native baselines.
      const parameters = input.cm.parameters(bindMotionParameters(dataUpdate, "data.transition/opacity"));
      const clock = JSON.stringify(parameters);
      const retime = signature !== clock;
      signature = clock;
      const change = previous !== null && JSON.stringify(previous.key) !== JSON.stringify(input.key);
      if (change) {
        const from = animation ? node.ownerDocument.defaultView?.getComputedStyle(node).opacity : undefined;
        cancel();
        play(from);
      } else if (!input.present || nativeTextContext(node) || input.cm.disabled || input.cm.timeScale === 0) {
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
