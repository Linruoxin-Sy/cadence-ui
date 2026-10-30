"use client";

import { Bold, Italic, Link2, Underline } from "lucide-react";
import { Button } from "@/registry/cadence/button/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/cadence/tooltip/tooltip";

const FORMATS = [
  { id: "bold", label: "Bold", shortcut: "⌘B", icon: Bold },
  { id: "italic", label: "Italic", shortcut: "⌘I", icon: Italic },
  { id: "underline", label: "Underline", shortcut: "⌘U", icon: Underline },
  { id: "link", label: "Insert link", shortcut: "⌘K", icon: Link2 },
] as const;

export function TooltipPreview() {
  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1">
          {FORMATS.map(({ id, label, shortcut, icon: Icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label={label}>
                <Icon />
              </TooltipTrigger>
              <TooltipContent>
                {label} <span className="opacity-70">({shortcut})</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Hover a control, or tab to it: the label fades in and grows out of the anchor. Escape hides it and leaves
          focus where it was. The shortcut is a hint, not the accessible name — each button has its own
          <code className="mx-1">aria-label</code>.
        </p>
      </div>
    </TooltipProvider>
  );
}
