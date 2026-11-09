"use client";

import { Reveal } from "@/registry/cadence/reveal";
import { PreviewRow } from "./shell";

export function RevealPreview() {
  return (
    <PreviewRow>
      <Reveal render={<section />} className="rounded-lg border p-5">
        <p className="font-medium">A readable first screen</p>
        <p className="text-muted-foreground text-sm">Content already in view stays visible.</p>
      </Reveal>
    </PreviewRow>
  );
}
