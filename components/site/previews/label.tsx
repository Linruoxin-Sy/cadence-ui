"use client";

import { useId } from "react";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { PreviewRow, PreviewStack } from "./shell";

function Wrapping() {
  return (
    <Label>
      <input type="checkbox" defaultChecked />
      Email me about releases
    </Label>
  );
}

function Disabled() {
  const id = useId();
  return (
    <PreviewRow className="items-start gap-4">
      <div className="group grid w-56 gap-2" data-disabled="true">
        <Label htmlFor={`${id}-slug`}>Slug</Label>
        <Input id={`${id}-slug`} disabled defaultValue="cadence" />
      </div>
      <div className="grid w-56 gap-2">
        <Input id={`${id}-workspace`} className="peer" disabled defaultValue="Cadence UI" />
        <Label htmlFor={`${id}-workspace`}>Workspace</Label>
      </div>
    </PreviewRow>
  );
}

const examples = { wrapping: Wrapping, disabled: Disabled };

function LabelSpecimen() {
  const id = useId();
  return (
    <PreviewStack>
      <PreviewRow className="items-start gap-4">
        <div className="grid w-56 gap-2">
          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input id={`${id}-email`} type="email" autoComplete="email" placeholder="ada@example.com" />
        </div>
        <div className="group grid w-56 gap-2" data-disabled="true">
          <Label htmlFor={`${id}-slug`}>Slug</Label>
          <Input id={`${id}-slug`} disabled defaultValue="cadence" />
        </div>
      </PreviewRow>
      <PreviewRow>
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-terms`} defaultChecked />
          <Label htmlFor={`${id}-terms`}>Email me about releases</Label>
        </div>
        <div className="group flex items-center gap-2" data-disabled="true">
          <Checkbox id={`${id}-muted`} disabled />
          <Label htmlFor={`${id}-muted`}>Disabled preference</Label>
        </div>
      </PreviewRow>
    </PreviewStack>
  );
}

export function LabelPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Label example: ${example}`);
    return <Example />;
  }
  return <LabelSpecimen />;
}
