"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/cadence/alert";
import { Button } from "@/registry/cadence/button";
import { PreviewStack } from "./shell";

/**
 * Both variants, and both shapes a title/description pair can take: with an icon
 * column and with an action in the corner. The third alert drops the icon to show
 * that the column collapses — the component is one grid, not three layouts.
 */
export function AlertPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-lg gap-3">
        <Alert>
          <CircleAlertIcon />
          <AlertTitle>33 components left to ship</AlertTitle>
          <AlertDescription>Batch B2 covers structure and feedback.</AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <TriangleAlertIcon />
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
          <AlertDescription>The icon column collapses to zero and the text sits flush left.</AlertDescription>
        </Alert>
      </div>
    </PreviewStack>
  );
}
