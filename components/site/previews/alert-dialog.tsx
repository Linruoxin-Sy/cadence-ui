"use client";

import { Trash2Icon } from "lucide-react";
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
} from "@/registry/cadence/alert-dialog";
import { Button } from "@/registry/cadence/button";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Two sizes, and the two intensities a destructive confirmation has: the full panel
 * with a media slot and a destructive action, and the `sm` panel for something that
 * can be undone. Neither dismisses on an outside click.
 */
export function AlertDialogPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>Delete project</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Trash2Icon aria-hidden="true" />
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
      </PreviewRow>
    </PreviewStack>
  );
}
