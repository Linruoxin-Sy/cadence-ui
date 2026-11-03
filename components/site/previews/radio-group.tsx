"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group";
import { PreviewStack } from "./shell";

export function PlanChoices() {
  const id = useId();
  return (
    <RadioGroup defaultValue="team" aria-label="Plan" className="w-full max-w-xs gap-3">
      {["starter", "team", "scale"].map((plan) => (
        <div key={plan} className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-${plan}`} value={plan} />
          <Label htmlFor={`${id}-${plan}`}>{plan === "starter" ? "Starter" : plan === "team" ? "Team" : "Scale"}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function ControlledPlan() {
  const id = useId();
  const [plan, setPlan] = useState("team");
  return (
    <div className="grid gap-4">
      <RadioGroup value={plan} onValueChange={setPlan} aria-label="Controlled plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selected plan: {plan}
      </p>
      <Button variant="outline" size="sm" onClick={() => setPlan("team")}>
        Choose Team
      </Button>
    </div>
  );
}

export function InvalidPlan() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <RadioGroup aria-invalid="true" aria-describedby={`${id}-error`} aria-label="Required plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" aria-invalid="true" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" aria-invalid="true" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p id={`${id}-error`} className="text-sm text-destructive">
        Choose a plan to continue.
      </p>
    </div>
  );
}

export function DisabledPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="starter" aria-label="Available plans">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-starter`} value="starter" />
        <Label htmlFor={`${id}-starter`}>Starter</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <RadioGroupItem id={`${id}-enterprise`} value="enterprise" disabled />
        <Label htmlFor={`${id}-enterprise`}>Enterprise (unavailable)</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-scale`} value="scale" />
        <Label htmlFor={`${id}-scale`}>Scale</Label>
      </div>
    </RadioGroup>
  );
}

export function LockedPlans() {
  const id = useId();
  return (
    <div className="grid gap-6">
      <RadioGroup defaultValue="team" disabled aria-label="Disabled plan">
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-team`} value="team" />
          <Label htmlFor={`${id}-disabled-team`}>Team</Label>
        </div>
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-scale`} value="scale" />
          <Label htmlFor={`${id}-disabled-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <RadioGroup defaultValue="team" readOnly aria-label="Read-only plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-team`} value="team" />
          <Label htmlFor={`${id}-readonly-team`}>Team (read-only)</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-scale`} value="scale" />
          <Label htmlFor={`${id}-readonly-scale`}>Scale (read-only)</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export function HorizontalPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="daily" aria-label="Digest frequency" className="flex flex-wrap gap-6">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-daily`} value="daily" />
        <Label htmlFor={`${id}-daily`}>Daily</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-weekly`} value="weekly" />
        <Label htmlFor={`${id}-weekly`}>Weekly</Label>
      </div>
    </RadioGroup>
  );
}

export function ShippingForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(`Shipping: ${new FormData(event.currentTarget).get("shipping")}`);
      }}
    >
      <RadioGroup name="shipping" required aria-label="Shipping method">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-standard`} value="standard" />
          <Label htmlFor={`${id}-standard`}>Standard</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-express`} value="express" />
          <Label htmlFor={`${id}-express`}>Express</Label>
        </div>
      </RadioGroup>
      <Button type="submit" size="sm">
        Submit shipping
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}

export function StaticRadio() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <RadioGroup defaultValue="static" aria-label="Static choice">
            <RadioGroupItem value="static" aria-label="Static radio" />
          </RadioGroup>
        </div>
        <CadenceProvider mode="full">
          <RadioGroup aria-label="Explicit full choice">
            <RadioGroupItem value="animated" aria-label="Explicit full radio" />
          </RadioGroup>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function RadioGroupPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "controlled" ? (
        <ControlledPlan />
      ) : example === "invalid" ? (
        <InvalidPlan />
      ) : example === "disabled" ? (
        <DisabledPlans />
      ) : example === "locked" ? (
        <LockedPlans />
      ) : example === "horizontal" ? (
        <HorizontalPlans />
      ) : example === "form-submission" ? (
        <ShippingForm />
      ) : example === "without-motion" ? (
        <StaticRadio />
      ) : (
        <PlanChoices />
      )}
    </PreviewStack>
  );
}
