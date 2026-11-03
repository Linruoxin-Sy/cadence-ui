"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Checkbox } from "@/registry/cadence/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
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

function FiltersSheet() {
  const id = useId();
  const [openOnly, setOpenOnly] = useState(true);
  const [applied, setApplied] = useState("Open only");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open filters</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Choose filters for this local view.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4">
            <Field orientation="horizontal">
              <Checkbox id={id} checked={openOnly} onCheckedChange={setOpenOnly} />
              <FieldLabel htmlFor={id}>Open only</FieldLabel>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpenOnly(false)}>
              Clear selection
            </Button>
            <SheetClose render={<Button onClick={() => setApplied(openOnly ? "Open only" : "All items")} />}>
              Apply filters
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p role="status" className="text-sm text-muted-foreground">
        {applied}
      </p>
    </div>
  );
}

function SheetEdges() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["right", "left", "top", "bottom"] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" />}>{side}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{side} sheet</SheetTitle>
              <SheetDescription>A fixed {side} edge.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

function FooterCloseSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open footer close</SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>View details</SheetTitle>
          <SheetDescription>The footer provides the visible close action.</SheetDescription>
        </SheetHeader>
        <p className="px-4 text-sm">A short details panel.</p>
        <SheetFooter>
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function LongSheet() {
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Browse activity</SheetTrigger>
      <SheetContent initialFocus={title}>
        <SheetHeader>
          <SheetTitle ref={title} tabIndex={-1}>
            Activity
          </SheetTitle>
          <SheetDescription>Scroll the list while the footer stays in view.</SheetDescription>
        </SheetHeader>
        <section
          aria-label="Activity entries"
          className="min-h-0 flex-1 overflow-y-auto px-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ol className="flex flex-col gap-4">
            {Array.from({ length: 30 }, (_, index) => (
              <li key={index.toString()} className="rounded-md border p-3 text-sm">
                <a href="/docs/changelog" className="underline underline-offset-4">
                  Activity {index + 1}: documentation updated.
                </a>
              </li>
            ))}
          </ol>
        </section>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ControlledSheet() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("Weekly digest");
  const [saved, setSaved] = useState("Weekly digest");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" />}>Edit title</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit title</SheetTitle>
            <SheetDescription>Save changes to this local example.</SheetDescription>
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(draft);
              setOpen(false);
            }}
          >
            <FieldGroup className="px-4">
              <Field>
                <FieldLabel htmlFor={id}>Title draft</FieldLabel>
                <Input id={id} value={draft} onValueChange={setDraft} />
              </Field>
            </FieldGroup>
            <SheetFooter>
              <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
              <Button type="submit">Save title</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <p role="status" className="text-sm">
        Saved: {saved}
      </p>
    </div>
  );
}

function SheetModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Sheet key={String(modal)} modal={modal}>
          <SheetTrigger render={<Button variant="outline" />}>{String(modal)}</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Mode: {String(modal)}</SheetTitle>
              <SheetDescription>Focus and scrolling follow the root modal setting.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

function SheetMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Open without motion</SheetTrigger>
          <SheetContent data-testid="initial-none">
            <SheetHeader>
              <SheetTitle>Immediate sheet</SheetTitle>
              <SheetDescription>No entering motion.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <CadenceProvider mode="full">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Open nested full</SheetTrigger>
            <SheetContent data-testid="nested-full">
              <SheetHeader>
                <SheetTitle>Nested full sheet</SheetTitle>
                <SheetDescription>The OS preference still wins.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function SheetPreview({ example }: { example?: string }) {
  if (example === "edges") return <SheetEdges />;
  if (example === "footer-close") return <FooterCloseSheet />;
  if (example === "long-list") return <LongSheet />;
  if (example === "controlled") return <ControlledSheet />;
  if (example === "modality") return <SheetModality />;
  if (example === "without-motion") return <SheetMotionScopes />;
  return <FiltersSheet />;
}
