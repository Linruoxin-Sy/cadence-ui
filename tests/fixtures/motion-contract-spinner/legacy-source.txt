"use client";

import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface SpinnerProps extends React.ComponentProps<"svg"> {}

/**
 * The indeterminate wait: something is happening, and no progress value exists yet.
 *
 * Recipe: `data.transition` in its continuous form — a CSS `animate-spin` loop
 * rather than a Motion loop, because a spinner is by definition next to something
 * the user is waiting on and must not compete for the main thread with it. Only
 * `transform` (rotation) changes, so the loop never triggers layout.
 *
 * Motion contract:
 * - full / reduced: rotation, `animate-spin`
 * - none: `animate-none`; the icon stays visible and still, and the accessible
 *   name still says "Loading"
 *
 * a11y: `role="status"` with `aria-label="Loading"`. The label is what a screen
 * reader announces; the rotation is never the only signal. Pass a more specific
 * `aria-label` ("Saving invoice") when the surrounding text does not say what is
 * loading.
 */
function Spinner({ className, ...props }: SpinnerProps) {
  const cm = useCadenceMotion();
  const spin = cm.mode === "none" ? "animate-none" : "animate-spin";

  return (
    <Loader2Icon
      data-slot="spinner"
      data-motion={cm.mode}
      role="status"
      aria-label="Loading"
      className={cn("size-4", spin, className)}
      {...props}
    />
  );
}

export { Spinner };
