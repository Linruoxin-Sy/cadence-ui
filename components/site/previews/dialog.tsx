"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/cadence/dialog/dialog";
import { Field, FieldLabel } from "@/registry/cadence/field/field";
import { Input } from "@/registry/cadence/input/input";

export function DialogPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>The URL stays the same. Existing links keep working after the rename.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="preview-project-name">Project name</FieldLabel>
            <Input id="preview-project-name" defaultValue="cadence-ui" />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Save name</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        The overlay fades and the panel settles from `--motion-scale-in` (0.96). Close it mid-exit and reopen: the
        sequence reverses instead of restarting. Under reduced motion only opacity animates.
      </p>
    </div>
  );
}
