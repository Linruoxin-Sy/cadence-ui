"use client";

import type { ReactNode } from "react";
import { cn } from "@/registry/cadence/lib/cn";

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
export function PreviewStack({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex w-full flex-col items-center gap-5", className)}>{children}</div>;
}

export function PreviewRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>{children}</div>;
}
