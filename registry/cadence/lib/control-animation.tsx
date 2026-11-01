"use client";

import { type HTMLMotionProps, motion, type Transition, useAnimationControls } from "motion/react";
import { useEffect, useEffectEvent, useLayoutEffect } from "react";

const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Target = Record<string, number>;

function useControlAnimation(target: Target, transition: Transition) {
  const controls = useAnimationControls();
  const signature = JSON.stringify([target, transition]);
  const update = useEffectEvent(() => {
    controls.stop();
    if (transition.duration === 0) controls.set(target);
    else void controls.start(target, transition);
  });
  // Value signatures retarget on clock changes; the event reads the latest inputs.
  useCommittedEffect(() => {
    update();
    return () => controls.stop();
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
