"use client";

import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { PreviewStack } from "./shell";

/**
 * The field's states: resting, filled, invalid, disabled — plus the file input, the
 * one `type` that restyles the control. Laid out as one grid rather than as rows, so
 * the fifth field sits under the first column instead of floating in the middle.
 *
 * Invalid comes from `aria-invalid` alone; the component never validates anything.
 */
export function InputPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-[30rem] grid-cols-2 gap-x-4 gap-y-5">
        <div className="grid gap-2">
          <Label htmlFor="input-preview-name">Workspace</Label>
          <Input id="input-preview-name" placeholder="Acme" autoComplete="organization" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="input-preview-filled">Filled</Label>
          <Input id="input-preview-filled" type="email" defaultValue="ada@example.com" readOnly />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="input-preview-invalid">Invalid</Label>
          <Input id="input-preview-invalid" type="email" defaultValue="ada@" aria-invalid="true" readOnly />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="input-preview-disabled">Disabled</Label>
          <Input id="input-preview-disabled" disabled defaultValue="cadence" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="input-preview-file">File</Label>
          <Input id="input-preview-file" type="file" accept="image/png,image/jpeg" />
        </div>
      </div>
    </PreviewStack>
  );
}
