"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";
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
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow } from "./shell";

function Confirmation({ size = "default", withIcon = false }: { size?: "default" | "sm"; withIcon?: boolean }) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button variant="outline" />}>
          {size === "sm" ? "Archive" : "Delete project"}
        </AlertDialogTrigger>
        <AlertDialogContent size={size}>
          <AlertDialogHeader>
            {withIcon && (
              <AlertDialogMedia>
                <Trash2Icon aria-hidden="true" />
              </AlertDialogMedia>
            )}
            <AlertDialogTitle>{size === "sm" ? "Archive this project?" : "Delete this project?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {size === "sm"
                ? "It stops deploying. You can unarchive it later."
                : "Every deployment and its logs go with it. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{size === "sm" ? "Cancel" : "Keep project"}</AlertDialogCancel>
            <AlertDialogAction
              variant={size === "sm" ? "default" : "destructive"}
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              {size === "sm" ? "Archive" : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-sm text-muted-foreground">
        {deleted ? (size === "sm" ? "Project archived locally" : "Project deleted locally") : "No changes"}
      </p>
    </div>
  );
}

function ConfirmationSizes() {
  return (
    <div className="flex flex-wrap gap-4">
      <Confirmation />
      <Confirmation size="sm" />
    </div>
  );
}

function IconConfirmation() {
  return <Confirmation withIcon />;
}

function ControlledConfirmation() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Request key revocation
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this key?</AlertDialogTitle>
            <AlertDialogDescription>Services using it lose access. Create a replacement first.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep key</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmed(true);
                setOpen(false);
              }}
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-sm text-muted-foreground">
        {confirmed ? "Key revoked locally" : "Key active"}
      </p>
    </div>
  );
}

function PendingConfirmation() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <AlertDialogTrigger render={<Button variant="outline" />}>Delete draft</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This local example models a caller-owned request. Complete request resolves it without sending data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p role="status" className="text-sm">
            {pending ? "Deletion pending" : "Ready to delete"}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
              onClick={() => setPending(true)}
            >
              {pending ? "Deleting…" : "Delete draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
          {pending && (
            <Button
              variant="outline"
              onClick={() => {
                setPending(false);
                setComplete(true);
                setOpen(false);
              }}
            >
              Complete request
            </Button>
          )}
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-sm text-muted-foreground">
        {complete ? "Draft deleted locally" : "Draft retained"}
      </p>
    </div>
  );
}

function AlertMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>Open without motion</AlertDialogTrigger>
          <AlertDialogContent data-testid="initial-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Immediate confirmation</AlertDialogTitle>
              <AlertDialogDescription>No transition runs on this panel or its overlay.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep project</AlertDialogCancel>
              <AlertDialogAction>Request deletion</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CadenceProvider mode="full">
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>Open nested full</AlertDialogTrigger>
            <AlertDialogContent data-testid="nested-full">
              <AlertDialogHeader>
                <AlertDialogTitle>Nested full confirmation</AlertDialogTitle>
                <AlertDialogDescription>
                  The OS preference can still reduce this explicit full scope.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep project</AlertDialogCancel>
                <AlertDialogAction>Request deletion</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function AlertDialogPreview({ example }: { example?: string }) {
  if (example === "sizes") return <ConfirmationSizes />;
  if (example === "icon") return <IconConfirmation />;
  if (example === "controlled") return <ControlledConfirmation />;
  if (example === "pending") return <PendingConfirmation />;
  if (example === "without-motion") return <AlertMotionScopes />;
  return (
    <PreviewRow>
      <Confirmation withIcon />
    </PreviewRow>
  );
}
