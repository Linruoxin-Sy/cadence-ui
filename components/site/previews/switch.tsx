"use client";

import { Label } from "@/registry/cadence/label";
import { Switch } from "@/registry/cadence/switch";
import { ControlMotionScope } from "./control-motion-scope";
import { PreviewRow } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "sm"] as const;

/**
 * The switch's range is small on purpose: on and off, the `sm` size, and disabled.
 * Both states are shown because a switch's state *is* its shape — an off specimen
 * alone would never show the thumb travelling.
 */
export function SwitchPreview() {
  const { control, choose } = usePreviewVariant("Switch", previewVariantOptions);
  return (
    <>
      {control}
      <ControlMotionScope staticControl={<Switch aria-label="Static switch" defaultChecked size={choose("default")} />}>
        <PreviewRow className="gap-6">
          <div className="flex items-center gap-2">
            <Switch id="switch-off" size={choose("default")} />
            <Label htmlFor="switch-off">Off</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="switch-on" defaultChecked size={choose("default")} />
            <Label htmlFor="switch-on">On</Label>
          </div>
        </PreviewRow>

        <PreviewRow className="gap-6">
          <div className="flex items-center gap-2">
            <Switch id="switch-small" size={choose("sm")} />
            <Label htmlFor="switch-small">Small</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="switch-small-on" size={choose("sm")} defaultChecked />
            <Label htmlFor="switch-small-on">Small, on</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="switch-disabled" disabled size={choose("default")} />
            <Label htmlFor="switch-disabled">Disabled</Label>
          </div>
        </PreviewRow>
      </ControlMotionScope>
    </>
  );
}
