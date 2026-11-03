"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { BoldIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/cadence/tooltip";
import { PreviewRow } from "./shell";

function BoldTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Bold">
        <BoldIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>Bold (⌘B)</TooltipContent>
    </Tooltip>
  );
}

function TooltipSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
          <TooltipContent side={side} sideOffset={8}>
            {side} placement
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function TooltipAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Tooltip key={align}>
          <TooltipTrigger render={<Button variant="outline" />}>{align}</TooltipTrigger>
          <TooltipContent align={align} alignOffset={0}>
            {align} alignment with this trigger
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function LogicalTooltips() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
            <TooltipContent side={side}>{side} follows RTL</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </DirectionProvider>
  );
}

function AppTooltipDelay() {
  return (
    <TooltipProvider delay={300}>
      <div className="flex flex-wrap gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Upload help</TooltipTrigger>
          <TooltipContent>Upload files up to 10 MB</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Share help</TooltipTrigger>
          <TooltipContent>Only invited people can read this project</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function DisabledControlTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            render={<span />}
            nativeButton={false}
            disabled
            focusableWhenDisabled
            variant="ghost"
            className="h-auto p-0"
          />
        }
        aria-label="Why Deploy is unavailable"
      >
        <Button disabled className="pointer-events-none">
          Deploy
        </Button>
      </TooltipTrigger>
      <TooltipContent>Finish the required fields first</TooltipContent>
    </Tooltip>
  );
}

function ControlledTooltip() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide shortcut" : "Show shortcut"}
      </Button>
      <Tooltip open={open} onOpenChange={setOpen} triggerId={id}>
        <TooltipTrigger id={id} render={<Button variant="outline" />}>
          Keyboard help
        </TooltipTrigger>
        <TooltipContent>Press ⌘K to search</TooltipContent>
      </Tooltip>
    </div>
  );
}

function TooltipMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Open without motion</TooltipTrigger>
          <TooltipContent data-testid="initial-none">Immediate tooltip</TooltipContent>
        </Tooltip>
        <CadenceProvider mode="full">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Open nested full</TooltipTrigger>
            <TooltipContent data-testid="nested-full">The OS preference still wins</TooltipContent>
          </Tooltip>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function TooltipPreview({ example }: { example?: string }) {
  if (example === "sides") return <TooltipSides />;
  if (example === "alignments") return <TooltipAlignments />;
  if (example === "logical-sides") return <LogicalTooltips />;
  if (example === "delay") return <AppTooltipDelay />;
  if (example === "disabled") return <DisabledControlTooltip />;
  if (example === "controlled") return <ControlledTooltip />;
  if (example === "without-motion") return <TooltipMotionScopes />;
  return (
    <PreviewRow>
      <BoldTooltip />
    </PreviewRow>
  );
}
