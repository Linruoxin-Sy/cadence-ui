"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Field, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/cadence/popover";
import { PreviewRow } from "./shell";

function ColumnPopover() {
  const id = useId();
  const [columns, setColumns] = useState(["Name", "Status", "Owner"]);
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Visible columns</PopoverTitle>
          <PopoverDescription>{columns.length} of four columns are shown.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex flex-col gap-2">
          {["Name", "Status", "Owner", "Updated"].map((column) => (
            <div key={column} className="flex items-center gap-2">
              <Checkbox
                id={`${id}-${column}`}
                checked={columns.includes(column)}
                onCheckedChange={(checked) =>
                  setColumns((previous) =>
                    checked ? [...previous, column] : previous.filter((value) => value !== column),
                  )
                }
              />
              <Label htmlFor={`${id}-${column}`} className="font-normal">
                {column}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PopoverSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline" />}>{side}</PopoverTrigger>
          <PopoverContent side={side} sideOffset={8} className="w-48">
            <PopoverHeader>
              <PopoverTitle>{side} placement</PopoverTitle>
              <PopoverDescription>Base UI can flip this panel to avoid a collision.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function PopoverAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Popover key={align}>
          <PopoverTrigger render={<Button variant="outline" />}>{align}</PopoverTrigger>
          <PopoverContent align={align} alignOffset={0} className="w-48">
            <PopoverHeader>
              <PopoverTitle>{align} alignment</PopoverTitle>
              <PopoverDescription>Aligned to this trigger along the cross axis.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function LogicalPopovers() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Popover key={side}>
            <PopoverTrigger render={<Button variant="outline" />}>{side}</PopoverTrigger>
            <PopoverContent side={side} className="w-48">
              <PopoverHeader>
                <PopoverTitle>{side}</PopoverTitle>
                <PopoverDescription>Logical placement follows right-to-left direction.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </DirectionProvider>
  );
}

function FormPopover() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Open PRs");
  const [saved, setSaved] = useState("Open PRs");
  return (
    <div className="flex flex-col items-start gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>Rename view</PopoverTrigger>
        <PopoverContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <PopoverHeader>
              <PopoverTitle>Rename this view</PopoverTitle>
              <PopoverDescription>The caller owns this draft and the saved name.</PopoverDescription>
            </PopoverHeader>
            <Field>
              <FieldLabel htmlFor={id}>View name</FieldLabel>
              <Input id={id} value={name} onValueChange={setName} required />
            </Field>
            <Button type="submit">Save view</Button>
          </form>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-sm text-muted-foreground">
        View: {saved}
      </p>
    </div>
  );
}

function ControlledPopover() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from application state
      </Button>
      <Popover open={open} onOpenChange={setOpen} triggerId={id}>
        <PopoverTrigger id={id} render={<Button variant="outline" />}>
          View options
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Application-owned panel</PopoverTitle>
            <PopoverDescription>The trigger ID anchors external open updates to the same trigger.</PopoverDescription>
          </PopoverHeader>
          <Button className="mt-3" onClick={() => setOpen(false)}>
            Finish editing
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ModalPopovers() {
  return (
    <div className="flex flex-wrap gap-3">
      {([false, true, "trap-focus"] as const).map((modal) => (
        <Popover key={String(modal)} modal={modal}>
          <PopoverTrigger render={<Button variant="outline" />}>{String(modal)}</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Modal: {String(modal)}</PopoverTitle>
              <PopoverDescription>
                False allows page interaction. True blocks outside interaction and locks desktop page scrolling.
                Trap-focus keeps focus inside without scroll locking.
              </PopoverDescription>
            </PopoverHeader>
            <PopoverPrimitive.Close render={<Button variant="outline" className="mt-3" />}>
              Close options
            </PopoverPrimitive.Close>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function PopoverMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>Open without motion</PopoverTrigger>
          <PopoverContent data-testid="initial-none">
            <PopoverHeader>
              <PopoverTitle>Immediate popover</PopoverTitle>
              <PopoverDescription>This portal starts at zero duration.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <CadenceProvider mode="full">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Open nested full</PopoverTrigger>
            <PopoverContent data-testid="nested-full">
              <PopoverHeader>
                <PopoverTitle>Nested full popover</PopoverTitle>
                <PopoverDescription>The OS preference still wins over explicit full.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function PopoverPreview({ example }: { example?: string }) {
  if (example === "columns") return <ColumnPopover />;
  if (example === "sides") return <PopoverSides />;
  if (example === "alignments") return <PopoverAlignments />;
  if (example === "logical-sides") return <LogicalPopovers />;
  if (example === "form") return <FormPopover />;
  if (example === "controlled") return <ControlledPopover />;
  if (example === "modal") return <ModalPopovers />;
  if (example === "without-motion") return <PopoverMotionScopes />;
  return (
    <PreviewRow>
      <ColumnPopover />
    </PreviewRow>
  );
}
