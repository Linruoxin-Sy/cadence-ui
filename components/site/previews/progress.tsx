"use client";

import { useEffect, useState } from "react";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/cadence/progress/progress";

export function ProgressPreview() {
  const [uploaded, setUploaded] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => setUploaded((value) => (value >= 100 ? 18 : value + 7)), 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <Progress value={uploaded} aria-label="Uploading assets">
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Uploading assets</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Preparing preview</span>
        <Progress value={null} aria-label="Preparing preview" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Complete</span>
        <Progress value={100} aria-label="Complete" />
      </div>
    </div>
  );
}
