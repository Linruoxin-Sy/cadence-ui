"use client";

import { Button } from "@/registry/cadence/button";
import { Spinner } from "@/registry/cadence/spinner";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The spinner takes its size from a class, so the specimen is four sizes, then the
 * two places it is actually used: beside a label, and inside a disabled button,
 * where it shares the row with the word without changing the button's height.
 */
export function SpinnerPreview() {
  return (
    <PreviewStack>
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
    </PreviewStack>
  );
}
