"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/cadence/tabs";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "line"] as const;

export function TabsPreview() {
  const { control, choose } = usePreviewVariant("Tabs", previewVariantOptions);
  const [vertical, setVertical] = useState(false);
  const [wide, setWide] = useState(false);
  const [value, setValue] = useState<string | null>("overview");
  return (
    <>
      {control}
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setVertical(!vertical)}>
            Toggle orientation
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWide(!wide)}>
            Resize list
          </Button>
          <Button variant="outline" size="sm" onClick={() => setValue(value === "overview" ? "activity" : "overview")}>
            Change selection
          </Button>
        </div>
        <Tabs value={value} onValueChange={setValue} orientation={vertical ? "vertical" : "horizontal"}>
          <TabsList aria-label="Project views" className={wide ? "w-full" : undefined} variant={choose("default")}>
            <TabsTrigger value="overview" render={<button type="button" />}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="locked" disabled>
              Locked
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="rounded-lg border p-4 text-sm">
            Project overview. Peer views share one selection indicator.
          </TabsContent>
          <TabsContent value="activity" className="rounded-lg border p-4 text-sm">
            Recent activity. Selection is controlled by the example.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="account" orientation={vertical ? "vertical" : "horizontal"}>
          <TabsList variant={choose("line")} aria-label="Settings views" activateOnFocus>
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
      </div>
    </>
  );
}
