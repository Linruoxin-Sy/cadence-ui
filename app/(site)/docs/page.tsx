import type { Metadata } from "next";
import Link from "next/link";
import { listGuides } from "@/lib/content";

export const metadata: Metadata = {
  title: "Docs",
  description: "Install Cadence, theme it, and understand the motion system.",
};

export default async function DocsPage() {
  const guides = await listGuides();

  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        These guides cover the whole system. Each component page adds its own API and motion contract.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/docs/${guide.slug}`}
            className="rounded-xl border border-border p-5 transition-colors hover:bg-muted/40"
          >
            <h2 className="text-sm font-semibold">{guide.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">/docs/{guide.slug}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p>
          Looking for the machine-readable version? Every component is also a registry item and a markdown file:{" "}
          <Link className="underline underline-offset-4 hover:text-foreground" href="/r/registry.json">
            /r/registry.json
          </Link>
          ,{" "}
          <Link className="underline underline-offset-4 hover:text-foreground" href="/llms.txt">
            /llms.txt
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
