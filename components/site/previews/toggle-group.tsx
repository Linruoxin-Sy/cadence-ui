"use client";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { useState } from "react";
import { AnimatedNumber } from "@/registry/cadence/animated-number";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";
import { PreviewStack } from "./shell";

export function GroupVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "outline", "segmented"] as const).map((variant) => (
        <ToggleGroup key={variant} variant={variant} defaultValue={["week"]} aria-label={`${variant} range`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
export function MultipleGroup() {
  return (
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
  );
}
export function SegmentedGroup() {
  const [range, setRange] = useState(["week"]);
  return (
    <ToggleGroup
      variant="segmented"
      value={range}
      onValueChange={(next) => {
        if (next.length) setRange(next);
      }}
      aria-label="Time range"
    >
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  );
}
export function GroupSpacing() {
  return (
    <div className="flex flex-wrap gap-4">
      {[0, 1].map((spacing) => (
        <ToggleGroup
          key={spacing}
          variant="outline"
          multiple
          spacing={spacing}
          defaultValue={["bold", "italic"]}
          aria-label={`Spacing ${spacing}`}
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
export function VerticalGroup() {
  return (
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
  );
}
export function GroupSizes() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <ToggleGroup key={size} size={size} variant="outline" defaultValue={["day"]} aria-label={`${size} size`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
export function ControlledGroup() {
  const [value, setValue] = useState(["center"]);
  return (
    <div className="grid justify-items-start gap-3">
      <ToggleGroup value={value} onValueChange={setValue} aria-label="Controlled alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selection: {value[0] ?? "none"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setValue(["left"])}>
        Align left externally
      </Button>
    </div>
  );
}
export function DisabledGroups() {
  return (
    <div className="flex flex-wrap gap-4">
      <ToggleGroup defaultValue={["day"]} loopFocus={false} aria-label="Disabled item" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" disabled>
          Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup disabled defaultValue={["day"]} aria-label="Disabled group" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
export function StaticGroup() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <div data-testid="initial-none">
          <ToggleGroup value={["static"]} aria-label="Static group">
            <ToggleGroupItem value="static">On</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <ToggleGroup defaultValue={["first"]} aria-label="Explicit full toggle-group">
              <ToggleGroupItem value="first">First</ToggleGroupItem>
              <ToggleGroupItem value="second">Second</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
export function ChangingGroup() {
  const [value, setValue] = useState(["week"]);
  const [long, setLong] = useState(false);
  const [large, setLarge] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [reorder, setReorder] = useState(false);
  const [quantity, setQuantity] = useState(19);
  const day = (
    <ToggleGroupItem key="day" value="day">
      {long ? "Day overview" : "Day"}
    </ToggleGroupItem>
  );
  const week = (
    <ToggleGroupItem key="week" value="week">
      Week
    </ToggleGroupItem>
  );
  return (
    <div className="grid w-full justify-items-start gap-4">
      <ToggleGroup
        aria-label="Changing range"
        style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
        variant="segmented"
        value={value}
        onValueChange={setValue}
        multiple={multiple}
        size={large ? "lg" : "default"}
      >
        {reorder ? [week, day] : [day, week]}
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setLong(!long)}>
          Change label
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLarge(!large)}>
          Change size
        </Button>
        <Button variant="outline" size="sm" onClick={() => setReorder(!reorder)}>
          Reorder items
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLong(!long);
            setLarge(!large);
            setValue([value[0] === "month" ? "week" : "month"]);
          }}
        >
          Change together
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMultiple(!multiple);
            setValue(["week"]);
          }}
        >
          {multiple ? "Use single selection" : "Use multiple selection"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setValue([])}>
          Clear selection
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        Selected: {value.join(", ") || "none"}
      </p>
      <ToggleGroup aria-label="Explicit quantities" value={["items"]} variant="outline">
        <ToggleGroupItem value="identity">2026</ToggleGroupItem>
        <ToggleGroupItem value="items">
          <span>Items</span>
          <AnimatedNumber value={quantity} />
        </ToggleGroupItem>
      </ToggleGroup>
      <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
        Add an item
      </Button>
    </div>
  );
}
function Specimen() {
  return (
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
  );
}
export function ToggleGroupPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "variants" ? (
        <GroupVariants />
      ) : example === "multiple" ? (
        <MultipleGroup />
      ) : example === "segmented" ? (
        <SegmentedGroup />
      ) : example === "spacing" ? (
        <GroupSpacing />
      ) : example === "vertical" ? (
        <VerticalGroup />
      ) : example === "sizes" ? (
        <GroupSizes />
      ) : example === "controlled" ? (
        <ControlledGroup />
      ) : example === "disabled" ? (
        <DisabledGroups />
      ) : example === "without-motion" ? (
        <StaticGroup />
      ) : example === "changing-content" ? (
        <ChangingGroup />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
