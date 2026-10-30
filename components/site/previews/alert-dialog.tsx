"use client";

import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/cadence/alert-dialog/alert-dialog";
import { Button } from "@/registry/cadence/button/button";

export function AlertDialogPreview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>Delete project</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Trash2 aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                Every deployment and its logs go with it. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep project</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Delete project</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" />}>Archive</AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this project?</AlertDialogTitle>
              <AlertDialogDescription>It stops deploying, and you can unarchive it later.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="text-xs text-muted-foreground">
        Click outside and nothing happens: an alert dialog refuses pointer dismissal, so the two buttons are the way out
        (Escape still cancels). The overlay fades and the panel settles from `--motion-scale-in` (0.96); under reduced
        motion only the fade remains.
      </p>
    </div>
  );
}
