"use client";

import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * The group's characteristics are `variant`, `spacing`, `multiple`, `size`, and
 * `orientation`. Shown as: a joined outline control (the common case), a detached
 * one, a multi-select one, and a vertical one. Each starts with an item pressed, so
 * the shared surface is visible without a click.
 */
export function ToggleGroupPreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <ToggleGroup variant="outline" defaultValue={["left"]} aria-label="Text alignment">
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup variant="outline" spacing={1} defaultValue={["day"]} aria-label="Range">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </PreviewRow>

      <PreviewRow>
        <ToggleGroup multiple defaultValue={["bold"]} aria-label="Text style">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup variant="outline" size="sm" defaultValue={["week"]} aria-label="Range, small">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </PreviewRow>

      <PreviewRow className="items-start gap-6">
        <ToggleGroup orientation="vertical" variant="outline" defaultValue={["left"]} aria-label="Vertical alignment">
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeftIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenterIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRightIcon />
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup orientation="vertical" size="sm" defaultValue={["bold"]} aria-label="Vertical text style">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </PreviewRow>
    </PreviewStack>
  );
}
