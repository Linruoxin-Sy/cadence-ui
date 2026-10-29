import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        {/*
         * The wordmark carries the brand gradient (--brand-from → --brand-to, see
         * globals.css). It is the only place the brand appears: components and their
         * previews keep the neutral semantic tokens so installs look like shadcn.
         */}
        <Link
          href="/"
          className="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-lg font-semibold tracking-tight text-transparent"
        >
          Cadence UI
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" href="/components">
            Components
          </Link>
          <Link className="transition-colors hover:text-foreground" href="/docs">
            Docs
          </Link>
          <a className="hidden transition-colors hover:text-foreground sm:inline" href="/r/registry.json">
            Registry
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
