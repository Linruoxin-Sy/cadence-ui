import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeFence } from "@/components/site/code-fence";
import { DocumentEntrance } from "@/components/site/document-entrance";
import { compileDocument } from "@/components/site/mdx";
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
import { Toc } from "@/registry/cadence/toc";

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
  const { headings, content } = await compileDocument(doc.body, id);

  return (
    <div className="mx-auto w-full max-w-3xl xl:grid xl:max-w-none xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-8">
      <DocumentEntrance as="article" className="mx-auto w-full min-w-0 max-w-3xl py-12">
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

        <details className="relative mt-6 text-sm xl:hidden" data-mobile-toc>
          <summary className="ml-auto w-fit cursor-pointer font-medium">On this page</summary>
          <Toc
            items={headings}
            className="absolute right-0 top-full z-20 mt-3 max-h-[min(28rem,calc(100dvh-12rem))] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-4 shadow-md [&_[data-slot=toc-title]]:sr-only"
          />
        </details>

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

        <section className="mt-4">{content}</section>
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
      <aside className="hidden min-w-0 py-12 xl:block" data-document-toc>
        <Toc
          items={headings}
          className="sticky top-20 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pr-1"
        />
      </aside>
    </div>
  );
}
