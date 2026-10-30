"use client";

import { Button } from "@/registry/cadence/button/button";
import { Checkbox } from "@/registry/cadence/checkbox/checkbox";
import { Label } from "@/registry/cadence/label/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/cadence/sheet/sheet";

const FILTERS = [
  { id: "sheet-open", label: "Open only", checked: true },
  { id: "sheet-mine", label: "Assigned to me", checked: false },
  { id: "sheet-stale", label: "No activity for 30 days", checked: false },
] as const;

export function SheetPreview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Open filters</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Applied to this view only. Nothing is saved.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4">
              {FILTERS.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <Checkbox id={filter.id} defaultChecked={filter.checked} />
                  <Label htmlFor={filter.id} className="font-normal">
                    {filter.label}
                  </Label>
                </div>
              ))}
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>Reset</SheetClose>
              <SheetClose render={<Button />}>Apply filters</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger render={<Button variant="ghost" />}>Bottom sheet</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Keyboard shortcuts</SheetTitle>
              <SheetDescription>The panel enters from the edge it belongs to.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>

      <p className="text-xs text-muted-foreground">
        The panel slides in from its own edge by its own size: no fixed distance to re-tune per side. Under reduced
        motion only the fade remains, and the backdrop shortens with it. Escape and the overlay both close it.
      </p>
    </div>
  );
}
