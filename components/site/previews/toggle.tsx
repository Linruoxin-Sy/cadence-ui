"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "@/registry/cadence/toggle";

export function TogglePreview() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold />
        </Toggle>
        <Toggle aria-label="Italic">
          <Italic />
        </Toggle>
        <Toggle aria-label="Underline" variant="outline">
          <Underline />
        </Toggle>
      </div>

      <div className="flex items-center gap-2">
        <Toggle size="sm" variant="outline">
          Small
        </Toggle>
        <Toggle variant="outline">Default</Toggle>
        <Toggle size="lg" variant="outline">
          Large
        </Toggle>
      </div>
    </div>
  );
}
