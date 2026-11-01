"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/cadence/alert";
import { Button } from "@/registry/cadence/button";
import { PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "destructive"] as const;

/**
 * Both variants, and both shapes a title/description pair can take: with an icon
 * column and with an action in the corner. The third alert drops the icon to show
 * that the column collapses — the component is one grid, not three layouts.
 */
export function AlertPreview() {
  const { control, choose } = usePreviewVariant("Alert", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <div className="grid w-full max-w-lg gap-3">
          <Alert variant={choose("default")}>
            <CircleAlertIcon />
            <AlertTitle>Registry ready</AlertTitle>
            <AlertDescription>58 components are available to install.</AlertDescription>
          </Alert>

          <Alert variant={choose("destructive")}>
            <TriangleAlertIcon />
            <AlertTitle>Deploy failed</AlertTitle>
            <AlertDescription>Build 42 exited with code 1. The previous release is still live.</AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm">
                Retry
              </Button>
            </AlertAction>
          </Alert>

          <Alert variant={choose("default")}>
            <AlertTitle>No icon, no action</AlertTitle>
            <AlertDescription>The icon column collapses to zero and the text sits flush left.</AlertDescription>
          </Alert>
        </div>
      </PreviewStack>
    </>
  );
}
