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
 * It owns no switch and no chrome. A mode is a setting, and the site has one
 * switch for it in the header (`MotionModeSwitch`); the only thing this frame
 * does with the mode is expose it as `data-preview-motion`, so a preview can be
 * inspected without opening the header.
 *
 * The value is the *resolved* mode, not the requested one: a visitor whose OS
 * asks for reduced motion sees `reduced` even while the switch says `full`, and
 * the attribute has to agree with what the preview actually rendered — a nested
 * provider that re-derived the mode from the media query was a second place for
 * the answer to disagree, and it did.
 */
export function PreviewFrame({ id }: { id: string }) {
  const resolved = useCadenceMotion().mode;

  return (
    <div data-preview={id} data-preview-motion={resolved} className="rounded-xl border border-border bg-background">
      {/* The body owns its height so the `Skeleton` → preview swap resizes the card
          instead of jumping it (`geometry.resize`, animation-system §3.2). The
          padding lives inside, so a focus ring or shadow is clipped at the padding
          edge rather than at the preview's own box.

          `min-h-80` is the card's floor, not the preview's: every component page
          starts at the same height whatever it happens to show, so browsing the
          catalogue does not feel like a column of ragged boxes. `place-items-center`
          centres the specimen on both axes — the previews themselves are laid out to
          sit in the middle rather than to fill the card. */}
      <MeasuredHeight className="grid min-h-80 place-items-center p-6">
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <Preview id={id} />
        </Suspense>
      </MeasuredHeight>
    </div>
  );
}
