"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group/toggle-group";

export function ToggleGroupPreview() {
  const [align, setAlign] = useState<string[]>(["left"]);
  const [marks, setMarks] = useState<string[]>(["bold"]);

  return (
    <div className="flex flex-col items-center gap-6">
      <ToggleGroup variant="outline" value={align} onValueChange={(next) => setAlign(next)} aria-label="Text alignment">
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup multiple value={marks} onValueChange={(next) => setMarks(next)} aria-label="Text style">
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup variant="outline" spacing={1} defaultValue={["day"]} aria-label="Range">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
