import type { Metadata } from "next";
import Link from "next/link";
import { listComponents } from "@/lib/content";

export const metadata: Metadata = {
  title: "Components",
  description: "Every Cadence component, with its category, motion intensity, and complexity.",
};

export default async function ComponentsPage() {
  const components = await listComponents();

  return (
    <div className="max-w-3xl py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {components.length} items, each shipping its source, its motion contract, and a reduced-motion branch. Install
        any of them with the shadcn CLI.
      </p>

      <div className="mt-10 divide-y divide-border border-y border-border">
        {components.map((doc) => (
          <Link
            key={doc.slug}
            href={`/components/${doc.slug}`}
            className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold group-hover:underline group-hover:underline-offset-4">
                  {doc.title}
                </h2>
                {doc.complexity ? (
                  <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {doc.complexity}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{doc.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
              <span>{doc.category}</span>
              <span aria-hidden="true">·</span>
              <span>{doc.intensity}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
