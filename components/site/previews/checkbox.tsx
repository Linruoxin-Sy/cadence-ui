"use client";

import { Checkbox } from "@/registry/cadence/checkbox";
import { Label } from "@/registry/cadence/label";
import { PreviewStack } from "./shell";

/**
 * Five states, because a checkbox has no variant: unchecked, checked, indeterminate,
 * disabled, and invalid. The label is part of every specimen — a checkbox without one
 * is a shape, not a control.
 */
export function CheckboxPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-unchecked" />
          <Label htmlFor="checkbox-unchecked">Unchecked</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-checked" defaultChecked />
          <Label htmlFor="checkbox-checked">Checked</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-indeterminate" indeterminate />
          <Label htmlFor="checkbox-indeterminate">Indeterminate</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-disabled" disabled defaultChecked />
          <Label htmlFor="checkbox-disabled">Disabled</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-invalid" aria-invalid="true" />
          <Label htmlFor="checkbox-invalid">Invalid</Label>
        </div>
      </div>
    </PreviewStack>
  );
}
