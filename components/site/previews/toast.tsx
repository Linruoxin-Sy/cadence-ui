"use client";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import {
  createToastManager,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/registry/cadence/toast";

function Types() {
  const [manager] = useState(createToastManager);
  return (
    <Toaster toastManager={manager} timeout={0}>
      <div className="flex flex-wrap gap-2">
        {([undefined, "success", "info", "warning", "error", "loading"] as const).map((type) => (
          <Button
            key={type ?? "plain"}
            variant="outline"
            onClick={() => manager.add({ title: `${type ?? "plain"} notification`, type })}
          >
            Show {type ?? "plain"}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => manager.close()}>
          Clear types
        </Button>
      </div>
    </Toaster>
  );
}

function Actions() {
  const [manager] = useState(createToastManager);
  const [result, setResult] = useState("Item available");
  return (
    <Toaster toastManager={manager} timeout={0}>
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => {
            setResult("Item archived");
            const id = manager.add({
              title: "Item archived",
              actionProps: {
                children: "Restore item",
                onClick: () => {
                  setResult("Item restored");
                  manager.close(id);
                },
              },
            });
          }}
        >
          Archive item
        </Button>
        <p role="status">{result}</p>
      </div>
    </Toaster>
  );
}

function Priority() {
  const [manager] = useState(createToastManager);
  return (
    <Toaster toastManager={manager} timeout={0}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => manager.add({ title: "Draft saved", priority: "low" })}>
          Polite notification
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            manager.add({
              title: "Connection unavailable",
              description: "Your draft remains on this device.",
              type: "error",
              priority: "high",
            })
          }
        >
          Urgent notification
        </Button>
        <Button variant="ghost" onClick={() => manager.close()}>
          Clear priority
        </Button>
      </div>
    </Toaster>
  );
}

function Progress() {
  const [manager] = useState(createToastManager);
  const [id, setId] = useState<string>();
  const [result, setResult] = useState("No export queued");
  return (
    <Toaster toastManager={manager} timeout={0}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!!id}
            onClick={() => {
              setId(manager.add({ title: "Export queued", type: "loading", onClose: () => setId(undefined) }));
              setResult("Export queued");
            }}
          >
            Queue export
          </Button>
          <Button
            variant="outline"
            disabled={!id}
            onClick={() => {
              if (id)
                manager.update(id, {
                  title: "Export ready",
                  description: "Download it from your exports page.",
                  type: "success",
                });
              setResult("Export ready");
            }}
          >
            Finish export
          </Button>
          <Button
            variant="ghost"
            disabled={!id}
            onClick={() => {
              if (id) manager.close(id);
              setId(undefined);
            }}
          >
            Dismiss export
          </Button>
        </div>
        <p role="status">{result}</p>
      </div>
    </Toaster>
  );
}

function Timers() {
  const [manager] = useState(createToastManager);
  return (
    <Toaster toastManager={manager} timeout={5000} limit={2}>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            manager.add({
              title: "Timed notification",
              description: "Closes after five seconds without hover or focus.",
            })
          }
        >
          Add timed notification
        </Button>
        <Button variant="outline" onClick={() => manager.add({ title: "Persistent notification", timeout: 0 })}>
          Add persistent notification
        </Button>
        <Button variant="ghost" onClick={() => manager.close()}>
          Clear timers
        </Button>
      </div>
    </Toaster>
  );
}

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map((item) => (
    <Toast key={item.id} toast={item} swipeDirection={direction}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}
function Composition({
  direction = "right",
  label = "Show custom notification",
}: {
  direction?: "up" | "down" | "left" | "right";
  label?: string;
}) {
  const [manager] = useState(createToastManager);
  return (
    <ToastProvider toastManager={manager} timeout={0}>
      <Button
        variant="outline"
        onClick={() =>
          manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })
        }
      >
        {label}
      </Button>
      <ToastPortal>
        <ToastViewport>
          <NotificationList direction={direction} />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

function Swipe() {
  return (
    <div className="flex flex-wrap gap-2">
      {(["up", "down", "left", "right"] as const).map((direction) => (
        <Composition key={direction} direction={direction} label={`Swipe ${direction}`} />
      ))}
    </div>
  );
}

function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-2">
        <Composition label="Show instant notification" />
        <CadenceProvider mode="full">
          <Composition label="Show nested full notification" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

function DefaultToast() {
  const [manager] = useState(createToastManager);
  const cm = useCadenceMotion();
  return (
    <Toaster toastManager={manager} timeout={0}>
      <div data-slot="toast-demo" data-motion={cm.mode}>
        <Button
          onClick={() =>
            manager.add({ title: "Changes saved", description: "Your workspace is up to date.", type: "success" })
          }
        >
          Show notification
        </Button>
      </div>
    </Toaster>
  );
}

export function ToastPreview({ example }: { example?: string }) {
  if (example === "types") return <Types />;
  if (example === "actions") return <Actions />;
  if (example === "priority") return <Priority />;
  if (example === "progress") return <Progress />;
  if (example === "timers") return <Timers />;
  if (example === "composition") return <Composition />;
  if (example === "swipe") return <Swipe />;
  if (example === "without-motion") return <WithoutMotion />;
  return <DefaultToast />;
}
