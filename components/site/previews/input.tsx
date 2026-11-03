"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { PreviewStack } from "./shell";

function InvalidInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input id={id} type="email" aria-invalid="true" aria-describedby={`${id}-error`} defaultValue="ada@" />
      <p id={`${id}-error`} className="text-sm text-destructive">
        Enter a complete email address.
      </p>
    </div>
  );
}

function FileInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Image</Label>
      <Input id={id} type="file" accept="image/png,image/jpeg" aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        Choose a PNG or JPEG image.
      </p>
    </div>
  );
}

function ControlledInput() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Workspace name</Label>
      <Input id={id} value={value} onValueChange={setValue} aria-describedby={`${id}-value`} />
      <p id={`${id}-value`} role="status" className="text-sm text-muted-foreground">
        Value: {value || "(empty)"}
      </p>
      <Button variant="outline" onClick={() => setValue("Cadence UI")}>
        Use workspace name
      </Button>
    </div>
  );
}

function InputAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-filled`}>Filled</Label>
        <Input id={`${id}-filled`} name="workspace" defaultValue="Cadence UI" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Input id={`${id}-disabled`} name="disabled" disabled defaultValue="cadence" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Input id={`${id}-readonly`} name="slug" readOnly defaultValue="cadence-ui" />
      </div>
    </div>
  );
}

function InputSpecimen() {
  const id = useId();
  return (
    <div className="grid w-full max-w-[30rem] grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-workspace`}>Workspace</Label>
        <Input id={`${id}-workspace`} placeholder="Acme" autoComplete="organization" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-filled`}>Filled</Label>
        <Input id={`${id}-filled`} type="email" defaultValue="ada@example.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-invalid`}>Invalid</Label>
        <Input
          id={`${id}-invalid`}
          type="email"
          aria-invalid="true"
          defaultValue="ada@"
          aria-describedby={`${id}-error`}
        />
        <p id={`${id}-error`} className="text-xs text-destructive">
          Enter a complete email address.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Input id={`${id}-disabled`} disabled defaultValue="cadence" />
      </div>
    </div>
  );
}

const examples = {
  invalid: InvalidInput,
  file: FileInput,
  controlled: ControlledInput,
  "disabled-readonly": InputAvailability,
};

export function InputPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Input example: ${example}`);
    return (
      <PreviewStack>
        <Example />
      </PreviewStack>
    );
  }
  return (
    <PreviewStack>
      <InputSpecimen />
    </PreviewStack>
  );
}
