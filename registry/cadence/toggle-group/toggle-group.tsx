"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { type CSSProperties, createContext, useContext } from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";
import { toggleVariants } from "../toggle/toggle";

const ToggleGroupContext = createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
});

export interface ToggleGroupProps extends ToggleGroupPrimitive.Props, VariantProps<typeof toggleVariants> {
  /** Gap between items in Tailwind's spacing steps; `0` joins the borders. */
  spacing?: number;
  orientation?: "horizontal" | "vertical";
}

export interface ToggleGroupItemProps extends TogglePrimitive.Props, VariantProps<typeof toggleVariants> {}

/**
 * A row of toggles that share a single visual surface: with `spacing={0}` the
 * outline variant collapses into one segmented control.
 *
 * Recipe: `feedback.press`, inherited by every item — pressing an item
 * compresses it and springs back, exactly like a standalone `toggle`. The group
 * itself never animates: a shared sliding indicator would need the pressed item
 * to change size, and that would move the neighbours the user is aiming at.
 *
 * Motion contract:
 * - full: item scale 1 → 0.97 while active
 * - reduced / none: no scale; the pressed background carries the state
 *
 * a11y: Base UI renders `role="group"` with roving focus, so arrow keys move
 * between items and Space presses one. Pass `multiple` to allow more than one
 * pressed item.
 */
function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[calc(var(--spacing)*var(--gap))] rounded-md data-vertical:flex-col data-vertical:items-stretch",
        "data-[spacing=0]:data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({ className, children, variant, size, ...props }: ToggleGroupItemProps) {
  const cm = useCadenceMotion();
  const context = useContext(ToggleGroupContext);
  const resolvedVariant = context.variant ?? variant;
  const resolvedSize = context.size ?? size;

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      data-motion={cm.mode}
      className={cn(
        toggleVariants({ variant: resolvedVariant, size: resolvedSize }),
        "w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10",
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md",
        "data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        "data-vertical:data-[spacing=0]:data-[variant=outline]:border-t-0 data-vertical:data-[spacing=0]:data-[variant=outline]:first:border-t",
        className,
      )}
      render={
        <motion.button
          whileTap={cm.reduced ? undefined : { scale: scale.press }}
          transition={cm.transition("feedback.press")}
        />
      }
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
