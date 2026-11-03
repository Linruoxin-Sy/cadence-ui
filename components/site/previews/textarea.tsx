"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Label } from "@/registry/cadence/label";
import { Textarea } from "@/registry/cadence/textarea";
import { PreviewStack } from "./shell";

function GrowingTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Growing note</Label>
      <Textarea id={id} className="min-h-16 max-h-48" placeholder="Type another line…" />
    </div>
  );
}

function ResizableTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Resizable note</Label>
      <Textarea
        id={id}
        rows={3}
        className="field-sizing-fixed resize-y min-h-24 max-h-64"
        defaultValue="Drag the lower corner to make more room."
      />
    </div>
  );
}

function InvalidTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Biography</Label>
      <Textarea
        id={id}
        aria-invalid="true"
        aria-describedby={`${id}-error`}
        defaultValue="I build design systems that…"
      />
      <p id={`${id}-error`} className="text-sm text-destructive">
        Keep it under 280 characters.
      </p>
    </div>
  );
}

function TextareaAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Textarea id={`${id}-disabled`} name="disabled" disabled defaultValue="Editing is unavailable." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Textarea
          id={`${id}-readonly`}
          name="summary"
          readOnly
          defaultValue="The release notes are ready for review."
        />
      </div>
    </div>
  );
}

function ControlledTextarea() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Review note</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={280}
        aria-describedby={`${id}-count`}
      />
      <p id={`${id}-count`} role="status" className="text-sm text-muted-foreground">
        {value.length} / 280 characters
      </p>
      <Button variant="outline" onClick={() => setValue("Ready for review.")}>
        Use review note
      </Button>
    </div>
  );
}

function TextareaSpecimen() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Comment</Label>
      <Textarea id={id} rows={3} className="max-h-40" placeholder="Leave a note for the reviewer" />
    </div>
  );
}

const examples = {
  "auto-growing": GrowingTextarea,
  resizable: ResizableTextarea,
  invalid: InvalidTextarea,
  "disabled-readonly": TextareaAvailability,
  controlled: ControlledTextarea,
};

export function TextareaPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Textarea example: ${example}`);
    return (
      <PreviewStack>
        <Example />
      </PreviewStack>
    );
  }
  return (
    <PreviewStack>
      <TextareaSpecimen />
    </PreviewStack>
  );
}
