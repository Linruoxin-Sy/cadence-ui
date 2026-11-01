"use client";

import { BoldIcon, ItalicIcon } from "lucide-react";
import { Toggle } from "@/registry/cadence/toggle";
import { ControlMotionScope } from "./control-motion-scope";
import { PreviewRow } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "outline"] as const;

/**
 * Both variants in both states, side by side: the pressed fill is the whole point of
 * a toggle, and it only reads as a state next to its un-pressed twin. The second row
 * carries the sizes and the disabled texture.
 */
export function TogglePreview() {
  const { control, choose } = usePreviewVariant("Toggle", previewVariantOptions);
  return (
    <>
      {control}
      <ControlMotionScope
        staticControl={
          <Toggle aria-label="Static toggle" defaultPressed variant={choose("default")}>
            On
          </Toggle>
        }
      >
        <PreviewRow>
          <Toggle aria-label="Bold" variant={choose("default")}>
            <BoldIcon />
          </Toggle>
          <Toggle aria-label="Bold (pressed)" defaultPressed variant={choose("default")}>
            <BoldIcon />
          </Toggle>
          <Toggle variant={choose("outline")} aria-label="Italic">
            <ItalicIcon />
          </Toggle>
          <Toggle variant={choose("outline")} aria-label="Italic (pressed)" defaultPressed>
            <ItalicIcon />
          </Toggle>
        </PreviewRow>

        <PreviewRow>
          <Toggle size="sm" variant={choose("outline")}>
            Small
          </Toggle>
          <Toggle variant={choose("outline")}>Default</Toggle>
          <Toggle size="lg" variant={choose("outline")}>
            Large
          </Toggle>
          <Toggle variant={choose("outline")} disabled>
            Disabled
          </Toggle>
        </PreviewRow>
      </ControlMotionScope>
    </>
  );
}
