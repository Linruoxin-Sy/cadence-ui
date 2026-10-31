"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export interface CheckboxProps extends CheckboxPrimitive.Root.Props {}

/**
 * A single on/off choice, or one row of a set. The tick is the only thing that
 * moves: it fades and settles from 0.96 to full size when the box is checked,
 * and reverses when it is cleared. There is deliberately no press animation —
 * the state change is the event, and a 16px box is too small for a second
 * protagonist.
 *
 * Recipe: `state.morph` — the control's own indicator morphs between the
 * checked and the unchecked state.
 *
 * Motion contract:
 * - full: opacity 0 → 1 and scale 0.96 → 1 when checked, reversed when cleared
 * - reduced: opacity only, the tick appears at full size
 * - none: no transition, both states render instantly
 *
 * a11y: Base UI renders `role="checkbox"` plus a hidden input, so Space toggles
 * it and a form still submits the value. Invalid state is attribute-driven
 * (`aria-invalid`); this component never validates (P11).
 */
function Checkbox({ className, ...props }: CheckboxProps) {
  const cm = useCadenceMotion();

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-motion={cm.mode}
      className={cn(
        "peer relative size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;

          return (
            <motion.span
              {...(rest as HTMLMotionProps<"span">)}
              className={cn("grid size-full place-content-center text-current", indicatorClassName)}
              initial={false}
              animate={state.checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
              transition={cm.transition("state.morph")}
            >
              <Check className="size-3.5" />
            </motion.span>
          );
        }}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
