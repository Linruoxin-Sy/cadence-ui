"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/cadence/collapsible";

export function CollapsiblePreview() {
  const [open, setOpen] = useState(true);
  const [details, setDetails] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">Project details</h3>
        <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>
          {open ? "Hide details" : "Show details"}
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="mt-4 rounded-lg border p-4 text-sm">
          <p className="mb-4">Components are copied into your project so you can make them your own.</p>
          <Button variant="outline" size="sm" onClick={() => setDetails(!details)}>
            Toggle extra detail
          </Button>
          {details && (
            <p className="mt-4">
              The disclosure follows content changes and responsive wrapping. Reduced and none modes update its height
              instantly.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
