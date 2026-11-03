# Pagination

> Long result sets, tables, and search results.

- Registry item: https://cadence.dev/r/pagination.json
- Install: `npx shadcn@latest add @cadence/pagination`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/pagination
```

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
up; below it only the chevrons are visible. Their accessible names remain “Go to previous page”
and “Go to next page”. The compact composition has its own real anchor destinations.

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
          <PaginationPrevious href="?page=1#usage" text="Back" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" text="Forward" />
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
