"use client";

import { BoldIcon, ItalicIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Toggle } from "@/registry/cadence/toggle";
import { PreviewStack } from "./shell";

export function ToggleVariants() {
  return (
    <div className="flex flex-wrap gap-3">
      <Toggle>Default</Toggle>
      <Toggle defaultPressed>Default on</Toggle>
      <Toggle variant="outline">Outline</Toggle>
      <Toggle variant="outline" defaultPressed>
        Outline on
      </Toggle>
    </div>
  );
}
export function ToggleSizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" size="lg">
        Large
      </Toggle>
    </div>
  );
}
export function LabelledToggle() {
  return (
    <Toggle variant="outline">
      <BoldIcon />
      Bold
    </Toggle>
  );
}
export function ControlledToggle() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Toggle pressed={on} onPressedChange={setOn}>
        <ItalicIcon />
        Italic
      </Toggle>
      <p role="status" className="text-sm text-muted-foreground">
        {on ? "Italic enabled" : "Italic disabled"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setOn(false)}>
        Clear italic
      </Button>
    </div>
  );
}
export function DisabledToggles() {
  return (
    <div className="flex flex-wrap gap-3">
      <Toggle disabled>Unavailable off</Toggle>
      <Toggle disabled defaultPressed variant="outline">
        Unavailable on
      </Toggle>
    </div>
  );
}
export function ToggleForm() {
  const [bold, setBold] = useState(false);
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid justify-items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(`Submitted bold: ${new FormData(event.currentTarget).get("bold") ?? "absent"}`);
      }}
    >
      <Toggle pressed={bold} onPressedChange={setBold}>
        <BoldIcon />
        Bold
      </Toggle>
      {bold && <input type="hidden" name="bold" value="enabled" />}
      <Button type="submit" size="sm">
        Save formatting
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
export function StaticToggle() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <div data-testid="initial-none">
          <Toggle aria-label="Static toggle On" defaultPressed>
            On
          </Toggle>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <Toggle aria-label="Explicit full toggle Press">Press</Toggle>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
function Specimen() {
  return (
    <div className="flex flex-wrap gap-3">
      <Toggle aria-label="Bold">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Bold (pressed)" defaultPressed>
        <BoldIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Italic">
        <ItalicIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Italic (pressed)" defaultPressed>
        <ItalicIcon />
      </Toggle>
    </div>
  );
}
export function TogglePreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "variants" ? (
        <ToggleVariants />
      ) : example === "sizes" ? (
        <ToggleSizes />
      ) : example === "label" ? (
        <LabelledToggle />
      ) : example === "controlled" ? (
        <ControlledToggle />
      ) : example === "disabled" ? (
        <DisabledToggles />
      ) : example === "form-submission" ? (
        <ToggleForm />
      ) : example === "without-motion" ? (
        <StaticToggle />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
