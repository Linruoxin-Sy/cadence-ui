"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/cadence/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/cadence/dropdown-menu";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function FileMenu() {
  const [name, setName] = useState("Roadmap.md");
  return (
    <ContextMenu>
      <ContextMenuTrigger
        tabIndex={0}
        className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm"
      >
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">Right-click for actions</span>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="File actions">
        <ContextMenuGroup>
          <ContextMenuItem render={<a href="/docs/changelog" />}>Open</ContextMenuItem>
          <ContextMenuItem onClick={() => setName("Roadmap (renamed).md")}>Rename</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Open with</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuGroup>
                <ContextMenuItem onClick={() => setName("Editor: Roadmap.md")}>Editor</ContextMenuItem>
                <ContextMenuItem onClick={() => setName("Preview: Roadmap.md")}>Preview</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function PointerSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <ContextMenu key={side}>
          <ContextMenuTrigger
            tabIndex={0}
            className="grid h-20 w-28 place-content-center rounded-md border border-dashed text-sm"
          >
            {side}
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" side={side} sideOffset={8} alignOffset={0}>
            <ContextMenuGroup>
              <ContextMenuItem>Close menu</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}

function PointerAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <ContextMenu key={align}>
          <ContextMenuTrigger
            tabIndex={0}
            className="grid h-20 w-28 place-content-center rounded-md border border-dashed text-sm"
          >
            {align}
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" side="bottom" align={align} alignOffset={0} sideOffset={8}>
            <ContextMenuGroup>
              <ContextMenuItem>Close menu</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}

function LogicalPointerSides() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <ContextMenu key={side}>
            <ContextMenuTrigger
              tabIndex={0}
              className="grid h-20 w-32 place-content-center rounded-md border border-dashed text-sm"
            >
              {side}
            </ContextMenuTrigger>
            <ContextMenuContent
              aria-label="File actions"
              side={side}
              alignOffset={0}
              sideOffset={8}
              className="max-w-(--available-width)"
            >
              <ContextMenuGroup>
                <ContextMenuItem>Close menu</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </DirectionProvider>
  );
}

function RowMenu() {
  const [result, setResult] = useState("No row action yet");
  const actions = ["Open", "Rename"];
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ContextMenu>
          <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
            Roadmap.md
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions">
            <ContextMenuGroup>
              {actions.map((action) => (
                <ContextMenuItem key={action} onClick={() => setResult(`${action} selected locally`)}>
                  {action}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Row actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {actions.map((action) => (
                <DropdownMenuItem key={action} onClick={() => setResult(`${action} selected locally`)}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function SelectionMenu() {
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          View options
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuLabel inset>Show</ContextMenuLabel>
            <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid} inset>
              Grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem defaultChecked>Rulers</ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup aria-label="Sort" value={sort} onValueChange={setSort}>
            <ContextMenuLabel>Sort</ContextMenuLabel>
            <ContextMenuRadioItem value="name" inset>
              Name
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="date">Date modified</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        Grid: {grid ? "shown" : "hidden"}; sort: {sort}
      </p>
    </div>
  );
}

function Submenu() {
  const [result, setResult] = useState("Not opened");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          Open a file
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem onClick={() => setResult("Default app")}>Default app</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Open with</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuGroup>
                  {["Editor", "Preview"].map((app) => (
                    <ContextMenuItem key={app} onClick={() => setResult(app)}>
                      {app}
                    </ContextMenuItem>
                  ))}
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function ItemStates() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          File commands
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuLabel inset>File</ContextMenuLabel>
            <ContextMenuItem inset onClick={() => setResult("Renamed locally")}>
              Rename<ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem inset closeOnClick={false} onClick={() => setResult("Still open")}>
              Keep open
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => setResult("Incorrectly activated")}>
              Locked command
            </ContextMenuItem>
            <ContextMenuCheckboxItem disabled defaultChecked>
              Locked visibility
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuRadioGroup defaultValue="locked">
            <ContextMenuRadioItem disabled value="locked">
              Locked sort
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuGroup>
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled>Unavailable app</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuGroup>
                  <ContextMenuItem>Never opened</ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem variant="destructive" onClick={() => setResult("Deleted locally")}>
              Delete<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <ContextMenu disabled>
        <ContextMenuTrigger
          tabIndex={0}
          aria-disabled="true"
          className="rounded-md border border-dashed px-6 py-4 text-sm opacity-50"
        >
          Disabled target
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem>Unavailable</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function ControlledMenu() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Not opened");
  return (
    <div className="grid gap-3">
      <ContextMenu
        open={open}
        onOpenChange={(value, details) => {
          setOpen(value);
          setReason(details.reason);
        }}
      >
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          Controlled target
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem
              closeOnClick={false}
              onClick={() => {
                setReason("Caller closed");
                setOpen(false);
              }}
            >
              Close from caller
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {open ? "Open" : "Closed"}: {reason}
      </p>
    </div>
  );
}

function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <ContextMenu>
          <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-4 py-4 text-sm">
            Open without motion
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" data-testid="initial-none">
            <ContextMenuGroup>
              <ContextMenuCheckboxItem>Grid</ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <CadenceProvider mode="full">
          <ContextMenu>
            <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-4 py-4 text-sm">
              Open nested full
            </ContextMenuTrigger>
            <ContextMenuContent aria-label="File actions" data-testid="nested-full">
              <ContextMenuGroup>
                <ContextMenuCheckboxItem>Grid</ContextMenuCheckboxItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function ContextMenuPreview({ example }: { example?: string }) {
  if (example === "sides") return <PointerSides />;
  if (example === "alignments") return <PointerAlignments />;
  if (example === "logical-sides") return <LogicalPointerSides />;
  if (example === "row-menu") return <RowMenu />;
  if (example === "selection") return <SelectionMenu />;
  if (example === "submenus") return <Submenu />;
  if (example === "items") return <ItemStates />;
  if (example === "controlled") return <ControlledMenu />;
  if (example === "without-motion") return <MenuMotionScopes />;
  return <FileMenu />;
}
