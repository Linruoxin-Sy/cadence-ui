"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { PreviewStack } from "./shell";

function Specimen() {
  const id = useId();
  return (
    <Field className="w-full max-w-lg">
      <FieldLabel htmlFor={id}>Company</FieldLabel>
      <FieldContent>
        <Input id={id} placeholder="Cadence Labs" aria-describedby={`${id}-help`} />
        <FieldDescription id={`${id}-help`}>Appears on the invoice header.</FieldDescription>
      </FieldContent>
    </Field>
  );
}

export function FieldOrientations() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <Field orientation="vertical">
        <FieldLabel htmlFor={`${id}-company`}>Company</FieldLabel>
        <Input id={`${id}-company`} placeholder="Cadence Labs" />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={`${id}-currency`}>Currency</FieldLabel>
        <Input id={`${id}-currency`} className="w-24" defaultValue="EUR" />
      </Field>
    </FieldGroup>
  );
}

export function ResponsiveFields() {
  const id = useId();
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <FieldGroup aria-label="Available width">
        <Field orientation="responsive">
          <FieldLabel htmlFor={`${id}-wide`}>Company</FieldLabel>
          <FieldContent>
            <Input id={`${id}-wide`} placeholder="Cadence Labs" aria-describedby={`${id}-wide-help`} />
            <FieldDescription id={`${id}-wide-help`}>Uses the available group width.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldGroup aria-label="Narrow panel" className="max-w-64">
        <Field orientation="responsive">
          <FieldLabel htmlFor={`${id}-narrow`}>Project</FieldLabel>
          <Input id={`${id}-narrow`} placeholder="Documentation" />
        </Field>
      </FieldGroup>
    </div>
  );
}

export function CallerError() {
  const id = useId();
  const [invalid, setInvalid] = useState(true);
  return (
    <div className="grid w-full max-w-lg gap-4">
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor={id}>VAT number</FieldLabel>
        <FieldContent>
          <Input
            id={id}
            defaultValue="NL0000"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : `${id}-help`}
          />
          <FieldDescription id={`${id}-help`}>Use the number on your invoice.</FieldDescription>
          <FieldError
            id={`${id}-error`}
            errors={
              invalid
                ? [
                    { message: "That VAT number has the wrong number of digits." },
                    { message: "Include the country prefix." },
                    { message: "Include the country prefix." },
                  ]
                : []
            }
          />
        </FieldContent>
      </Field>
      <Button size="sm" variant="outline" className="justify-self-start" onClick={() => setInvalid((value) => !value)}>
        Toggle supplied error
      </Button>
    </div>
  );
}

export function BillingFields() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <FieldSet>
        <FieldLegend>Billing details</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-company`}>Company</FieldLabel>
            <Input id={`${id}-company`} />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Individual name</FieldLabel>
            <Input id={`${id}-name`} />
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend variant="label">Invoice contact</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <Input id={`${id}-email`} type="email" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}

export function ChoiceCard() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <FieldLabel htmlFor={id}>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Team plan</FieldTitle>
            <FieldDescription id={`${id}-help`}>Unlimited projects for your team.</FieldDescription>
          </FieldContent>
          <Checkbox id={id} name="team-plan" value="team" aria-describedby={`${id}-help`} defaultChecked />
        </Field>
      </FieldLabel>
    </FieldGroup>
  );
}

const examples = {
  orientation: FieldOrientations,
  responsive: ResponsiveFields,
  "caller-error": CallerError,
  fieldset: BillingFields,
  "choice-card": ChoiceCard,
};

export function FieldPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Field example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <Specimen />
    </PreviewStack>
  );
}
