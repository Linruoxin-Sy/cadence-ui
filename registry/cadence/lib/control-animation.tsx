"use client";

import { cancelFrame, frame, type HTMLMotionProps, motion, type Transition, useAnimationControls } from "motion/react";
import { type ComponentProps, useEffect, useLayoutEffect } from "react";

import { NativeMotionDiv } from "./native-div";

type Target = Record<string, number | string>;
const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useControlAnimation(target: Target, transition: Transition) {
  const controls = useAnimationControls();
  const signature = JSON.stringify([target, transition]);
  // The signature tracks values rather than object identity. This effect's closure
  // belongs to the committed render; unrelated renders never restart the recipe.
  // signature includes every target and transition value.
  useCommittedEffect(() => {
    controls.stop();
    const settle = () => controls.set(target);
    if (transition.duration === 0) {
      settle();
      // Motion queues same-target writes in its update phase. Reassert this
      // committed zero-clock target after older queued writes, before paint.
      frame.update(settle);
    } else void controls.start(target, transition);
    return () => {
      cancelFrame(settle);
      controls.stop();
    };
  }, [signature, controls]);
  return controls;
}

type ControlSpanProps = Omit<HTMLMotionProps<"span">, "animate" | "initial" | "transition"> & {
  target: Target;
  transition: Transition;
};
type ControlDivProps = Omit<HTMLMotionProps<"div">, "animate" | "initial" | "transition"> & {
  target: Target;
  transition: Transition;
};

export function ControlSpan({ target, transition, ...props }: ControlSpanProps) {
  const controls = useControlAnimation(target, transition);
  return <motion.span {...props} initial={target} animate={controls} />;
}
export function ControlDiv({ target, transition, ...props }: ControlDivProps) {
  const controls = useControlAnimation(target, transition);
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
  const controls = useControlAnimation(target, transition);
  return <NativeMotionDiv {...props} initial={target} animate={controls} />;
}
