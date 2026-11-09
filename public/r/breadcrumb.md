# Breadcrumb

> Hierarchy navigation, from the root to the current page.

- Registry item: https://cadence.dev/r/breadcrumb.json
- Install: `npx shadcn@latest add @cadence/breadcrumb`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/breadcrumb
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge @base-ui/react lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| breadcrumb | `@components/cadence/breadcrumb/index.tsx` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: breadcrumb](https://cadence.dev/r/breadcrumb.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Copy both files in the target list, keeping `breadcrumb/index.tsx` beside the
shared `lib/` directory containing `cn.ts`. No motion runtime, provider or
additional item-specific CSS is required beyond the base theme and Tailwind
utilities. The trail stays static in full, reduced and none modes; the link's
colour transition is hover feedback. `lucide-react` is a component dependency
for the default chevron and ellipsis, even when an example uses a custom separator.

Keep the source's existing `"use client"` directive. In Next.js App Router, a
Server Component can compose the parts shown in Usage and the named examples
with serializable props, including the `render` element in “A router link”.
Event handlers or a function passed to `render` belong in a client module. The
preview already has a client boundary; copying its specimen does not require
the site's preview shell.

Only “A router link” needs `next/link` from an existing Next.js application; the
Breadcrumb source imports no framework router. In another router, use its link
element with `render` and keep the resulting anchor's destination. The caller
owns route destinations, ancestor order and which ancestors are hidden; Breadcrumb
does not derive a trail from the URL or navigate on its own.

“A deep trail that collapses” and the top preview use native `details`/`summary`,
so no extra registry item or npm package is needed. The disclosure keeps its
browser-owned state and supports Enter and Space without JavaScript.
`BreadcrumbEllipsis` is decorative; keep the summary's accessible name and make
hidden ancestors reachable. Use `BreadcrumbPage` for the current page and give
each navigation landmark a distinct label when rendering several trails.

## Usage

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>plan.pdf</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A deep trail that collapses

`BreadcrumbEllipsis` is decorative, not a trigger. The caller chooses which ancestors to collapse.
Here a native `details` disclosure makes the hidden Documentation link reachable with Enter or Space,
including without JavaScript. Longer hierarchies can put multiple ancestor links in the disclosure.
Each trail owns its own open state; the component does not measure or truncate a route.

<ComponentExample name="collapsed" />

```tsx
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function CollapsedTrail() {
  return (
    <Breadcrumb aria-label="Collapsed guide trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <details className="relative">
            <summary aria-label="Show ancestors" className="cursor-pointer list-none rounded-sm focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <BreadcrumbEllipsis />
            </summary>
            <div className="absolute top-full left-0 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
              <BreadcrumbLink href="/docs" className="whitespace-nowrap">Documentation</BreadcrumbLink>
            </div>
          </details>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Motion modes</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A custom separator

`BreadcrumbSeparator` accepts any child; its default is a chevron. A slash stays decorative: the
separator is hidden from assistive technology, while every ancestor remains a native link.
This choice changes the separator alone, without changing the trail or its destinations.

<ComponentExample name="separator" />

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function CustomSeparator() {
  return (
    <Breadcrumb aria-label="Slash trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem><BreadcrumbLink href="/components">Components</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A router link

`BreadcrumbLink` accepts Base UI’s `render`. Pass the framework link to preserve client navigation
and prefetching; the rendered element is still an anchor with `data-slot="breadcrumb-link"`.
This Next.js example navigates to real Home and Components routes. The current page stays a
non-focusable `BreadcrumbPage`. In another router, replace only the `Link` import and element.

<ComponentExample name="router" />

```tsx
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function RouterTrail() {
  return (
    <Breadcrumb aria-label="Router trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink render={<Link href="/components" />}>Components</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## When to use

- A hierarchy deeper than two levels, where the user needs to know where they are and
  how to get back up: `Workspace / Projects / cadence-ui`.
- A page reached through a drill-down — a file inside a folder inside a drive.
- A trail that doubles as navigation: every ancestor is a link, the current page is
  not.

## When not to use

- Two levels of depth. The header already links home; a trail of two items adds noise.
- A wizard or a multi-step form. That is a progress indicator, and it must not let the
  user jump to a step they have not reached.
- A history of where the user came from ("back to search results"). That is a back
  link, and it should look like one.

## API

| Part                   | Props                 | Notes                                                         |
| ---------------------- | --------------------- | ------------------------------------------------------------- |
| `Breadcrumb`           | native nav props      | `aria-label="breadcrumb"`.                                    |
| `BreadcrumbList`       | native ol props       | Flex row that wraps; muted, small text.                       |
| `BreadcrumbItem`       | native li props       | Inline flex, one gap.                                         |
| `BreadcrumbLink`       | `render`, anchor props| Anchor by default; `data-slot="breadcrumb-link"`.             |
| `BreadcrumbPage`       | native span props     | The current page: `aria-current="page"`, not a link.          |
| `BreadcrumbSeparator`  | native li props       | `role="presentation"`, `aria-hidden`; chevron by default.     |
| `BreadcrumbEllipsis`   | native span props     | Hidden from assistive tech; contains `sr-only` "More".        |

## Motion contract

Authored intensity is **subtle**: Breadcrumb declares no Cadence recipe; native content/layout and existing CSS state feedback remain unchanged.

No motion (T0). Nothing in a trail animates. A navigation landmark that fades or
slides in is harder to find, and a trail that reflows on navigation makes the one
stable thing on the page move.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

`transition-colors` on the link is hover feedback on the text colour only.

## Accessibility

- The `nav` is labelled "breadcrumb" by default. Give each trail a distinct
  `aria-label` when several appear on one page, so readers can tell its landmarks apart.
- Order matters: `<ol>`/`<li>` gives the trail a length and a sequence, which is what
  a screen reader announces ("list, 3 items").
- The last item is `BreadcrumbPage`: `aria-current="page"`, `aria-disabled="true"`, and
  not focusable. It is where the user already is, so linking it is a no-op that costs a
  tab stop.
- Separators are decorative — `role="presentation"` and `aria-hidden` — so the trail is
  read as names, not as "chevron".
- An ellipsis must not be the only way to reach hidden ancestors: pair it with an accessible
  disclosure or menu. The native disclosure above supports Enter and Space and works without JavaScript.

## Responsiveness and performance

The list wraps and increases its gap at sm. Collapsing a deep trail into an ellipsis is
caller-owned; the component does not measure width or choose hidden ancestors.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Composed controls retain their own dependencies and motion
contracts. Server-rendered markup does not imply that every interaction works without JavaScript.
The registry enforces a 4 KiB gzip budget for this item's own shipped source; dependencies and
application bundles are measured separately.

## Notes for AI

- Do not wrap the current page in a link "for consistency". It is a `BreadcrumbPage`.
- Do not put the trail in a `Card` header as decoration; it is navigation and belongs
  near the top of the content region.
- If the hierarchy is generated from a route, derive the trail from the route's
  segments rather than hand-writing items — a trail that disagrees with the URL is
  worse than none.

---

Full index: https://cadence.dev/llms.txt
