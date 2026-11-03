"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/cadence/input-group";
import { Kbd } from "@/registry/cadence/kbd";
import { PreviewStack } from "./shell";

function Specimen() {
  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components" aria-label="Search components" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function AddonAlignments() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Inline start" placeholder="cadence.dev" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Inline end" placeholder="cadence" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.dev</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>Recipient</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Block start" placeholder="you@example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Block end" placeholder="review-notes" />
        <InputGroupAddon align="block-end">
          <InputGroupText>Lowercase letters and hyphens.</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

export function FrameButtons() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      {(["xs", "sm", "icon-xs", "icon-sm"] as const).map((size) => (
        <ClearDomain key={size} size={size} />
      ))}
    </div>
  );
}

function ClearDomain({ size }: { size: "xs" | "sm" | "icon-xs" | "icon-sm" }) {
  const [value, setValue] = useState("cadence.dev");
  return (
    <InputGroup>
      <InputGroupInput aria-label={`Domain ${size}`} value={value} onChange={(event) => setValue(event.target.value)} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size={size} aria-label={`Clear domain ${size}`} onClick={() => setValue("")}>
          {size.startsWith("icon") ? <XIcon aria-hidden="true" /> : "Clear"}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function NoteComposer() {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState("");
  return (
    <form
      className="grid w-full max-w-sm gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(note);
        setNote("");
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          aria-label="Note"
          rows={3}
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Leave a note for the reviewer…"
        />
        <InputGroupAddon align="block-end">
          <InputGroupText>{note.length}/280</InputGroupText>
          <InputGroupButton type="submit" size="sm" variant="default" className="ml-auto" disabled={!note.trim()}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p role="status" className="text-sm text-muted-foreground">
        {sent ? `Sent: ${sent}` : "No note sent."}
      </p>
    </form>
  );
}

export function InvalidEmail() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="email"
          aria-label="Email"
          defaultValue="unavailable@example.com"
          aria-invalid
          aria-describedby={id}
        />
      </InputGroup>
      <p id={id} className="text-sm text-destructive">
        This email address is unavailable.
      </p>
    </div>
  );
}

const examples = {
  alignments: AddonAlignments,
  button: FrameButtons,
  textarea: NoteComposer,
  invalid: InvalidEmail,
};

export function InputGroupPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown InputGroup example: ${example}`);
    return <Example />;
  }
  return (
    <PreviewStack>
      <Specimen />
    </PreviewStack>
  );
}
