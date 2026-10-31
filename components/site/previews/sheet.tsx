"use client";

import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Label } from "@/registry/cadence/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/cadence/sheet";
import { PreviewRow, PreviewStack } from "./shell";

const SIDES = [
  { side: "right", label: "Right" },
  { side: "left", label: "Left" },
  { side: "top", label: "Top" },
  { side: "bottom", label: "Bottom" },
] as const;

/**
 * The side is the component's characteristic, so the specimen is one trigger per
 * edge: the panel enters from the edge it belongs to, sized by its own content. The
 * right-hand panel carries the full composition — header, body, footer.
 */
export function SheetPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-2">
        {SIDES.map(({ side, label }) => (
          <Sheet key={side}>
            <SheetTrigger render={<Button variant={side === "right" ? "outline" : "ghost"} />}>{label}</SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Applied to this view only. Nothing is saved.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4">
                <div className="flex items-center gap-2">
                  <Checkbox id={`sheet-open-${side}`} defaultChecked />
                  <Label htmlFor={`sheet-open-${side}`} className="font-normal">
                    Open only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id={`sheet-mine-${side}`} />
                  <Label htmlFor={`sheet-mine-${side}`} className="font-normal">
                    Assigned to me
                  </Label>
                </div>
              </div>
              <SheetFooter>
                <SheetClose render={<Button variant="outline" />}>Reset</SheetClose>
                <SheetClose render={<Button />}>Apply filters</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </PreviewRow>
    </PreviewStack>
  );
}
