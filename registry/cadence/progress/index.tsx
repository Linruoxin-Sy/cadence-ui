"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

/**
 * The completion fraction (0–1) of the nearest `Progress`, or `null` when the
 * progress is indeterminate. Shared through context so a composed
 * `ProgressTrack` / `ProgressIndicator` animates without re-reading the root.
 */
const ProgressContext = createContext<number | null>(null);

export interface ProgressProps extends ProgressPrimitive.Root.Props {}

export interface ProgressTrackProps extends ProgressPrimitive.Track.Props {}

export interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props {}

export interface ProgressLabelProps extends ProgressPrimitive.Label.Props {}

export interface ProgressValueProps extends ProgressPrimitive.Value.Props {}

/**
 * How far a task has come. Pass `value={null}` for work that has no measurable
 * end yet.
 *
 * Recipe: `data.transition` (one-shot form) — the fill grows to its new value
 * instead of jumping, and the indeterminate state falls back to the continuous
 * form: an opacity pulse, never a sweep.
 *
 * Motion contract:
 * - full: the fill scales to the new value over `duration.base`
 * - reduced: the fill jumps to the new value; the indeterminate pulse stays
 *   (opacity only, and it is the only thing that says "still working")
 * - none: no transition, no pulse
 *
 * The fill is a `scaleX` transform, not a width: a width transition would
 * relayout the track on every frame, and the track is usually inside a list.
 *
 * a11y: Base UI puts `role="progressbar"`, `aria-valuemin/max/now` on the root
 * and exposes `ProgressLabel` / `ProgressValue` so the number is readable
 * without looking at the bar. The fill is decorative.
 */
function Progress({ className, children, value, min = 0, max = 100, ...props }: ProgressProps) {
  const cm = useCadenceMotion();
  const fraction =
    value === null || value === undefined ? null : Math.min(1, Math.max(0, (value - min) / (max - min || 1)));

  return (
    <ProgressContext.Provider value={fraction}>
      <ProgressPrimitive.Root
        data-slot="progress"
        data-motion={cm.mode}
        value={value}
        min={min}
        max={max}
        className={cn("flex w-full flex-wrap gap-3", className)}
        {...props}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </ProgressPrimitive.Root>
    </ProgressContext.Provider>
  );
}

function ProgressTrack({ className, ...props }: ProgressTrackProps) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn("relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-primary/20", className)}
      {...props}
    />
  );
}

function ProgressIndicator({ className, style, ...props }: ProgressIndicatorProps) {
  const cm = useCadenceMotion();
  const fraction = useContext(ProgressContext);
  const indeterminate = fraction === null;
  const pulse = indeterminate ? (cm.mode === "none" ? "animate-none" : "animate-pulse") : undefined;

  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      data-motion={cm.mode}
      // Base UI writes `width: <value>%`; the fill is driven by a transform instead,
      // so the element keeps the full track width and only its scale changes.
      style={{ width: "100%", ...style }}
      className={className}
      render={(indicatorProps) => {
        const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLDivElement>;

        return (
          <motion.div
            {...(rest as HTMLMotionProps<"div">)}
            className={cn("h-full w-full origin-left bg-primary", pulse, indicatorClassName)}
            initial={false}
            animate={{ scaleX: fraction ?? 1 }}
            transition={cm.reduced ? { duration: 0 } : cm.transition("data.transition")}
          />
        );
      }}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressLabelProps) {
  return (
    <ProgressPrimitive.Label data-slot="progress-label" className={cn("text-sm font-medium", className)} {...props} />
  );
}

function ProgressValue({ className, ...props }: ProgressValueProps) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn("text-sm text-muted-foreground tabular-nums", className)}
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
