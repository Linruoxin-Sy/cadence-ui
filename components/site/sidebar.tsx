"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/registry/cadence/lib/cn";

export interface SidebarItem {
  slug: string;
  title: string;
}

export interface SidebarProps {
  components: SidebarItem[];
  guides: SidebarItem[];
}

function isActive(pathname: string, href: string) {
  return pathname === href;
}

function NavLink({ href, title, active }: { href: string; title: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-2 py-1.5 text-[13px] leading-5 transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {title}
    </Link>
  );
}

function Groups({ components, guides, pathname }: SidebarProps & { pathname: string }) {
  return (
    <div className="space-y-7">
      <div>
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Getting started
        </p>
        <nav className="mt-2 space-y-0.5" aria-label="Guides">
          {guides.map((guide) => (
            <NavLink
              key={guide.slug}
              href={`/docs/${guide.slug}`}
              title={guide.title}
              active={isActive(pathname, `/docs/${guide.slug}`)}
            />
          ))}
        </nav>
      </div>

      <div>
        <div className="flex items-baseline justify-between px-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Components</p>
          <span className="text-[11px] text-muted-foreground">{components.length}</span>
        </div>
        <nav className="mt-2 space-y-0.5" aria-label="Components">
          {components.map((component) => (
            <NavLink
              key={component.slug}
              href={`/components/${component.slug}`}
              title={component.title}
              active={isActive(pathname, `/components/${component.slug}`)}
            />
          ))}
        </nav>
        <Link
          href="/components"
          aria-current={pathname === "/components" ? "page" : undefined}
          className={cn(
            "mt-2 block px-2 text-[12px] underline underline-offset-4",
            pathname === "/components" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          All components
        </Link>
      </div>
    </div>
  );
}

/**
 * Documentation sidebar: guides first, then every component.
 *
 * Desktop: sticky column on the left. Mobile: a collapsed disclosure above the
 * content, so the page still starts with the article.
 */
export function Sidebar({ components, guides }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <details className="group mb-6 rounded-xl border border-border px-3 py-2 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium">
          Browse
          <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-border pt-4 pb-2">
          <Groups components={components} guides={guides} pathname={pathname} />
        </div>
      </details>

      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-10 pr-2">
          <Groups components={components} guides={guides} pathname={pathname} />
        </div>
      </aside>
    </>
  );
}
