"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "../lib/cn";

export interface SeparatorProps extends SeparatorPrimitive.Props {
  /**
   * Purely visual separator: sets `role="none"` and `aria-hidden` so screen
   * readers do not announce it. Upstream's Base UI separator is always
   * announced; this prop is additive, for markup ported from the Radix style.
   */
  decorative?: boolean;
}

/**
 * A rule between groups. T0: nothing animates; the only thing that changes is
 * the colour token.
 *
 * Base UI emits `data-orientation`, so a consumer can size the rule from CSS
 * without a prop: `data-[orientation=vertical]:h-8`.
 */
function Separator({ className, orientation = "horizontal", decorative = false, ...props }: SeparatorProps) {
  // Spreading `role: undefined` would override Base UI's own role, so the
  // decorative props are only added when they are asked for.
  const a11y = decorative ? { role: "none", "aria-hidden": true } : {};

  return (
    <SeparatorPrimitive
      data-slot="separator"
      data-orientation={orientation}
      orientation={orientation}
      {...a11y}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
