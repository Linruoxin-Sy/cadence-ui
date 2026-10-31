"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/cadence/select";

const FRAMEWORKS = [
  { value: "next", label: "Next.js App Router" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro islands" },
  { value: "vite", label: "Vite SPA" },
] as const;

export function SelectPreview() {
  const [value, setValue] = useState<string | null>("next");

  return (
    <div className="flex flex-col gap-4">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Framework">
          <SelectValue placeholder="Choose a framework" />
        </SelectTrigger>
        <SelectContent>
          {FRAMEWORKS.map((framework) => (
            <SelectItem key={framework.value} value={framework.value}>
              {framework.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        Pick a value: the label flies from the option into the trigger, the trigger's clipped slot folds to the new
        width, and the check mark scales in. The label is laid out at its final width, so the surface can settle without
        re-wrapping the text.
      </p>
    </div>
  );
}
