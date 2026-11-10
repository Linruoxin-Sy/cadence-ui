"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/cadence/tabs";

function ProjectTabs({
  orientation = "horizontal",
  variant = "default",
  wide = false,
  disabled = false,
  value,
  onValueChange,
}: {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
  wide?: boolean;
  disabled?: boolean;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <Tabs
      defaultValue="overview"
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      className="w-full max-w-md"
    >
      <TabsList aria-label="Project views" variant={variant} className={wide ? "w-full" : undefined}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {disabled && (
          <TabsTrigger value="locked" disabled>
            Locked
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border p-4 text-sm">
        Project overview. Peer views share one selection indicator.
      </TabsContent>
      <TabsContent value="activity" className="rounded-lg border p-4 text-sm">
        Recent activity.
      </TabsContent>
    </Tabs>
  );
}

function SettingsTabs({ vertical = false }: { vertical?: boolean }) {
  return (
    <Tabs defaultValue="account" orientation={vertical ? "vertical" : "horizontal"} className="w-full max-w-md">
      <TabsList variant="line" aria-label="Settings views" activateOnFocus>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="p-4 text-sm">
        Account settings
      </TabsContent>
      <TabsContent value="notifications" className="p-4 text-sm" keepMounted>
        Notification preferences
      </TabsContent>
    </Tabs>
  );
}

function Controlled() {
  const [value, setValue] = useState<string | null>("overview");
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setValue(value === "overview" ? "activity" : "overview")}
      >
        Change selection
      </Button>
      <ProjectTabs value={value} onValueChange={setValue} />
      <output className="text-sm" aria-live="polite">
        Selected: {value}
      </output>
    </div>
  );
}

function Vertical() {
  return (
    <div className="flex w-full flex-col gap-6">
      <ProjectTabs orientation="vertical" disabled />
      <SettingsTabs vertical />
    </div>
  );
}

function LineStyle() {
  return <SettingsTabs />;
}

function Persistent() {
  return (
    <Tabs defaultValue="draft" className="w-full max-w-md">
      <TabsList aria-label="Editor views">
        <TabsTrigger value="draft" render={<button type="button" />}>
          Draft
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="draft" keepMounted render={<section />}>
        <textarea
          aria-label="Draft text"
          className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
          defaultValue="Work in progress"
        />
      </TabsContent>
      <TabsContent value="history" className="p-4 text-sm">
        Previous revisions
      </TabsContent>
    </Tabs>
  );
}

function ListSizing() {
  const [wide, setWide] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Button variant="outline" size="sm" className="self-start" onClick={() => setWide((value) => !value)}>
        Resize list
      </Button>
      <ProjectTabs wide={wide} />
    </div>
  );
}

function Disabled() {
  return <ProjectTabs disabled />;
}

function ChangingContent() {
  const [long, setLong] = useState(true);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex w-full max-w-lg flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setLong((v) => !v)}>
          Change label
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
          Change panel content
        </Button>
      </div>
      <Tabs defaultValue="activity" className="w-full p-2 font-mono [font-feature-settings:normal]">
        <TabsList variant="line" aria-label="Changing project views">
          <TabsTrigger value="overview">{long ? "Project overview" : "Overview"}</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="rounded-md border p-4 text-sm">
          Project overview
        </TabsContent>
        <TabsContent value="activity" className="whitespace-pre-line rounded-md border p-4 text-sm">
          {expanded ? "Release ready\nReview complete\nReady for the next milestone" : "Release pending"}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Quantities() {
  const [count, setCount] = useState(19);
  return (
    <div className="flex w-full max-w-md flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={() => setCount((n) => (n === 19 ? 20 : 19))}>
        Update count
      </Button>
      <Tabs defaultValue="count" className="font-mono [font-feature-settings:normal]">
        <TabsList aria-label="Open requests">
          <TabsTrigger value="count">{count}</TabsTrigger>
        </TabsList>
        <TabsContent value="count" className="p-4 text-2xl tabular-nums">
          {count}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const examples = {
  controlled: Controlled,
  vertical: Vertical,
  "line-style": LineStyle,
  persistent: Persistent,
  "list-sizing": ListSizing,
  disabled: Disabled,
  "changing-content": ChangingContent,
  quantities: Quantities,
};

export function TabsPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Tabs example: ${example}`);
    return <Example />;
  }
  return <ProjectTabs />;
}
