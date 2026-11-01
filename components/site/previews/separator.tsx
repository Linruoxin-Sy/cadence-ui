"use client";

import { Separator } from "@/registry/cadence/separator";
import { PreviewRow, PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["horizontal", "vertical"] as const;

/**
 * Two orientations, and the two roles a rule can play: a real boundary that screen
 * readers announce, and `decorative`, which is a line and nothing else. The vertical
 * pair sits in a `h-6` row because a vertical separator takes its height from the
 * box it divides.
 */
export function SeparatorPreview() {
  const { control, choose } = usePreviewVariant("Separator", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <PreviewRow>
          <div className="grid w-72 gap-3 text-sm">
            <span>Signed in as ada@example.com.</span>
            <Separator className="data-[orientation=vertical]:h-6" orientation={choose("horizontal")} />
            <span className="text-muted-foreground">Billing is handled by finance.</span>
            <Separator decorative orientation={choose("horizontal")} />
            <span className="text-muted-foreground">This second rule is decorative.</span>
          </div>
        </PreviewRow>

        <PreviewRow>
          <div className="flex min-h-6 flex-wrap items-center gap-3 text-sm">
            <span>Draft</span>
            <Separator orientation={choose("vertical")} className="data-[orientation=vertical]:h-6" />
            <span className="text-muted-foreground">Edited 2 minutes ago</span>
            <Separator orientation={choose("vertical")} className="data-[orientation=vertical]:h-6" />
            <span className="text-muted-foreground">ada@example.com</span>
          </div>
        </PreviewRow>
      </PreviewStack>
    </>
  );
}
