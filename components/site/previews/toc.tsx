"use client";

import { Toc } from "@/registry/cadence/toc";

const items = [
  { id: "toc-preview-overview", title: "Overview" },
  { id: "toc-preview-installation", title: "Installation" },
  { id: "toc-preview-usage", title: "Usage with longer section titles" },
  { id: "toc-preview-api", title: "API" },
] as const;

export function TocPreview() {
  return (
    <div className="grid w-full max-w-lg gap-8 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <div className="flex flex-col gap-6 text-sm">
        {items.map(({ id, title }) => (
          <section key={id}>
            <h2 id={id} className="scroll-mt-24 font-medium">
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {id.endsWith("overview")
                ? "Jump to a section using the links."
                : `Your ${title.toLowerCase()} content goes here.`}
            </p>
          </section>
        ))}
      </div>
      <Toc items={items} label="Contents" />
    </div>
  );
}
