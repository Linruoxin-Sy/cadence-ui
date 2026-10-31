# Card

> Grouping related content, such as a summary or a record.

- Registry item: https://cadence.dev/r/card.json
- Install: `npx shadcn@latest add @cadence/card`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/card
```

## Usage

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/cadence/card";
import { Button } from "@/components/cadence/button";

export function Plan() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Parity plan</CardTitle>
        <CardDescription>57 components, nine batches, one release train.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Batch B1 ships the eleven atoms.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Open plan</Button>
      </CardFooter>
    </Card>
  );
}
```

## Action in the header

`CardHeader` switches to two columns when a `CardAction` is present — no extra
prop, no manual grid.

```tsx
<CardHeader>
  <CardTitle>Members</CardTitle>
  <CardDescription>12 people have access.</CardDescription>
  <CardAction>
    <Button size="sm" variant="outline">Invite</Button>
  </CardAction>
</CardHeader>
```

## Compact

`size="sm"` tightens every part at once, because the spacing lives in one custom
property on the root:

```tsx
<Card size="sm">…</Card>
```

## Content-sized

A card normally takes the width its parent gives it and the height its content
needs. `fit="content"` turns that around: the surface is measured from its own
content and pinned to it, so a parent that stretches its children — a `grid`
row, `items-stretch`, `h-full` — cannot stretch the card either.

The width is `w-fit`, so it resolves against the content and still re-wraps when
the window narrows. The height comes from a `ResizeObserver` on the content box
and is written in the frame the content changed. This is measurement, not
motion: no recipe, no duration, nothing to skip under `prefers-reduced-motion` —
the box is the same in every mode.

```tsx
<div className="grid grid-cols-2 gap-4">
  <Card fit="content">
    <CardHeader>
      <CardTitle>Short</CardTitle>
      <CardDescription>Two lines, and the card is two lines tall.</CardDescription>
    </CardHeader>
  </Card>
  <Card>
    <CardHeader>
      <CardTitle>Stretched</CardTitle>
      <CardDescription>This card fills the row, like a normal grid item.</CardDescription>
    </CardHeader>
    <CardContent>…and keeps the extra height it was given.</CardContent>
  </Card>
</div>
```

Reach for it when the content is the thing being compared and equal card heights
would be a lie — a picker where each option shows its own details, a list where
one row has an extra field. Do **not** use it to opt a card out of a layout the
rest of the page follows: a grid of cards is usually meant to line up.

## Section boundaries

Add a rule with utilities rather than a new part; the `[.border-b]` selectors are
already wired:

```tsx
<CardHeader className="border-b">…</CardHeader>
<CardFooter className="border-t">…</CardFooter>
```

## When to use

- A unit of content that belongs together: a summary, a plan, an account, a
  record in a grid.
- A surface that needs a header, an optional action, body content, and a footer.
- A list of comparable items where the boundary itself carries meaning.

## When not to use

- To fake spacing. A card is a boundary; use padding if you only need breathing
  room.
- As a page layout. Nesting cards inside cards flattens the hierarchy.
- For a modal or a popover; those are overlays with their own focus rules.

## API

| Part              | Props                           | Notes                                                                              |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `Card`            | `size`, `fit`, native div props | `size` sets `--card-spacing` and `data-size`; `fit`: `"content"` hugs the content. |
| `CardHeader`      | native div props                | Grid header; reacts to `CardAction` and a bottom border.                           |
| `CardTitle`       | native div props                | Bold, leading-none. Does not create a heading.                                     |
| `CardDescription` | native div props                | Muted supporting text.                                                             |
| `CardAction`      | native div props                | Top-right slot inside the header.                                                  |
| `CardContent`     | native div props                | Body; carries the horizontal padding.                                              |
| `CardFooter`      | native div props                | Bottom row; reacts to a top border.                                                |

Every part sets `data-slot`, so CSS can reach it:
`[&>[data-slot=card-header]]:gap-4`. Under `fit="content"` the parts are wrapped
in one `data-slot="card-flow"` box, which is the element the height is measured
from — style the parts from the shell as before, and the flow box only if you
need the measured layer itself.

## Motion contract

No motion (T0). A card does not fade, lift, or scale in. If a group of cards should
appear in sequence, that is a page-level `list.stagger` decision made by the parent,
not a property of the card.

`fit="content"` adds no row to the table below: the measured height is applied as
soon as it is known, so there is no phase, no interpolation, and no reduced-motion
branch to keep — the geometry is information, and both modes render it identically.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- `Card` is a plain `div`: no role, no landmark. That is correct for a visual
  grouping — but it means the card is not a navigable region. If a set of cards is
  the main content, wrap it in a `<section>` or a list (`<ul>/<li>`).
- `CardTitle` renders a `div`. When the title belongs in the document outline, put
  a heading inside it: `<CardTitle><h3 …>Parity plan</h3></CardTitle>`, or render
  the card with `aria-labelledby` pointing at the title's id.
- A card that is clickable must contain a real link or button; do not put
  `onClick` on the card and call it done — it is invisible to keyboard users.

## Notes for AI

- Use `CardFooter` for actions, not a bare `div` — it keeps spacing consistent when
  `size` changes.
- Do not add hover lift to a card that is not interactive. Motion on a static card
  is decoration (P9).
- `fit="content"` is opt-in and per card. A grid of cards is meant to line up; only
  reach for the content-sized variant when the differences between cards are the
  information.

---

Full index: https://cadence.dev/llms.txt
