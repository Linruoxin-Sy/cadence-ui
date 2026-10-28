import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Cadence<span className="text-muted-foreground"> UI</span>
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
