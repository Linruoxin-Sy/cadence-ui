"use client";

import { useState } from "react";
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

function ChangingShortcut() {
  const [revision, setRevision] = useState(false);
  const [extra, setExtra] = useState(false);
  const labels = [
    { id: "control", label: revision ? "Control" : "Ctrl" },
    { id: "alt", label: revision ? "Shift" : "Alt" },
    { id: "key", label: revision ? "10" : "9" },
  ];
  return (
    <div className="flex w-full flex-col items-start gap-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setRevision((value) => !value)}>
          Change platform labels
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExtra((value) => !value)}>
          Toggle modifier
        </Button>
      </div>
      <p className="flex max-w-full flex-wrap items-center gap-2 text-sm text-muted-foreground">
        Run command
        <KbdGroup>
          {labels.map(({ id, label }) => (
            <Kbd key={id} style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
              {label}
            </Kbd>
          ))}
          {extra && <Kbd key="extra">Fn</Kbd>}
        </KbdGroup>
      </p>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>Inspect changing shortcut</TooltipTrigger>
        <TooltipContent>
          Command{" "}
          <KbdGroup>
            {labels.slice(0, 2).map(({ id, label }) => (
              <Kbd key={id} style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
                {label}
              </Kbd>
            ))}
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const examples = { single: SingleKey, combination: Combination, tooltip: InsideTooltip, changing: ChangingShortcut };

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
