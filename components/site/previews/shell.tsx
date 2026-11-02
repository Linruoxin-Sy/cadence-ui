"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/registry/cadence/lib/cn";
import { popupStyle } from "@/registry/cadence/lib/popup-style";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

/**
 * Layout shell shared by every component preview.
 *
 * A preview is a specimen, not a lesson: it shows the component's own range —
 * variants, sizes, states, the compositions that change its shape — and nothing
 * else. There are no group captions, because a caption is a second thing to read
 * before the thing you came for, and the components already name themselves.
 *
 * The frame does the centring (`PreviewFrame` places this stack in the middle of a
 * card with a minimum height), so a preview only decides its rows. `PreviewRow`
 * wraps: a matrix must fold inside a narrow card rather than introduce horizontal
 * overflow, and that is the one rule every row here relies on.
 *
 * Order is meaningful, not arbitrary: the first row is the default the component
 * ships with, the second is what changes its shape (size, orientation, state), the
 * third is composition. A reader who stops after one row has still seen the thing
 * the page is about.
 */

/**
 * The specimen lands rather than appearing. The frame's height is measured and
 * applied at once (see `MeasuredHeight`), which is right — but it means the only
 * thing left to soften is the content itself, and geometry is the one property we
 * must not animate here: a frame shorter than its content clips it. So the stack
 * rises 4px and fades in, and nothing moves in layout.
 *
 * `starting:` is the whole mechanism: the browser paints the *starting* style on
 * the element's first frame and transitions to the base style, which covers both
 * ways a preview arrives — a route change, and the chunk that replaces the
 * `Skeleton` at hydration. A JS entrance cannot: the element is already painted
 * at its final state by then, so Motion would snap it back to `opacity: 0` and
 * play catch-up in view. The duration comes from `--motion-duration-*`, so
 * Each stack owns its effective clock. Reduced keeps the fade and removes travel;
 * none removes the starting state and cancels every running transition.
 */
export function PreviewStack({ className, children }: { className?: string; children: ReactNode }) {
  const cm = useCadenceMotion();
  return (
    <div
      data-preview-stack
      data-motion={cm.mode}
      style={popupStyle(cm, undefined) as CSSProperties}
      className={cn(
        "flex w-full flex-col items-center gap-5 ease-cadence-out duration-(--motion-duration-base)",
        cm.disabled
          ? "transition-none"
          : cm.reduced
            ? "transition-opacity starting:opacity-0"
            : "transition-[translate,opacity] starting:opacity-0 starting:translate-y-1 motion-reduce:transition-opacity motion-reduce:starting:translate-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PreviewRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>{children}</div>;
}
