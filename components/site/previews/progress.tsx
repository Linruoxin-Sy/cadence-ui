"use client";

import { useState } from "react";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/cadence/progress";
import { ControlMotionScope } from "./control-motion-scope";

/**
 * Three states: a determinate bar with its own label and readout, the indeterminate
 * one (`value={null}`), and complete. The determinate fill uses `data.transition`.
 */
export function ProgressPreview() {
  const [value, setValue] = useState(62);
  return (
    <ControlMotionScope staticControl={<Progress value={null} aria-label="Static progress" className="max-w-20" />}>
      <div className="grid w-full max-w-sm gap-5">
        <label className="grid gap-2 text-sm">
          Upload progress
          <input
            aria-label="Upload progress"
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
        <Progress value={value} aria-label="Uploading assets">
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
    </ControlMotionScope>
  );
}
