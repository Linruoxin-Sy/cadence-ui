"use client";

import { Label } from "@/registry/cadence/label";
import { Switch } from "@/registry/cadence/switch";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The switch's range is small on purpose: on and off, the `sm` size, and disabled.
 * Both states are shown because a switch's state *is* its shape — an off specimen
 * alone would never show the thumb travelling.
 */
export function SwitchPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-6">
        <div className="flex items-center gap-2">
          <Switch id="switch-off" />
          <Label htmlFor="switch-off">Off</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-on" defaultChecked />
          <Label htmlFor="switch-on">On</Label>
        </div>
      </PreviewRow>

      <PreviewRow className="gap-6">
        <div className="flex items-center gap-2">
          <Switch id="switch-small" size="sm" />
          <Label htmlFor="switch-small">Small</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-small-on" size="sm" defaultChecked />
          <Label htmlFor="switch-small-on">Small, on</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-disabled" disabled />
          <Label htmlFor="switch-disabled">Disabled</Label>
        </div>
      </PreviewRow>
    </PreviewStack>
  );
}
