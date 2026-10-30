"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/cadence/alert/alert";
import { Button } from "@/registry/cadence/button/button";

export function AlertPreview() {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <CircleAlert />
        <AlertTitle>33 components left to ship</AlertTitle>
        <AlertDescription>Batch B2 covers structure and feedback; B3 starts the form controls.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Deploy failed</AlertTitle>
        <AlertDescription>Build 42 exited with code 1. The previous release is still live.</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm">
            Retry
          </Button>
        </AlertAction>
      </Alert>

      <Alert>
        <AlertTitle>No icon, no action</AlertTitle>
        <AlertDescription>
          The icon column collapses to zero, so title and description sit flush left — one component, three shapes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
