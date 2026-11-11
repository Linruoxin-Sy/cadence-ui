"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
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

function Changing() {
  const id = useId();
  const [work, setWork] = useState(false);
  const [quantity, setQuantity] = useState(19);
  return (
    <div className="flex w-full flex-col items-start gap-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setWork((value) => !value)}>
          Rename field
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuantity((value) => (value === 19 ? 20 : 19))}>
          Change quantity
        </Button>
      </div>
      <div className="grid w-full max-w-sm gap-3">
        <Label
          htmlFor={`${id}-email`}
          className="w-fit"
          style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
        >
          {work ? "Work email address" : "Email address"}
        </Label>
        <Input id={`${id}-email`} type="email" defaultValue="ada@example.com" />
      </div>
      <div className="grid gap-3">
        <Label
          htmlFor={`${id}-count`}
          className="w-fit"
          style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
        >
          {quantity}
        </Label>
        <input id={`${id}-count`} type="checkbox" aria-describedby={`${id}-hint`} />
        <span id={`${id}-hint`} className="text-sm text-muted-foreground">
          Available seats; the number is a quantity.
        </span>
      </div>
    </div>
  );
}

const examples = { wrapping: Wrapping, disabled: Disabled, changing: Changing };

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
