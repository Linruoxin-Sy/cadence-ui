// biome-ignore-all lint/a11y/noNoninteractiveTabindex: The bounded article scroll region needs keyboard scrolling.
"use client";

import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Toc } from "@/registry/cadence/toc";

function Compact() {
  const id = useId();
  const items = [
    { id: `${id}-overview`, title: "Overview" },
    { id: `${id}-details`, title: "Details" },
  ] as const;
  return (
    <div className="w-full max-w-xs">
      <Toc items={items} label="Guide sections" />
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {items.map((item) => (
          <h2 key={item.id} id={item.id} className="scroll-mt-24 font-normal">
            {item.title}
          </h2>
        ))}
      </div>
    </div>
  );
}

function Nested() {
  const id = useId();
  const items = [
    { id: `${id}-api`, title: "API" },
    { id: `${id}-props`, title: "Props", depth: 3 },
    { id: `${id}-keyboard`, title: "Keyboard" },
  ] as const;
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <Toc items={items} label="Reference sections" />
      <div className="grid gap-4 text-sm">
        <section>
          <h3 id={items[0].id} className="scroll-mt-24 font-medium">
            API
          </h3>
          <p className="mt-1 text-muted-foreground">Component reference.</p>
          <h4 id={items[1].id} className="mt-3 scroll-mt-24 font-medium">
            Props
          </h4>
          <p className="mt-1 text-muted-foreground">Caller-supplied options.</p>
        </section>
        <section>
          <h3 id={items[2].id} className="scroll-mt-24 font-medium">
            Keyboard
          </h3>
          <p className="mt-1 text-muted-foreground">Use Tab and Enter on native links.</p>
        </section>
      </div>
    </div>
  );
}

function Controlled() {
  const id = useId();
  const items = [
    { id: `${id}-overview`, title: "Overview" },
    { id: `${id}-details`, title: "Details" },
  ] as const;
  const [activeId, setActiveId] = useState<string>(items[0].id);
  return (
    <div className="grid w-full gap-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setActiveId(items[0].id)}>
          Mark Overview
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveId(items[1].id)}>
          Mark Details
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveId("")}>
          Clear highlight
        </Button>
      </div>
      <Toc
        items={items}
        activeId={activeId}
        label="Controlled sections"
        onClick={(event) => {
          const link =
            event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-toc-id]") : null;
          if (link) setActiveId(link.dataset.tocId ?? "");
        }}
      />
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
        {items.map((item) => (
          <h3 key={item.id} id={item.id} className="scroll-mt-24 font-normal">
            {item.title}
          </h3>
        ))}
      </div>
    </div>
  );
}

function ScrollTracking() {
  const id = useId();
  const items = [
    { id: `${id}-overview`, title: "Overview" },
    { id: `${id}-installation`, title: "Installation" },
    { id: `${id}-usage`, title: "Usage with longer section titles that wrap across lines" },
    { id: `${id}-api`, title: "API" },
  ] as const;
  const [activeId, setActiveId] = useState<string>(items[0].id);
  const paragraphs = [
    "Choose a section link or scroll this article. Its reading indicator follows the section nearest the top of this scrolling region.",
    "Install the component, then supply the same stable heading ids to both the article and the navigation. Each example here owns a separate id prefix.",
    "Long section titles wrap without widening the navigation rail. The indicator follows the full label height. The article keeps its native keyboard and pointer scrolling.",
    "The caller owns the entries, labels and scroll container. Toc supplies the links, current-section semantics and motion-aware navigation to their real targets.",
  ] as const;
  return (
    <div className="grid w-full min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <section
        aria-label="Example article"
        tabIndex={0}
        className="h-80 min-w-0 overflow-y-auto overscroll-contain rounded-md border p-4 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
        onScroll={(event) => {
          const host = event.currentTarget;
          const top =
            host.getBoundingClientRect().top + host.clientTop + Number.parseFloat(getComputedStyle(host).paddingTop);
          let current: string = items[0].id;
          for (const item of items) {
            const heading = document.getElementById(item.id);
            if (heading && heading.getBoundingClientRect().top <= top + 1) current = item.id;
          }
          if (host.scrollTop + host.clientHeight >= host.scrollHeight - 1) current = items.at(-1)?.id ?? items[0].id;
          setActiveId(current);
        }}
      >
        {items.map((item, index) => (
          <section key={item.id} className="min-h-64 pb-6">
            <h3 id={item.id} className="scroll-mt-4 font-medium">
              {item.title}
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{paragraphs[index]}</p>
          </section>
        ))}
      </section>
      <Toc items={items} activeId={activeId} label="Article sections" />
    </div>
  );
}

const examples = { nested: Nested, controlled: Controlled, "scroll-tracking": ScrollTracking };

export function TocPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Toc example: ${example}`);
    return <Example />;
  }
  return <Compact />;
}
