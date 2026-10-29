"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/registry/cadence/lib/cn";

export interface SidebarItem {
  slug: string;
  title: string;
}

export interface SidebarGroup {
  id: string;
  title: string;
  components: SidebarItem[];
}

export interface SidebarProps {
  groups: SidebarGroup[];
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

function Groups({ groups, guides, pathname }: SidebarProps & { pathname: string }) {
  const total = groups.reduce((count, group) => count + group.components.length, 0);
  const onIndex = pathname === "/components";

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
        {/*
         * The label is the link to the index, so the index has one place to be "current"
         * instead of a trailing link that duplicates the heading above it.
         */}
        <div className="flex items-baseline justify-between px-2">
          <Link
            href="/components"
            aria-current={onIndex ? "page" : undefined}
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
              onIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Components
          </Link>
          <span className={cn("text-[11px]", onIndex ? "text-foreground" : "text-muted-foreground")}>{total}</span>
        </div>
        {/*
         * Second level: one block per parity batch (docs/parity-plan.md §7). The batch is
         * structure, not a heading the reader should scan for, so it is a quiet label over
         * an indented list rather than a third weight of link.
         */}
        <div className="mt-3 space-y-4">
          {groups.map((group) => (
            <nav key={group.id} aria-label={group.title}>
              <div className="flex items-baseline justify-between px-2">
                <p className="text-[11px] leading-5 font-medium text-muted-foreground/80">{group.title}</p>
                <span className="text-[10px] tabular-nums text-muted-foreground/60">{group.components.length}</span>
              </div>
              <div className="mt-1 ml-3 space-y-0.5 border-l border-border pl-1">
                {group.components.map((component) => (
                  <NavLink
                    key={component.slug}
                    href={`/components/${component.slug}`}
                    title={component.title}
                    active={isActive(pathname, `/components/${component.slug}`)}
                  />
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Documentation sidebar: guides first, then every component nested under its parity batch.
 *
 * Desktop: sticky column on the left. Mobile: a collapsed disclosure above the
 * content, so the page still starts with the article.
 */
export function Sidebar({ groups, guides }: SidebarProps) {
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
          <Groups groups={groups} guides={guides} pathname={pathname} />
        </div>
      </details>

      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-10 pr-2">
          <Groups groups={groups} guides={guides} pathname={pathname} />
        </div>
      </aside>
    </>
  );
}
