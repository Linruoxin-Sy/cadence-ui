"use client";

import { type MotionProps, motion } from "motion/react";
import { type ComponentProps, useCallback, useEffect, useLayoutEffect, useRef } from "react";

type NativeEvents = Pick<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd">;

// Motion reserves these names. Keep native handlers outside its prop namespace,
// then restore them on the same button after Motion has resolved style and refs.
const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function NativeButton({
  nativeEvents,
  nativeRef,
  ref,
  ...props
}: ComponentProps<"button"> & {
  nativeEvents: NativeEvents;
  nativeRef: ComponentProps<"button">["ref"];
}) {
  const node = useRef<HTMLButtonElement | null>(null);
  const motionRef = useCallback(
    (instance: HTMLButtonElement | null) => {
      node.current = instance;
      if (typeof ref === "function") return ref(instance);
      if (ref) ref.current = instance;
    },
    [ref],
  );
  // Motion 13 keeps its ref callback stable across external-ref replacement.
  // Commit the Base/caller ref separately, including React 19 cleanup ownership.
  useCommittedEffect(() => {
    const instance = node.current;
    if (!nativeRef || !instance) return;
    if (typeof nativeRef === "function") {
      const cleanup = nativeRef(instance);
      return () => {
        if (typeof cleanup === "function") cleanup();
        else nativeRef(null);
      };
    }
    nativeRef.current = instance;
    return () => {
      nativeRef.current = null;
    };
  }, [nativeRef]);
  return <button {...props} {...nativeEvents} ref={motionRef} />;
}
const MotionNativeButton = motion.create(NativeButton);

export function PressButton({
  ref,
  onAnimationStart,
  onDrag,
  onDragStart,
  onDragEnd,
  ...props
}: ComponentProps<"button"> & Pick<MotionProps, "whileTap" | "transition">) {
  return (
    <MotionNativeButton
      {...props}
      nativeRef={ref}
      nativeEvents={{ onAnimationStart, onDrag, onDragStart, onDragEnd }}
    />
  );
}
