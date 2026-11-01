"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { useState } from "react";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/registry/cadence/sidebar";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["sidebar", "floating", "inset"] as const;

function Controls() {
  const { state, openMobile, setOpen, setOpenMobile } = useSidebar();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SidebarTrigger />
      <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={() => setOpen(true)}>
        Expand
      </button>
      <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={() => setOpen(false)}>
        Collapse
      </button>
      <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={() => setOpenMobile(false)}>
        Close mobile
      </button>
      <output data-testid="sidebar-state">
        {state} / {openMobile ? "mobile open" : "mobile closed"}
      </output>
    </div>
  );
}
export function SidebarPreview() {
  const { control, choose, select: selectPreviewVariant } = usePreviewVariant("Sidebar", previewVariantOptions);
  const [mode, setMode] = useState<CadenceMode>("full");
  const [open, setOpen] = useState(true);
  const [side, setSide] = useState<"left" | "right">("left");
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">("offcanvas");
  const [variant, setVariant] = useState<"sidebar" | "floating" | "inset">("sidebar");
  return (
    <>
      {control}
      <div className="grid w-full min-w-0 gap-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <label>
            Panel motion{" "}
            <select aria-label="Panel motion" value={mode} onChange={(e) => setMode(e.target.value as CadenceMode)}>
              {["full", "reduced", "none"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Side{" "}
            <select value={side} onChange={(e) => setSide(e.target.value as typeof side)}>
              <option>left</option>
              <option>right</option>
            </select>
          </label>
          <label>
            Collapse mode{" "}
            <select value={collapsible} onChange={(e) => setCollapsible(e.target.value as typeof collapsible)}>
              {["offcanvas", "icon", "none"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Variant{" "}
            <select
              value={choose(variant)}
              onChange={(e) => {
                selectPreviewVariant("all");
                setVariant(e.target.value as typeof variant);
              }}
            >
              {["sidebar", "floating", "inset"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <CadenceProvider mode={mode}>
          <SidebarProvider
            open={open}
            onOpenChange={setOpen}
            className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
          >
            <Sidebar side={side} collapsible={collapsible} variant={choose(variant)} className="absolute h-full">
              <SidebarHeader>
                <strong>Acme workspace</strong>
                <SidebarInput aria-label="Search workspace" placeholder="Search workspace" />
              </SidebarHeader>
              <SidebarContent>
                <nav aria-label="Workspace">
                  <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarMenu>
                      {(
                        [
                          [Home, "Overview"],
                          [Inbox, "Inbox"],
                          [Settings, "Settings"],
                        ] as const
                      ).map(([Icon, label]) => (
                        <SidebarMenuItem key={String(label)}>
                          <SidebarMenuButton
                            render={<a href="#workspace-content" />}
                            tooltip={String(label)}
                            isActive={label === "Overview"}
                          >
                            {typeof Icon !== "string" && <Icon aria-hidden="true" />}
                            <span>{String(label)}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                </nav>
              </SidebarContent>
              <SidebarFooter>
                <span className="truncate text-xs">Acme team</span>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
            <div id="workspace-content" className="flex min-w-0 flex-1 flex-col gap-4 p-4">
              <Controls />
              <h3 className="font-medium">Project overview</h3>
              <p className="text-sm text-muted-foreground">
                Use the toggle or Ctrl/Cmd+B. On small screens, navigation opens in a sheet.
              </p>
              <input
                className="min-w-0 rounded border p-2"
                aria-label="Workspace draft"
                placeholder="Draft stays during desktop toggles"
              />
            </div>
          </SidebarProvider>
        </CadenceProvider>
      </div>
    </>
  );
}
