"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton";
import { PreviewStack } from "./shell";

function SkeletonSpecimen() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      <div className="grid w-48 gap-3" role="status" aria-busy="true" aria-label="Loading card">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <AvatarAndName />
    </div>
  );
}

export function TextLines() {
  return (
    <div className="grid w-full max-w-sm gap-2" role="status" aria-busy="true" aria-label="Loading paragraph">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export function AvatarAndName() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3" role="status" aria-busy="true" aria-label="Loading person">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SwappingContent() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <section aria-label="Profile" aria-busy={loading} aria-live="polite" className="flex min-h-14 items-center gap-3">
        {loading ? (
          <>
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="grid gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm"
            >
              AL
            </div>
            <div className="grid text-sm">
              <strong>Ada Lovelace</strong>
              <span>Engineer</span>
            </div>
          </>
        )}
      </section>
      <Button variant="outline" size="sm" onClick={() => setLoading((value) => !value)}>
        {loading ? "Load profile" : "Reload profile"}
      </Button>
    </div>
  );
}

export function StaticSkeleton() {
  return (
    <CadenceProvider mode="none">
      <div className="w-full max-w-sm" role="status" aria-busy="true" aria-label="Loading without motion">
        <Skeleton className="h-4 w-full" />
      </div>
    </CadenceProvider>
  );
}

export function SkeletonPreview({ example }: { example?: string }) {
  const content =
    example === "text-lines" ? (
      <TextLines />
    ) : example === "avatar-name" ? (
      <AvatarAndName />
    ) : example === "swap-content" ? (
      <SwappingContent />
    ) : example === "without-motion" ? (
      <StaticSkeleton />
    ) : (
      <SkeletonSpecimen />
    );
  return <PreviewStack>{content}</PreviewStack>;
}
