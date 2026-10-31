// biome-ignore-all lint/a11y/useSemanticElements: the group is a div with role="group" because its children are arbitrary controls swapped through `render`, not a form section.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";
import { Separator } from "../separator";

/**
 * Joins adjacent controls into one shape. The rounding and border rules are
 * `[&>*]` selectors rather than props, so any child that renders a `data-slot`
 * — a button, a select trigger, an input — takes part without knowing about the
 * group. Only the first and last child keep their outer corners.
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

export interface ButtonGroupProps extends React.ComponentProps<"div">, VariantProps<typeof buttonGroupVariants> {}

/**
 * Two or more controls that act on the same thing. T0: nothing animates. A focus
 * ring that lifts above its neighbour is the only depth cue, and it is a z-index,
 * not motion.
 *
 * a11y: `role="group"` names the set; give it `aria-label` when the group has no
 * visible heading. `orientation` changes the layout, so keyboard users tab in the
 * order the controls are written — keep it that way.
 */
function ButtonGroup({ className, orientation = "horizontal", ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export interface ButtonGroupTextProps extends useRender.ComponentProps<"div"> {}

/** Static text in the group — a prefix, a unit, a count. `render` swaps the tag. */
function ButtonGroupText({ className, render, ...props }: ButtonGroupTextProps) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className,
        ),
      },
      props,
    ),
    render,
    // `state` is what emits `data-slot` — Base UI converts state keys to data-* attributes.
    state: { slot: "button-group-text" },
  });
}

export interface ButtonGroupSeparatorProps extends React.ComponentProps<typeof Separator> {}

/**
 * A rule between two controls. It stretches to the group's cross axis, so a
 * horizontal group gets a vertical rule and the reverse.
 */
function ButtonGroupSeparator({ className, orientation = "vertical", ...props }: ButtonGroupSeparatorProps) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto", className)}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
