"use client";

import { Suspense } from "react";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton";
import { MeasuredHeight } from "./measured-height";
import { previews } from "./previews";

export function Preview({ id }: { id: string }) {
  const Component = previews[id];
  if (!Component) {
    return <p className="text-sm text-muted-foreground">Preview coming soon.</p>;
  }
  return <Component />;
}

/**
 * The frame every component page mounts.
 *
 * It does **not** own the motion mode or the playback speed. Both are settings, and
 * the site has one switch and one gear for them in the header (`MotionModeSwitch`,
 * `MotionSpeedSelect`); this frame reads the resolved mode and says so, so a reader
 * who switched to `none` on another page knows why the preview is still.
 *
 * The value is the *resolved* mode, not the requested one: a visitor whose OS asks
 * for reduced motion sees `reduced` even while the switch says `full`, and the label
 * has to agree with what the preview actually rendered.
 */
export function PreviewFrame({ id }: { id: string }) {
  const resolved = useCadenceMotion().mode;

  return (
    <div data-preview={id} data-preview-motion={resolved} className="rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-[11px] text-muted-foreground">
          Motion <span className="font-medium text-foreground capitalize">{resolved}</span>
          <span className="hidden sm:inline"> · change it in the header</span>
        </p>
      </div>

      {/* The body owns its height so the `Skeleton` → preview swap resizes the card
          instead of jumping it (`geometry.resize`, animation-system §3.2). The
          padding lives inside, so a focus ring or shadow is clipped at the padding
          edge rather than at the preview's own box. */}
      <MeasuredHeight className="p-6">
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <Preview id={id} />
        </Suspense>
      </MeasuredHeight>
    </div>
  );
}
