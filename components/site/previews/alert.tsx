"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
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

export function ChangingAlert() {
  const [failed, setFailed] = useState(false);
  const [destructive, setDestructive] = useState(false);
  const [count, setCount] = useState(19);
  const [show, setShow] = useState(true);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setFailed((value) => !value)}>
          Update message
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount((value) => value + 1)}>
          Add retry
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDestructive((value) => !value)}>
          Change tone
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShow((value) => !value)}>
          {show ? "Hide message" : "Show message"}
        </Button>
      </div>
      <AnimatePresence>
        {show && (
          <Alert
            key="message"
            variant={destructive ? "destructive" : "default"}
            style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
          >
            {failed ? (
              <TriangleAlertIcon key="warning" aria-hidden="true" />
            ) : (
              <CircleAlertIcon key="info" aria-hidden="true" />
            )}
            <AlertTitle>{failed ? "Deploy failed" : "Deploy pending"}</AlertTitle>
            <AlertDescription>
              {failed ? "ERR_042: previous release live. Retry this build." : "Awaiting build result."}
            </AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => setShow(false)}>
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        )}
      </AnimatePresence>
      <Alert style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
        <AlertTitle>Retries remaining</AlertTitle>
        <AlertDescription>{count}</AlertDescription>
      </Alert>
    </div>
  );
}

export function AlertPreview({ example }: { example?: string }) {
  const content =
    example === "changing" ? (
      <ChangingAlert />
    ) : example === "action" ? (
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
