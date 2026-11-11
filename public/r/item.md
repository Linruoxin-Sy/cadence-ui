# Item

> Rows in lists of files, members, and invoices.

- Registry item: https://cadence.dev/r/item.json
- Install: `npx shadcn@latest add @cadence/item`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/item
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — transitive registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/separator](https://cadence.dev/r/separator.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| separator | `@components/cadence/lib/separator-layout.ts` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| item | `@components/cadence/item/index.tsx` | [JSON files[].content](https://cadence.dev/r/item.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: separator](https://cadence.dev/r/separator.json)

[Source files: item](https://cadence.dev/r/item.json)

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

Keep `item/index.tsx`, `separator/index.tsx` and `lib/cn.ts` at the listed relative
paths. Item imports Separator even when you do not render `ItemSeparator`; both
components share the `cn` helper. Keep Separator’s listed shared runtime files too;
ItemSeparator inherits its presence, orientation, definite-length and colour effects.
An optional provider controls its mode.
Keep the source files' `"use client"` directives for Base UI behavior. The Usage
and body examples can render these client parts from a Server Component in
Next.js App Router; they do not call the exported variant functions or add event
handlers.

Usage, Sizes, Media, Header and footer, and the top preview use `lucide-react`.
Install it when keeping those icons:

```package-manager
npm install lucide-react
```

The top preview also uses [Button](/components/button) for Download plan.md.
Install it when reproducing that action:

```install
npx shadcn@latest add @cadence/button
```

For a manual Button installation, follow its Manual tab and copy every shared
motion and provider file it lists. Button adds `motion` to the packages listed
above; wrapping the application in its provider is optional. Its press scales in
full mode and drops that scale in reduced and none modes, while Item remains
static. Put the preview's download event handler in a `"use client"` module; the
caller owns the download content and browser action. The body examples do not
need Button. A whole-row link uses a native anchor through `render`, needs no
extra registry item and does not gain Button's press animation. Variants,
Separators and A whole-row link need no example-only packages.

## Usage

```tsx
import { FileTextIcon } from "lucide-react";

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/cadence/item";

export function Files() {
  return (
    <ItemGroup aria-label="Files">
      <Item>
        <ItemMedia variant="icon">
          <FileTextIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>plan.md</ItemTitle>
          <ItemDescription>Project notes.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## A whole-row link

Base UI `render` makes the row one real anchor while keeping `data-slot="item"`. Do not nest other links or buttons inside it. This guide link has a real destination.

<ComponentExample name="whole-row-link" />

```tsx
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/cadence/item";

export function WholeRowLink() {
  return (
    <ItemGroup aria-label="Guides" className="w-full max-w-lg">
      <Item render={<a href="/docs/installation" />} variant="outline">
        <ItemContent>
          <ItemTitle>Installation guide</ItemTitle>
          <ItemDescription>Set up Cadence in your project.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## Variants

`default` is transparent, `muted` fills the surface, and `outline` draws the border. All three keep the same border width and padding; compare this axis independently from size.

<ComponentExample name="variants" />

```tsx
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/cadence/item";

export function ItemVariants() {
  return (
    <ItemGroup aria-label="Row variants" className="w-full max-w-lg gap-2">
      {(["default", "muted", "outline"] as const).map((variant) => (
        <Item key={variant} variant={variant}>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
            <ItemDescription>The same row at default density.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
```

## Sizes

`default`, `sm`, and `xs` change padding and gaps, not text hierarchy. These outline rows keep their content fixed so density is directly comparable.

<ComponentExample name="sizes" />

```tsx
import { FileTextIcon } from "lucide-react";

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/cadence/item";

export function ItemSizes() {
  return (
    <ItemGroup aria-label="Row sizes" className="w-full max-w-lg gap-2">
      {(["default", "sm", "xs"] as const).map((size) => (
        <Item key={size} size={size} variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{size}</ItemTitle>
            <ItemDescription>Project notes.</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
```

## Media

`default` leaves media unframed; `icon` adds a compact icon tile; `image` clips an image into a 40px square. The illustration is decorative because the adjacent title identifies the row.

<ComponentExample name="media" />

```tsx
import { FileTextIcon, FolderIcon } from "lucide-react";

import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/cadence/item";

export function ItemMediaStyles() {
  const cover =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23334155'/%3E%3Cpath d='M10 10h20v20H10z' fill='%23e2e8f0'/%3E%3C/svg%3E";
  return (
    <ItemGroup aria-label="Media styles" className="w-full max-w-lg">
      <Item>
        <ItemMedia>
          <FileTextIcon aria-hidden="true" className="size-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Unframed icon</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="icon">
          <FolderIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Icon tile</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="image">
          <img src={cover} alt="" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Cover image</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## Separators

`ItemSeparator` is a horizontal Separator with no vertical margins, flush between two rows. The group remains a labelled group; it does not impose list-item roles on links.

<ComponentExample name="separators" />

```tsx
import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemRules() {
  return (
    <ItemGroup aria-label="Recent files" className="w-full max-w-lg">
      <Item>
        <ItemContent>
          <ItemTitle>plan.md</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemContent>
          <ItemTitle>notes.md</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## Header and footer

`ItemHeader` and `ItemFooter` occupy full rows. Place them as direct children of Item so metadata spans the row above and below the main content.

<ComponentExample name="header-footer" />

```tsx
import { FileTextIcon } from "lucide-react";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/cadence/item";

export function ItemMetadata() {
  return (
    <ItemGroup aria-label="Reports" className="w-full max-w-lg">
      <Item variant="outline">
        <ItemHeader>
          <span className="text-xs text-muted-foreground">Quarterly report</span>
          <span className="text-xs">Draft</span>
        </ItemHeader>
        <ItemMedia variant="icon">
          <FileTextIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Q4 project notes</ItemTitle>
          <ItemDescription>Ready for the next review.</ItemDescription>
        </ItemContent>
        <ItemFooter>
          <span className="text-xs text-muted-foreground">Updated 2 hours ago</span>
          <span className="text-xs">2 pages</span>
        </ItemFooter>
      </Item>
    </ItemGroup>
  );
}
```

## When to use

- A list of comparable objects where each row carries a name, a line of supporting
  text, and an action: files, members, invoices, saved searches.
- A row that must become a link as a whole, without nesting a button inside an
  anchor.
- A dense list where three sizes (`default`, `sm`, `xs`) cover a panel, a card, and a
  sidebar strip respectively.

## When not to use

- Tabular data with columns that need to line up across rows. Use `table`: an item is
  a sentence, not a grid.
- A single object on its own page. Use `card`; the item's rhythm assumes siblings.
- A selectable row inside a menu or a listbox. Those have their own roles and
  keyboard model; use the menu or `command` component.

## API

| Part              | Props                                  | Notes                                                           |
| ----------------- | -------------------------------------- | --------------------------------------------------------------- |
| `Item`            | `variant`, `size`, `render`            | `variant`: `default \| outline \| muted`; `size`: `default \| sm \| xs`. |
| `ItemGroup`       | native div props                       | `role="group"`; wraps rows and separators.                      |
| `ItemMedia`       | `variant`                              | `default \| icon \| image`, exposed as `data-variant`.          |
| `ItemContent`     | native div props                       | Grows; a second content block stops growing.                    |
| `ItemTitle`       | native div props                       | One line, medium weight.                                        |
| `ItemDescription` | native props for `p`                   | Clamped to two lines, muted.                                    |
| `ItemActions`     | native div props                       | Right-aligned controls.                                         |
| `ItemHeader`      | native div props                       | Full-width row above the content.                               |
| `ItemFooter`      | native div props                       | Full-width row below the content.                               |
| `ItemSeparator`   | `Separator` props                      | Horizontal rule with `my-0`.                                    |

`Item` writes `data-slot="item"`, `data-variant`, and `data-size`; the other parts
write their own `data-slot` (`item-media`, `item-content`, `item-title`,
`item-description`, `item-actions`, `item-header`, `item-footer`,
`item-separator`).

`ItemSeparator` accepts Base state callbacks for `className` and `style`; caller classes are merged last. `Item` render props use native string classes and style objects.

## Motion contract

Authored intensity is **subtle**: Item declares no Cadence recipe; native content/layout and existing CSS state feedback remain unchanged.

The row adds no local motion. ItemSeparator inherits Separator’s delivered rule effects.
A row does not lift on hover or slide on mount. The only transition
is `transition-colors` on the row and on a link inside it — state feedback that
costs nothing and never moves the text the user is reading.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

If a list should arrive in sequence, that is `list.stagger` on the parent. A row
that animates itself cannot be interrupted by the next render.

## Accessibility

- `ItemGroup` sets `role="group"`, not `role="list"`: a row may be a container or an
  anchor via `render`, and a list would require every child to be a `listitem` —
  which would strip that anchor of its link role. Give the group a label when it is
  not already under a heading: `aria-label="Files"`.
- A row that links nowhere is a container. If the whole row is clickable, render an
  anchor with `render` rather than adding `onClick` — the anchor is focusable,
  middle-clickable, and announced as a link.
- `ItemMedia variant="icon"` is decorative in most rows; add `aria-label` to the
  icon only when it carries information the title does not.
- Keep action buttons out of the tab order of a read-only list. Put them in
  `ItemActions` and reveal them on hover **and** focus, never hover alone.

## Responsiveness and performance

Items fill available width and allow wrapping. The caller owns text overflow and action placement in
narrow containers; large collections need application pagination or virtualization.

The row adds no local interpolation; Separator installs its shared motion runtime.
Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Composed controls retain their own dependencies and motion
contracts. Server-rendered markup does not imply that every interaction works without JavaScript.
The registry enforces a 4 KiB gzip budget for this item's own shipped source; dependencies and
application bundles are measured separately.

## Notes for AI

- Reach for `Item` when the row is a sentence about one object; reach for `table`
  when the columns are the point.
- `size="sm"` and `xs` do not change type: they change padding and gaps. Use them for
  density, not hierarchy.
- Use `ItemSeparator`, not `border-b` on the row: the separator keeps the variant
  border colour independent of the divider.

---

Full index: https://cadence.dev/llms.txt
