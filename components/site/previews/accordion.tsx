"use client";
import { useId, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/cadence/accordion";
import { Button } from "@/registry/cadence/button";
import { Input } from "@/registry/cadence/input";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function BasicExample() {
  return (
    <Accordion className="w-full max-w-lg" defaultValue={["install"]}>
      <AccordionItem value="install">
        <AccordionTrigger>How do I install a component?</AccordionTrigger>
        <AccordionContent>
          Install from the Cadence registry. The source is copied into your project, ready to customise.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="motion">
        <AccordionTrigger>Can I reduce the motion?</AccordionTrigger>
        <AccordionContent>
          Yes. Your system preference is respected, and the provider can disable motion entirely.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Upcoming integrations</AccordionTrigger>
        <AccordionContent>Not available yet.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function ControlledExample() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setValue(["account"])}>
          Open account from outside
        </Button>
        <Button variant="outline" onClick={() => setValue([])}>
          Close from outside
        </Button>
      </div>
      <Accordion value={value} onValueChange={setValue}>
        <AccordionItem value="account">
          <AccordionTrigger>Account settings</AccordionTrigger>
          <AccordionContent>Your account details stay with the caller.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <p role="status">Open sections: {value.join(", ") || "none"}</p>
    </div>
  );
}

export function MultipleExample() {
  return (
    <Accordion multiple defaultValue={["delivery", "returns"]}>
      <AccordionItem value="delivery">
        <AccordionTrigger>Delivery</AccordionTrigger>
        <AccordionContent>Track your delivery from your order history.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Start a return within thirty days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function DisabledExample() {
  return (
    <div className="grid gap-4">
      <Accordion defaultValue={["available"]}>
        <AccordionItem value="available">
          <AccordionTrigger>Available settings</AccordionTrigger>
          <AccordionContent>You can edit these settings.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="locked" disabled>
          <AccordionTrigger>Unavailable section</AccordionTrigger>
          <AccordionContent>Not available yet.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="help">
          <AccordionTrigger>Settings help</AccordionTrigger>
          <AccordionContent>Contact the workspace owner.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion disabled defaultValue={["readable"]}>
        <AccordionItem value="readable">
          <AccordionTrigger>Read-only summary</AccordionTrigger>
          <AccordionContent>The whole group is disabled; this initial summary remains readable.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="later">
          <AccordionTrigger>Locked next step</AccordionTrigger>
          <AccordionContent>Unavailable.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function PersistentExample() {
  const rootId = useId();
  const panelId = useId();
  return (
    <div className="grid gap-4">
      <Accordion keepMounted defaultValue={["draft"]}>
        <AccordionItem value="draft">
          <AccordionTrigger>Workspace draft</AccordionTrigger>
          <AccordionContent>
            <Label htmlFor={rootId}>Workspace note</Label>
            <Input id={rootId} defaultValue="Keep this draft" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion defaultValue={["local"]}>
        <AccordionItem value="local">
          <AccordionTrigger>Panel draft</AccordionTrigger>
          <AccordionContent keepMounted>
            <Label htmlFor={panelId}>Panel note</Label>
            <Input id={panelId} defaultValue="Keep this panel" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function SearchableExample() {
  return (
    <div className="grid gap-4">
      <Accordion hiddenUntilFound>
        <AccordionItem value="reference">
          <AccordionTrigger>Delivery reference</AccordionTrigger>
          <AccordionContent>Cobalt delivery reference: use your order number when contacting support.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion>
        <AccordionItem value="policy">
          <AccordionTrigger>Searchable policy</AccordionTrigger>
          <AccordionContent hiddenUntilFound>
            Indigo returns reference: keep your receipt for a return.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion defaultValue={["motion"]}>
      <AccordionItem value="motion">
        <AccordionTrigger>Can I reduce the motion?</AccordionTrigger>
        <AccordionContent>
          <p>Yes. Your system preference is respected, and the provider can disable motion entirely.</p>
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
            Toggle details
          </Button>
          {expanded && (
            <p className="mt-4">
              Disclosure heights update instantly in reduced and none modes. Full mode follows the measured content
              height and can reverse while moving.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function CustomRenderExample() {
  return (
    <Accordion defaultValue={["support"]}>
      <AccordionItem value="support">
        <AccordionTrigger>Where can I get help?</AccordionTrigger>
        <AccordionContent render={<section />} className="text-muted-foreground" style={{ scrollMarginTop: "6rem" }}>
          <a href="/docs/installation">Read the installation guide</a> before adding your first component.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function OrientationExample() {
  return (
    <div className="grid gap-4">
      {(["vertical", "horizontal"] as const).map((orientation) => (
        <Accordion key={orientation} orientation={orientation} loopFocus defaultValue={["state"]}>
          <AccordionItem value="state">
            <AccordionTrigger>{orientation} state</AccordionTrigger>
            <AccordionContent>
              Orientation is retained as state; keyboard navigation follows normal Tab order.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="next">
            <AccordionTrigger>Next {orientation} section</AccordionTrigger>
            <AccordionContent>This is still a vertically stacked section.</AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
}

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <Accordion defaultValue={["instant"]}>
          <AccordionItem value="instant">
            <AccordionTrigger>Instant disclosure</AccordionTrigger>
            <AccordionContent>No height transition runs here.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <CadenceProvider mode="full">
          <Accordion defaultValue={["nested"]}>
            <AccordionItem value="nested">
              <AccordionTrigger>Nested full disclosure</AccordionTrigger>
              <AccordionContent>The operating system can still reduce this transition.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

const examples = {
  controlled: ControlledExample,
  multiple: MultipleExample,
  disabled: DisabledExample,
  persistent: PersistentExample,
  searchable: SearchableExample,
  "changing-content": ChangingContentExample,
  "custom-render": CustomRenderExample,
  orientation: OrientationExample,
  "without-motion": WithoutMotionExample,
};

export function AccordionPreview({ example }: { example?: string }) {
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
