"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/cadence/dialog";
import { Field, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow } from "./shell";

function EditingDialog() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("cadence-ui");
  const [saved, setSaved] = useState("cadence-ui");
  return (
    <div className="flex flex-col items-start gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The URL stays the same. Existing links keep working.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor={id}>Project name</FieldLabel>
              <Input id={id} value={name} onValueChange={setName} required />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit">Save name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground" role="status">
        Project: {saved}
      </p>
    </div>
  );
}

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from application state
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application-owned dialog</DialogTitle>
            <DialogDescription>
              The caller owns open. Escape and outside presses still report changes.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setOpen(false)}>Finish task</Button>
        </DialogContent>
      </Dialog>
      <p role="status" className="text-sm text-muted-foreground">
        Dialog {open ? "open" : "closed"}
      </p>
    </div>
  );
}

function WithoutCloseDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Review changes</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>
            The corner button is hidden. This visible action and Escape still close the dialog.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Done reviewing</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FooterCloseDialog() {
  const [prepared, setPrepared] = useState(false);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Export details</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export details</DialogTitle>
          <DialogDescription>Prepare the export without dismissing the panel.</DialogDescription>
        </DialogHeader>
        <p role="status" className="text-sm">
          {prepared ? "Export prepared" : "Ready to export"}
        </p>
        <DialogFooter showCloseButton>
          <Button onClick={() => setPrepared(true)}>Prepare export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LongContentDialog() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Read the changelog</DialogTrigger>
      <DialogContent initialFocus={titleRef} className="max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
            Release notes
          </DialogTitle>
          <DialogDescription>Scroll this panel to read every change.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm text-muted-foreground">
          {Array.from({ length: 16 }, (_, index) => index + 1).map((change) => (
            <p key={change}>
              Change {change}: Components keep their native semantics, caller-owned data, and documented full, reduced,
              and none motion behavior.
            </p>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function DialogModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Dialog key={String(modal)} modal={modal}>
          <DialogTrigger render={<Button variant="outline" />}>{String(modal)}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modal: {String(modal)}</DialogTitle>
              <DialogDescription>
                True traps focus and locks page scrolling; false removes the focus trap and scroll lock; trap-focus
                keeps the focus trap without scroll locking. DialogContent still renders a backdrop.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}

function DialogMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Open without motion</DialogTrigger>
          <DialogContent data-testid="initial-none">
            <DialogHeader>
              <DialogTitle>Immediate dialog</DialogTitle>
              <DialogDescription>Both overlay and panel start with zero duration.</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
        <CadenceProvider mode="full">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Open nested full</DialogTrigger>
            <DialogContent data-testid="nested-full">
              <DialogHeader>
                <DialogTitle>Nested full dialog</DialogTitle>
                <DialogDescription>
                  This explicit scope restores timing; the system reduced preference still wins.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function DialogPreview({ example }: { example?: string }) {
  if (example === "editing") return <EditingDialog />;
  if (example === "controlled") return <ControlledDialog />;
  if (example === "without-close") return <WithoutCloseDialog />;
  if (example === "footer-close") return <FooterCloseDialog />;
  if (example === "long-content") return <LongContentDialog />;
  if (example === "modality") return <DialogModality />;
  if (example === "without-motion") return <DialogMotionScopes />;
  return (
    <PreviewRow>
      <EditingDialog />
    </PreviewRow>
  );
}
