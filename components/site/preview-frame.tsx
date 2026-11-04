"use client";

import type { ReactNode } from "react";
import { cn } from "@/registry/cadence/lib/cn";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";
import { MeasuredHeight } from "./measured-height";

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
export function PreviewFrameClient({ id, example, children }: { id: string; example?: string; children: ReactNode }) {
  const resolved = useCadenceMotion().mode;

  return (
    <div
      data-preview={example === undefined ? id : undefined}
      data-component-example={example === undefined ? undefined : `${id}/${example}`}
      data-preview-motion={resolved}
      className="rounded-xl border border-border bg-background"
    >
      {/* The body owns its height so the card around the preview is the size of
          what is inside it, measured on every change and applied at once: the
          preview's own motion is the motion, and a second tween on top of it
          reads as an easing curve (see `MeasuredHeight`). What is left to soften
          is the arrival, and that is the specimen's own business — `PreviewStack`
          lands it with a `@starting-style` fade and a 4px rise, which moves no
          layout. The padding lives inside the measured box, so a focus ring or
          shadow is clipped at the padding edge rather than at the preview's own
          box — and so the 4px of travel stays inside that padding instead of
          cutting the specimen.

          `min-h-80` is the card's floor, not the preview's: every component page
          starts at the same height whatever it happens to show, so browsing the
          catalogue does not feel like a column of ragged boxes. `place-items-center`
          centres the specimen on both axes — the previews themselves are laid out to
          sit in the middle rather than to fill the card. */}
      <MeasuredHeight className={cn("grid place-items-center p-6", example === undefined ? "min-h-80" : "min-h-40")}>
        {/* The route supplies the real SSR specimen. A local streaming fallback leaves
            the actual specimen in a hidden segment when JavaScript is disabled. */}
        {children}
      </MeasuredHeight>
    </div>
  );
}
