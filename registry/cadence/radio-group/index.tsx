"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export interface RadioGroupProps extends RadioGroupPrimitive.Props {}

export interface RadioGroupItemProps extends RadioPrimitive.Root.Props<unknown> {}

/**
 * A set of options where exactly one can be selected.
 *
 * Motion contract (`state.morph`): the dot of the newly selected item fades and
 * settles from 0.96 to full size; the previously selected dot reverses. Nothing
 * else in the group moves, so the eye follows the choice rather than the row.
 *
 * - full: opacity 0 → 1, scale 0.96 → 1 on the selected dot
 * - reduced: opacity only
 * - none: both states render instantly
 *
 * a11y: Base UI wires `role="radiogroup"` with roving tabindex, so arrow keys
 * move the selection and Space selects. Group and item both accept
 * `aria-invalid`, which styles the ring; validation itself is the caller's job
 * (P11).
 */
function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("grid gap-3", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  const cm = useCadenceMotion();

  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-motion={cm.mode}
      className={cn(
        "group/radio-group-item peer relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs outline-none transition-[color,box-shadow]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;

          return (
            <motion.span
              {...(rest as HTMLMotionProps<"span">)}
              className={cn("flex size-full items-center justify-center", indicatorClassName)}
              initial={false}
              animate={state.checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
              transition={cm.transition("state.morph")}
            >
              <span className="size-2 rounded-full bg-primary" />
            </motion.span>
          );
        }}
      />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
