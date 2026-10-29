"use client";

import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton/skeleton";

function CardPlaceholder() {
  return (
    <div className="w-full space-y-3" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonPreview() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 lg:max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Card</p>
          <CardPlaceholder />
        </div>

        <div className="space-y-4 lg:max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">List row</p>
          <div className="flex items-center gap-3" aria-busy="true">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">data-motion="none"</p>
        <CadenceProvider mode="none">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </CadenceProvider>
        <p className="text-xs text-muted-foreground">
          The pulse is opacity-only, so reduced motion keeps it; <code>data-motion="none"</code> stops it and the shape
          stays at full opacity.
        </p>
      </div>
    </div>
  );
}
