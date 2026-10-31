"use client";

import { Button } from "@/registry/cadence/button";
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
} from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";

export function FieldPreview() {
  return (
    <FieldSet className="max-w-md">
      <FieldLegend>Billing details</FieldLegend>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-name">Company</FieldLabel>
          <FieldContent>
            <Input id="field-name" placeholder="Cadence Labs" />
            <FieldDescription>Appears on the invoice header.</FieldDescription>
          </FieldContent>
        </Field>

        <Field data-invalid="true">
          <FieldLabel htmlFor="field-vat">VAT number</FieldLabel>
          <FieldContent>
            <Input id="field-vat" aria-invalid defaultValue="NL0000" aria-describedby="field-vat-error" />
            <FieldError id="field-vat-error">That VAT number has the wrong number of digits.</FieldError>
          </FieldContent>
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="field-currency">Currency</FieldLabel>
            <FieldDescription>Invoices are issued in this currency.</FieldDescription>
          </FieldContent>
          <Input id="field-currency" className="w-24" defaultValue="EUR" />
        </Field>

        <FieldSeparator>or</FieldSeparator>

        <Field data-invalid="true">
          <FieldContent>
            <FieldLabel htmlFor="field-email">Email</FieldLabel>
            <Input id="field-email" type="email" aria-invalid aria-describedby="field-email-error" />
            <FieldError
              id="field-email-error"
              errors={[{ message: "Required" }, { message: "Required" }, { message: "Not a work email" }]}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <Field orientation="horizontal">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="ghost">
          Cancel
        </Button>
      </Field>
    </FieldSet>
  );
}
