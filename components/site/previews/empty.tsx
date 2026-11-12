"use client";

import { FolderIcon, InboxIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Button, buttonVariants } from "@/registry/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/cadence/empty";
import { PreviewStack } from "./shell";

export function ChangingEmpty() {
  const [revision, change] = useState(0);
  const [show, reveal] = useState(true);
  const [tone, changeTone] = useState(false);
  const changed = revision % 2 !== 0;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => change((value) => value + 1)}>
          Update empty state
        </Button>
        <Button size="sm" variant="outline" onClick={() => reveal((value) => !value)}>
          Toggle results
        </Button>
        <Button size="sm" variant="outline" onClick={() => changeTone((value) => !value)}>
          Change tone
        </Button>
      </div>
      <AnimatePresence initial={false} mode="sync">
        {show ? (
          <Empty
            key="empty"
            style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
            className={
              tone ? "flex-none border bg-muted text-muted-foreground" : "flex-none border bg-card text-foreground"
            }
          >
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className={tone ? "bg-card text-muted-foreground" : "bg-muted text-foreground"}
              >
                {changed ? (
                  <FolderIcon key="folder" aria-hidden="true" />
                ) : (
                  <InboxIcon key="inbox" aria-hidden="true" />
                )}
              </EmptyMedia>
              <EmptyTitle className={tone ? "text-muted-foreground" : "text-foreground"}>
                {changed ? "No archived components" : "No saved components"}
              </EmptyTitle>
              <EmptyDescription className={tone ? "text-foreground" : "text-muted-foreground"}>
                {changed
                  ? "Your archive is empty for now. Browse the catalogue and start your collection."
                  : "Your archive is empty for now."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <a href="/components" className={buttonVariants({ size: "sm" })}>
                Browse components
              </a>
            </EmptyContent>
          </Empty>
        ) : (
          <p key="results">The application owns populated results. Toggle to restore the empty region.</p>
        )}
      </AnimatePresence>
      <Empty
        className="border"
        aria-label="Remaining count"
        style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
      >
        <EmptyHeader>
          <EmptyTitle>Remaining saved slots</EmptyTitle>
          <EmptyDescription>{19 + revision}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          Direct numbers roll; identifier strings and rich recovery actions retain their structure.
        </EmptyContent>
      </Empty>
    </div>
  );
}

function EmptySpecimen() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No saved components</EmptyTitle>
        <EmptyDescription>Browse the catalogue to find your first component.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href="/components" className={buttonVariants({ size: "sm" })}>
          Browse components
        </a>
      </EmptyContent>
    </Empty>
  );
}

export function EmptyBoundaries() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No saved components</EmptyTitle>
          <EmptyDescription>A caller-supplied dashed boundary.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing to review</EmptyTitle>
          <EmptyDescription>No extra boundary inside an existing panel.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

export function EmptySecondAction() {
  const [cleared, setCleared] = useState(false);
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No matching components</EmptyTitle>
        <EmptyDescription>
          {cleared ? "Filters cleared. Save a component to fill this list." : "No saved components match your filters."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={() => setCleared(true)}>
          Clear filters
        </Button>
        <a href="/components" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Browse components
        </a>
      </EmptyContent>
    </Empty>
  );
}

export function EmptyMediaForms() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Inbox clear</EmptyTitle>
          <EmptyDescription>An icon on the muted media surface.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <svg
              aria-hidden="true"
              viewBox="0 0 64 48"
              className="w-16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 14h20l6 6h26v24H6z" />
              <path d="M6 14V6h20l6 8h26v6" />
            </svg>
          </EmptyMedia>
          <EmptyTitle>Folder empty</EmptyTitle>
          <EmptyDescription>Transparent media for your own illustration.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

export function EmptyWithoutMedia() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No saved components</EmptyTitle>
        <EmptyDescription>Browse the catalogue to find your first component.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href="/components" className={buttonVariants({ size: "sm" })}>
          Browse components
        </a>
      </EmptyContent>
    </Empty>
  );
}

export function EmptyPreview({ example }: { example?: string }) {
  const content =
    example === "changing" ? (
      <ChangingEmpty />
    ) : example === "boundaries" ? (
      <EmptyBoundaries />
    ) : example === "second-action" ? (
      <EmptySecondAction />
    ) : example === "media" ? (
      <EmptyMediaForms />
    ) : example === "without-media" ? (
      <EmptyWithoutMedia />
    ) : (
      <EmptySpecimen />
    );
  return (
    <PreviewStack>
      <div className="w-full max-w-xl">{content}</div>
    </PreviewStack>
  );
}
