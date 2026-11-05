"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function CheckboxStates() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-checked`} defaultChecked />
        <Label htmlFor={`${id}-checked`}>Checked by default</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-mixed`} indeterminate />
        <Label htmlFor={`${id}-mixed`}>Some projects selected</Label>
      </div>
    </div>
  );
}

export function ControlledCheckbox() {
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={id} checked={accepted} onCheckedChange={setAccepted} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {accepted ? "Terms accepted" : "Terms not accepted"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setAccepted(false)}>
        Reset acceptance
      </Button>
    </div>
  );
}

export function InvalidCheckbox() {
  const id = useId();
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <Checkbox id={id} aria-invalid="true" aria-describedby={`${id}-error`} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p id={`${id}-error`} className="text-sm text-destructive">
        You must accept the terms to continue.
      </p>
    </div>
  );
}

export function CheckboxSettings() {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-help`} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor={id}>Send the weekly digest</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Every Monday, 09:00.
        </p>
      </div>
    </div>
  );
}

export function DisabledCheckboxes() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, unchecked</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, checked</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only preference</Label>
      </div>
    </div>
  );
}

export function CheckboxForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setResult(`Submitted consent: ${data.get("consent")}`);
      }}
    >
      <div className="flex items-center gap-3">
        <Checkbox id={id} name="consent" value="accepted" required />
        <Label htmlFor={id}>Accept the terms (required)</Label>
      </div>
      <Button type="submit" size="sm">
        Submit consent
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}

export function StaticCheckbox() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Checkbox aria-label="Static checkbox" className="inline-flex" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Checkbox aria-label="Explicit full checkbox" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

function Specimen() {
  const id = useId();
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-4">
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-off`} />
        <Label htmlFor={`${id}-off`}>Unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-on`} defaultChecked />
        <Label htmlFor={`${id}-on`}>Checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-mixed`} indeterminate />
        <Label htmlFor={`${id}-mixed`}>Indeterminate</Label>
      </div>
      <div className="group flex items-center gap-2" data-disabled="true">
        <Checkbox id={`${id}-disabled`} disabled defaultChecked />
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-invalid`} aria-invalid="true" />
        <Label htmlFor={`${id}-invalid`}>Invalid</Label>
      </div>
    </div>
  );
}

export function CheckboxPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "states" ? (
        <CheckboxStates />
      ) : example === "controlled" ? (
        <ControlledCheckbox />
      ) : example === "invalid" ? (
        <InvalidCheckbox />
      ) : example === "settings" ? (
        <CheckboxSettings />
      ) : example === "disabled" ? (
        <DisabledCheckboxes />
      ) : example === "form-submission" ? (
        <CheckboxForm />
      ) : example === "without-motion" ? (
        <StaticCheckbox />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
