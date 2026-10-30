import Link from "next/link";
import { CodeFence } from "@/components/site/code-fence";
import { listComponents } from "@/lib/content";

const principles = [
  {
    title: "Same API as shadcn",
    body: "Exports, props, and data-slot values match upstream, so a component is a drop-in replacement rather than a parallel idea.",
  },
  {
    title: "Motion with a reason",
    body: "Every animation explains a state change. Components that do not need motion stay still, and every tier has a written budget.",
  },
  {
    title: "UI only, no validation",
    body: "Invalid state is rendered from aria-invalid, never computed. Rules, schemas, and form state stay in your code.",
  },
];

export default async function HomePage() {
  const components = await listComponents();
  const featured = components.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="py-20 sm:py-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Animation-first · shadcn registry
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Every shadcn component, with motion that explains itself.
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground">
          Cadence mirrors shadcn's API and adds a motion contract: Base UI for behaviour, Tailwind CSS v4 for styling,
          Motion for animation, and a documented reduced-motion branch for every component.
        </p>
        <div className="mt-8 max-w-md">
          <CodeFence source="npx shadcn@latest add @cadence/button" language="bash" size="sm" />
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <Link className="font-medium underline underline-offset-4" href="/components">
            Browse components
          </Link>
          <Link
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            href="/docs/installation"
          >
            Installation
          </Link>
        </div>
      </section>

      <section aria-labelledby="components-heading" className="pb-8">
        <div className="flex items-end justify-between gap-4">
          <h2 id="components-heading" className="text-xl font-semibold tracking-tight">
            Components
          </h2>
          <Link
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            href="/components"
          >
            All {components.length}
          </Link>
        </div>
        {featured.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {featured.map((doc) => (
              <Link
                key={doc.slug}
                href={`/components/${doc.slug}`}
                className="block h-full rounded-xl border border-border p-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{doc.title}</h3>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {doc.tier ?? doc.intensity ?? "T0"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">{doc.slug}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            The parity rebuild starts with <code className="font-mono">button</code> and{" "}
            <code className="font-mono">dialog</code>.
          </p>
        )}
      </section>

      <section aria-labelledby="principles-heading" className="py-16">
        <h2 id="principles-heading" className="text-xl font-semibold tracking-tight">
          How it stays coherent
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {principles.map((principle) => (
            <div key={principle.title} className="h-full rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold">{principle.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/30 p-8">
        <h2 className="text-xl font-semibold tracking-tight">Install one, get the system</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every item pulls in the motion presets, the{" "}
          <code className="rounded border border-border bg-background px-1 py-0.5 font-mono text-xs">cn</code> helper,
          and the optional provider. No runtime package, no global CSS, no lock-in.
        </p>
        <div className="mt-5 max-w-md">
          <CodeFence source="npx shadcn@latest add @cadence/cadence-theme" language="bash" size="sm" />
        </div>
      </section>
    </div>
  );
}
