"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import type { ComponentProps } from "react";
import { useNativeMotionRef } from "./press-button";

type NativeEvents = Pick<ComponentProps<"div">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd">;

function NativeDiv({
  nativeEvents,
  nativeRef,
  ref,
  ...props
}: ComponentProps<"div"> & {
  nativeEvents: NativeEvents;
  nativeRef: ComponentProps<"div">["ref"];
}) {
  const motionRef = useNativeMotionRef(ref, nativeRef);
  return <div {...props} {...nativeEvents} ref={motionRef} />;
}
const MotionNativeDiv = motion.create(NativeDiv);

type NativeKeys = "ref" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd";
type NativeMotionDivProps = Omit<HTMLMotionProps<"div">, NativeKeys> & Pick<ComponentProps<"div">, NativeKeys>;

export function NativeMotionDiv({
  ref,
  onAnimationStart,
  onDrag,
  onDragStart,
  onDragEnd,
  ...props
}: NativeMotionDivProps) {
  return (
    <MotionNativeDiv {...props} nativeRef={ref} nativeEvents={{ onAnimationStart, onDrag, onDragStart, onDragEnd }} />
  );
}
