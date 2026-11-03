"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/cadence/select";
import { PreviewRow, PreviewStack } from "./shell";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger
        size={size}
        aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}
      >
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Sizes() {
  return (
    <PreviewRow>
      <FrameworkSelect />
      <FrameworkSelect size="sm" />
      <FrameworkSelect empty />
    </PreviewRow>
  );
}

function Groups() {
  return (
    <Select
      items={[
        { value: "apple", label: "Apple" },
        { value: "orange", label: "Orange" },
        { value: "carrot", label: "Carrot" },
      ]}
      defaultValue="apple"
    >
      <SelectTrigger aria-label="Produce">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="orange" disabled>
            Orange
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function Controlled() {
  const [value, setValue] = useState<string | null>("next");
  return (
    <PreviewStack>
      <PreviewRow>
        <Select items={frameworks} value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="Controlled framework">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frameworks.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setValue("astro")}>
          Choose Astro externally
        </Button>
      </PreviewRow>
      <output className="text-sm" aria-live="polite">
        Value: {value}
      </output>
    </PreviewStack>
  );
}

function FormSubmission() {
  const [submitted, setSubmitted] = useState<string>();
  return (
    <form
      className="flex flex-wrap items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get("framework")));
      }}
    >
      <Select items={frameworks} name="framework" required>
        <SelectTrigger aria-label="Framework to submit">
          <SelectValue placeholder="Choose a framework" />
        </SelectTrigger>
        <SelectContent>
          {frameworks.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit">Submit framework</Button>
      <output className="w-full text-sm" aria-live="polite">
        {submitted ? `Submitted: ${submitted}` : "No submission yet"}
      </output>
    </form>
  );
}

function DisabledInvalid() {
  const errorId = useId();
  return (
    <PreviewStack>
      <PreviewRow>
        <Select items={frameworks} disabled defaultValue="next">
          <SelectTrigger aria-label="Framework, disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next">Next.js</SelectItem>
          </SelectContent>
        </Select>
        <Select items={frameworks} defaultValue="astro">
          <SelectTrigger aria-label="Framework, invalid" aria-invalid="true" aria-describedby={errorId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frameworks.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreviewRow>
      <p id={errorId} className="text-sm text-destructive">
        This framework is unavailable for your project.
      </p>
    </PreviewStack>
  );
}

function Multiple() {
  return (
    <Select items={frameworks} multiple defaultValue={["next", "astro"]}>
      <SelectTrigger aria-label="Multiple frameworks">
        <SelectValue placeholder="Choose frameworks" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Placement() {
  const id = useId();
  return (
    <PreviewStack>
      <PreviewRow>
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <div key={side} className="grid gap-2">
            <label htmlFor={`${id}-${side}`} className="text-xs capitalize">
              {side} panel
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${side}`} aria-label={`Framework, ${side} panel`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side={side} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </PreviewRow>
      <PreviewRow>
        {(["start", "center", "end"] as const).map((align) => (
          <div key={align} className="grid gap-2">
            <label htmlFor={`${id}-${align}`} className="text-xs capitalize">
              {align} alignment
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${align}`} aria-label={`Framework, ${align} alignment`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align={align} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </PreviewRow>
    </PreviewStack>
  );
}

const examples = {
  sizes: Sizes,
  multiple: Multiple,
  placement: Placement,
  groups: Groups,
  controlled: Controlled,
  "form-submission": FormSubmission,
  "disabled-invalid": DisabledInvalid,
};

export function SelectPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Select example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewRow>
      <FrameworkSelect />
      <FrameworkSelect size="sm" />
    </PreviewRow>
  );
}
