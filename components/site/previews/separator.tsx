"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
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

function Changing() {
  const [shown, show] = useState(true);
  const [vertical, orient] = useState(false);
  const [long, resize] = useState(false);
  const [accent, colour] = useState(false);
  return (
    <div className="grid w-full gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => show(!shown)}>
          Toggle rule
        </button>
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => orient(!vertical)}>
          Change orientation
        </button>
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => resize(!long)}>
          Change length
        </button>
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => colour(!accent)}>
          Change colour
        </button>
      </div>
      <div className="flex h-48 items-center justify-center rounded-lg border p-4" data-rule-stage="">
        <AnimatePresence initial={false}>
          {shown && (
            <Separator
              key="rule"
              orientation={vertical ? "vertical" : "horizontal"}
              style={{ [vertical ? "height" : "width"]: long ? 160 : 80 }}
              className={accent ? "bg-primary" : "bg-border"}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const examples = { horizontal: Horizontal, vertical: Vertical, decorative: Decorative, changing: Changing };

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
