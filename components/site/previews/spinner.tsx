"use client";

import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Spinner } from "@/registry/cadence/spinner";

export function SpinnerPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Inline</p>
          <div className="flex items-center gap-3 text-sm">
            <Spinner />
            <span className="text-muted-foreground">Loading the registry…</span>
          </div>
          <div className="flex items-center gap-2">
            <Spinner className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">size-3</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">In a button</p>
          <Button disabled size="sm">
            <Spinner />
            Saving
          </Button>
          <p className="text-xs text-muted-foreground">
            The button keeps its size; the spinner and the word share one row.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">data-motion="none"</p>
        <CadenceProvider mode="none">
          <div className="flex items-center gap-3 text-sm">
            <Spinner />
            <span className="text-muted-foreground">Rotation stops, the icon stays, the label still says Loading.</span>
          </div>
        </CadenceProvider>
      </div>
    </div>
  );
}
