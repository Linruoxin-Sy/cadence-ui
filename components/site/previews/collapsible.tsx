"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/cadence/collapsible";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function BasicExample() {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">Project details</h2>
        <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>
          {open ? "Hide details" : "Show details"}
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="mt-4 rounded-lg border p-4 text-sm">
          Components are copied into your project so you can make them your own.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ControlledExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open from outside
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Close from outside
        </Button>
      </div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>Account details</CollapsibleTrigger>
        <CollapsibleContent>Your account details stay with the caller.</CollapsibleContent>
      </Collapsible>
      <p role="status">Details: {open ? "open" : "closed"}</p>
    </div>
  );
}

export function CustomTriggerExample() {
  return (
    <div className="grid gap-4">
      <Collapsible defaultOpen>
        <CollapsibleTrigger render={<Button variant="outline" />}>Button details</CollapsibleTrigger>
        <CollapsibleContent>Initially visible without an entrance animation.</CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger
          nativeButton={false}
          render={<div />}
          className="w-fit rounded border p-2 focus-visible:outline-2"
        >
          Non-native details
        </CollapsibleTrigger>
        <CollapsibleContent>A div receives the primitive's role, focus and keyboard handling.</CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function DisabledExample() {
  return (
    <div className="grid gap-4">
      <Collapsible disabled defaultOpen>
        <CollapsibleTrigger>Locked project</CollapsibleTrigger>
        <CollapsibleContent>
          This initially open summary remains readable while the root is disabled.
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger disabled>Unavailable details</CollapsibleTrigger>
        <CollapsibleContent>Not available yet.</CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger>Available details</CollapsibleTrigger>
        <CollapsibleContent>You can still open this independent section.</CollapsibleContent>
      </Collapsible>
      <a href="/docs/installation">Read the installation guide</a>
    </div>
  );
}

export function PersistentExample() {
  const id = useId();
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Workspace draft</CollapsibleTrigger>
      <CollapsibleContent keepMounted>
        <Label htmlFor={id}>Workspace note</Label>
        <Input id={id} defaultValue="Keep this draft" />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SearchableExample() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Reference notes</CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound>
        Cobalt delivery reference: use your order number when contacting support.
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ChangingContentExample() {
  const [details, setDetails] = useState(false);
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Project information</CollapsibleTrigger>
      <CollapsibleContent className="mt-4 rounded-lg border p-4 text-sm">
        <p className="mb-4">Components are copied into your project so you can make them your own.</p>
        <Button variant="outline" size="sm" aria-expanded={details} onClick={() => setDetails(!details)}>
          Toggle extra detail
        </Button>
        {details && (
          <p className="mt-4">
            The disclosure follows content changes and responsive wrapping. Reduced and none modes update its height
            instantly.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CustomRenderExample() {
  const id = useId();
  return (
    <Collapsible defaultOpen render={<section />}>
      <CollapsibleTrigger id={id}>Support resources</CollapsibleTrigger>
      <CollapsibleContent
        render={<section />}
        role="region"
        aria-labelledby={id}
        className="text-muted-foreground"
        style={{ scrollMarginTop: "6rem" }}
      >
        <a href="/docs/installation">Read the installation guide</a> before adding your first component.
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Instant disclosure</CollapsibleTrigger>
          <CollapsibleContent>No height transition runs here.</CollapsibleContent>
        </Collapsible>
        <CadenceProvider mode="full">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Nested full disclosure</CollapsibleTrigger>
            <CollapsibleContent>The operating system can still reduce this transition.</CollapsibleContent>
          </Collapsible>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

const examples = {
  controlled: ControlledExample,
  "custom-trigger": CustomTriggerExample,
  disabled: DisabledExample,
  persistent: PersistentExample,
  searchable: SearchableExample,
  "changing-content": ChangingContentExample,
  "custom-render": CustomRenderExample,
  "without-motion": WithoutMotionExample,
};

export function CollapsiblePreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : BasicExample;
  if (!Example) return null;
  return (
    <PreviewStack>
      <div className="grid w-full max-w-lg gap-4">
        <Example />
      </div>
    </PreviewStack>
  );
}
