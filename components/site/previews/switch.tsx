"use client";

import { Label } from "@/registry/cadence/label/label";
import { Switch } from "@/registry/cadence/switch/switch";

export function SwitchPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-1">
          <Label htmlFor="switch-public">Public workspace</Label>
          <p className="text-sm text-muted-foreground">Anyone with the link can read it.</p>
        </div>
        <Switch id="switch-public" defaultChecked />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-1">
          <Label htmlFor="switch-alerts">Deploy alerts</Label>
          <p className="text-sm text-muted-foreground">A notification for every failed build.</p>
        </div>
        <Switch id="switch-alerts" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="switch-compact">Compact rows</Label>
        <Switch id="switch-compact" size="sm" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="switch-locked">Require approval</Label>
        <Switch id="switch-locked" disabled />
      </div>
    </div>
  );
}
