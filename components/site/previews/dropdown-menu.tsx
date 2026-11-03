"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/cadence/dropdown-menu";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function RowActions() {
  const [result, setResult] = useState("No action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Renamed locally")}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResult("Duplicated locally")}>Duplicate</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {["Backlog", "In review", "Done"].map((value) => (
                    <DropdownMenuItem key={value} onClick={() => setResult(`Moved to ${value}`)}>
                      {value}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => setResult("Deleted locally")}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  );
}

function MenuCommands() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Commands</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Edit selected")}>
              Edit<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem inset closeOnClick={false} onClick={() => setResult("Still open")}>
              Keep open
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setResult("Delete selected locally")}>
              Delete<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function ViewMenu() {
  const [comments, setComments] = useState(false);
  const [density, setDensity] = useState("comfortable");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>View</DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem defaultChecked inset>
              Description
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={comments} onCheckedChange={setComments}>
              Comments
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioItem value="compact" inset>
              Compact
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        Comments: {comments ? "shown" : "hidden"}; density: {density}
      </p>
    </div>
  );
}

function MoveMenu() {
  const [destination, setDestination] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Move item</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDestination("Current group")}>Keep here</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {["Backlog", "Review"].map((value) => (
                    <DropdownMenuItem key={value} onClick={() => setDestination(value)}>
                      {value}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {destination}
      </p>
    </div>
  );
}

function GroupedMenu() {
  const [result, setResult] = useState("No grouped action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Grouped actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Project commands</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Pull request</DropdownMenuLabel>
            <DropdownMenuItem inset onClick={() => setResult("Review selected locally")}>
              Review
            </DropdownMenuItem>
            <DropdownMenuItem inset onClick={() => setResult("Summary selected locally")}>
              Copy summary
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>History</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setResult("Activity selected locally")}>View activity</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function ControlledMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("No action");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open externally
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen} triggerId={id}>
        <DropdownMenuTrigger id={id} render={<Button variant="outline" />}>
          Controlled actions
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Copied locally")}>Copy</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}

function DisabledMenus() {
  return (
    <div className="flex flex-wrap gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger disabled render={<Button variant="outline" />}>
          Disabled trigger
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Unavailable</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Unavailable commands</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>Delete locked item</DropdownMenuItem>
            <DropdownMenuCheckboxItem disabled defaultChecked>
              Locked visibility
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup defaultValue="locked">
            <DropdownMenuRadioItem value="locked" disabled>
              Locked density
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled>Unavailable destination</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Never opened</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>Done</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MenuSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((value) => (
        <DropdownMenu key={value}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
          <DropdownMenuContent side={value} className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>Close menu</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}

function MenuAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((value) => (
        <DropdownMenu key={value}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
          <DropdownMenuContent align={value} className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>Close menu</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}

function LogicalMenus() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <div className="flex flex-wrap gap-3">
          {(["inline-start", "inline-end"] as const).map((value) => (
            <DropdownMenu key={value}>
              <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
              <DropdownMenuContent side={value} className="w-52 max-w-(--available-width)">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Close menu</DropdownMenuItem>
                  <DropdownMenuItem>Done</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>
    </DirectionProvider>
  );
}

function MenuModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((modal) => (
        <DropdownMenu key={String(modal)} modal={modal}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{String(modal)}</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}

function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Open without motion</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="initial-none">
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem>Comments</DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <CadenceProvider mode="full">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>Open nested full</DropdownMenuTrigger>
            <DropdownMenuContent data-testid="nested-full">
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem>Comments</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function DropdownMenuPreview({ example }: { example?: string }) {
  if (example === "items") return <MenuCommands />;
  if (example === "selection") return <ViewMenu />;
  if (example === "submenus") return <MoveMenu />;
  if (example === "grouping") return <GroupedMenu />;
  if (example === "controlled") return <ControlledMenu />;
  if (example === "disabled") return <DisabledMenus />;
  if (example === "sides") return <MenuSides />;
  if (example === "alignments") return <MenuAlignments />;
  if (example === "logical-sides") return <LogicalMenus />;
  if (example === "modality") return <MenuModality />;
  if (example === "without-motion") return <MenuMotionScopes />;
  return <RowActions />;
}
