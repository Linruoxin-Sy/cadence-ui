"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/cadence/select";
import { PreviewRow, PreviewStack } from "./shell";

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
] as const;

/**
 * Closed, a select is its trigger, so the specimen is the trigger's range: a chosen
 * value, the placeholder, the `sm` size, disabled, and invalid. Open any of them —
 * the label flies from the option into the trigger and the slot folds to the new
 * width.
 */
export function SelectPreview() {
  const items = FRAMEWORKS.map((framework) => (
    <SelectItem key={framework.value} value={framework.value}>
      {framework.label}
    </SelectItem>
  ));

  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <Select defaultValue="next">
          <SelectTrigger aria-label="Framework">
            <SelectValue placeholder="Choose a framework" />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>

        <Select>
          <SelectTrigger aria-label="Framework, empty">
            <SelectValue placeholder="Choose a framework" />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>

        <Select defaultValue="remix">
          <SelectTrigger size="sm" aria-label="Framework, small">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      </PreviewRow>

      <PreviewRow className="gap-3">
        <Select disabled defaultValue="next">
          <SelectTrigger aria-label="Framework, disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>

        <Select defaultValue="astro">
          <SelectTrigger aria-label="Framework, invalid" aria-invalid="true">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{items}</SelectContent>
        </Select>
      </PreviewRow>
    </PreviewStack>
  );
}
