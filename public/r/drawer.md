# Drawer

> A bottom sheet that opens over the page, follows a drag, and closes on swipe or on request.

- Registry item: https://cadence.dev/r/drawer.json
- Install: `npx shadcn@latest add @cadence/drawer`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## When to use

- A short task opened from the bottom of the screen, where the thumb is: move to, share, quick actions.
- A list or explanation that the page behind should stay visible for — a bottom sheet covers the bottom,
  not the context.
- A panel the user expects to swipe away, because that is how sheets behave on touch devices.

## When not to use

- A decision that must be answered. Use `alert-dialog`; a drawer can be dragged shut.
- A hint on a control. Use `tooltip` or `hover-card`.
- A long multi-step flow. Use a page or a `sheet` with a footer; dragging half-way through a form is a
  worse experience than a full surface.

## Installation

```install
npx shadcn@latest add @cadence/drawer
```

## Usage

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";
import { Button } from "@/components/cadence/button";

export function MoveConversation() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move conversation</DrawerTitle>
          <DrawerDescription>Drag down to dismiss, or pick a destination.</DrawerDescription>
        </DrawerHeader>
        {/* the destinations */}
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

## Examples

### A visible swipe handle

`showSwipeHandle` draws the handle that says "drag me". It is `aria-hidden`: the drag is an accelerator,
never the only way out — the close controls and Escape still work.

```tsx
<Drawer showSwipeHandle>…</Drawer>
```

### Swiping from another edge

`swipeDirection` moves the sheet, its placement, and the direction it closes in. The default is `"down"`.

```tsx
<Drawer swipeDirection="right">…</Drawer>
<Drawer swipeDirection="up">…</Drawer>
```

### Snap points

`snapPoints` lets the sheet rest at more than one height; the peek is the smallest value. The overlay
stays in step with the swipe, so the page behind returns as the sheet travels.

```tsx
<Drawer snapPoints={[0.5, 1]}>…</Drawer>
```

### Non-modal

A drawer that should not lock the page passes `modal={false}`; the backdrop is skipped and the page
stays interactive.

```tsx
<Drawer modal={false}>…</Drawer>
```

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Drawer` | `open`, `defaultOpen`, `onOpenChange`, `modal`, `snapPoints`, `swipeDirection`, `showSwipeHandle` | `showSwipeHandle` is additive; `swipeDirection` defaults to `"down"` and `modal` to `true`. |
| `DrawerTrigger` | native button props, `render` | Opens the drawer. |
| `DrawerContent` | `render`, `className` | Renders portal, overlay (when modal), viewport, popup, and content. |
| `DrawerOverlay` | `className` | Only needed when replacing `DrawerContent`. |
| `DrawerSwipeHandle` | `className` | The handle; rendered for you when `showSwipeHandle` is set. |
| `DrawerClose` | native button props, `render` | Closes the drawer. |
| `DrawerHeader` / `DrawerFooter` | `className` | Stacking and spacing only. |
| `DrawerTitle` | `className` | Required accessible name. |
| `DrawerDescription` | `className` | Supporting text. |

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | sheet `opacity 0 → 1` + `transform` from `--closed-transform`; backdrop `opacity 0 → 1` | `popup.anchored` · `duration.slow` / `duration.fast` | yes |
| drag | `transform` follows `--drawer-swipe-movement-*`; backdrop opacity is `1 - --drawer-swipe-progress` | `gesture.drag` | yes (it is the gesture) |
| exit | sheet back to `--closed-transform` + `opacity → 0`; backdrop `opacity → 0` | `exit.fade` · `duration.slow` / `duration.fast` | yes |
| reduced | fade only: the closed-state slide is dropped, so the sheet appears and disappears in place | `exit.fade` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the sheet is in place on the first frame | – | – |

The drag keeps tracking the finger under `reduced`: that movement is the user's own, not authored motion,
and a sheet that ignored the drag would be worse than one that follows it. The release animation uses the
token duration rather than a velocity-scaled one — the swipe physics decide *where* the sheet settles,
the token decides how long the settle takes.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Cycles focus inside a modal drawer. |
| Escape | Closes the drawer and returns focus to the trigger. |
| Enter / Space | Activates the focused control. |

## Accessibility

- Base UI provides `role="dialog"`, `aria-modal`, `aria-labelledby` / `aria-describedby`, focus
  trapping, focus return, scroll lock, and Escape handling while the drawer is modal.
- `DrawerTitle` is required: a drawer without an accessible name is invalid.
- The swipe handle is `aria-hidden="true"` and is never the only way out. A user who cannot drag gets
  the close controls, Escape, and the overlay press (for a modal drawer).
- The content region scrolls on its own (`overflow-y-auto`), so a long list inside the sheet does not
  move the page behind it.

## Responsive behavior

The default sheet sits at the bottom, spans the width, and caps its height at `calc(100dvh - 3rem)` so a
strip of the page stays visible. `swipeDirection="left"` / `"right"` becomes a side panel at `w-3/4`,
capped at `max-w-sm` from `sm` up. Snap points change the resting height without changing any of that
geometry.

## Performance

- The drag writes CSS variables and a `transform`; it never touches layout or React state per frame.
- The backdrop opacity is a `calc()` on the same variable, so the page behind dims as the sheet moves
  without a second animation.
- Entry and exit animate `transform` and `opacity` only. Nothing is measured during render.

## Notes for AI

- Use `drawer` for a short touch-first task from the bottom edge; use `sheet` for a side panel that
  holds a form, and `alert-dialog` when the answer must be deliberate.
- Always render `DrawerTitle`. `DrawerDescription` is the second line of the announcement.
- Never make the swipe the only dismissal: keep a `DrawerClose`, and let Escape work.
- For a list of actions, each row is a `DrawerClose` so choosing one closes the sheet.

---

Full index: https://cadence.dev/llms.txt
