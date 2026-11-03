"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Switch } from "@/registry/cadence/switch";
import { PreviewStack } from "./shell";

export function SwitchSizes() {
  const id = useId();
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <div className="flex items-center gap-3">
        <Switch id={`${id}-off`} />
        <Label htmlFor={`${id}-off`}>Off</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-on`} defaultChecked />
        <Label htmlFor={`${id}-on`}>On</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-off`} size="sm" />
        <Label htmlFor={`${id}-small-off`}>Small</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-on`} size="sm" defaultChecked />
        <Label htmlFor={`${id}-small-on`}>Small, on</Label>
      </div>
    </div>
  );
}

export function ControlledSwitch() {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Switch id={id} checked={on} onCheckedChange={setOn} />
        <Label htmlFor={id}>Alerts</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Alerts {on ? "on" : "off"} in this example
      </p>
      <Button variant="outline" size="sm" onClick={() => setOn(false)}>
        Turn alerts off
      </Button>
    </div>
  );
}

export function SwitchSettings() {
  const id = useId();
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>Deploy alerts</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          A notification for every failed build.
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-help`} />
    </div>
  );
}

export function DisabledSwitches() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, off</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, on</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only setting</Label>
      </div>
    </div>
  );
}

export function StaticSwitch() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Switch aria-label="Static switch" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Switch aria-label="Explicit full switch" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

function Specimen() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <SwitchSizes />
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={id} disabled />
        <Label htmlFor={id}>Disabled</Label>
      </div>
    </div>
  );
}

export function SwitchPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "sizes" ? (
        <SwitchSizes />
      ) : example === "controlled" ? (
        <ControlledSwitch />
      ) : example === "settings" ? (
        <SwitchSettings />
      ) : example === "disabled" ? (
        <DisabledSwitches />
      ) : example === "without-motion" ? (
        <StaticSwitch />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
