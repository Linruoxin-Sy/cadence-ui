"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/cadence/drawer";
import { Field, FieldGroup, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function MoveConversation() {
  const [destination, setDestination] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Drawer showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move conversation</DrawerTitle>
            <DrawerDescription>Drag down to dismiss, or choose a local destination.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-1 py-4">
            {["Inbox", "Archive", "Read later"].map((value) => (
              <DrawerClose
                key={value}
                render={<Button variant="ghost" className="justify-start" onClick={() => setDestination(value)} />}
              >
                {value}
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm text-muted-foreground">
        {destination}
      </p>
    </div>
  );
}

function DrawerHandles() {
  return (
    <div className="flex flex-wrap gap-3">
      {[false, true].map((handle) => (
        <Drawer key={String(handle)} showSwipeHandle={handle}>
          <DrawerTrigger render={<Button variant="outline" />}>
            {handle ? "With handle" : "Without handle"}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Swipe cue</DrawerTitle>
              <DrawerDescription>Drag down or use the close action.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}

function DrawerDirections() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["down", "up", "left", "right"] as const).map((direction) => (
        <Drawer key={direction} swipeDirection={direction} showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>{direction}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{direction} drawer</DrawerTitle>
              <DrawerDescription>Swipe {direction} to dismiss.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}

function SnappingDrawer() {
  const [snap, setSnap] = useState<number | string | null>(0.5);
  return (
    <Drawer showSwipeHandle snapPoints={[0.5, 1]} snapPoint={snap} onSnapPointChange={setSnap}>
      <DrawerTrigger render={<Button variant="outline" />}>Open snap points</DrawerTrigger>
      <DrawerContent className="h-[80dvh]">
        <DrawerHeader>
          <DrawerTitle>Reading queue</DrawerTitle>
          <DrawerDescription>Expand to read more, or drag between snap points.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-wrap gap-2 py-4">
          <Button variant="outline" onClick={() => setSnap(1)}>
            Expand
          </Button>
          <Button variant="outline" onClick={() => setSnap(0.5)}>
            Peek
          </Button>
        </div>
        <p role="status" className="text-sm">
          Snap: {String(snap)}
        </p>
        <ol className="flex flex-col gap-4 py-4">
          {Array.from({ length: 20 }, (_, index) => (
            <li key={index.toString()} className="rounded-md border p-3 text-sm">
              Reading item {index + 1}
            </li>
          ))}
        </ol>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Drawer key={String(modal)} modal={modal} showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>{String(modal)}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Mode: {String(modal)}</DrawerTitle>
              <DrawerDescription>Focus and scrolling follow this mode.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}

function ControlledDrawer() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("Read later");
  const [saved, setSaved] = useState("Read later");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" />}>Edit destination</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Destination label</DrawerTitle>
            <DrawerDescription>Rename this local example destination.</DrawerDescription>
          </DrawerHeader>
          <form
            className="flex flex-col gap-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(draft);
              setOpen(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={id}>Destination draft</FieldLabel>
                <Input id={id} value={draft} onValueChange={setDraft} />
              </Field>
            </FieldGroup>
            <DrawerFooter>
              <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
              <Button type="submit">Save destination</Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm">
        Saved: {saved}
      </p>
    </div>
  );
}

function DrawerMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Drawer showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>Open without motion</DrawerTrigger>
          <DrawerContent data-testid="initial-none">
            <DrawerHeader>
              <DrawerTitle>Immediate drawer</DrawerTitle>
              <DrawerDescription>No authored transition.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <CadenceProvider mode="full">
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button variant="outline" />}>Open nested full</DrawerTrigger>
            <DrawerContent data-testid="nested-full">
              <DrawerHeader>
                <DrawerTitle>Nested full drawer</DrawerTitle>
                <DrawerDescription>The OS preference still wins.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function DrawerPreview({ example }: { example?: string }) {
  if (example === "handle") return <DrawerHandles />;
  if (example === "directions") return <DrawerDirections />;
  if (example === "snap-points") return <SnappingDrawer />;
  if (example === "modality") return <DrawerModality />;
  if (example === "controlled") return <ControlledDrawer />;
  if (example === "without-motion") return <DrawerMotionScopes />;
  return <MoveConversation />;
}
