"use client";

import { AspectRatio } from "@/registry/cadence/aspect-ratio";

export function AspectRatioPreview() {
  return (
    <div className="grid max-w-lg gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">16 / 9</p>
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border bg-muted">
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 to-primary/0 text-sm text-muted-foreground">
            16 : 9
          </div>
        </AspectRatio>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 4 / 3, 3 / 4].map((ratio) => (
          <div key={ratio} className="flex flex-col gap-2">
            <AspectRatio ratio={ratio} className="overflow-hidden rounded-md border bg-muted">
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                {ratio === 1 ? "1 : 1" : ratio > 1 ? "4 : 3" : "3 : 4"}
              </div>
            </AspectRatio>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        The box is reserved before the media loads, so nothing below it moves when the image arrives.
      </p>
    </div>
  );
}
