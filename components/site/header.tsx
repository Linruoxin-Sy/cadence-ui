import Link from "next/link";
import { MotionModeSwitch, MotionSpeedSelect } from "./motion-mode";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      {/*
       * The background spans the viewport; the centred site container aligns the
       * wordmark and nav with the documentation shell, home page, and footer.
       */}
      <div className="mx-auto flex h-14 w-full max-w-site items-center justify-between px-4 md:px-6">
        {/*
         * The wordmark carries the brand gradient (--brand-from → --brand-to, see
         * globals.css). It is the only place the brand appears: components and their
         * previews keep the neutral semantic tokens so installs look like shadcn.
         */}
        <Link
          prefetch={false}
          href="/"
          className="bg-linear-to-r from-brand-from to-brand-to bg-clip-text text-lg font-semibold tracking-tight text-transparent"
        >
          Cadence UI
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link prefetch={false} className="transition-colors hover:text-foreground" href="/components">
            Components
          </Link>
          <Link prefetch={false} className="transition-colors hover:text-foreground" href="/docs">
            Docs
          </Link>
          <a className="hidden transition-colors hover:text-foreground sm:inline" href="/r/registry.json">
            Registry
          </a>
          {/* The site has exactly one motion-mode switch and one speed gear, and both live here. */}
          <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
          <MotionModeSwitch />
          {/* `contents` keeps the trigger a direct flex child at `sm` and up, so the nav's gap
              applies to it; below `sm` the wrapper removes it from the row entirely. */}
          <span className="hidden sm:contents">
            <MotionSpeedSelect />
          </span>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
