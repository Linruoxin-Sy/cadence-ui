"use client";

import type * as React from "react";
import { cn } from "../lib/cn";

export interface LabelProps extends React.ComponentProps<"label"> {}

/**
 * The accessible name of a form control. T0: a label is text, and text that
 * slides around while you are trying to read it is a bug.
 *
 * Associate it the native way — `<Label htmlFor="email">` or by wrapping the
 * control — so clicking the text focuses the input without any JavaScript.
 * The disabled styles read `[data-disabled=true]` on a parent group and
 * `:disabled` on the sibling control; the label never owns state.
 */
function Label({ className, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: this is the label primitive; the caller supplies `htmlFor` or wraps the control, and both are tested.
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
