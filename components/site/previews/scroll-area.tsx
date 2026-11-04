"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { ScrollArea, ScrollBar } from "@/registry/cadence/scroll-area";
import { PreviewStack } from "./shell";

export function VerticalExample() {
  return (
    <ScrollArea aria-label="Release notes" className="h-48 w-full rounded-md border">
      <ul className="flex flex-col gap-3 p-4 pr-6 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i.toString()}>Release {20 - i}: improved keyboard navigation and component parity.</li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function HorizontalExample() {
  return (
    <ScrollArea aria-label="Project timeline" className="w-full rounded-md border">
      <ol className="flex w-max gap-4 p-4 pb-6">
        {["Research", "Design", "Build", "Review", "Ship", "Learn"].map((phase) => (
          <li key={phase} className="flex h-24 w-40 items-center justify-center rounded-md bg-muted text-sm">
            {phase}
          </li>
        ))}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export function BothAxesExample() {
  return (
    <ScrollArea aria-label="Delivery log" className="h-48 w-full rounded-md border">
      <ol className="flex w-[48rem] flex-col gap-3 p-4 pr-6 pb-6 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i.toString()} className="flex justify-between gap-8">
            <span>Delivery {i + 1}: workspace components and documentation</span>
            <span className="shrink-0">Completed</span>
          </li>
        ))}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export function WithoutOverflowExample() {
  return (
    <div className="grid gap-4">
      <ScrollArea aria-label="Short note" className="h-32 w-full rounded-md border">
        <p className="p-4 text-sm">All changes saved.</p>
      </ScrollArea>
      <ScrollArea aria-label="Reserved track" className="h-32 w-full rounded-md border">
        <p className="p-4 text-sm">A mounted horizontal track has no scroll range.</p>
        <ScrollBar keepMounted orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export function CallerRenderingExample() {
  const rootRef = useRef<HTMLDivElement>(null);
  function returnToTop() {
    rootRef.current
      ?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
      ?.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <div className="grid gap-4">
      <Button variant="outline" onClick={returnToTop}>
        Return activity to top
      </Button>
      <ScrollArea
        ref={rootRef}
        render={<section />}
        role="region"
        aria-label="Workspace activity"
        overflowEdgeThreshold={{ yStart: 16, yEnd: 16 }}
        className={(state) =>
          state.hasOverflowY ? "h-48 w-full rounded-md border border-primary" : "h-48 w-full rounded-md border"
        }
        style={() => ({ maxWidth: "100%" })}
      >
        <ol className="flex flex-col gap-3 p-4 pr-6 text-sm">
          {Array.from({ length: 20 }, (_, i) => (
            <li key={i.toString()}>
              <a href="/docs/changelog" className="underline underline-offset-4">
                Activity {i + 1}: read the changelog
              </a>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  );
}

export function RtlExample() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <ScrollArea aria-label="مراحل المشروع" className="w-full rounded-md border">
          <ol className="flex w-max gap-4 p-4 pb-6" lang="ar">
            {["البحث", "التصميم", "البناء", "المراجعة", "النشر", "التعلم"].map((phase) => (
              <li key={phase} className="flex h-24 w-40 items-center justify-center rounded-md bg-muted text-sm">
                {phase}
              </li>
            ))}
          </ol>
          <ScrollBar
            orientation="horizontal"
            render={<div title="Project phases track" />}
            className={() => "h-3"}
            style={() => ({ padding: 2 })}
          />
        </ScrollArea>
      </div>
    </DirectionProvider>
  );
}

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  const [tall, setTall] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setExpanded((value) => !value)}>
          Change activity count
        </Button>
        <Button variant="outline" onClick={() => setTall((value) => !value)}>
          Resize activity panel
        </Button>
      </div>
      <p role="status">
        {expanded ? 40 : 20} entries · {tall ? "Tall" : "Compact"} panel
      </p>
      <ScrollArea
        aria-label="Updating activity"
        className={tall ? "h-72 w-full rounded-md border" : "h-48 w-full rounded-md border"}
      >
        <div className="flex flex-col gap-3 p-4 pr-6 text-sm">
          <input
            aria-label="Activity draft"
            defaultValue="Keep this draft"
            className="w-full min-w-0 rounded-md border p-2 focus-visible:outline-2 focus-visible:outline-ring"
          />
          <ol className="flex flex-col gap-3">
            {Array.from({ length: expanded ? 40 : 20 }, (_, i) => (
              <li key={i.toString()}>Activity {i + 1}: documentation updated.</li>
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  );
}

function BasicExample() {
  return (
    <div className="grid min-w-0 gap-5">
      <div className="min-w-0">
        <h2 className="mb-2 text-sm font-medium">Release notes</h2>
        <VerticalExample />
      </div>
      <div className="min-w-0">
        <h2 className="mb-2 text-sm font-medium">Project timeline</h2>
        <HorizontalExample />
      </div>
    </div>
  );
}

const examples = {
  vertical: VerticalExample,
  horizontal: HorizontalExample,
  "both-axes": BothAxesExample,
  "without-overflow": WithoutOverflowExample,
  "caller-rendering": CallerRenderingExample,
  rtl: RtlExample,
  "changing-content": ChangingContentExample,
};

export function ScrollAreaPreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : BasicExample;
  if (!Example) return null;
  return (
    <PreviewStack className="min-w-0">
      <div className="w-full min-w-0 max-w-xl">
        <Example />
      </div>
    </PreviewStack>
  );
}
