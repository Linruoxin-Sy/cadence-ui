"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/registry/cadence/lib/cn";
import { duration } from "@/registry/cadence/lib/motion";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";
import { SIDEBAR_EASE, SIDEBAR_ITEM, SIDEBAR_TIMING } from "./easing";
import { Reveal } from "./reveal";

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

/** Nothing is collapsed until the reader says so, so the first paint shows the whole map. */
const NOTHING_CLOSED: ReadonlySet<string> = new Set();

/**
 * A disclosure body is a large block — the whole navigation column can unfold —
 * so it rides past the `duration.page` token. The extra ~50ms matters: the last
 * row only becomes visible at the bottom of the panel and its own entrance is
 * 0.22s, so a 0.5s panel lets the container and that row stop together instead
 * of the row fading on after the height has settled. `SIDEBAR_EASE` keeps the
 * first half quick and the last few frames moving. Written as a ratio so
 * `reduced` keeps its 0.6 factor and `none` still resolves to zero.
 */
const PANEL_TIME_SCALE = SIDEBAR_TIMING.panel / duration.base;

function isActive(pathname: string, href: string) {
  return pathname === href;
}

function NavLink({ href, title, active }: { href: string; title: string; active: boolean }) {
  return (
    <Reveal className="origin-left" {...SIDEBAR_ITEM}>
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
    </Reveal>
  );
}

/**
 * The disclosure affordance. Down means "closed, click to open", up means "open,
 * click to close"; the flip rides on `state.morph` like any other state indicator.
 */
function DisclosureChevron({ open }: { open: boolean }) {
  const cm = useCadenceMotion();

  return (
    <motion.span
      aria-hidden="true"
      className="inline-flex shrink-0 text-muted-foreground/70 transition-colors group-hover/row:text-foreground"
      animate={{ rotate: open ? 180 : 0 }}
      transition={cm.reduced ? { duration: 0 } : cm.transition("state.morph")}
    >
      <ChevronDown className="size-3.5" strokeWidth={2.25} />
    </motion.span>
  );
}

/**
 * A whole-row toggle: label, count, and chevron are one hit target, so the pointer
 * does not have to find a 14px icon. `aria-expanded` carries the state and the
 * visible label carries the name — no `aria-label` to override it.
 *
 * The row is a `<button>`, which is why a section title here cannot also be a link:
 * interactive content cannot nest inside a button. The components index stays
 * reachable from the site header.
 */
function DisclosureHeader({
  open,
  controls,
  onClick,
  label,
  meta,
}: {
  open: boolean;
  controls: string;
  onClick: () => void;
  label: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      className="group/row flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
    >
      {label}
      <span className="flex items-center gap-1">
        {meta}
        <DisclosureChevron open={open} />
      </span>
    </button>
  );
}

/**
 * Animated disclosure body. Takes its own rows out of the DOM when closed, so a
 * collapsed section is not reachable by Tab and does not need `inert`.
 *
 * Full width animates height + opacity. Reduced keeps the fade and drops the
 * height transition (layout motion is what reduced mode forbids); `none` gets a
 * zero-duration transition, which resolves to an instant toggle.
 */
function Disclosure({ id, open, children }: { id: string; open: boolean; children: React.ReactNode }) {
  const cm = useCadenceMotion();
  // The ratio replaces the provider's `timeScale` rather than stacking on it, so
  // the header's speed gear is multiplied in here (see `document-entrance.tsx`).
  const panel = {
    ...cm.transition("reveal", { timeScale: PANEL_TIME_SCALE * cm.timeScale }),
    ease: SIDEBAR_EASE,
  };
  const transition = cm.reduced ? { height: { duration: 0 }, opacity: panel } : panel;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="panel"
          id={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Section label: one weight of small caps, dimmed until the row is hovered. */
function SectionLabel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "text-[11px] leading-5 font-medium uppercase tracking-[0.14em] transition-colors group-hover/row:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

interface GroupsProps extends SidebarProps {
  pathname: string;
  isOpen: (id: string) => boolean;
  onToggle: (id: string) => void;
}

function Groups({ groups, guides, pathname, isOpen, onToggle }: GroupsProps) {
  const total = groups.reduce((count, group) => count + group.components.length, 0);
  const onIndex = pathname === "/components";
  const uid = useId();
  const panelId = (key: string) => `${uid}-${key}`;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <DisclosureHeader
          open={isOpen("docs")}
          controls={panelId("docs")}
          onClick={() => onToggle("docs")}
          label={<SectionLabel>Docs</SectionLabel>}
        />
        <Disclosure id={panelId("docs")} open={isOpen("docs")}>
          <nav className="flex flex-col gap-0.5 pt-1" aria-label="Docs">
            {guides.map((guide) => (
              <NavLink
                key={guide.slug}
                href={`/docs/${guide.slug}`}
                title={guide.title}
                active={isActive(pathname, `/docs/${guide.slug}`)}
              />
            ))}
          </nav>
        </Disclosure>
      </div>

      <div>
        <DisclosureHeader
          open={isOpen("components")}
          controls={panelId("components")}
          onClick={() => onToggle("components")}
          label={<SectionLabel active={onIndex}>Components</SectionLabel>}
          meta={
            <span
              className={cn(
                "text-[11px] tabular-nums transition-colors group-hover/row:text-foreground",
                onIndex ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {total}
            </span>
          }
        />
        <Disclosure id={panelId("components")} open={isOpen("components")}>
          {/*
           * Second level: one block per parity batch (docs/parity-plan.md §7). The batch is
           * structure, not a heading the reader should scan for, so it is a quiet label over
           * an indented list rather than a third weight of link.
           */}
          <div className="flex flex-col gap-5 pt-2">
            {groups.map((group) => {
              const id = `group:${group.id}`;
              const open = isOpen(id);

              return (
                <nav key={group.id} aria-label={group.title}>
                  <DisclosureHeader
                    open={open}
                    controls={panelId(id)}
                    onClick={() => onToggle(id)}
                    label={
                      <span className="text-[13px] leading-5 font-medium text-muted-foreground transition-colors group-hover/row:text-foreground">
                        {group.title}
                      </span>
                    }
                    meta={
                      <span className="text-[11px] tabular-nums text-muted-foreground transition-colors group-hover/row:text-foreground">
                        {group.components.length}
                      </span>
                    }
                  />
                  <Disclosure id={panelId(id)} open={open}>
                    <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-border pl-1">
                      {group.components.map((component) => (
                        <NavLink
                          key={component.slug}
                          href={`/components/${component.slug}`}
                          title={component.title}
                          active={isActive(pathname, `/components/${component.slug}`)}
                        />
                      ))}
                    </div>
                  </Disclosure>
                </nav>
              );
            })}
          </div>
        </Disclosure>
      </div>
    </div>
  );
}

/**
 * Documentation sidebar: docs first, then every component nested under its parity batch.
 * Every heading level is a disclosure, so a long catalogue can be folded down to the
 * batch the reader is working in.
 *
 * Desktop: sticky column on the left. Mobile: a collapsed disclosure above the
 * content, so the page still starts with the article.
 */
export function Sidebar({ groups, guides }: SidebarProps) {
  const pathname = usePathname();
  const [closed, setClosed] = useState<ReadonlySet<string>>(NOTHING_CLOSED);

  const isOpen = (id: string) => !closed.has(id);
  const onToggle = (id: string) => {
    setClosed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          <Groups groups={groups} guides={guides} pathname={pathname} isOpen={isOpen} onToggle={onToggle} />
        </div>
      </details>

      <aside className="hidden w-56 shrink-0 md:block">
        <div className="no-scrollbar sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-10 pr-2">
          <Groups groups={groups} guides={guides} pathname={pathname} isOpen={isOpen} onToggle={onToggle} />
        </div>
      </aside>
    </>
  );
}
