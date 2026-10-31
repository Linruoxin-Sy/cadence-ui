"use client";

import { Skeleton } from "@/registry/cadence/skeleton";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * A skeleton is a shape, so the specimen is three shapes at the sizes they are
 * actually used: a card placeholder, a list row, and a paragraph. The pulse is
 * opacity-only, which is why it survives `reduced` and stops under `none`.
 */
export function SkeletonPreview() {
  return (
    <PreviewStack>
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
    </PreviewStack>
  );
}
