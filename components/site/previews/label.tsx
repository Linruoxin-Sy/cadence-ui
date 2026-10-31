"use client";

import { Checkbox } from "@/registry/cadence/checkbox";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Three associations: label above a field (the default), label above a disabled
 * field, where `peer-disabled` greys the label without a prop, and label wrapping a
 * checkbox, where clicking the words toggles the box.
 */
export function LabelPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="items-start gap-4">
        <div className="grid w-56 gap-2">
          <Label htmlFor="label-preview-email">Email</Label>
          <Input id="label-preview-email" type="email" autoComplete="email" placeholder="ada@example.com" />
        </div>

        <div className="grid w-56 gap-2">
          <Label htmlFor="label-preview-slug" className="peer-disabled:opacity-50">
            Slug
          </Label>
          <Input id="label-preview-slug" className="peer" disabled defaultValue="cadence" />
        </div>
      </PreviewRow>

      <PreviewRow>
        <div className="flex items-center gap-2">
          <Checkbox id="label-preview-terms" defaultChecked />
          <Label htmlFor="label-preview-terms">Email me about releases</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="label-preview-muted" disabled />
          <Label htmlFor="label-preview-muted">Disabled preference</Label>
        </div>
      </PreviewRow>
    </PreviewStack>
  );
}
