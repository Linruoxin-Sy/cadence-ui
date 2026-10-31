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
import { PreviewStack } from "./shell";

/**
 * `Field` has no visual variant — it is a layout contract. So the specimen is the
 * four things the contract covers: a labelled field with a description, an
 * orientation="horizontal" field where the label sits beside the control, an invalid
 * field whose error takes the space the description would have used, and a separator
 * between groups.
 */
export function FieldPreview() {
  return (
    <PreviewStack>
      <FieldSet className="w-full max-w-sm gap-3">
        <FieldLegend>Billing details</FieldLegend>

        <FieldGroup className="gap-3">
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
            <Input id="field-currency" className="w-20" defaultValue="EUR" />
          </Field>

          <FieldSeparator>or</FieldSeparator>

          <Field orientation="horizontal">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="ghost">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </PreviewStack>
  );
}
