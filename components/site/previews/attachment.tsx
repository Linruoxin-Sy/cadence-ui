"use client";

import { FileTextIcon, XIcon } from "lucide-react";
import { type ComponentProps, useId, useRef, useState } from "react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/registry/cadence/attachment";
import { Button } from "@/registry/cadence/button";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow, PreviewStack } from "./shell";

const noteUrl = "data:text/plain;charset=utf-8,Project%20notes%0AReview%20the%20attachment%20examples.";
const imageUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23d4d4d8'/%3E%3Crect x='10' y='10' width='60' height='60' rx='6' fill='%23fafafa'/%3E%3Cpath d='M20 28h40M20 40h24M20 52h32' stroke='%2352525b' stroke-width='4'/%3E%3C/svg%3E";

function FileTile({
  name = "project-notes.txt",
  description = "Text file · 45 B",
  ...props
}: ComponentProps<typeof Attachment> & { name?: string; description?: string }) {
  return (
    <Attachment {...props}>
      <AttachmentMedia aria-hidden="true">
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={name}>{name}</AttachmentTitle>
        <AttachmentDescription>{description}</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}

function ReadyFile() {
  const [removed, setRemoved] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  return (
    <div ref={region} tabIndex={-1} className="max-w-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {removed ? (
        <p className="text-sm text-muted-foreground">No attached files.</p>
      ) : (
        <Attachment>
          <AttachmentMedia aria-hidden="true">
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>project-notes.txt</AttachmentTitle>
            <AttachmentDescription>Text file · 45 B</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger
            render={<a href={noteUrl} download="project-notes.txt" aria-label="Download project notes" />}
          />
          <AttachmentActions>
            <AttachmentAction
              aria-label="Remove project notes"
              onClick={() => {
                setRemoved(true);
                region.current?.focus();
              }}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
    </div>
  );
}

function UploadState() {
  const states = ["idle", "uploading", "processing", "error", "done"] as const;
  const descriptions = {
    idle: "Ready to upload",
    uploading: "Uploading · 64%",
    processing: "Processing file",
    error: "Upload failed · connection lost",
    done: "Upload complete",
  };
  return (
    <div className="flex w-full min-w-0 flex-wrap justify-center gap-3">
      {states.map((state) => (
        <FileTile
          key={state}
          state={state}
          name={`${state}.pdf`}
          description={descriptions[state]}
          aria-busy={state === "uploading" || state === "processing"}
        />
      ))}
    </div>
  );
}

function Images() {
  return (
    <div className="flex max-w-full flex-wrap items-start justify-center gap-4">
      {(["done", "processing"] as const).map((state) => (
        <Attachment key={state} state={state} orientation="vertical" aria-busy={state === "processing"}>
          <AttachmentMedia variant="image">
            {/* biome-ignore lint/performance/noImgElement: Native images are the public AttachmentMedia composition. */}
            <img src={imageUrl} width={80} height={80} alt="Interface diagram" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle title={`${state}-diagram.svg`}>{state}-diagram.svg</AttachmentTitle>
            <AttachmentDescription>{state === "done" ? "SVG · 250 B" : "Processing preview"}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-4">
      {(["default", "sm", "xs"] as const).map((size) => (
        <FileTile key={size} size={size} name={`${size}-notes.txt`} description={`Size: ${size}`} />
      ))}
    </div>
  );
}

function TriggerAndActions() {
  const [opened, setOpened] = useState(0);
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex min-w-0 max-w-full flex-col items-start gap-3">
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>review-notes.txt</AttachmentTitle>
          <AttachmentDescription>Download or save independently</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger
          aria-label="Download review notes"
          onClick={() => setOpened((n) => n + 1)}
          render={<a href={noteUrl} download="review-notes.txt" />}
        />
        <AttachmentActions>
          <AttachmentAction size="sm" onClick={() => setSaved((v) => !v)} aria-pressed={saved}>
            {saved ? "Saved" : "Save"}
          </AttachmentAction>
          <AttachmentAction aria-label="Delete locked review notes" disabled>
            <XIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <output className="text-sm text-muted-foreground">
        Downloads requested: {opened}; {saved ? "saved" : "not saved"}.
      </output>
    </div>
  );
}

function ScrollableGroups() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <AttachmentGroup
          key={orientation}
          tabIndex={0}
          role="group"
          aria-label={`${orientation} reference files`}
          className="w-full focus-visible:outline-2 focus-visible:outline-ring"
        >
          {[
            "research-notes-with-a-very-long-name.txt",
            "project-roadmap.txt",
            "interface-reference.txt",
            "meeting-notes.txt",
          ].map((name) => (
            <Attachment key={name} orientation={orientation} size="sm">
              <AttachmentMedia aria-hidden="true">
                <FileTextIcon />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle title={name}>{name}</AttachmentTitle>
                <AttachmentDescription>Reference · text file</AttachmentDescription>
              </AttachmentContent>
              <AttachmentTrigger render={<a href={noteUrl} download={name} aria-label={`Download ${name}`} />} />
            </Attachment>
          ))}
        </AttachmentGroup>
      ))}
    </div>
  );
}

function CallerOwnedFileSelection() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<NonNullable<ComponentProps<typeof Attachment>["state"]>>("idle");
  const [notice, setNotice] = useState("No file selected. This example makes no requests.");
  const descriptions = {
    idle: "Selected locally · no upload started",
    uploading: "Local simulation · 64%",
    processing: "Local simulation · processing",
    error: "Caller supplied: connection lost",
    done: "Local simulation complete",
  };
  function update(next: typeof state) {
    setState(next);
    setNotice(descriptions[next]);
  }
  return (
    <form
      ref={form}
      onSubmit={(event) => event.preventDefault()}
      className="flex w-full min-w-0 max-w-lg flex-col items-start gap-3"
    >
      <label htmlFor={`${id}-file`} className="text-sm font-medium">
        Choose a local file (name only)
      </label>
      <Input
        ref={input}
        id={`${id}-file`}
        name="attachment"
        type="file"
        aria-describedby={`${id}-notice`}
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null;
          setFile(selected);
          setState("idle");
          setNotice(selected ? `Selected ${selected.name}; no request started.` : "No file selected.");
        }}
      />
      {file && (
        <Attachment
          state={state}
          aria-busy={state === "uploading" || state === "processing"}
          aria-invalid={state === "error" || undefined}
          aria-describedby={state === "error" ? `${id}-error` : undefined}
        >
          <AttachmentMedia aria-hidden="true">
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle title={file.name}>{file.name}</AttachmentTitle>
            <AttachmentDescription>{descriptions[state]}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger
            aria-label={`Inspect ${file.name}`}
            onClick={() => setNotice(`${file.name} · ${file.size} bytes · ${file.type || "unknown type"}`)}
          />
          <AttachmentActions>
            <AttachmentAction
              aria-label={`Remove ${file.name}`}
              onClick={() => {
                setFile(null);
                setState("idle");
                form.current?.reset();
                setNotice(`Removed ${file.name}`);
                input.current?.focus();
              }}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      )}
      {state === "error" && file && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          Connection lost. Retry when your application is ready.
        </p>
      )}
      <div className="flex max-w-full flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!file} onClick={() => update("uploading")}>
          Start local simulation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || state !== "uploading"}
          onClick={() => update("processing")}
        >
          Process locally
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || state !== "processing"}
          onClick={() => update("done")}
        >
          Finish locally
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!file} onClick={() => update("error")}>
          Supply failure
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!file || state !== "error"}
          onClick={() => update("uploading")}
        >
          Retry locally
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            form.current?.reset();
            setFile(null);
            setState("idle");
            setNotice("Local selection reset.");
            input.current?.focus();
          }}
        >
          Reset selection
        </Button>
      </div>
      <p id={`${id}-notice`} role="status" className="max-w-full break-all text-sm text-muted-foreground">
        {notice}
      </p>
    </form>
  );
}

function CustomParts() {
  const trigger = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(0);
  return (
    <div className="flex min-w-0 max-w-full flex-col items-start gap-3">
      <Attachment
        className="rounded-none"
        style={{ borderStyle: "dashed" }}
        onKeyDown={(event) => {
          if (event.key === "F2") trigger.current?.focus();
        }}
      >
        <AttachmentContent>
          <AttachmentTitle>custom-notes.txt</AttachmentTitle>
          <AttachmentDescription>F2 focuses the inspect button</AttachmentDescription>
        </AttachmentContent>
        <AttachmentTrigger
          ref={trigger}
          aria-label="Inspect custom notes"
          onClick={() => setCount((n) => n + 1)}
          render={(props) => <button {...props} type="button" data-caller-trigger="yes" />}
        />
        <AttachmentActions>
          <AttachmentAction
            render={<a href={noteUrl} download="custom-notes.txt" />}
            size="sm"
            className={(s) => (s.disabled ? "opacity-50" : "underline")}
            style={(s) => ({ fontWeight: s.disabled ? 400 : 600 })}
          >
            Download
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Button variant="outline" size="sm" onClick={() => trigger.current?.focus()}>
        Focus inspect
      </Button>
      <output className="text-sm text-muted-foreground">Inspections: {count}</output>
    </div>
  );
}

function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <FileTile state="uploading" name="quiet-report.pdf" description="Uploading · 64%" aria-busy="true" />
    </CadenceProvider>
  );
}

export function AttachmentPreview({ example }: { example?: string }) {
  let content = <ReadyFile />;
  switch (example) {
    case "upload-state":
      content = <UploadState />;
      break;
    case "images":
      content = <Images />;
      break;
    case "sizes":
      content = <Sizes />;
      break;
    case "trigger-and-actions":
      content = <TriggerAndActions />;
      break;
    case "scrollable-groups":
      content = <ScrollableGroups />;
      break;
    case "caller-owned-file-selection":
      content = <CallerOwnedFileSelection />;
      break;
    case "custom-parts":
      content = <CustomParts />;
      break;
    case "without-motion":
      content = <WithoutMotion />;
      break;
  }
  return (
    <PreviewStack className="min-w-0">
      <PreviewRow className="w-full min-w-0">{content}</PreviewRow>
    </PreviewStack>
  );
}
