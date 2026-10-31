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

| Part              | Props                     | Notes                                                    |
| ----------------- | ------------------------- | -------------------------------------------------------- |
| `Card`            | `size`, native div props  | `size`: `"default" \| "sm"`. Sets `--card-spacing` and `data-size`. |
| `CardHeader`      | native div props          | Grid header; reacts to `CardAction` and a bottom border.  |
| `CardTitle`       | native div props          | Bold, leading-none. Does not create a heading.            |
| `CardDescription` | native div props          | Muted supporting text.                                    |
| `CardAction`      | native div props          | Top-right slot inside the header.                         |
| `CardContent`     | native div props          | Body; carries the horizontal padding.                     |
| `CardFooter`      | native div props          | Bottom row; reacts to a top border.                       |

Every part sets `data-slot`, so CSS can reach it:
`[&>[data-slot=card-header]]:gap-4`.

## Motion contract

No motion (T0). A card does not fade, lift, or scale in. If a group of cards should
appear in sequence, that is a page-level `list.stagger` decision made by the parent,
not a property of the card.

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

---

Full index: https://cadence.dev/llms.txt
