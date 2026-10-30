"use client";

import { Label } from "@/registry/cadence/label/label";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group/radio-group";

const plans = [
  { value: "starter", label: "Starter", hint: "One project, one seat." },
  { value: "team", label: "Team", hint: "Unlimited projects, five seats." },
  { value: "scale", label: "Scale", hint: "SSO, audit log, priority support." },
];

export function RadioGroupPreview() {
  return (
    <RadioGroup defaultValue="team" aria-label="Plan" className="w-full max-w-md gap-4">
      {plans.map((plan) => (
        <div key={plan.value} className="flex items-start gap-3">
          <RadioGroupItem id={`plan-${plan.value}`} value={plan.value} className="mt-0.5" />
          <div className="grid gap-1">
            <Label htmlFor={`plan-${plan.value}`}>{plan.label}</Label>
            <p className="text-sm text-muted-foreground">{plan.hint}</p>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
