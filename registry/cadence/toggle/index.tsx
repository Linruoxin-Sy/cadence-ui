"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-pressed:bg-accent data-pressed:text-accent-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ToggleProps extends TogglePrimitive.Props, VariantProps<typeof toggleVariants> {}

/**
 * A two-state button: press it to turn a formatting option on, press again to
 * turn it off. The pressed background is the state; the press scale is the
 * feedback that the pointer landed.
 *
 * Recipe: `feedback.press` — the button compresses while active and springs back.
 *
 * Motion contract:
 * - full: scale 1 → 0.97 while active, released on pointer up
 * - reduced: no scale, the pressed background is the only change
 * - none: no scale, same as reduced
 *
 * a11y: Base UI renders a real `<button>` with `aria-pressed`, so Space and
 * Enter toggle it. The pressed state is never carried by colour alone — the
 * attribute and the background change together.
 */
function Toggle({ className, variant = "default", size = "default", ...props }: ToggleProps) {
  const cm = useCadenceMotion();

  return (
    <TogglePrimitive
      data-slot="toggle"
      data-motion={cm.mode}
      className={cn(toggleVariants({ variant, size }), className)}
      render={
        <motion.button
          whileTap={cm.reduced ? undefined : { scale: scale.press }}
          transition={cm.transition("feedback.press")}
        />
      }
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
