"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Spinner } from "@/registry/cadence/spinner";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The spinner takes its size from a class, so the specimen is four sizes, then the
 * two places it is actually used: beside a label, and inside a disabled button,
 * where it shares the row with the word without changing the button's height.
 */
export function SpinnerPreview() {
  const [mode, setMode] = useState<CadenceMode | "inherit">("inherit");
  return (
    <PreviewStack>
      <label className="flex gap-2 text-sm">
        Spinner motion
        <select
          aria-label="Spinner motion"
          value={mode}
          onChange={(e) => setMode(e.target.value as CadenceMode | "inherit")}
          className="rounded border bg-background px-2"
        >
          {["inherit", "full", "reduced", "none"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <CadenceProvider mode={mode === "inherit" ? undefined : mode}>
        <PreviewRow>
          <Spinner className="size-3" />
          <Spinner />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
        </PreviewRow>

        <PreviewRow className="gap-6">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Loading the registry…
          </span>
          <Button disabled size="sm">
            <Spinner />
            Saving
          </Button>
        </PreviewRow>
      </CadenceProvider>
      <CadenceProvider mode="none">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-label="Static loading" data-testid="static-spinner" />
          Motion disabled from the first render
        </span>
      </CadenceProvider>
    </PreviewStack>
  );
}
