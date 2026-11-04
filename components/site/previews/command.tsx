"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/cadence/command";
import { InputGroupInput } from "@/registry/cadence/input-group";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function SearchableList({
  children,
  emptyMessage = "No actions found.",
  ...inputProps
}: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && (
        <CommandEmpty>
          <span role="status">{emptyMessage}</span>
        </CommandEmpty>
      )}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

function Palette({
  label = "Open command palette",
  showCloseButton = false,
}: {
  label?: string;
  showCloseButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Workspace commands"
        description="Find an action, then press Enter to run it."
        showCloseButton={showCloseButton}
      >
        <Command label="Workspace actions">
          <SearchableList placeholder="Search workspace...">
            <CommandGroup heading="Workspace">
              {["projects", "search", "settings"].map((value) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={(action) => {
                    setExecuted(`Executed: ${action}`);
                    setOpen(false);
                  }}
                >
                  {value}
                </CommandItem>
              ))}
            </CommandGroup>
          </SearchableList>
        </Command>
      </CommandDialog>
    </div>
  );
}

function Keywords() {
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="Account actions" className="rounded-lg border">
        <SearchableList placeholder="Try user or find...">
          <CommandGroup heading="Workspace">
            <CommandItem value="search" keywords={["find"]} onSelect={setExecuted}>
              Search files
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem value="profile" keywords={["account", "user"]} onSelect={setExecuted}>
              Profile
            </CommandItem>
            <CommandItem value="billing" disabled>
              Billing unavailable
            </CommandItem>
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}

function Shortcuts() {
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="Navigation actions" className="rounded-lg border">
        <SearchableList placeholder="Search navigation...">
          <CommandGroup heading="Navigation">
            <CommandItem value="settings" onSelect={setExecuted}>
              Settings<CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
            <CommandItem value="projects" onSelect={setExecuted}>
              Projects<CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}

function Controlled() {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState("none");
  const [executed, setExecuted] = useState("none");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command label="Controlled actions" value={highlight} onValueChange={setHighlight} className="rounded-lg border">
        <SearchableList placeholder="Search controlled actions..." value={query} onValueChange={setQuery}>
          <CommandGroup heading="Workspace">
            {["projects", "settings"].map((value) => (
              <CommandItem key={value} value={value} onSelect={setExecuted}>
                {value}
              </CommandItem>
            ))}
          </CommandGroup>
        </SearchableList>
      </Command>
      <Button
        variant="outline"
        onClick={() => {
          setQuery("");
          setHighlight("settings");
        }}
      >
        Highlight settings externally
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        Query: {query || "empty"}; highlighted: {highlight || "none"}; executed: {executed}
      </p>
    </div>
  );
}

function PrefixFilter() {
  return (
    <Command
      defaultValue="none"
      label="Prefix actions"
      className="w-full max-w-sm rounded-lg border"
      filter={(value, search, keywords = []) =>
        [value, ...keywords].some((text) => text.toLowerCase().startsWith(search.trim().toLowerCase())) ? 1 : 0
      }
    >
      <SearchableList placeholder="Match a prefix, such as pref..." emptyMessage="No prefix matches.">
        <CommandGroup heading="Actions">
          <CommandItem value="settings" keywords={["preferences"]}>
            Settings
          </CommandItem>
          <CommandItem value="projects">Projects</CommandItem>
        </CommandGroup>
      </SearchableList>
    </Command>
  );
}

function CallerResults() {
  const [query, setQuery] = useState("");
  const [executed, setExecuted] = useState("No action yet");
  const results = ["Paris", "London", "Tokyo"].filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="City actions" shouldFilter={false} className="rounded-lg border">
        <SearchableList
          placeholder="Search local city data..."
          value={query}
          onValueChange={setQuery}
          emptyMessage="No city found."
        >
          <CommandGroup heading="Cities">
            {results.map((city) => (
              <CommandItem key={city} value={city} onSelect={setExecuted}>
                Open {city}
              </CommandItem>
            ))}
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}

function Navigation() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Command defaultValue="none" label="Bounded actions" loop={false} className="rounded-lg border">
        <CommandInput placeholder="Bounded; Ctrl+N enabled" />
        <CommandList>
          <CommandGroup heading="Bounded">
            <CommandItem value="first">First</CommandItem>
            <CommandItem value="unavailable" disabled>
              Unavailable
            </CommandItem>
            <CommandItem value="last">Last</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <Command
        defaultValue="none"
        label="Looping actions"
        loop
        vimBindings={false}
        disablePointerSelection
        className="rounded-lg border"
      >
        <CommandInput placeholder="Looping; arrow keys" />
        <CommandList>
          <CommandGroup heading="Looping">
            <CommandItem value="first">First</CommandItem>
            <CommandItem value="unavailable" disabled>
              Unavailable
            </CommandItem>
            <CommandItem value="last">Last</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function DisabledInput() {
  return (
    <Command defaultValue="none" label="Unavailable search" className="w-full max-w-sm rounded-lg border">
      <CommandInput disabled placeholder="Search unavailable" />
      <CommandList>
        <CommandGroup heading="Unavailable">
          <CommandItem value="offline" disabled>
            Offline action
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function MountedActions() {
  return (
    <Command defaultValue="none" label="Persistent help" className="w-full max-w-sm rounded-lg border">
      <CommandInput placeholder="Try a query with no matches..." />
      <CommandList>
        <CommandGroup heading="Workspace">
          <CommandItem value="projects">Projects</CommandItem>
        </CommandGroup>
        <CommandSeparator alwaysRender />
        <CommandGroup heading="Help" forceMount>
          <CommandItem value="help" forceMount>
            Search the help center
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function CustomInput() {
  return (
    <Command defaultValue="none" label="Custom search field" className="w-full max-w-sm rounded-lg border">
      <SearchableList placeholder="Search with a composed input..." inputMode="search" autoComplete="off">
        <CommandGroup heading="Workspace">
          <CommandItem value="projects">Projects</CommandItem>
          <CommandItem value="settings">Settings</CommandItem>
        </CommandGroup>
      </SearchableList>
    </Command>
  );
}

function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <div className="flex w-full flex-wrap gap-4">
        <Palette label="Open instant palette" />
        <CadenceProvider mode="full">
          <Palette label="Open nested full palette" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function CommandPreview({ example }: { example?: string }) {
  switch (example) {
    case "dialog":
      return <Palette label="Open named palette" showCloseButton />;
    case "keywords":
      return <Keywords />;
    case "shortcuts":
      return <Shortcuts />;
    case "controlled":
      return <Controlled />;
    case "filter":
      return <PrefixFilter />;
    case "results":
      return <CallerResults />;
    case "navigation":
      return <Navigation />;
    case "disabled":
      return <DisabledInput />;
    case "mounted":
      return <MountedActions />;
    case "custom-input":
      return <CustomInput />;
    case "without-motion":
      return <WithoutMotion />;
    default:
      return <Palette />;
  }
}
