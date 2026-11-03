"use client";

import { Separator } from "@/registry/cadence/separator";
import { PreviewStack } from "./shell";

function Horizontal() {
  return (
    <div className="grid w-full max-w-72 gap-3 text-sm">
      <span>Signed in as ada@example.com.</span>
      <Separator />
      <span className="text-muted-foreground">Billing is handled by finance.</span>
    </div>
  );
}

function Vertical() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Draft</span>
      <Separator orientation="vertical" />
      <span className="text-muted-foreground">Edited 2 minutes ago</span>
    </div>
  );
}

function Decorative() {
  return (
    <div className="grid w-full max-w-72 gap-3 text-sm">
      <span>Cadence UI</span>
      <Separator decorative />
      <span className="text-muted-foreground">Made for your next project.</span>
    </div>
  );
}

const examples = { horizontal: Horizontal, vertical: Vertical, decorative: Decorative };

export function SeparatorPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Separator example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <Horizontal />
      <Vertical />
    </PreviewStack>
  );
}
