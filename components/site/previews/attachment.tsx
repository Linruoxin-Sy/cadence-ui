"use client";

import { FileTextIcon, XIcon } from "lucide-react";
import { useState } from "react";
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
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

export function AttachmentPreview() {
  const [mode, setMode] = useState<CadenceMode>("full");
  const [state, setState] = useState<"idle" | "uploading" | "processing" | "error" | "done">("uploading");
  const [size, setSize] = useState<"default" | "sm" | "xs">("default");
  const [vertical, setVertical] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [name, setName] = useState("sales-dashboard.pdf");
  const [notice, setNotice] = useState("Local demonstration; no file is uploaded.");
  return (
    <div className="flex w-full min-w-0 max-w-lg flex-col gap-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <label>
          Attachment motion{" "}
          <select
            aria-label="Attachment motion"
            value={mode}
            onChange={(e) => setMode(e.target.value as CadenceMode)}
            className="rounded border bg-background p-1"
          >
            <option value="full">Full</option>
            <option value="reduced">Reduced</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>
          State{" "}
          <select
            aria-label="State"
            value={state}
            onChange={(e) => setState(e.target.value as typeof state)}
            className="rounded border bg-background p-1"
          >
            {(["idle", "uploading", "processing", "error", "done"] as const).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Size{" "}
          <select
            aria-label="Size"
            value={size}
            onChange={(e) => setSize(e.target.value as typeof size)}
            className="rounded border bg-background p-1"
          >
            <option>default</option>
            <option>sm</option>
            <option>xs</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={vertical} onChange={(e) => setVertical(e.target.checked)} />
          Vertical
        </label>
      </div>
      <label className="flex min-w-0 flex-col gap-2 text-sm">
        Choose a local file (name only)
        <input
          type="file"
          name="attachment"
          className="w-full min-w-0 text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setName(file.name);
              setState("idle");
              setRemoved(false);
              setNotice(`Selected ${file.name}; no upload started.`);
            }
          }}
        />
      </label>
      <CadenceProvider mode={mode}>
        {!removed && (
          <Attachment
            data-testid="live-attachment"
            state={state}
            size={size}
            orientation={vertical ? "vertical" : "horizontal"}
            aria-busy={state === "uploading" || state === "processing"}
          >
            <AttachmentMedia aria-hidden="true">
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle title={name}>{name}</AttachmentTitle>
              <AttachmentDescription>
                {state === "error" ? "Upload failed · retry in your application" : `${state} · local demo`}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger aria-label={`Inspect ${name}`} onClick={() => setNotice(`Inspecting ${name}`)} />
            <AttachmentActions>
              <AttachmentAction
                aria-label={`Remove ${name}`}
                onClick={() => {
                  setRemoved(true);
                  setNotice(`Removed ${name}`);
                }}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        )}
        <button
          type="button"
          className="w-fit rounded border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            setRemoved(false);
            setName("sales-dashboard.pdf");
            setState("uploading");
            setNotice("Demo reset");
          }}
        >
          Reset attachment
        </button>
        <AttachmentGroup
          tabIndex={0}
          role="group"
          aria-label="Reference files"
          className="w-full focus-visible:outline-2 focus-visible:outline-ring"
        >
          {[
            "research-notes-with-a-very-long-name.md",
            "project-roadmap.pdf",
            "interface-reference.svg",
            "meeting-notes.txt",
          ].map((file, i) => (
            <Attachment key={file} orientation="vertical" size="sm">
              <AttachmentMedia variant={i === 2 ? "image" : "icon"}>
                {i === 2 ? (
                  // biome-ignore lint/performance/noImgElement: Native images are AttachmentMedia's public composition API.
                  <img
                    alt="Interface diagram"
                    width={80}
                    height={80}
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23d4d4d8'/%3E%3Crect x='10' y='10' width='60' height='60' rx='6' fill='%23fafafa'/%3E%3Cpath d='M20 28h40M20 40h24M20 52h32' stroke='%2352525b' stroke-width='4'/%3E%3C/svg%3E"
                  />
                ) : (
                  <FileTextIcon aria-hidden="true" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle title={file}>{file}</AttachmentTitle>
                <AttachmentDescription>Reference · {i + 1} MB</AttachmentDescription>
              </AttachmentContent>
              <AttachmentTrigger render={<a href="#attachment-details" aria-label={`Details for ${file}`} />} />
            </Attachment>
          ))}
        </AttachmentGroup>
      </CadenceProvider>
      <p id="attachment-details" role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
    </div>
  );
}
