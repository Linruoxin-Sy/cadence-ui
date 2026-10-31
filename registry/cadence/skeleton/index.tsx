"use client";

import type * as React from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface SkeletonProps extends React.ComponentProps<"div"> {}

/**
 * A placeholder with the shape of the content that is loading.
 *
 * Recipe: `data.transition` — a continuous opacity loop, implemented in CSS
 * (`animate-pulse`) rather than in Motion, because a list of placeholders must
 * not pay for forty animation loops on the main thread. Only `opacity` changes,
 * so the pulse cannot trigger layout.
 *
 * Motion contract:
 * - full / reduced: pulse, opacity only (the reduced branch keeps it: M5 says a
 *   reduced motion experience loses scale and travel, not opacity)
 * - none: `animate-none`, the shape stays at full opacity
 *
 * a11y: a skeleton is decorative. The region that is loading carries
 * `aria-busy="true"`; the skeleton itself is never announced.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  const cm = useCadenceMotion();
  const pulse = cm.mode === "none" ? "animate-none" : "animate-pulse";

  return (
    <div
      data-slot="skeleton"
      data-motion={cm.mode}
      className={cn("rounded-md bg-accent", pulse, className)}
      {...props}
    />
  );
}

export { Skeleton };
