"use client";

import { useState } from "react";
import { useGroupRef, usePanelRef } from "react-resizable-panels";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/cadence/resizable";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["horizontal", "vertical"] as const;

export function ResizablePreview() {
  const {
    control: variantControl,
    choose,
    select: selectPreviewVariant,
  } = usePreviewVariant("Resizable", previewVariantOptions);
  const inherited = useCadenceMotion();
  const [mode, setMode] = useState<CadenceMode>();
  const [vertical, setVertical] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [size, setSize] = useState(40);
  const [origin, setOrigin] = useState("initial");
  const group = useGroupRef();
  const panel = usePanelRef();
  const control = "rounded border px-2 py-1 text-sm";
  return (
    <>
      {variantControl}
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label>
            Panel motion{" "}
            <select
              aria-label="Panel motion"
              value={mode ?? inherited.mode}
              onChange={(e) => setMode(e.target.value as CadenceMode)}
            >
              {["full", "reduced", "none"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={choose(vertical ? "vertical" : "horizontal") === "vertical"}
              onChange={(e) => {
                selectPreviewVariant("all");
                setVertical(e.target.checked);
              }}
            />{" "}
            Vertical
          </label>
          <label>
            <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} /> Lock layout
          </label>
          <button type="button" className={control} onClick={() => panel.current?.collapse()}>
            Collapse
          </button>
          <button type="button" className={control} onClick={() => panel.current?.expand()}>
            Expand
          </button>
          <button type="button" className={control} onClick={() => panel.current?.resize("55%")}>
            Resize to 55%
          </button>
          <button
            type="button"
            className={control}
            onClick={() => group.current?.setLayout({ explorer: 40, editor: 60 })}
          >
            Reset layout
          </button>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="layout-report">
          Explorer {Math.round(size)}% · {origin}
        </p>
        <CadenceProvider mode={mode}>
          <ResizablePanelGroup
            groupRef={group}
            orientation={choose(vertical ? "vertical" : "horizontal")}
            disabled={disabled}
            className="min-h-64 rounded-md border"
            style={{ height: 288 }}
            onLayoutChanged={(_, meta) => setOrigin(meta.isUserInteraction ? "user" : "external")}
          >
            <ResizablePanel
              id="explorer"
              panelRef={panel}
              defaultSize="40%"
              minSize="20%"
              maxSize="60%"
              collapsible
              onResize={(s) => setSize(s.asPercentage)}
            >
              <div className="flex h-full min-w-0 flex-col gap-3 overflow-auto p-4 text-sm">
                <strong>Explorer</strong>
                <label>
                  Draft
                  <input
                    aria-label="Draft"
                    className="mt-2 w-full min-w-0 rounded border bg-background px-2 py-1"
                    defaultValue="Keep this note"
                  />
                </label>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize explorer" />
            <ResizablePanel id="editor" defaultSize="60%" minSize="40%">
              <div className="flex h-full items-center justify-center p-4 text-sm">Editor</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CadenceProvider>
        <p className="text-sm text-muted-foreground">
          Drag the divider or focus it and use arrow keys. Enter collapses and expands the explorer.
        </p>
      </div>
    </>
  );
}
