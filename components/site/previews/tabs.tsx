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

const examples = {
  controlled: Controlled,
  vertical: Vertical,
  "line-style": LineStyle,
  persistent: Persistent,
  "list-sizing": ListSizing,
  disabled: Disabled,
};

export function TabsPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Tabs example: ${example}`);
    return <Example />;
  }
  return <ProjectTabs />;
}
