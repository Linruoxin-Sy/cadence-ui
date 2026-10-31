"use client";

import { AspectRatio } from "@/registry/cadence/aspect-ratio";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The component has one prop, so the specimen is the prop's range: a wide, a square
 * and a tall ratio at the same column width. The boxes are visible on purpose — the
 * point of the component is the space it reserves before the media loads.
 */
export function AspectRatioPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="items-center gap-4">
        {[
          { ratio: 16 / 9, label: "16 : 9" },
          { ratio: 1, label: "1 : 1" },
          { ratio: 3 / 4, label: "3 : 4" },
        ].map(({ ratio, label }) => (
          <AspectRatio key={label} ratio={ratio} className="w-36 overflow-hidden rounded-lg border bg-muted">
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">{label}</div>
          </AspectRatio>
        ))}
      </PreviewRow>
    </PreviewStack>
  );
}
