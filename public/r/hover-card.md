# Hover Card

> A preview panel that opens from a link on hover or focus and disappears when the pointer leaves.

- Registry item: https://cadence.dev/r/hover-card.json
- Install: `npx shadcn@latest add @cadence/hover-card`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## When to use

- A preview of what a link leads to: a profile, a repository, a document — enough to decide whether to
  click.
- Context that helps a name make sense — the person behind an `@handle`, the project behind a package.
- A short panel with one or two actions that should not interrupt the page.

## When not to use

- A label for an icon. Use `tooltip`: it is smaller, quicker, and announced as a description.
- Content the user opened on purpose. Use `popover`: hover cards close when the pointer moves on, and
  anything with a task in it deserves a deliberate open.
- Information the user needs to answer a question. Nothing that appears and disappears on hover can be
  the only place it lives.

## Installation

```bash
npx shadcn@latest add @cadence/hover-card
```

## Usage

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card/hover-card";

export function ReviewerCard() {
  return (
    <p>
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger render={<a href="/u/linruoxin" />}>@linruoxin</HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-medium">Lin Ruoxin</p>
          <p className="text-sm text-muted-foreground">Maintains the motion layer and the registry.</p>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}
```

## Examples

### With an action inside

The card is not modal and does not trap focus, so a link or a button inside it works normally. Base UI
keeps the card open while the pointer or focus is inside it, which is what makes the action reachable.

```tsx
<HoverCardContent>
  <p className="text-sm font-medium">Lin Ruoxin</p>
  <Button size="xs" variant="secondary">
    Follow
  </Button>
</HoverCardContent>
```

### Placement

`side` defaults to `bottom` — unlike a tooltip, which defaults to `top` — because the card is larger and
reads better below the link. `alignOffset` defaults to `4` for the same reason.

```tsx
<HoverCardContent side="right" align="start">
  …
</HoverCardContent>
```

### A delay for the whole app

`HoverCard` takes the same delay props as the Base UI root. A longer `delay` keeps a page of links from
flashing cards at every pointer movement.

```tsx
<HoverCard delay={400}>…</HoverCard>
```

## API

| Part | Props | Notes |
| --- | --- | --- |
| `HoverCard` | `open`, `defaultOpen`, `onOpenChange`, `delay`, `closeDelay` | Base UI root; `delay` is per card. |
| `HoverCardTrigger` | native props, `render` | The link or button the card describes. |
| `HoverCardContent` | `side`, `align`, `sideOffset`, `alignOffset`, `render`, `className` | Renders portal, positioner, and popup. `side` defaults to `bottom`, `sideOffset` to `4`, `alignOffset` to `4`. |

The portal renders `data-slot="hover-card-portal"`; the popup is `data-slot="hover-card-content"`. There
is no `HoverCardArrow`: upstream's Base UI surface has none, and the card is a surface rather than a
pointer.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | panel `opacity 0 → 1` + `scale 0.96 → 1` from the anchor origin | `popup.anchored` · `duration.fast` | yes |
| exit | panel `opacity → 0` + `scale → 0.96` | `exit.fade` · `duration.fast` | yes |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (96ms) | `exit.fade` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the panel appears on the first frame | – | – |

Same anchored motion as `popover` and `tooltip`: the scale starts at `--transform-origin`, which Base UI
points at the trigger. Hover cards close when the pointer leaves, so the exit has to be short; `fast` is
the anchored-surface duration the three share.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Focusing the trigger opens the card; moving focus into it keeps it open. |
| Escape | Closes the card and returns focus to the trigger. |
| Enter / Space | Follows the trigger link, or activates a control inside the card. |

Keyboard focus opens the card for the same reason it does in a tooltip: without it, the content would
exist only for pointer users.

## Accessibility

- The trigger carries the accessible name; the card is supplementary. That is why Cadence does not give
  the popup `role="dialog"` or wire it as the trigger's description: a panel that may hold several
  paragraphs and a button is neither a name nor a description, and a screen reader reading it on every
  focus would be noise.
- Interactive content inside the card is reachable in order: Tab moves from the trigger into the card's
  links and buttons, and the card stays open while focus is inside it.
- Hover is never the only path: focus opens it too, and Escape closes it, so the card never traps a
  keyboard user.
- If the card is the only place a piece of information exists, it is in the wrong component — move it
  into the page or into a `popover`.

## Responsive behavior

The panel is `w-64` with `p-4`; Base UI flips it to another side and shifts the alignment when the
viewport cannot fit it. On touch devices there is no hover: the trigger still opens the card on focus or
tap, and the content must not assume a pointer is nearby.

## Performance

- Mounted only while open, so a page of links carries no extra popup trees.
- Animates `opacity` and `scale` only: no layout reads, no `top`/`left` transition, no JavaScript
  animation loop. The card follows the anchor through the positioner, not through React state.

## Notes for AI

- Use `hover-card` only for a preview of the linked thing; use `popover` for anything the user opens to
  act, and `tooltip` for a label.
- The trigger must have its own text or `aria-label`; the card is not its name.
- Keep the card small: a person, a repository, a document summary, one action. If it needs scrolling, it
  wants to be a `popover` or a page.

---

Full index: https://cadence.dev/llms.txt
