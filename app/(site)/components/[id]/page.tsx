import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeFence } from "@/components/site/code-fence";
import { DocumentEntrance } from "@/components/site/document-entrance";
import { Mdx } from "@/components/site/mdx";
import { PreviewFrame } from "@/components/site/preview";
import { getComponent, getComponentSource, listComponents } from "@/lib/content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/cadence/breadcrumb";

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

  const components = await listComponents();
  const index = components.findIndex((component) => component.slug === id);
  const previous = components[index - 1];
  const next = components[index + 1];
  const files = await getComponentSource(id);

  return (
    <DocumentEntrance as="article" className="mx-auto max-w-3xl py-12">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/components" />}>Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{doc.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{doc.description}</p>
      </header>

      <section className="mt-8" aria-label="Live preview">
        <PreviewFrame id={doc.slug} />
      </section>

      <details className="mt-4 rounded-lg border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">Component source</summary>
        <p className="my-3 text-sm text-muted-foreground">
          Installable source from the registry payload. See Usage below for examples.
        </p>
        <div className="grid min-w-0 gap-4">
          {files.map((file) => (
            <CodeFence
              key={file.path}
              title={file.path}
              source={file.content}
              language={file.path.endsWith("css") ? "css" : "tsx"}
            />
          ))}
        </div>
      </details>

      <section className="mt-4">
        <Mdx source={doc.body} toc />
      </section>
      <footer className="mt-12 grid gap-6 border-t border-border pt-6 text-sm">
        <a
          className="underline underline-offset-4"
          href={`https://github.com/Linruoxin-Sy/cadence-ui/edit/main/content/components/${doc.slug}.mdx`}
        >
          Edit this page
        </a>
        <nav aria-label="Component pagination" className="flex justify-between gap-4">
          {previous ? (
            <Link rel="prev" href={`/components/${previous.slug}`}>
              Previous: {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link rel="next" href={`/components/${next.slug}`}>
              Next: {next.title}
            </Link>
          )}
        </nav>
      </footer>
    </DocumentEntrance>
  );
}
