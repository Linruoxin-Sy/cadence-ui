# Table of Contents

> Section navigation for documentation, guides, and long articles.

- Registry item: https://cadence.dev/r/toc.json
- Install: `npx shadcn@latest add @cadence/toc`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: layout.shared, scroll.navigate

## Installation

**Command**

```install
npx shadcn@latest add @cadence/toc
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| toc | `@components/cadence/toc/index.tsx` | [JSON files[].content](https://cadence.dev/r/toc.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: toc](https://cadence.dev/r/toc.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
    --motion-stagger-reveal: 0.055s;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all 9 target files, including every shared motion and provider helper.
Keep the sibling `cadence/` tree, relative imports and shipped `"use client"`
directives. Complete the linked manual base setup with Cadence theme CSS,
ensure Tailwind CSS v4 scans the copied files, and apply
`bg-background text-foreground` to your application root. No additional
item-specific stylesheet is required. The provider files are required imports;
wrapping the application is optional. Standalone Toc respects the system
motion preference; a provider selects a local mode or recipe clock.

The Controlled active section example additionally uses Button. For a fully
manual installation, install its complete recursive npm dependencies:

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

The Toc command above already covers `clsx`, `tailwind-merge` and `motion`;
Button adds `@base-ui/react` and `class-variance-authority`. Copy Button's
complete `files[].content` from the JSON below to its target. Its direct
registry dependencies are `@cadence/cadence-motion`, `@cadence/cadence-utils`
and `@cadence/cadence-provider`; reuse all their files from the base graph.
No additional CSS is needed. The [Button Manual](/components/button#installation)
also exposes its complete source blocks; no CLI command is required.

| Additional item | Target file | Full source |
| --- | --- | --- |
| [@cadence/button](https://cadence.dev/r/button.json) | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |

Usage can remain a Server Component: its entries and native nav props are
serializable. Keep state, effects, event handlers, refs and function props in a `"use client"`
caller; the controlled and bounded-scroll examples own their state and handlers.
Preserve the shipped component's own client boundary.

Build `items` from the same heading data as the article. Supply existing,
unique ids without a leading `#`, readable titles and document order;
`depth` is `2` by default or `3` for one indented level. Toc does not parse
Markdown, generate headings or own routing. Empty items render nothing.
An omitted `activeId` enables window tracking, initially marking the first
entry until layout is measured. Missing headings are skipped by tracking;
keep every target present rather than relying on the first-entry fallback.

Supplying `activeId` disables automatic tracking. An empty or unknown id
leaves no current entry; activating a link does not update caller state.
Use your router/observer or a delegated nav `onClick` as in the controlled
example; there is no `onActiveIdChange` prop. The caller also tracks a
bounded scroll container and supplies its current id. Remount after replacing
heading elements dynamically, or pass new items so targets are collected again.

`scrollOffset` only sets the automatic window-tracking threshold (default
`96`); it does not set the navigation destination. Set headings'
`scroll-margin-top` and the scrolling host's `scroll-padding-top` for fixed
headers. The caller owns sticky placement, container height/overflow and
responsive disclosure or column layout. Keep parents shrinkable for wrapped
labels and do not add a second CSS/native smooth-scroll clock.

Native anchors work before hydration and without JavaScript. After hydration,
an unmodified primary activation navigates the nearest overflowing scroll
host, preserving URL parameters/history state and notifying hash listeners.
Completion focuses the heading without a second scroll; temporary tabindex
is restored on blur/unmount. Modified clicks, missing targets and
caller-cancelled events retain native behavior. A nav `onClick` runs first;
call `preventDefault()` only when the caller intends to suppress navigation.

Full mode uses `layout.shared` for one persistent reading indicator and
`scroll.navigate` for explicit link navigation. Initial measured placement
is immediate. Reduced/none place the indicator and navigate
immediately; a live downgrade completes an active trip, while user input,
resize, history, external hashes or unmount cancel it. Positive clock changes
retime from the current position. Static placement geometry is not a resize
animation. Optional Button actions retain Button's separate `feedback.press`
contract.

## Usage

```tsx
import { Toc } from "@/components/cadence/toc";

export function Example() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_12rem]">
      <article>
        <h2 id="overview" className="scroll-mt-24">
          Overview
        </h2>
        <p>Introduce the topic here.</p>
        <h2 id="details" className="scroll-mt-24">
          Details
        </h2>
        <p>Explain the details here.</p>
      </article>
      <aside>
        <Toc
          className="sticky top-24"
          items={[
            { id: "overview", title: "Overview" },
            { id: "details", title: "Details" },
          ]}
        />
      </aside>
    </div>
  );
}
```

## Nested sections

Pass `depth: 3` for a subsection. Entries stay in document order and indent one level. The caller supplies unique heading ids and readable labels; Toc does not parse Markdown. Each card uses its own id prefix so its links cannot target the surrounding documentation.

<ComponentExample name="nested" />

```tsx
"use client";

import { useId } from "react";
import { Toc } from "@/components/cadence/toc";

export function Nested() {
  const id = useId();
  const items = [
    { id: `${id}-api`, title: "API" },
    { id: `${id}-props`, title: "Props", depth: 3 },
    { id: `${id}-keyboard`, title: "Keyboard" },
  ] as const;
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <Toc items={items} label="Reference sections" />
      <div className="grid gap-4 text-sm">
        <section>
          <h3 id={items[0].id} className="scroll-mt-24 font-medium">
            API
          </h3>
          <p className="mt-1 text-muted-foreground">Component reference.</p>
          <h4 id={items[1].id} className="mt-3 scroll-mt-24 font-medium">
            Props
          </h4>
          <p className="mt-1 text-muted-foreground">Caller-supplied options.</p>
        </section>
        <section>
          <h3 id={items[2].id} className="scroll-mt-24 font-medium">
            Keyboard
          </h3>
          <p className="mt-1 text-muted-foreground">Use Tab and Enter on native links.</p>
        </section>
      </div>
    </div>
  );
}
```

## Controlled active section

Supply `activeId` when a router or your observer owns the current section; an empty string clears the highlight. This disables automatic window tracking. The external Mark actions update only this instance, while its delegated link handler keeps caller state in sync with link activation.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Toc } from "@/components/cadence/toc";
import { Button } from "@/components/cadence/button";

export function Controlled() {
  const id = useId();
  const items = [
    { id: `${id}-overview`, title: "Overview" },
    { id: `${id}-details`, title: "Details" },
  ] as const;
  const [activeId, setActiveId] = useState<string>(items[0].id);
  return (
    <div className="grid w-full gap-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setActiveId(items[0].id)}>
          Mark Overview
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveId(items[1].id)}>
          Mark Details
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveId("")}>
          Clear highlight
        </Button>
      </div>
      <Toc
        items={items}
        activeId={activeId}
        label="Controlled sections"
        onClick={(event) => {
          const link =
            event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-toc-id]") : null;
          if (link) setActiveId(link.dataset.tocId ?? "");
        }}
      />
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
        {items.map((item) => (
          <h3 key={item.id} id={item.id} className="scroll-mt-24 font-normal">
            {item.title}
          </h3>
        ))}
      </div>
    </div>
  );
}
```

## Scroll tracking

Without `activeId`, Toc follows headings on window scroll, resize and initial layout. For a bounded article, the caller tracks that scrolling host and supplies `activeId`, as in this example. Scroll the complete article or activate its links: navigation uses the real scroll container and the wrapped label determines the indicator height. The caller keeps entries and heading ids aligned; it does not add another smooth-scroll clock.

<ComponentExample name="scroll-tracking" />

```tsx
"use client";

import { useId, useState } from "react";
import { Toc } from "@/components/cadence/toc";

export function ScrollTracking() {
  const id = useId();
  const items = [
    { id: `${id}-overview`, title: "Overview" },
    { id: `${id}-installation`, title: "Installation" },
    { id: `${id}-usage`, title: "Usage with longer section titles that wrap across lines" },
    { id: `${id}-api`, title: "API" },
  ] as const;
  const [activeId, setActiveId] = useState<string>(items[0].id);
  const paragraphs = [
    "Choose a section link or scroll this article. Its reading indicator follows the section nearest the top of this scrolling region.",
    "Install the component, then supply the same stable heading ids to both the article and the navigation. Each example here owns a separate id prefix.",
    "Long section titles wrap without widening the navigation rail. The indicator follows the full label height. The article keeps its native keyboard and pointer scrolling.",
    "The caller owns the entries, labels and scroll container. Toc supplies the links, current-section semantics and motion-aware navigation to their real targets.",
  ] as const;
  return (
    <div className="grid w-full min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <section
        aria-label="Example article"
        tabIndex={0}
        className="h-80 min-w-0 overflow-y-auto overscroll-contain rounded-md border p-4 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
        onScroll={(event) => {
          const host = event.currentTarget;
          const top =
            host.getBoundingClientRect().top + host.clientTop + Number.parseFloat(getComputedStyle(host).paddingTop);
          let current: string = items[0].id;
          for (const item of items) {
            const heading = document.getElementById(item.id);
            if (heading && heading.getBoundingClientRect().top <= top + 1) current = item.id;
          }
          if (host.scrollTop + host.clientHeight >= host.scrollHeight - 1) current = items.at(-1)?.id ?? items[0].id;
          setActiveId(current);
        }}
      >
        {items.map((item, index) => (
          <section key={item.id} className="min-h-64 pb-6">
            <h3 id={item.id} className="scroll-mt-4 font-medium">
              {item.title}
            </h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{paragraphs[index]}</p>
          </section>
        ))}
      </section>
      <Toc items={items} activeId={activeId} label="Article sections" />
    </div>
  );
}
```

## When to use

- Component reference pages with installation, usage, and API sections.
- Long guides whose sections need direct links.
- Articles with nested headings and a reading position indicator.

## When not to use

- Page hierarchy: use Breadcrumb.
- Navigation between different pages: use Sidebar or Navigation Menu.
- Switching panels that hide other content: use Tabs.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly TocEntry[]` | required | Entries in document order; empty arrays render nothing. |
| `label` | `string` | `"On this page"` | Visible title and accessible navigation label. |
| `activeId` | `string` | automatic | Controlled current heading id; disables automatic tracking. |
| `scrollOffset` | `number` | `96` | Pixels below the viewport top for automatic tracking. |
| `className` | `string` | – | Merged last. |
| native nav props | `ComponentProps<"nav">` | – | Includes ref, style, aria attributes, and event handlers. |

`TocEntry` has `id: string`, `title: string`, and optional `depth: 2 | 3` (default `2`).
Slots are `toc`, `toc-title`, `toc-track`, `toc-rail`, `toc-indicator`, `toc-list`, `toc-item`, and `toc-link`.

## Motion contract

Authored intensity is **medium**: Native section navigation scrolls the page while a local indicator follows the active heading.

One persistent indicator follows the active entry. Its top and bottom edges use the shared physics
spring, then render as translation and vertical scale on a one-pixel base. Wrapped labels determine
the destination's length. Edges stay inside the rail, and interrupted movement preserves velocity.
Text and `aria-current` follow the current section immediately. Activating a link smoothly scrolls
the actual scrolling host to its heading in full mode. The destination respects the heading's scroll
margin and the host's scroll padding; movement stays within the host's scroll bounds.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Active section or label size changes | Indicator translateY / scaleY | `layout.shared/one-shot` / `spring.morph` | Yes; the existing indicator follows the latest target. |
| Section link activation | Native scroll offset | `scroll.navigate/one-shot` / `duration.page` / `ease.inOut` | Yes; another link retargets from the current position. |
| Initial measurement / restored selection | Instant placement, no entrance | — | — |
| reduced | Instant indicator placement and section navigation | — | Stops springs; completes an active navigation before paint. |
| none | Instant placement and navigation, no animation clock | — | Stops springs; completes an active navigation before paint. |

Zero provider timeScale also places the indicator immediately. Restoring full motion keeps the
settled position until the next section or size change. A ResizeObserver supplies geometry; no
layout is read during render. Navigation uses one token-backed tween, with no separate CSS/native
smooth-scroll clock. Wheel, touch, pointer input, scrolling keys, resizing, history traversal and
external hash changes cancel it at the current position. Positive clock changes retime the current
trip; reduced/none or zero clock complete it immediately. No interrupted trip restarts later.
Removed/replaced targets and passive scroll-host geometry changes cancel a trip before it can focus
or snap to an obsolete destination. Hidden/offscreen links settle their reading indicator while a
valid user-activated trip retains its target and focus. Document hiding, print and forced-colours
cancel navigation; restoration does not resume an abandoned trip.
The site's mobile disclosure stays instant. Initial hashes, reload, history traversal and no-JS
links keep native behavior; only an explicit unmodified section link activation starts the recipe.

## Accessibility

- A labelled `nav` contains an ordered list of native links.
- Tab and Shift+Tab move between links; Enter activates the same navigation as a primary click.
- The active link has `aria-current="location"` and a stronger text weight. The decorative indicator is hidden from assistive technology.
- Heading targets need matching, unique ids. Offset their scroll margin to account for sticky headers.
- Native anchors remain usable before hydration and without JavaScript. Automatic tracking requires JavaScript.
- Navigation preserves unrelated URL parameters and history state, pushes the new fragment and notifies hashchange listeners. Back/forward use native scroll restoration.
- Completion focuses the heading without scrolling a second time. A temporary `tabindex="-1"` is removed on blur/unmount; caller-supplied tabindex is preserved. Interrupted navigation never steals focus.
- Modified/new-tab clicks and caller-cancelled clicks retain native behavior.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Move between native section links. |
| Enter | Scroll to the focused link's heading, update the fragment and focus the heading on completion. |
| Scrolling keys / Tab / Escape | Interrupt an ongoing smooth navigation. |

The indicator never receives focus or replaces a link when its destination changes.

## Responsiveness and performance

The component fills its parent and wraps long labels. The caller owns placement, sticky position,
height limits, and overflow. For documentation layouts, place it in a sticky right column with an
independently scrollable list. Smaller viewports can use a native disclosure near the title; a
floating disclosure list avoids moving the article when opened.

Automatic tracking uses passive window scroll events,
resize events, and a ResizeObserver, with cleanup on unmount. It reads heading positions in those callbacks,
updates state only when the active id changes, and selects the final heading at the page bottom.
It tracks headings present when mounted; remount after dynamically replacing the document or pass new items.
The server renders the first entry as current; hydration corrects it for a deep link or restored scroll position.
Before measurement, a static border marks the current link, including without JavaScript. The first
measured position is immediate. The indicator remains mounted through selection and mode changes.
The indicator's two edge values animate; the list's layout does not interpolate. Section navigation
measures its destination once on activation, then writes native offsets without per-frame layout reads.
A ResizeObserver tracks
wrapped labels, font changes, and a mobile disclosure becoming visible. Motion and the shared
Cadence provider/runtime are installed dependencies; a provider is optional and system reduced
motion is respected standalone. The T3 source budget is 12 KB gzip; dependency and page budgets
are measured separately.

## Notes for AI

- Build the list from the same heading tree that renders the article so links and ids cannot drift.
- Use this Cadence original for document navigation; it has no pinned shadcn counterpart.
- Do not use a component instance to generate heading ids or to own application routing.

---

Full index: https://cadence.dev/llms.txt
