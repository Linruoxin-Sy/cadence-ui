"use client";

import { BoldIcon, ItalicIcon } from "lucide-react";
import { Toggle } from "@/registry/cadence/toggle";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Both variants in both states, side by side: the pressed fill is the whole point of
 * a toggle, and it only reads as a state next to its un-pressed twin. The second row
 * carries the sizes and the disabled texture.
 */
export function TogglePreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Toggle aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle aria-label="Bold (pressed)" defaultPressed>
          <BoldIcon />
        </Toggle>
        <Toggle variant="outline" aria-label="Italic">
          <ItalicIcon />
        </Toggle>
        <Toggle variant="outline" aria-label="Italic (pressed)" defaultPressed>
          <ItalicIcon />
        </Toggle>
      </PreviewRow>

      <PreviewRow>
        <Toggle size="sm" variant="outline">
          Small
        </Toggle>
        <Toggle variant="outline">Default</Toggle>
        <Toggle size="lg" variant="outline">
          Large
        </Toggle>
        <Toggle variant="outline" disabled>
          Disabled
        </Toggle>
      </PreviewRow>
    </PreviewStack>
  );
}
