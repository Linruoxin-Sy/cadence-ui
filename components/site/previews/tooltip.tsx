"use client";

import { BoldIcon, ItalicIcon, Link2Icon, UnderlineIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/cadence/tooltip";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Four placements on one row, each a different `side`, because the placement is the
 * only thing a tooltip really decides. The content shows both shapes: a label with a
 * shortcut, and a plain sentence.
 */
export function TooltipPreview() {
  return (
    <PreviewStack>
      <TooltipProvider delay={150}>
        <PreviewRow className="gap-2">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Bold">
              <BoldIcon />
            </TooltipTrigger>
            <TooltipContent side="top">
              Bold <span className="opacity-70">(⌘B)</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Italic">
              <ItalicIcon />
            </TooltipTrigger>
            <TooltipContent side="right">
              Italic <span className="opacity-70">(⌘I)</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Underline">
              <UnderlineIcon />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Underline <span className="opacity-70">(⌘U)</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Insert link">
              <Link2Icon />
            </TooltipTrigger>
            <TooltipContent side="left">
              Insert link <span className="opacity-70">(⌘K)</span>
            </TooltipContent>
          </Tooltip>
        </PreviewRow>
      </TooltipProvider>
    </PreviewStack>
  );
}
