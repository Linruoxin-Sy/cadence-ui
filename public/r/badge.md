# Badge

> Statuses, counts, and categories.

- Registry item: https://cadence.dev/r/badge.json
- Install: `npx shadcn@latest add @cadence/badge`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/badge
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| badge | `@components/cadence/badge/index.tsx` | [JSON files[].content](https://cadence.dev/r/badge.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: badge](https://cadence.dev/r/badge.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Badge needs only the files and packages listed above; no motion runtime, provider or
additional item-specific CSS is required.

The With an icon example also uses `lucide-react`. Install it only when using those
icons; Badge itself does not require an icon package:

```package-manager
npm install lucide-react
```

## Usage

```tsx
import { Badge } from "@/components/cadence/badge";

export function Release() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">Parity plan</span>
      <Badge variant="secondary">0.2.0</Badge>
    </div>
  );
}
```

## Variants

Choose one of six visual weights for a status or category. The `link` variant is
only a style; use `render` when the badge should navigate.

<ComponentExample name="variants" />

```tsx
import { Badge } from "@/components/cadence/badge";

export function BadgeVariants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  );
}
```

## With an icon

Pair a short label with an icon; the text still communicates the status without
depending on the icon or colour.

<ComponentExample name="icon" />

```tsx
import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Badge } from "@/components/cadence/badge";

export function BadgeIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge><CheckIcon />Verified</Badge>
      <Badge variant="secondary"><ClockIcon />Pending</Badge>
      <Badge variant="outline"><GitBranchIcon />main</Badge>
    </div>
  );
}
```

## As a link

`render` replaces the element, so a badge stays a `span` unless you ask for
something else. The `[a&]` selectors only switch on hover when it really is a link.
These anchors use native focus and Enter navigation to the changelog.

<ComponentExample name="link" />

```tsx
import { Badge } from "@/components/cadence/badge";

export function BadgeLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline" render={<a href="/docs/changelog" />}>3 releases</Badge>
      <Badge variant="ghost" render={<a href="/docs/changelog" />}>Changelog</Badge>
    </div>
  );
}
```

## When to use

- A short status: `Active`, `Beta`, `Deprecated`, `3 open`.
- A category or tag next to a title, where the colour carries the grouping.
- A count attached to a navigation item or a filter chip.

## When not to use

- Anything the user must click to act; use `button` (a badge has no focus, no
  press feedback, and no keyboard path).
- More than about three words. A long label belongs in running text or in a `card`
  header, not in a pill.
- A status that changes while the user watches; use `toast` or an inline message,
  because a badge swap is easy to miss.

## API

| Prop        | Type                                                                                             | Default     | Description                                      |
| ----------- | ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------ |
| `variant`   | `"default" \| "secondary" \| "outline" \| "ghost" \| "destructive" \| "link"`                     | `"default"` | Visual weight.                                   |
| `render`    | `ReactElement \| (props, state) => ReactElement`                                                  | –           | Base UI composition; replaces `asChild`.         |
| `className` | `string`                                                                                          | –           | Merged last.                                     |

`data-slot="badge"` and `data-variant` are rendered from the component's state, so
you can restyle per variant from CSS without touching this file. All native span
props are forwarded.

## Motion contract

No motion (T0). A badge labels content; it does not enter, leave, or move.

| Phase   | Properties                          | Token | Interruptible |
| ------- | ----------------------------------- | ----- | ------------- |
| –       | none                                | –     | –             |
| reduced | none                                | –     | –             |
| none    | none                                | –     | –             |

`transition-[color,box-shadow]` is state feedback on the design tokens (hover on a
linked badge, the focus ring), not motion: it never moves the box and never runs
on mount.

## Accessibility

- The badge is a `span`, so it is not in the tab order and has no role — the text
  itself is the message.
- Colour is never the only signal: every variant still carries readable text.
- When rendered as a link it inherits the anchor's semantics, focus ring, and
  keyboard behaviour, and gains `[a&]:hover` styles automatically.

## Responsiveness and performance

Badges keep intrinsic width and do not wrap their text. Keep labels short; let the parent wrap a
collection or provide an overflow strategy for long labels.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Never attach `onClick` to a badge; switch to `button` with `size="sm"`.
- Do not animate a badge in or out. If the status changes, swap the text and let
  `aria-live` on the surrounding region announce it.

---

Full index: https://cadence.dev/llms.txt
