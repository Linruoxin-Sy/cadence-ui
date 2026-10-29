import type * as React from "react";
import { cn } from "../lib/cn";

export interface KbdProps extends React.ComponentProps<"kbd"> {}

/**
 * A keyboard key or a shortcut hint. T0: the key never moves; it is a label, and
 * motion here would only compete with the action it describes.
 *
 * The tooltip variant is upstream's: a `Kbd` inside `data-slot="tooltip-content"`
 * inverts its colours so it stays legible on the tooltip surface.
 */
function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
        className,
      )}
      {...props}
    />
  );
}

export interface KbdGroupProps extends React.ComponentProps<"kbd"> {}

/** Groups keys that are pressed together, e.g. `⌘` `K`, with one gap between them. */
function KbdGroup({ className, ...props }: KbdGroupProps) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

export { Kbd, KbdGroup };
