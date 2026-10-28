import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCommand } from "@/components/site/copy-command";
import { Mdx } from "@/components/site/mdx";
import { PreviewFrame } from "@/components/site/preview";
import { getComponent, listComponents } from "@/lib/content";

export async function generateStaticParams() {
  const components = await listComponents();
  return components.map((doc) => ({ id: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doc = await getComponent(id);
  if (!doc) return {};
  return { title: doc.title, description: doc.description };
}

export default async function ComponentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getComponent(id);
  if (!doc) notFound();

  const badges = [
    doc.category,
    doc.intensity,
    doc.complexity ? `complexity ${doc.complexity}` : null,
    doc.since ? `since ${doc.since}` : null,
  ].filter(Boolean);

  return (
    <article className="max-w-3xl py-12">
      <nav className="text-xs text-muted-foreground">
        <Link className="underline underline-offset-4 hover:text-foreground" href="/components">
          Components
        </Link>
        <span className="px-2">/</span>
        <span>{doc.title}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{doc.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-8" aria-label="Live preview">
        <PreviewFrame id={doc.slug} />
      </section>

      <section className="mt-4">
        <CopyCommand command={`npx shadcn@latest add @cadence/${doc.slug}`} />
      </section>

      <section className="mt-10">
        <Mdx source={doc.body} />
      </section>
    </article>
  );
}
