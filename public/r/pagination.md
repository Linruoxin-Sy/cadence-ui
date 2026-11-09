# Pagination

> Long result sets, tables, and search results.

- Registry item: https://cadence.dev/r/pagination.json
- Install: `npx shadcn@latest add @cadence/pagination`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/pagination
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — transitive registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| pagination | `@components/cadence/pagination/index.tsx` | [JSON files[].content](https://cadence.dev/r/pagination.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: pagination](https://cadence.dev/r/pagination.json)

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

Copy all ten files in the target list, keeping `pagination/index.tsx` and
`button/index.tsx` beside the shared `lib/` directory. Pagination imports
`buttonVariants` from the Button module for its anchor styles, so retain that
module's complete motion/provider dependency tree even though no `Button` is
rendered. The provider files are required imports; wrapping your application is
optional. Pagination itself stays static in full, reduced and none modes, with
only colour, border and shadow state feedback from the button styles. No
additional item-specific CSS is needed beyond the base theme and Tailwind utilities.

Keep the source's existing `"use client"` directives. In Next.js App Router,
Usage, the collapsed range, custom labels, sizes and boundary examples can be
composed in a Server Component with serializable props. “Without a page in the
URL” needs its own client module for `useState`, `useId` and the click handler.
The top preview has a client boundary already; copying its specimen does not
require the site's preview shell. All examples use the same installation files
and packages, including `lucide-react` for the component's chevrons and ellipsis;
none needs a framework router package.

Every page control is a native anchor. The caller supplies destinations, the
visible range, `isActive`, boundary states and result data; Pagination does not
read the URL, fetch records or calculate pages. Replace the sample query URLs
with destinations your application actually handles. The local-state example
preserves modified clicks, but its fragment fallback only reaches the results
region and cannot restore the selected page when shared or reloaded.

At a boundary, omit `href` and keep `role="link"` plus `aria-disabled="true"`;
`aria-disabled` alone does not stop an anchor with a destination. Ellipses remain
decorative. Give repeated navigation landmarks distinct labels, keep meaningful
previous/next accessible names when changing their text, and choose a compact
range that fits the parent on narrow screens.

## Usage

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/cadence/pagination";

export function ResultPages() {
  return (
    <Pagination aria-label="Result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#usage">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3#usage">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## A collapsed range

The caller chooses the visible pages and supplies every destination. `PaginationEllipsis` is a
decorative skipped range, not a link or a range-expansion control. Here page 2 is current and the
last page stays reachable. The sample URLs retain `page` on this documentation route; your
application must read that query, fetch the results and derive `isActive` from its actual page.

<ComponentExample name="collapsed" />

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/cadence/pagination";

export function CollapsedPages() {
  return (
    <Pagination aria-label="Collapsed result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#usage">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3#usage">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=12#usage">12</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## Custom labels

`PaginationPrevious` and `PaginationNext` accept `text`. Back and Forward are visible from `sm`
up; below it only the chevrons are visible. When changing the visible text, supply an
`aria-label` that includes that text: “Back to previous page” and “Forward to next page”
keep the direction clear at either width. The compact composition has its own real anchor destinations.

<ComponentExample name="labels" />

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/cadence/pagination";

export function CustomLabels() {
  return (
    <Pagination aria-label="Custom-labelled result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" text="Back" aria-label="Back to previous page" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" text="Forward" aria-label="Forward to next page" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## Without a page in the URL

This caller owns the current page and invoice records; Pagination does not fetch or slice data.
An ordinary click or Enter updates the results and `aria-current` without changing the URL.
Modified clicks retain the native anchor behavior, whose fragment points to the uniquely named
results region; that fallback only scrolls to the region, it cannot restore a local page. Use page
query URLs when opening, sharing or reloading must restore the selected results.

<ComponentExample name="local-state" />

```tsx
"use client";

import { useId, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/cadence/pagination";

const records = [
  ["Invoice 1001", "Invoice 1002"],
  ["Invoice 1003", "Invoice 1004"],
  ["Invoice 1005", "Invoice 1006"],
];

export function LocalPages() {
  const [page, setPage] = useState(1);
  const resultsId = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <section id={resultsId} aria-label="Invoice results" className="min-h-24 rounded-md border p-3">
        <p aria-live="polite" className="mb-2 text-sm text-muted-foreground">
          Page {page} of 3
        </p>
        <ul className="text-sm">
          {records[page - 1]?.map((record) => (
            <li key={record}>{record}</li>
          ))}
        </ul>
      </section>
      <Pagination aria-label="Invoice pages">
        <PaginationContent>
          {[1, 2, 3].map((value) => (
            <PaginationItem key={value}>
              <PaginationLink
                href={`#${resultsId}`}
                aria-controls={resultsId}
                isActive={value === page}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  setPage(value);
                }}
              >
                {value}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

## Sizes

`PaginationLink` reuses all eight button sizes, with `icon` as its default. Fixed active links
show the text and square shapes directly, without a shared size control. Previous and Next also
accept `size` but default to `default`; use text sizes when showing their written labels.
Sizes change the target geometry, not the page state. Allow enough touch space around small links.

<ComponentExample name="sizes" />

```tsx
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/cadence/pagination";

const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const;

export function PageSizes() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-6 sm:grid-cols-4">
      {sizes.map((size) => (
        <div key={size} className="grid justify-items-center gap-2">
          <Pagination aria-label={`Pages sized ${size}`}>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink size={size} href="?page=2#sizes" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  );
}
```

## At a boundary

At the first page, omit the previous control’s `href` and supply `role="link"` and `aria-disabled="true"`. Without an `href`, the explicit
role preserves the accessible label on the disabled anchor.
The anchor remains visible as context, is absent from the link tab order, and cannot navigate to
page zero. The caller owns this boundary decision; `aria-disabled` alone does not disable an
anchor that still has an `href`. Apply the same rule to Next at the last page.

<ComponentExample name="boundary" />

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/cadence/pagination";

export function FirstPage() {
  return (
    <Pagination aria-label="First result page">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious role="link" aria-disabled="true" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#at-a-boundary" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=2#at-a-boundary" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## When to use

- A result set that is paged for a reason: the total is unknown, the data is remote, or
  the URL should carry the page so it can be shared and reloaded.
- A list where the user needs to jump to a specific page, not only step forward.
- A table footer on the server, where the count lives in the response.

## When not to use

- A finite list that is already in memory. Render it, or a "load more" button — paging
  something you already have is a worse experience than scrolling.
- An infinite feed. There is no page to link to, so an anchor-based control lies.
- A carousel or a wizard. Those step through slides or steps, and their controls are
  buttons.

## API

| Part                  | Props                    | Notes                                                          |
| --------------------- | ------------------------ | -------------------------------------------------------------- |
| `Pagination`          | native nav props         | `aria-label="pagination"`, `role="navigation"`.                |
| `PaginationContent`   | native ul props          | Row with a one-unit gap.                                       |
| `PaginationItem`      | native li props          | One slot in the list.                                          |
| `PaginationLink`      | `isActive`, `size`, anchors | Always an `<a>`; `aria-current="page"` and `data-active` when active. |
| `PaginationPrevious`  | `text`, link props       | Chevron left; `aria-label="Go to previous page"`.              |
| `PaginationNext`      | `text`, link props       | Chevron right; `aria-label="Go to next page"`.                 |
| `PaginationEllipsis`  | native span props        | `aria-hidden`; contains `sr-only` "More pages".                |

`size` comes from the button variants (`icon` by default), so the shape matches a
button without becoming one.

## Motion contract

No motion (T0). A page change is a navigation: the content that changes is the list,
not the control. Animating the pagination would animate the one thing that stays the
same.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

If the new page's rows should arrive in sequence, that is `list.stagger` on the list.

## Accessibility

- `aria-label="pagination"` names the landmark, so it can be skipped or listed.
- The current page is `aria-current="page"`. Colour and the outline variant are the
  sighted half of the same signal — never the only one.
- Previous and next carry a written `aria-label`, because their visible text is hidden
  below `sm`. The chevron alone is not a name.
- A disabled end state (`page 1`, no previous) should render the control without an
  `href` and with `aria-disabled="true"`, not a link that 404s.
- The unordered list gives the count; the ellipsis is decorative and must not be
  focusable.

## Responsiveness and performance

Navigation fills its parent while the inner list remains a single row. The caller chooses the page
range and ellipses and may hide optional text on small screens; page counts are not computed by the
component.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Composed controls retain their
own dependencies and motion contracts. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Every control is an anchor. Do not replace it with `Button` — the shape comes from
  `buttonVariants`, and Base UI's button would put `role="button"` on a link.
- Keep a real `href` when a click handler takes over. A fragment fallback keeps native
  navigation, but sharing the selected results requires a URL that encodes the page.
- Do not render more than about seven items; collapse the middle with
  `PaginationEllipsis`.

---

Full index: https://cadence.dev/llms.txt
