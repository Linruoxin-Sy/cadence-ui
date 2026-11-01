"use client";

import { ScrollArea, ScrollBar } from "@/registry/cadence/scroll-area";

export function ScrollAreaPreview() {
  return (
    <div className="grid min-w-0 gap-6">
      <div className="min-w-0">
        <h3 className="mb-2 text-sm font-medium">Release notes</h3>
        <ScrollArea aria-label="Release notes" className="h-48 w-full rounded-md border">
          <ul className="flex flex-col gap-3 p-4 pr-6 text-sm">
            {Array.from({ length: 20 }, (_, i) => (
              <li key={i.toString()}>Release {20 - i}: improved keyboard navigation and component parity.</li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      <div className="min-w-0">
        <h3 className="mb-2 text-sm font-medium">Project timeline</h3>
        <ScrollArea aria-label="Project timeline" className="w-full rounded-md border">
          <div className="flex w-max gap-4 p-4 pb-6">
            {["Research", "Design", "Build", "Review", "Ship", "Learn"].map((label) => (
              <div key={label} className="flex h-24 w-40 items-center justify-center rounded-md bg-muted text-sm">
                {label}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
