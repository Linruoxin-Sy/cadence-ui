"use client";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/cadence/command";
import { PopupMotionScope } from "./popup-motion-scope";

function Actions({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <Command label="Workspace actions" className="rounded-lg border">
      <CommandInput placeholder="Search workspace..." />
      <CommandList>
        <CommandEmpty>No actions found.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem value="projects" onSelect={onSelect}>
            Open projects
          </CommandItem>
          <CommandItem value="search" keywords={["find"]} onSelect={onSelect}>
            Search files
          </CommandItem>
          <CommandItem value="archive" disabled>
            Archive workspace
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem value="settings" onSelect={onSelect}>
            Settings<CommandShortcut>Ctrl+S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
export function CommandPreview() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("No action yet");
  return (
    <PopupMotionScope>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Actions onSelect={setSelected} />
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open command palette
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {selected}
        </p>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <Actions
            onSelect={(value) => {
              setSelected(value);
              setOpen(false);
            }}
          />
        </CommandDialog>
      </div>
    </PopupMotionScope>
  );
}
