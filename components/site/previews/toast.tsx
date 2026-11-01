"use client";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";
import { createToastManager, Toaster } from "@/registry/cadence/toast";
import { PopupMotionScope } from "./popup-motion-scope";
import { usePreviewVariant } from "./use-preview-variant";

const types = ["success", "info", "warning", "error", "loading"] as const;

export function ToastPreview() {
  const { control, choose } = usePreviewVariant("Toast", types);
  const [manager] = useState(createToastManager);
  const [message, setMessage] = useState("No action yet");
  const cm = useCadenceMotion();
  return (
    <PopupMotionScope>
      {control}
      <Toaster toastManager={manager} timeout={0}>
        <div data-slot="toast-demo" data-motion={cm.mode} className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() =>
                manager.add({
                  title: "Changes saved",
                  description: "Your workspace is up to date.",
                  type: choose("success"),
                  actionProps: { children: "Undo", onClick: () => setMessage("Changes undone") },
                })
              }
            >
              Show notification
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                manager.add({
                  title: "Connection unavailable",
                  description: "Try again when you are online.",
                  type: choose("error"),
                  priority: "high",
                })
              }
            >
              Show error
            </Button>
            <Button variant="ghost" onClick={() => manager.close()}>
              Dismiss all
            </Button>
          </div>
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </Toaster>
    </PopupMotionScope>
  );
}
