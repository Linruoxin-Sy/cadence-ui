"use client";

import { Button } from "@/registry/cadence/button/button";
import { Checkbox } from "@/registry/cadence/checkbox/checkbox";
import { Label } from "@/registry/cadence/label/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/cadence/popover/popover";

const COLUMNS = [
  { id: "column-name", label: "Name", checked: true },
  { id: "column-status", label: "Status", checked: true },
  { id: "column-owner", label: "Owner", checked: true },
  { id: "column-updated", label: "Updated", checked: false },
  { id: "column-created", label: "Created", checked: false },
] as const;

export function PopoverPreview() {
  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Visible columns</PopoverTitle>
            <PopoverDescription>Three of five columns are shown.</PopoverDescription>
          </PopoverHeader>
          <div className="flex flex-col gap-2">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex items-center gap-2">
                <Checkbox id={column.id} defaultChecked={column.checked} />
                <Label htmlFor={column.id} className="font-normal">
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        The panel grows out of its anchor: Base UI sets <code>--transform-origin</code> where the trigger meets the
        panel, so the scale starts there. Press Escape or click outside to close; the control you clicked keeps the
        focus ring.
      </p>
    </div>
  );
}
