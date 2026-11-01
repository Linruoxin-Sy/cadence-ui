"use client";

import { useState } from "react";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * A skeleton is a shape, so the specimen is three shapes at the sizes they are
 * actually used: a card placeholder, a list row, and a paragraph. The pulse is
 * opacity-only, which is why it survives `reduced` and stops under `none`.
 */
export function SkeletonPreview() {
  const [mode, setMode] = useState<CadenceMode | undefined>();
  return (
    <PreviewStack>
      <label className="flex items-center gap-2 text-sm">
        Skeleton motion
        <select
          aria-label="Skeleton motion"
          value={mode ?? "inherit"}
          onChange={(e) => setMode(e.target.value === "inherit" ? undefined : (e.target.value as CadenceMode))}
        >
          <option value="inherit">Inherit</option>
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
          <option value="none">None</option>
        </select>
      </label>
      <CadenceProvider mode={mode}>
        <PreviewRow className="items-start gap-8">
          <div className="w-56" aria-busy="true">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>

          <div className="w-56" aria-busy="true">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="grid w-full gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </PreviewRow>
      </CadenceProvider>
    </PreviewStack>
  );
}
