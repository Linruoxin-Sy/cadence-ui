"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/cadence/alert";
import { Button } from "@/registry/cadence/button";
import { PreviewStack } from "./shell";

function AlertSpecimen() {
  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert>
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Registry ready</AlertTitle>
        <AlertDescription>Components are available to install.</AlertDescription>
      </Alert>
      <DestructiveAlert />
    </div>
  );
}

export function AlertWithAction() {
  const [visible, setVisible] = useState(true);
  if (!visible)
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
        Show alert
      </Button>
    );
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Deploy failed</AlertTitle>
      <AlertDescription>Build 42 exited with code 1. The previous release is still live.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={() => setVisible(false)}>
          Dismiss
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function AlertWithoutIcon() {
  return (
    <Alert>
      <AlertTitle>Read-only mode</AlertTitle>
      <AlertDescription>Billing needs attention before you can edit.</AlertDescription>
    </Alert>
  );
}

export function DestructiveAlert() {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Payment declined</AlertTitle>
      <AlertDescription>Update your payment method before the next invoice.</AlertDescription>
    </Alert>
  );
}

export function AlertPreview({ example }: { example?: string }) {
  const content =
    example === "action" ? (
      <AlertWithAction />
    ) : example === "without-icon" ? (
      <AlertWithoutIcon />
    ) : example === "destructive" ? (
      <DestructiveAlert />
    ) : (
      <AlertSpecimen />
    );
  return (
    <PreviewStack>
      <div className="w-full max-w-lg">{content}</div>
    </PreviewStack>
  );
}
