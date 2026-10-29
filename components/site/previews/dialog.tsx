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

export function DialogPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>The URL stays the same. Existing links keep working after the rename.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Project name</span>
            <input
              defaultValue="cadence-ui"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Save name</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        The overlay fades and the panel settles from 0.95 scale. Close it mid-exit and reopen: the sequence reverses
        instead of restarting. Under reduced motion only opacity animates.
      </p>
    </div>
  );
}
