# Empty

> The resting state of a region that has nothing to show yet.

- Registry item: https://cadence.dev/r/empty.json
- Install: `npx shadcn@latest add @cadence/empty`
- Type: registry:ui
- Since: 0.2.0


## When to use

- A list, table, or panel that is legitimately empty: no invoices, no results for
  this filter, a folder nobody has filled yet.
- An empty state that teaches the next step — a primary action, a link to a
  template, or a line that explains what will appear here.
- A region whose emptiness is a state, not a mistake: an inbox at zero, a fresh
  workspace.

## When not to use

- While loading. Use `skeleton` when the shape of the incoming content is known,
  and `spinner` when it is not.
- A search that returned nothing because of a typo. That case needs the query echoed
  back and the filter explained, not a generic illustration.
- An error. An empty region is a normal state; a failed request is an `alert`.

## Installation

```install
npx shadcn@latest add @cadence/empty
```

## Usage

```tsx
import { Inbox } from "lucide-react";
import { Button } from "@/components/cadence/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/cadence/empty/empty";

export function InvoicesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No invoices yet</EmptyTitle>
        <EmptyDescription>Invoices you send will land here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create invoice</Button>
      </EmptyContent>
    </Empty>
  );
}
```

## Examples

### Bounded or unbounded

The root is a dashed container with generous padding, so it can stand in for a whole
panel. Drop the boundary with a class when it already sits inside a bordered card.

```tsx
<Empty className="border">…</Empty>
```

### A second action

`EmptyContent` is a column with a gap; put the secondary action underneath, or side
by side with a row wrapper.

```tsx
<EmptyContent>
  <Button size="sm">Import CSV</Button>
  <Button size="sm" variant="ghost">Start from a template</Button>
</EmptyContent>
```

### Icon or illustration

`variant="icon"` puts the glyph on a muted surface; `default` leaves the media
transparent for an illustration or a small chart.

```tsx
<EmptyMedia variant="icon">
  <Inbox />
</EmptyMedia>
```

## API

| Part               | Props                   | Notes                                                          |
| ------------------ | ----------------------- | -------------------------------------------------------------- |
| `Empty`            | native div props        | Centred flex column, dashed boundary, `md:p-12`.               |
| `EmptyHeader`      | native div props        | Stacks media, title, description; `max-w-sm`.                  |
| `EmptyTitle`       | native div props        | Large, medium weight. Renders a `div`, not a heading.          |
| `EmptyDescription` | native props for `p`    | Renders a `div` (upstream too): the copy often holds a block.  |
| `EmptyMedia`       | `variant`               | `"default" \| "icon"`, exposed as `data-variant`.              |
| `EmptyContent`     | native div props        | Actions; full width, `max-w-sm`, own gap.                      |

`data-slot` values are `empty`, `empty-header`, `empty-title`,
`empty-description`, `empty-icon`, `empty-content`.

## Motion contract

No motion (T0). An empty state is a resting state: it is what the region looks like
when nothing is happening. Fading it in would make it look like content arriving,
which is the one thing it is not.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

When the region swaps from empty to populated, that transition belongs to the list
(`list.stagger` or `data.transition`), not to this component.

## Accessibility

- The root is a plain container: no role, no live region. Announce the change of
  state in the region that owns it (`aria-live="polite"` on the list), not here.
- `EmptyTitle` renders a `div`. If the empty state is the main content of a page,
  put a real heading inside it so it appears in the outline.
- The media is decorative. Pass `aria-hidden` to the icon, or give the surrounding
  text the whole message — an icon alone never carries meaning.
- Keep at least one action focusable. An empty state with no way forward is a dead
  end; the primary action is the reason this component exists.

## Notes for AI

- One primary action per empty state. Two competing buttons read as a decision the
  user is not ready to make.
- Do not build an empty state out of `Card` plus padding; the boundary, the rhythm,
  and the description width are already decided here.
- Do not use `Empty` for a loading placeholder — `skeleton` keeps the layout stable,
  which `Empty` does not.

---

Full index: https://cadence.dev/llms.txt
