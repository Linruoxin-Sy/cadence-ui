"use client";

import { Progress, ProgressLabel, ProgressValue } from "@/registry/cadence/progress";
import { PreviewStack } from "./shell";

/**
 * Three states: a determinate bar with its own label and readout, the indeterminate
 * one (`value={null}`), and complete. The determinate bar animates its width through
 * `geometry.resize`, so it is also the card's slowest thing to watch.
 */
export function ProgressPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-sm gap-5">
        <Progress value={62} aria-label="Uploading assets">
          <div className="flex w-full items-center justify-between">
            <ProgressLabel>Uploading assets</ProgressLabel>
            <ProgressValue />
          </div>
        </Progress>

        <div className="grid gap-1">
          <span className="text-sm">Preparing preview</span>
          <Progress value={null} aria-label="Preparing preview" />
        </div>

        <div className="grid gap-1">
          <span className="text-sm">Complete</span>
          <Progress value={100} aria-label="Complete" />
        </div>
      </div>
    </PreviewStack>
  );
}
