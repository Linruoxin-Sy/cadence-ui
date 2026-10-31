"use client";

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
import { PreviewRow, PreviewStack } from "./shell";

const CHANGELOG = [
  "Eleven atoms: button, badge, kbd, separator, label, input, textarea, card, aspect ratio, avatar, skeleton.",
  "Every component declares its motion recipes in the registry, so the docs and the source cannot drift.",
  "The previews load per page, so a component page never downloads the whole library.",
  "Reduced motion is a branch in the tree, not a media query bolted on afterwards.",
  "The docs site reads the same payload the CLI installs, which is what keeps the examples honest.",
  "Long bodies scroll inside the panel, so a dialog keeps its own height instead of growing with the copy.",
];

/**
 * A modal cannot show its own characteristics closed, so the specimen is the two
 * shapes it is used in: a short confirmation with a field and a footer, and a long
 * body that scrolls inside the panel instead of growing it. Both are one click away.
 */
export function DialogPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>
                The URL stays the same. Existing links keep working after the rename.
              </DialogDescription>
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

        <Dialog>
          <DialogTrigger render={<Button variant="ghost" />}>Read the changelog</DialogTrigger>
          <DialogContent className="max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>0.2.0</DialogTitle>
              <DialogDescription>Eleven atoms, nine batches, one release train.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {CHANGELOG.map((entry) => (
                <p key={entry}>{entry}</p>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </PreviewRow>
    </PreviewStack>
  );
}
