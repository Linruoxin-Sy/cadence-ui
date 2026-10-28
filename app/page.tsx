import Link from "next/link";
import { CopyCommand } from "@/components/site/copy-command";
import { listComponents } from "@/lib/content";
import { FadeIn } from "@/registry/cadence/fade-in/fade-in";
import { TextReveal } from "@/registry/cadence/text-reveal/text-reveal";

const principles = [
  {
    title: "Tokens, not one-offs",
    body: "Every duration, easing, and spring comes from one preset file. Components resolve named recipes instead of inventing timing.",
  },
  {
    title: "Interruptible by default",
    body: "Panels close on a spring and reopen mid-exit. Base UI's starting and ending styles keep every state change reversible.",
  },
  {
    title: "Reduced motion is not a patch",
    body: "Each component documents and implements its reduced branch. The system preference always wins, and data-motion turns everything off.",
  },
];

export default async function HomePage() {
  const components = await listComponents();
  const featured = components.slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-6">
      <section className="py-20 sm:py-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Animation-first · shadcn registry
        </p>
        <TextReveal as="h1" className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Motion that explains what just happened.
        </TextReveal>
        <p className="mt-6 max-w-xl text-base text-muted-foreground">
          Cadence is a small set of React components with motion built in. Base UI for behaviour, Tailwind CSS v4 for
          styling, Motion for animation, and a documented reduced-motion branch for every one.
        </p>
        <div className="mt-8 max-w-md">
          <CopyCommand command="npx shadcn@latest add @cadence/morph-button" />
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {featured.map((doc, index) => (
            <FadeIn key={doc.slug} delay={index * 0.05}>
              <Link
                href={`/components/${doc.slug}`}
                className="block h-full rounded-xl border border-border p-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{doc.title}</h3>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {doc.intensity ?? "medium"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground">{doc.slug}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      <section aria-labelledby="principles-heading" className="py-16">
        <h2 id="principles-heading" className="text-xl font-semibold tracking-tight">
          How it stays coherent
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {principles.map((principle, index) => (
            <FadeIn key={principle.title} delay={index * 0.06}>
              <div className="h-full rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{principle.body}</p>
              </div>
            </FadeIn>
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
          <CopyCommand command="npx shadcn@latest add @cadence/cadence-theme" />
        </div>
      </section>
    </div>
  );
}
