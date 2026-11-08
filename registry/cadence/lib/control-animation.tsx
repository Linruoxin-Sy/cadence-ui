"use client";

import { cancelFrame, frame, type HTMLMotionProps, motion, type Transition, useAnimationControls } from "motion/react";
import { type ComponentProps, useEffect, useLayoutEffect, useRef } from "react";

import type { CadenceMode } from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import { NativeMotionDiv } from "./native-div";

type Target = Record<string, number | string>;
const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useControlAnimation(
  target: Target,
  transition: Transition,
  mode?: CadenceMode,
  onEnvironmentSettle?: () => void,
) {
  const controls = useAnimationControls();
  const current = useRef<{ target: string; mode?: CadenceMode; instant: boolean; active: boolean } | null>(null);
  const generation = useRef(0);
  const queued = useRef<(() => void) | null>(null);
  const latest = useRef(target);
  const environment = useRef<MotionEnvironment | null>(null);
  const environmentSettle = useRef(onEnvironmentSettle);
  const signature = JSON.stringify([target, transition, mode]);
  // A lifecycle owner may consume a cancelled visual internally. Never replay
  // the element's user animation-completion callback to do that bookkeeping.
  useCommittedEffect(() => {
    environmentSettle.current = onEnvironmentSettle;
  }, [onEnvironmentSettle]);
  // The signature tracks values rather than object identity. This effect's closure
  // belongs to the committed render; unrelated renders never restart the recipe.
  // signature includes every target and transition value.
  useCommittedEffect(() => {
    latest.current = target;
    const key = JSON.stringify(target);
    const instant = transition.duration === 0 || Boolean(environment.current?.hidden || environment.current?.immediate);
    const previous = current.current;
    current.current = { target: key, mode, instant, active: previous?.active ?? false };
    // Finite tweens and duration-defined springs capture their action clock.
    // Physics owners explicitly retime; restrictions always cancel, even when
    // the target is unchanged. Restoring full does not replay a settled action.
    if (
      previous?.target === key &&
      !instant &&
      !previous.instant &&
      previous.mode === mode &&
      (!transition.stiffness || !previous.active)
    )
      return;
    if (queued.current) cancelFrame(queued.current);
    const epoch = ++generation.current;
    controls.stop();
    current.current.active = false;
    const settle = () => controls.set(target);
    queued.current = settle;
    if (
      instant ||
      (previous?.target === key &&
        (previous.instant || !previous.active || (previous.mode !== mode && mode === "full")))
    ) {
      settle();
      // Motion queues same-target writes in its update phase. Reassert this
      // committed zero-clock target after older queued writes, before paint.
      frame.update(settle);
    } else {
      current.current.active = true;
      const timing = previous?.target === key && transition.stiffness ? { ...transition, delay: 0 } : transition;
      void controls.start(target, timing).then(() => {
        if (generation.current === epoch && current.current) current.current.active = false;
      });
    }
  }, [signature, controls]);
  useCommittedEffect(
    () =>
      subscribeMotionEnvironment(document, (next) => {
        environment.current = next;
        if (!next.hidden && !next.immediate) return;
        const wasActive = current.current?.active;
        if (queued.current) cancelFrame(queued.current);
        generation.current++;
        if (current.current) {
          current.current.active = false;
          current.current.instant = true;
        }
        controls.stop();
        const settle = () => controls.set(latest.current);
        queued.current = settle;
        settle();
        frame.update(settle);
        if (wasActive) environmentSettle.current?.();
      }),
    [controls],
  );
  useCommittedEffect(
    () => () => {
      if (queued.current) cancelFrame(queued.current);
      generation.current++;
      current.current = null;
      controls.stop();
    },
    [controls],
  );
  return controls;
}

type ControlSpanProps = Omit<HTMLMotionProps<"span">, "animate" | "initial" | "transition"> & {
  "data-motion"?: CadenceMode;
  target: Target;
  transition: Transition;
};
type ControlDivProps = Omit<HTMLMotionProps<"div">, "animate" | "initial" | "transition"> & {
  "data-motion"?: CadenceMode;
  target: Target;
  transition: Transition;
};

export function ControlSpan({ target, transition, ...props }: ControlSpanProps) {
  const controls = useControlAnimation(target, transition, props["data-motion"] as CadenceMode);
  return <motion.span {...props} initial={target} animate={controls} />;
}
export function ControlDiv({ target, transition, ...props }: ControlDivProps) {
  const controls = useControlAnimation(target, transition, props["data-motion"] as CadenceMode);
  return <motion.div {...props} initial={target} animate={controls} />;
}

export function NativeControlDiv({
  target,
  transition,
  ...props
}: Omit<ComponentProps<typeof NativeMotionDiv>, "animate" | "initial" | "transition"> & {
  target: Target;
  transition: Transition;
}) {
  const controls = useControlAnimation(target, transition, (props as { "data-motion"?: CadenceMode })["data-motion"]);
  return <NativeMotionDiv {...props} initial={target} animate={controls} />;
}
