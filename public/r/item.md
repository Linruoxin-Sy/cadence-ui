# Item

> Rows in lists of files, members, and invoices.

- Registry item: https://cadence.dev/r/item.json
- Install: `npx shadcn@latest add @cadence/item`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/item
```

## Usage

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function Files() {
  return (
    <ItemGroup aria-label="Files">
      <Item>
        <ItemMedia variant="icon"><FileTextIcon aria-hidden="true" /></ItemMedia>
        <ItemContent><ItemTitle>plan.md</ItemTitle><ItemDescription>Project notes.</ItemDescription></ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## A whole-row link

Base UI `render` makes the row one real anchor while keeping `data-slot="item"`. Do not nest other links or buttons inside it. This guide link has a real destination.

<ComponentExample name="whole-row-link" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function WholeRowLink() {
  return (
    <ItemGroup aria-label="Guides" className="w-full max-w-lg">
      <Item render={<a href="/docs/installation" />} variant="outline">
        <ItemContent><ItemTitle>Installation guide</ItemTitle><ItemDescription>Set up Cadence in your project.</ItemDescription></ItemContent>
      </Item>
    </ItemGroup>
  );
}
```

## Variants

`default` is transparent, `muted` fills the surface, and `outline` draws the border. All three keep the same border width and padding; compare this axis independently from size.

<ComponentExample name="variants" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemVariants() {
  return (
    <ItemGroup aria-label="Row variants" className="w-full max-w-lg gap-2">
      {(["default", "muted", "outline"] as const).map((variant) => (
        <Item key={variant} variant={variant}><ItemContent><ItemTitle>{variant}</ItemTitle><ItemDescription>The same row at default density.</ItemDescription></ItemContent></Item>
      ))}
    </ItemGroup>
  );
}
```

## Sizes

`default`, `sm`, and `xs` change padding and gaps, not text hierarchy. These outline rows keep their content fixed so density is directly comparable.

<ComponentExample name="sizes" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemSizes() {
  return (
    <ItemGroup aria-label="Row sizes" className="w-full max-w-lg gap-2">
      {(["default", "sm", "xs"] as const).map((size) => (
        <Item key={size} size={size} variant="outline"><ItemMedia variant="icon"><FileTextIcon aria-hidden="true" /></ItemMedia><ItemContent><ItemTitle>{size}</ItemTitle><ItemDescription>Project notes.</ItemDescription></ItemContent></Item>
      ))}
    </ItemGroup>
  );
}
```

## Media

`default` leaves media unframed; `icon` adds a compact icon tile; `image` clips an image into a 40px square. The illustration is decorative because the adjacent title identifies the row.

<ComponentExample name="media" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemMediaStyles() {
  const cover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23334155'/%3E%3Cpath d='M10 10h20v20H10z' fill='%23e2e8f0'/%3E%3C/svg%3E";
  return (
    <ItemGroup aria-label="Media styles" className="w-full max-w-lg">
      <Item><ItemMedia><FileTextIcon aria-hidden="true" className="size-5" /></ItemMedia><ItemContent><ItemTitle>Unframed icon</ItemTitle></ItemContent></Item>
      <Item><ItemMedia variant="icon"><FolderIcon aria-hidden="true" /></ItemMedia><ItemContent><ItemTitle>Icon tile</ItemTitle></ItemContent></Item>
      <Item><ItemMedia variant="image"><img src={cover} alt="" /></ItemMedia><ItemContent><ItemTitle>Cover image</ItemTitle></ItemContent></Item>
    </ItemGroup>
  );
}
```

## Separators

`ItemSeparator` is a horizontal Separator with no vertical margins, flush between two rows. The group remains a labelled group; it does not impose list-item roles on links.

<ComponentExample name="separators" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemRules() {
  return (
    <ItemGroup aria-label="Recent files" className="w-full max-w-lg">
      <Item><ItemContent><ItemTitle>plan.md</ItemTitle></ItemContent></Item>
      <ItemSeparator />
      <Item><ItemContent><ItemTitle>notes.md</ItemTitle></ItemContent></Item>
    </ItemGroup>
  );
}
```

## Header and footer

`ItemHeader` and `ItemFooter` occupy full rows. Place them as direct children of Item so metadata spans the row above and below the main content.

<ComponentExample name="header-footer" />

```tsx
import { DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/components/cadence/item";

export function ItemMetadata() {
  return (
    <ItemGroup aria-label="Reports" className="w-full max-w-lg">
      <Item variant="outline">
        <ItemHeader><span className="text-xs text-muted-foreground">Quarterly report</span><span className="text-xs">Draft</span></ItemHeader>
        <ItemMedia variant="icon"><FileTextIcon aria-hidden="true" /></ItemMedia>
        <ItemContent><ItemTitle>Q4 project notes</ItemTitle><ItemDescription>Ready for the next review.</ItemDescription></ItemContent>
        <ItemFooter><span className="text-xs text-muted-foreground">Updated 2 hours ago</span><span className="text-xs">2 pages</span></ItemFooter>
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

No motion (T0). A row does not lift on hover or slide on mount. The only transition
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

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
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
