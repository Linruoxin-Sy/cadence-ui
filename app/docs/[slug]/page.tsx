import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mdx } from "@/components/site/mdx";
import { getGuide, listGuides } from "@/lib/content";

export async function generateStaticParams() {
  const guides = await listGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  return (
    <article className="max-w-3xl py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{guide.title}</h1>
      <p className="mt-2 text-base text-muted-foreground">{guide.description}</p>
      <div className="mt-8">
        <Mdx source={guide.body} />
      </div>
    </article>
  );
}
