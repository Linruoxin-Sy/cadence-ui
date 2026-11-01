"use client";

import { useState } from "react";
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
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["vertical", "horizontal", "responsive"] as const;

/**
 * `Field` has no visual variant — it is a layout contract. So the specimen is the
 * four things the contract covers: a labelled field with a description, an
 * orientation="horizontal" field where the label sits beside the control, an invalid
 * field whose error takes the space the description would have used, and a separator
 * between groups.
 */
export function FieldPreview() {
  const { control, choose } = usePreviewVariant("Field", previewVariantOptions);
  // The application supplies invalid state; Field performs no validation.
  const [invalid, setInvalid] = useState(true);
  return (
    <>
      {control}
      <PreviewStack>
        <FieldSet className="w-full max-w-lg gap-3">
          <FieldLegend>Billing details</FieldLegend>

          <FieldGroup className="gap-3">
            <Field orientation={choose("responsive")}>
              <FieldLabel htmlFor="field-name">Company</FieldLabel>
              <FieldContent>
                <Input id="field-name" placeholder="Cadence Labs" />
                <FieldDescription>Appears on the invoice header.</FieldDescription>
              </FieldContent>
            </Field>

            <Field data-invalid={invalid} orientation={choose("vertical")}>
              <FieldLabel htmlFor="field-vat">VAT number</FieldLabel>
              <FieldContent>
                <Input
                  id="field-vat"
                  aria-invalid={invalid}
                  defaultValue="NL0000"
                  aria-describedby={invalid ? "field-vat-error" : undefined}
                />
                <FieldError id="field-vat-error">
                  {invalid ? "That VAT number has the wrong number of digits." : null}
                </FieldError>
              </FieldContent>
            </Field>

            <Field orientation={choose("horizontal")}>
              <FieldContent>
                <FieldLabel htmlFor="field-currency">Currency</FieldLabel>
                <FieldDescription>Invoices are issued in this currency.</FieldDescription>
              </FieldContent>
              <Input id="field-currency" className="w-20" defaultValue="EUR" />
            </Field>

            <FieldSeparator>or</FieldSeparator>

            <Field orientation={choose("horizontal")} className="flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setInvalid((value) => !value)}>
                Toggle supplied error
              </Button>
              <Button size="sm">Save</Button>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </PreviewStack>
    </>
  );
}
