"use client";

import { Button } from "@/registry/cadence/button";
import { Kbd, KbdGroup } from "@/registry/cadence/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/cadence/tooltip";
import { PreviewRow } from "./shell";

function SingleKey() {
  return <Kbd>Esc</Kbd>;
}

function Combination() {
  return (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  );
}

function InsideTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save changes</TooltipTrigger>
      <TooltipContent>
        Save{" "}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}

const examples = { single: SingleKey, combination: Combination, tooltip: InsideTooltip };

export function KbdPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Kbd example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewRow className="gap-5">
      <Kbd>Esc</Kbd>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </PreviewRow>
  );
}
