"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/cadence/tabs";

/** Local install method; package-manager choice remains in its existing store. */
export function InstallationTabs({ command, manual }: { command: ReactNode; manual: ReactNode }) {
  return (
    <Tabs defaultValue="command" data-installation className="mt-6 min-w-0">
      <TabsList variant="line" aria-label="Installation method">
        <TabsTrigger value="command">Command</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>
      {/* hidden removes inactive panels from focus; omitting inert also lets the
          no-JS stylesheet expose readable, selectable source in both panels. */}
      <TabsContent value="command" keepMounted inert={false}>
        {command}
      </TabsContent>
      <TabsContent value="manual" keepMounted inert={false}>
        {manual}
      </TabsContent>
    </Tabs>
  );
}
