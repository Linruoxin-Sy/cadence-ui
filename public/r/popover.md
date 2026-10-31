# Popover

> An anchored panel that opens next to its trigger and returns focus to it when it closes.

- Registry item: https://cadence.dev/r/popover.json
- Install: `npx shadcn@latest add @cadence/popover`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## When to use

- A small set of controls that belongs to the thing it is attached to: column visibility, a filter, a
  share link, a colour picker.
- Context that would crowd the page if it were always visible, but that the user opens on demand.
- An edit that is scoped to one trigger and can be dismissed without losing the page.

## When not to use

- A confirmation that must be answered. Use `alert-dialog`: a popover can be dismissed by clicking away.
- A task that needs the whole screen or a focus trap. Use `dialog` or `sheet`.
- A one- or two-word hint on a control. Use `tooltip`, which cannot hold interactive content.

## Installation

```install
npx shadcn@latest add @cadence/popover
```

## Usage

```tsx
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover/popover";
import { Button } from "@/components/cadence/button/button";

export function SharePopover() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Share</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Share this project</PopoverTitle>
          <PopoverDescription>Anyone with the link can read it, nobody can edit it.</PopoverDescription>
        </PopoverHeader>
        <p className="text-sm">cadence.dev/p/cadence-ui</p>
      </PopoverContent>
    </Popover>
  );
}
```

## Examples

### Positioned by side

`side` and `align` choose the placement, and the panel flips when there is no room. The motion follows
the anchor, not the side: the panel grows from `--transform-origin`, which Base UI points at the
trigger.

```tsx
<PopoverContent side="top" align="start" sideOffset={8}>
  …
</PopoverContent>
```

### With a form

The panel is a normal container, so `Field` and `Input` work inside it. Nothing traps focus: a popover
is non-modal by default.

```tsx
<PopoverContent>
  <PopoverHeader>
    <PopoverTitle>Rename this view</PopoverTitle>
  </PopoverHeader>
  <Field>
    <FieldLabel htmlFor="view-name">Name</FieldLabel>
    <Input id="view-name" defaultValue="Open PRs" />
  </Field>
</PopoverContent>
```

### Controlled

```tsx
const [open, setOpen] = useState(false);

<Popover open={open} onOpenChange={setOpen}>
  <PopoverContent>…</PopoverContent>
</Popover>;
```

### Modal when it has to be

A popover that holds a destructive control can trap focus and block the page behind it without becoming
a dialog:

```tsx
<Popover modal>
  <PopoverTrigger render={<Button variant="outline" />}>Danger zone</PopoverTrigger>
  <PopoverContent>…</PopoverContent>
</Popover>
```

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Popover` | `open`, `defaultOpen`, `onOpenChange`, `modal` | Base UI root. Non-modal by default. |
| `PopoverTrigger` | native button props, `render` | The anchor and the toggle. |
| `PopoverContent` | `side`, `align`, `sideOffset`, `alignOffset`, `render`, `className` | Renders portal and positioner; `sideOffset` defaults to `4`. |
| `PopoverHeader` | `className` | Stacked title and description. |
| `PopoverTitle` | `className` | Base UI heading; the panel's accessible name. |
| `PopoverDescription` | `className` | Muted supporting text; becomes `aria-describedby`. |

`PopoverContent` positions itself; there is no `PopoverAnchor` export, because Base UI anchors to the
trigger and upstream's Base UI surface has no anchor part.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | panel `opacity 0 → 1` + `scale 0.96 → 1` from the anchor origin | `popup.anchored` · `duration.fast` | yes |
| exit | panel `opacity → 0` + `scale → 0.96` | `exit.fade` · `duration.fast` | yes (reopen mid-exit) |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (96ms) | `exit.fade` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the panel appears on the first frame | – | – |

The panel grows out of its anchor rather than sliding towards it. A slide would need a distance token
and four per-side classes, and it moves the edge the positioner just lined up away from the trigger;
`--transform-origin` says the same thing with one transform. The scale reads `--motion-scale-in`, so
the class list carries a token and not a number.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Enter / Space | Opens the popover from its trigger. |
| Tab / Shift+Tab | Moves through the panel's controls and then out of it; focus is not trapped unless `modal`. |
| Escape | Closes the popover and returns focus to the trigger. |

Pressing outside closes it, which is the difference between a popover and an alert dialog.

## Accessibility

- Base UI gives the popup `role="dialog"`, `aria-expanded` on the trigger, `aria-controls`, and focus
  return on close. The panel is labelled by `PopoverTitle` and described by `PopoverDescription` when
  both are rendered.
- The trigger keeps `aria-expanded` in step, so assistive technology announces "collapsed" / "expanded"
  rather than a dialog appearing out of nowhere.
- `PopoverTitle` is optional for an interactive panel, but any popover that opens a region of controls
  should have one: an unnamed dialog is announced as just "dialog".
- Interactive controls inside the panel are reachable: the popover is non-modal, so Tab leaves it and
  the trigger's focus ring stays where the user left it.

## Responsive behavior

The panel is `w-72` wide and flips sides when the trigger has no room above or below; Base UI also
shifts it along the cross axis to stay inside the viewport. On a narrow screen it can fill most of the
width — pass `className="w-[calc(100vw-2rem)]"` or a max width when the content is wider than the
default.

## Performance

- One popup tree is mounted only while open; the portal unmounts after the exit transition.
- Animates `opacity` and `scale` only — no layout read, no `top`/`left` transition, no JavaScript
  animation loop. Reopening during the exit reverses the fade.

## Notes for AI

- Use `popover` for anchored, dismissible content; use `alert-dialog` when the answer must be explicit.
- Pass the trigger through `render`, not a wrapper: the trigger is what the positioner anchors to and
  what gets `aria-expanded`.
- Do not simulate a modal confirmation with `modal`; it blocks outside interaction but still closes on
  Escape, which is not what a confirmation promises.

---

Full index: https://cadence.dev/llms.txt
