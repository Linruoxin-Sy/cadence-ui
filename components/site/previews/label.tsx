"use client";

import { Input } from "@/registry/cadence/input/input";
import { Label } from "@/registry/cadence/label/label";

export function LabelPreview() {
  return (
    <div className="grid max-w-sm gap-6">
      <div className="grid gap-2">
        <Label htmlFor="label-preview-email">Email</Label>
        <Input id="label-preview-email" type="email" autoComplete="email" placeholder="ada@example.com" />
        <p className="text-xs text-muted-foreground">Click the label: focus lands in the field.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="label-preview-slug" className="peer-disabled:opacity-50">
          Slug
        </Label>
        <Input id="label-preview-slug" className="peer" disabled defaultValue="cadence" />
        <p className="text-xs text-muted-foreground">The label follows the disabled control without a prop.</p>
      </div>

      <Label className="w-fit">
        <input type="checkbox" className="size-4 accent-primary" defaultChecked />
        Email me about releases
      </Label>
    </div>
  );
}
