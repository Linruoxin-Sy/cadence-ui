import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentEntrance } from "@/components/site/document-entrance";
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

  return (
    <DocumentEntrance as="article" className="max-w-3xl py-12">
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
      </header>

      <section className="mt-8" aria-label="Live preview">
        <PreviewFrame id={doc.slug} />
      </section>

      <section className="mt-4">
        <Mdx source={doc.body} />
      </section>
    </DocumentEntrance>
  );
}
