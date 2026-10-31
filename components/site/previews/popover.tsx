"use client";

import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Label } from "@/registry/cadence/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/cadence/popover";
import { PreviewRow, PreviewStack } from "./shell";

const COLUMNS = [
  { id: "column-name", label: "Name", checked: true },
  { id: "column-status", label: "Status", checked: true },
  { id: "column-owner", label: "Owner", checked: true },
  { id: "column-updated", label: "Updated", checked: false },
] as const;

/**
 * A popover is its content, so the specimen is the two contents it is used with: a
 * header plus a list of controls, and a bare paragraph. `align` moves the panel under
 * the trigger's left or right edge.
 */
export function PopoverPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
          <PopoverContent align="start">
            <PopoverHeader>
              <PopoverTitle>Visible columns</PopoverTitle>
              <PopoverDescription>Three of four columns are shown.</PopoverDescription>
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

        <Popover>
          <PopoverTrigger render={<Button variant="ghost" />}>Plain content</PopoverTrigger>
          <PopoverContent align="end" className="w-64 text-sm">
            A popover is not a dialog: it does not trap focus and clicking outside closes it.
          </PopoverContent>
        </Popover>
      </PreviewRow>
    </PreviewStack>
  );
}
