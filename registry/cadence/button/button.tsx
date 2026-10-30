"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

/**
 * Press feedback is the only motion here: the control compresses to 0.97 while
 * active, then springs back on release. Under reduced motion the scale is
 * dropped and only the colour transition remains.
 *
 * The scale is not in the `transition-[…]` list on purpose: Motion owns the
 * transform, and a CSS transition on the same property would double-write it.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow] ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

/**
 * Button with the shadcn API: six variants, eight sizes, and Base UI's `render`
 * for composition.
 *
 * Motion contract:
 * - press: scale 1 → 0.97 on `spring.press`, released on pointer up
 * - reduced / none: no scale, colour transition only
 *
 * a11y: Base UI owns the disabled/focusable semantics; `aria-invalid` drives the
 * destructive ring. The component never validates anything itself.
 */
export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  const cm = useCadenceMotion();

  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-motion={cm.mode}
      className={cn(buttonVariants({ variant, size }), className)}
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

export { buttonVariants };
