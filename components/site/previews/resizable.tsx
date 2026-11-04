"use client";

import { useId, useRef, useState } from "react";
import { useGroupRef, usePanelRef } from "react-resizable-panels";
import { Button } from "@/registry/cadence/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/cadence/resizable";
import { PreviewStack } from "./shell";

function Horizontal() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="rounded-md border" style={{ height: 240 }}>
      <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="overflow-auto p-4 text-sm">
        Explorer
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize explorer" />
      <ResizablePanel defaultSize="60%" minSize="30%" className="overflow-auto p-4 text-sm">
        Editor
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function Vertical() {
  return (
    <ResizablePanelGroup orientation="vertical" className="rounded-md border" style={{ height: 300 }}>
      <ResizablePanel defaultSize="55%" minSize="25%" className="overflow-auto p-4 text-sm">
        Preview
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize preview" />
      <ResizablePanel minSize="25%" className="overflow-auto p-4 text-sm">
        Output
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function HandleStyles() {
  return (
    <div className="flex w-full flex-col gap-4">
      {[false, true].map((grip) => (
        <ResizablePanelGroup key={String(grip)} className="rounded-md border" style={{ height: 140 }}>
          <ResizablePanel defaultSize="50%" minSize="20%" className="overflow-auto p-4 text-sm">
            {grip ? "Grip" : "Plain"}
          </ResizablePanel>
          <ResizableHandle withHandle={grip} aria-label={grip ? "Resize with grip" : "Resize plain divider"} />
          <ResizablePanel minSize="20%" className="overflow-auto p-4 text-sm">
            Content
          </ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}

function CollapsiblePanels() {
  return (
    <ResizablePanelGroup className="rounded-md border" style={{ height: 240 }}>
      <ResizablePanel
        defaultSize="35%"
        minSize="25%"
        maxSize="60%"
        collapsible
        collapsedSize="8%"
        collapsedThreshold="5%"
        className="overflow-auto p-3 text-sm"
      >
        <span className="whitespace-nowrap">Files</span>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize collapsible files" />
      <ResizablePanel minSize="40%" className="overflow-auto p-4 text-sm">
        Focus the divider and press Enter to collapse or restore Files.
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function LockedLayouts() {
  return (
    <div className="flex w-full flex-col gap-4">
      {(["group", "panel", "separator"] as const).map((lock) => (
        <ResizablePanelGroup
          key={lock}
          disabled={lock === "group"}
          className="rounded-md border"
          style={{ height: 150 }}
        >
          <ResizablePanel
            defaultSize="30%"
            minSize="15%"
            disabled={lock === "panel"}
            className="overflow-auto p-3 text-sm"
          >
            Locked {lock}
          </ResizablePanel>
          <ResizableHandle disabled={lock === "separator"} aria-label={`Resize ${lock} first divider`} />
          <ResizablePanel defaultSize="35%" minSize="15%" className="overflow-auto p-3 text-sm">
            Middle
          </ResizablePanel>
          <ResizableHandle aria-label={`Resize ${lock} second divider`} />
          <ResizablePanel minSize="15%" className="overflow-auto p-3 text-sm">
            End
          </ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}

function ExternalUpdates() {
  const id = useId();
  const files = `${id}-files`;
  const editor = `${id}-editor`;
  const group = useGroupRef();
  const panel = usePanelRef();
  const [size, setSize] = useState(40);
  const [previous, setPrevious] = useState<number>();
  const [pixels, setPixels] = useState(0);
  const [live, setLive] = useState(40);
  const [origin, setOrigin] = useState("initial");
  const [requested, setRequested] = useState(40);
  const [inspection, setInspection] = useState("Not inspected");
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => panel.current?.collapse()}>
          Collapse
        </Button>
        <Button variant="outline" size="sm" onClick={() => panel.current?.expand()}>
          Expand
        </Button>
        <Button variant="outline" size="sm" onClick={() => panel.current?.resize("55%")}>
          Resize to 55%
        </Button>
        <Button variant="outline" size="sm" onClick={() => group.current?.setLayout({ [files]: 40, [editor]: 60 })}>
          Reset layout
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const current = panel.current?.getSize();
            setInspection(
              `${Math.round(current?.asPercentage ?? 0)}% / ${Math.round(current?.inPixels ?? 0)}px · ${panel.current?.isCollapsed() ? "collapsed" : "expanded"} · layout ${Math.round(group.current?.getLayout()[files] ?? 0)}%`,
            );
          }}
        >
          Inspect layout
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Files {Math.round(size)}% · {origin} · live {Math.round(live)}% · requested {Math.round(requested)}% · previous{" "}
        {previous === undefined ? "initial" : `${Math.round(previous)}%`} · {Math.round(pixels)}px
      </p>
      <p className="text-sm text-muted-foreground" data-inspection>
        {inspection}
      </p>
      <ResizablePanelGroup
        groupRef={group}
        defaultLayout={{ [files]: 40, [editor]: 60 }}
        className="rounded-md border"
        style={{ height: 260 }}
        onLayoutChange={(layout) => setLive(layout[files] ?? 0)}
        onLayoutChanged={(layout, meta) => {
          setOrigin(meta.isUserInteraction ? "user" : "external");
          setRequested((meta.requestedLayout ?? layout)[files] ?? 0);
        }}
      >
        <ResizablePanel
          id={files}
          panelRef={panel}
          defaultSize="40%"
          minSize="20%"
          maxSize="60%"
          collapsible
          className="overflow-auto p-3 text-sm"
          onResize={(next, _, prev) => {
            setSize(next.asPercentage);
            setPixels(next.inPixels);
            setPrevious(prev?.asPercentage);
          }}
        >
          <label className="flex min-w-0 flex-col gap-2" htmlFor={`${id}-draft`}>
            Draft
            <input
              id={`${id}-draft`}
              className="w-full min-w-0 rounded border bg-background px-2 py-1"
              defaultValue="Keep this note"
            />
          </label>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize files externally" />
        <ResizablePanel id={editor} defaultSize="60%" minSize="40%" className="overflow-auto p-4 text-sm">
          Editor
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function ResizePreviews() {
  return (
    <div className="flex w-full flex-col gap-4">
      {(["panel", "separator"] as const).map((mode) => (
        <ResizablePanelGroup key={mode} resizePreviewMode={mode} className="rounded-md border" style={{ height: 180 }}>
          <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="overflow-auto p-4 text-sm">
            {mode === "panel" ? "Live panels" : "Release to apply"}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            aria-label={`Resize ${mode} preview`}
            preview={<div className="h-full w-1 bg-primary" />}
          />
          <ResizablePanel minSize="30%" className="overflow-auto p-4 text-sm">
            Editor
          </ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}

function ContainerResize() {
  const [compact, setCompact] = useState(false);
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={() => setCompact((value) => !value)}>
        {compact ? "Restore container" : "Narrow container"}
      </Button>
      <div className="flex min-w-0 flex-col gap-4" style={{ width: compact ? "80%" : "100%" }}>
        {(["preserve-relative-size", "preserve-pixel-size"] as const).map((behavior) => (
          <ResizablePanelGroup key={behavior} className="rounded-md border" style={{ height: 180 }}>
            <ResizablePanel
              defaultSize={behavior === "preserve-pixel-size" ? 100 : "40%"}
              groupResizeBehavior={behavior}
              className="overflow-auto p-3 text-sm"
            >
              {behavior === "preserve-pixel-size" ? "100px" : "40%"}
            </ResizablePanel>
            <ResizableHandle aria-label={`Resize ${behavior}`} />
            <ResizablePanel className="overflow-auto p-3 text-sm">Flexible remainder</ResizablePanel>
          </ResizablePanelGroup>
        ))}
      </div>
    </div>
  );
}

function NestedPanels() {
  return (
    <ResizablePanelGroup className="rounded-md border" style={{ height: 300 }}>
      <ResizablePanel defaultSize="30%" minSize="15%" className="overflow-auto p-3 text-sm">
        Files
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize nested files" />
      <ResizablePanel defaultSize="45%" minSize="20%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="25%" className="overflow-auto p-3 text-sm">
            Preview
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize nested preview" />
          <ResizablePanel minSize="25%" className="overflow-auto p-3 text-sm">
            Console
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize nested inspector" />
      <ResizablePanel minSize="15%" className="overflow-auto p-3 text-sm">
        Details
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function CustomParts() {
  const handle = useRef<HTMLDivElement>(null);
  const [clicks, setClicks] = useState(0);
  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="outline" size="sm" onClick={() => handle.current?.focus()}>
        Focus divider
      </Button>
      <ResizablePanelGroup
        disableCursor
        resizeTargetMinimumSize={{ coarse: 32, fine: 16 }}
        className="rounded-md border"
        style={{ height: 200 }}
      >
        <ResizablePanel
          defaultSize="40%"
          minSize="20%"
          className="overflow-auto p-4 text-sm"
          style={{ fontWeight: 600 }}
        >
          Files
        </ResizablePanel>
        <ResizableHandle
          elementRef={handle}
          disableDoubleClick
          withHandle
          className="w-2 bg-muted"
          aria-label="Resize custom divider"
          onClick={() => setClicks((count) => count + 1)}
        />
        <ResizablePanel minSize="30%" className="overflow-auto p-4 text-sm">
          Editor
        </ResizablePanel>
      </ResizablePanelGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Divider clicks: {clicks}
      </p>
    </div>
  );
}

export function ResizablePreview({ example }: { example?: string }) {
  let content = <Horizontal />;
  switch (example) {
    case "vertical":
      content = <Vertical />;
      break;
    case "handle-styles":
      content = <HandleStyles />;
      break;
    case "collapsible-panels":
      content = <CollapsiblePanels />;
      break;
    case "locked-layouts":
      content = <LockedLayouts />;
      break;
    case "external-updates":
      content = <ExternalUpdates />;
      break;
    case "resize-previews":
      content = <ResizePreviews />;
      break;
    case "container-resize":
      content = <ContainerResize />;
      break;
    case "nested-panels":
      content = <NestedPanels />;
      break;
    case "custom-parts":
      content = <CustomParts />;
      break;
  }
  return <PreviewStack>{content}</PreviewStack>;
}
