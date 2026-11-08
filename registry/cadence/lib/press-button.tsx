"use client";

import { type MotionProps, motion } from "motion/react";
import { type ComponentProps, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useControlAnimation } from "./control-animation";
import type { CadenceMode } from "./motion";

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
  contentOnly = false,
  decoration,
  "data-motion": mode,
  ...props
}: ComponentProps<"button"> &
  Pick<MotionProps, "whileTap" | "transition"> & {
    /** Keep the button out of a stacking context so shared decorations can pass under siblings. */
    contentOnly?: boolean;
    decoration?: ReactNode;
    "data-motion"?: string;
  }) {
  const [pressed, setPressed] = useState(false);
  const owner = useRef<number | "Enter" | null>(null);
  const release = useCallback(() => {
    owner.current = null;
    setPressed(false);
  }, []);
  const disabled = props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const enabled = !disabled && !!whileTap;
  useCommittedEffect(() => {
    if (!pressed) return;
    const releasePointer = (event: PointerEvent) => {
      // Keyboard-generated pointercancel from another control is not this press.
      if (event.isTrusted && event.pointerId === owner.current) release();
    };
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    return () => {
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
    };
  }, [pressed, release]);
  useCommittedEffect(() => {
    // Native disabled can swallow pointerup. Cancel this visual gesture rather
    // than reviving it when the same button is enabled again.
    if (!enabled) release();
  }, [enabled, release]);
  const pressScale = typeof whileTap === "object" && "scale" in whileTap ? whileTap.scale : 1;
  const controls = useControlAnimation(
    { scale: pressed && !disabled && typeof pressScale === "number" ? pressScale : 1 },
    disabled || !whileTap ? { duration: 0 } : transition,
    mode as CadenceMode,
  );
  return (
    <MotionNativeButton
      {...props}
      data-motion={mode}
      initial={false}
      animate={contentOnly ? undefined : controls}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        if (enabled && event.button === 0 && event.isPrimary && owner.current === null) {
          owner.current = event.pointerId;
          setPressed(true);
        }
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event);
        if (event.pointerId === owner.current) release();
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event);
        if (event.pointerId === owner.current) release();
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (enabled && event.key === "Enter" && event.target === event.currentTarget && owner.current === null) {
          owner.current = "Enter";
          setPressed(true);
        }
      }}
      onKeyUp={(event) => {
        props.onKeyUp?.(event);
        if (event.key === "Enter" && owner.current === "Enter") release();
      }}
      onBlur={(event) => {
        props.onBlur?.(event);
        release();
      }}
      nativeRef={ref}
      nativeEvents={{ onAnimationStart, onDrag, onDragStart, onDragEnd }}
    >
      {decoration}
      {contentOnly ? (
        <motion.span
          data-slot="press-button-content"
          data-motion={mode}
          className="relative z-10 inline-flex items-center justify-center gap-[inherit]"
          initial={false}
          animate={controls}
        >
          {props.children}
        </motion.span>
      ) : (
        props.children
      )}
    </MotionNativeButton>
  );
}
