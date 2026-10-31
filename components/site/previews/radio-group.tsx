"use client";

import { Label } from "@/registry/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group";
import { PreviewStack } from "./shell";

/**
 * A group, not a lone radio: the component's characteristic is that one option is
 * chosen and the rest are not, plus the disabled option that stays visible but
 * unavailable. Short labels keep four rows inside a row of the card.
 */
export function RadioGroupPreview() {
  return (
    <PreviewStack>
      <RadioGroup defaultValue="team" aria-label="Plan" className="w-full max-w-xs gap-3">
        <div className="flex items-center gap-2">
          <RadioGroupItem id="plan-starter" value="starter" />
          <Label htmlFor="plan-starter">Starter</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="plan-team" value="team" />
          <Label htmlFor="plan-team">Team</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="plan-scale" value="scale" />
          <Label htmlFor="plan-scale">Scale</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="plan-enterprise" value="enterprise" disabled />
          <Label htmlFor="plan-enterprise">Enterprise</Label>
        </div>
      </RadioGroup>
    </PreviewStack>
  );
}
