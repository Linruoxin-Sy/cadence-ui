"use client";

import { Checkbox } from "@/registry/cadence/checkbox";
import { Label } from "@/registry/cadence/label";

const rows = [
  { id: "terms", label: "Accept the terms of service", hint: "Required to create a workspace." },
  { id: "digest", label: "Send the weekly digest", hint: "Every Monday, 09:00 in your timezone." },
  { id: "beta", label: "Join the beta channel", hint: "Unstable builds, no support." },
];

export function CheckboxPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-start gap-3">
          <Checkbox id={row.id} defaultChecked={index === 0} className="mt-0.5" />
          <div className="grid gap-1">
            <Label htmlFor={row.id}>{row.label}</Label>
            <p className="text-sm text-muted-foreground">{row.hint}</p>
          </div>
        </div>
      ))}

      <div className="flex items-start gap-3">
        <Checkbox id="newsletter" indeterminate aria-invalid className="mt-0.5" />
        <div className="grid gap-1">
          <Label htmlFor="newsletter">Select all newsletters</Label>
          <p className="text-sm text-destructive">Pick at least one channel.</p>
        </div>
      </div>
    </div>
  );
}
