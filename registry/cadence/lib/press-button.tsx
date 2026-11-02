"use client";

import { type MotionProps, motion } from "motion/react";
import { type ComponentProps, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useControlAnimation } from "./control-animation";

type NativeEvents = Pick<ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd">;

// Motion reserves these names. Keep native handlers outside its prop namespace,
// then restore them on the same button after Motion has resolved style and refs.
const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useNativeMotionRef<T extends HTMLElement>(
  ref: import("react").Ref<T> | undefined,
  nativeRef: import("react").Ref<T> | undefined,
) {
  const node = useRef<T | null>(null);
  const motionRef = useCallback(
    (instance: T | null) => {
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
  return motionRef;
}

function NativeButton({
  nativeEvents,
  nativeRef,
  ref,
  ...props
}: ComponentProps<"button"> & {
  nativeEvents: NativeEvents;
  nativeRef: ComponentProps<"button">["ref"];
}) {
  const motionRef = useNativeMotionRef(ref, nativeRef);
  return <button {...props} {...nativeEvents} ref={motionRef} />;
}
const MotionNativeButton = motion.create(NativeButton);

export function PressButton({
  ref,
  onAnimationStart,
  onDrag,
  onDragStart,
  onDragEnd,
  whileTap,
  transition = {},
  ...props
}: ComponentProps<"button"> & Pick<MotionProps, "whileTap" | "transition">) {
  const [pressed, setPressed] = useState(false);
  const disabled = props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const enabled = !disabled && !!whileTap;
  useCommittedEffect(() => {
    // Native disabled can swallow pointerup. Cancel this visual gesture rather
    // than reviving it when the same button is enabled again.
    if (!enabled) setPressed(false);
  }, [enabled]);
  const pressScale = typeof whileTap === "object" && "scale" in whileTap ? whileTap.scale : 1;
  const controls = useControlAnimation(
    { scale: pressed && !disabled && typeof pressScale === "number" ? pressScale : 1 },
    disabled || !whileTap ? { duration: 0 } : transition,
  );
  return (
    <MotionNativeButton
      {...props}
      initial={false}
      animate={controls}
      onTapStart={() => {
        if (enabled) setPressed(true);
      }}
      onTap={() => setPressed(false)}
      onTapCancel={() => setPressed(false)}
      nativeRef={ref}
      nativeEvents={{ onAnimationStart, onDrag, onDragStart, onDragEnd }}
    />
  );
}
