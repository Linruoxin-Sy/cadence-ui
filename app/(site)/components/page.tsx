import type { Metadata } from "next";
import { ComponentCatalog } from "@/components/site/component-catalog";
import { listComponents } from "@/lib/content";

export const metadata: Metadata = {
  title: "Components",
  description: "Every Cadence component, with its category, motion intensity, and complexity.",
};

export default async function ComponentsPage() {
  const components = await listComponents();

  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {components.length} items, each shipping its source, its motion contract, and a reduced-motion branch. Install
        any of them with the shadcn CLI.
      </p>

      <ComponentCatalog
        components={components.map(({ slug, title, description, categories, intensity, complexity }) => ({
          slug,
          title,
          description,
          categories: categories ?? [],
          intensity,
          complexity,
        }))}
      />
    </div>
  );
}
