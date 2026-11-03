"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/registry/cadence/menubar";

function EditorMenubar() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Editor">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("New local document")}>New</MenubarItem>
              <MenubarItem onClick={() => setResult("Saved locally")}>Save</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Undo selected locally")}>Undo</MenubarItem>
              <MenubarItem onClick={() => setResult("Redo selected locally")}>Redo</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem render={<a href="/docs/changelog" />}>Changelog</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  );
}

function MenuTraversal() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((loopFocus) => (
        <Menubar
          key={String(loopFocus)}
          loopFocus={loopFocus}
          aria-label={loopFocus ? "Looping menus" : "Bounded menus"}
        >
          {["File", "Edit", "View"].map((label) => (
            <MenubarMenu key={label}>
              <MenubarTrigger>{label}</MenubarTrigger>
              <MenubarContent>
                <MenubarGroup>
                  <MenubarItem>{label} command</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      ))}
    </div>
  );
}

function MenuOrientations() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <Menubar
          key={orientation}
          orientation={orientation}
          aria-label={`${orientation} menus`}
          className={orientation === "vertical" ? "h-auto flex-col items-stretch" : undefined}
        >
          {["File", "Edit"].map((label) => (
            <MenubarMenu key={label}>
              <MenubarTrigger>{label}</MenubarTrigger>
              <MenubarContent side={orientation === "vertical" ? "right" : "bottom"}>
                <MenubarGroup>
                  <MenubarItem>{label} command</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      ))}
    </div>
  );
}

function GroupedCommands() {
  const [result, setResult] = useState("No export yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Export commands">
        <MenubarMenu>
          <MenubarTrigger>Export</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel inset>Document</MenubarLabel>
              <MenubarItem inset onClick={() => setResult("PDF selected locally")}>
                PDF<MenubarShortcut>⇧⌘P</MenubarShortcut>
              </MenubarItem>
              <MenubarItem inset onClick={() => setResult("PNG selected locally")}>
                PNG
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Help</MenubarLabel>
              <MenubarItem render={<a href="/docs/changelog" />}>Changelog</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function MenuSelection() {
  const [sidebar, setSidebar] = useState(true);
  const [density, setDensity] = useState("comfortable");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="View settings">
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel inset>Show</MenubarLabel>
              <MenubarCheckboxItem checked={sidebar} onCheckedChange={setSidebar}>
                Sidebar
              </MenubarCheckboxItem>
              <MenubarCheckboxItem defaultChecked inset>
                Line numbers
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarRadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
              <MenubarLabel>Density</MenubarLabel>
              <MenubarRadioItem value="compact" inset>
                Compact
              </MenubarRadioItem>
              <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">
        Sidebar: {sidebar ? "shown" : "hidden"}; density: {density}
      </p>
    </div>
  );
}

function NestedCommands() {
  const [result, setResult] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Organize document">
        <MenubarMenu>
          <MenubarTrigger>Organize</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Kept here")}>Keep here</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger inset>Move to</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarGroup>
                    {["Backlog", "Review"].map((value) => (
                      <MenubarItem key={value} onClick={() => setResult(value)}>
                        {value}
                      </MenubarItem>
                    ))}
                  </MenubarGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function ItemBehaviors() {
  const [result, setResult] = useState("No item action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Item commands">
        <MenubarMenu>
          <MenubarTrigger>Actions</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Renamed locally")}>Rename</MenubarItem>
              <MenubarItem inset closeOnClick={false} onClick={() => setResult("Still open")}>
                Keep open
              </MenubarItem>
              <MenubarItem variant="destructive" onClick={() => setResult("Deleted locally")}>
                Delete
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function DisabledCommands() {
  return (
    <div className="flex flex-wrap gap-3">
      <Menubar disabled aria-label="Disabled bar">
        <MenubarMenu>
          <MenubarTrigger>Disabled bar</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>Unavailable</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <Menubar aria-label="Disabled commands">
        <MenubarMenu>
          <MenubarTrigger disabled>Disabled trigger</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem>Unavailable</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Unavailable commands</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem disabled>Delete locked document</MenubarItem>
              <MenubarCheckboxItem disabled defaultChecked>
                Locked sidebar
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarRadioGroup defaultValue="locked">
              <MenubarRadioItem disabled value="locked">
                Locked density
              </MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarGroup>
              <MenubarSub>
                <MenubarSubTrigger disabled>Unavailable destination</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarGroup>
                    <MenubarItem>Never opened</MenubarItem>
                  </MenubarGroup>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem>Done</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}

function ControlledMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("No controlled action");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open externally
      </Button>
      <Menubar aria-label="Controlled menu">
        <MenubarMenu open={open} onOpenChange={setOpen} triggerId={id}>
          <MenubarTrigger id={id}>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Saved locally")}>Save</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function MenuSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Menubar key={side} aria-label={`${side} placement`}>
          <MenubarMenu>
            <MenubarTrigger>{side}</MenubarTrigger>
            <MenubarContent side={side}>
              <MenubarGroup>
                <MenubarItem>Done</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}

function MenuAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Menubar key={align} aria-label={`${align} alignment`}>
          <MenubarMenu>
            <MenubarTrigger>{align}</MenubarTrigger>
            <MenubarContent align={align} alignOffset={0}>
              <MenubarGroup>
                <MenubarItem>Done</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}

function RtlMenus() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Menubar key={side} aria-label={`${side} RTL`}>
            <MenubarMenu>
              <MenubarTrigger>{side}</MenubarTrigger>
              <MenubarContent side={side} className="min-w-0 w-48 max-w-(--available-width)">
                <MenubarGroup>
                  <MenubarItem>Done</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent>
                <MenubarGroup>
                  <MenubarItem>About</MenubarItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        ))}
      </div>
    </DirectionProvider>
  );
}

function MenuModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((modal) => (
        <Menubar key={String(modal)} modal={modal} aria-label={`modal ${modal}`}>
          <MenubarMenu>
            <MenubarTrigger>{String(modal)}</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>Done</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}

function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Menubar aria-label="Instant menu">
          <MenubarMenu>
            <MenubarTrigger>Open without motion</MenubarTrigger>
            <MenubarContent data-testid="initial-none">
              <MenubarGroup>
                <MenubarCheckboxItem>Sidebar</MenubarCheckboxItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <CadenceProvider mode="full">
          <Menubar aria-label="Nested full menu">
            <MenubarMenu>
              <MenubarTrigger>Open nested full</MenubarTrigger>
              <MenubarContent data-testid="nested-full">
                <MenubarGroup>
                  <MenubarCheckboxItem>Sidebar</MenubarCheckboxItem>
                </MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function MenubarPreview({ example }: { example?: string }) {
  if (example === "traversal") return <MenuTraversal />;
  if (example === "orientation") return <MenuOrientations />;
  if (example === "grouping") return <GroupedCommands />;
  if (example === "selection") return <MenuSelection />;
  if (example === "submenus") return <NestedCommands />;
  if (example === "items") return <ItemBehaviors />;
  if (example === "disabled") return <DisabledCommands />;
  if (example === "controlled") return <ControlledMenu />;
  if (example === "sides") return <MenuSides />;
  if (example === "alignments") return <MenuAlignments />;
  if (example === "logical-sides") return <RtlMenus />;
  if (example === "modality") return <MenuModality />;
  if (example === "without-motion") return <MenuMotionScopes />;
  return <EditorMenubar />;
}
