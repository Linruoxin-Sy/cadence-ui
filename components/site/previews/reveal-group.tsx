"use client";

import { Reveal } from "@/registry/cadence/reveal";
import { RevealGroup } from "@/registry/cadence/reveal-group";
import { PreviewRow } from "./shell";

export function RevealGroupPreview() {
  return (
    <PreviewRow>
      <section className="flex max-w-sm flex-col gap-4" aria-label="Narrative chapters">
        <p className="text-muted-foreground text-sm">A shared entrance policy.</p>
        <RevealGroup stagger="cycle">
          <Reveal className="rounded-md bg-muted p-4">A readable chapter</Reveal>
        </RevealGroup>
      </section>
    </PreviewRow>
  );
}
