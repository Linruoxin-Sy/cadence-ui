# Dropdown Menu

> Row actions, filters, and view settings behind one button.

- Registry item: https://cadence.dev/r/dropdown-menu.json
- Install: `npx shadcn@latest add @cadence/dropdown-menu`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

```install
npx shadcn@latest add @cadence/dropdown-menu
```

## Usage

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";
import { Button } from "@/components/cadence/button";

export function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => rename()}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicate()}>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Items, shortcuts, and destructive actions

An item is a `menuitem`: it runs, then the menu closes. `DropdownMenuShortcut` is a
right-aligned hint only — the component binds no keys, so register the shortcut yourself.
`variant="destructive"` colours the label and its icons; `inset` indents an item to line up
with one that has a check mark.

```tsx
<DropdownMenuItem onClick={() => edit()}>
  Edit
  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem variant="destructive" onClick={() => remove()}>
  Delete
  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
</DropdownMenuItem>
```

## Checkbox and radio items

Both keep the menu open, so a user can set several options in one visit. The mark is the
item's state, not a second control: `aria-checked` carries it for assistive technology, and
the mark scales in as confirmation.

```tsx
<DropdownMenuCheckboxItem defaultChecked onCheckedChange={setDescription}>
  Description
</DropdownMenuCheckboxItem>

<DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

## Submenus

A submenu is a menu anchored to its trigger item. It opens on hover after the pointer rests,
on `ArrowRight`, and on click; `DropdownMenuSubContent` takes the same placement props as the
top-level panel, with `side="right"` as the default.

```tsx
<DropdownMenuSub>
  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem onClick={() => move("backlog")}>Backlog</DropdownMenuItem>
    <DropdownMenuItem onClick={() => move("review")}>In review</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

## Grouping

`DropdownMenuGroup` binds a `DropdownMenuLabel` to the items it holds: the group is labelled
by it, so a screen reader announces "Pull request, group". A label outside a group is a
plain caption above the items, which is what most toolbars want.

```tsx
<DropdownMenuGroup>
  <DropdownMenuLabel>Pull request</DropdownMenuLabel>
  <DropdownMenuItem onClick={() => edit()}>Edit</DropdownMenuItem>
  <DropdownMenuItem onClick={() => duplicate()}>Duplicate</DropdownMenuItem>
</DropdownMenuGroup>
```

## Controlled open

`open` and `onOpenChange` make the menu controlled, which is how a menu is opened from
outside its trigger — a keyboard shortcut, a row's context, a tour step.

```tsx
const [open, setOpen] = useState(false);

<DropdownMenu open={open} onOpenChange={setOpen}>
  <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
  <DropdownMenuContent>…</DropdownMenuContent>
</DropdownMenu>;
```

## When to use

- A row of actions behind one trigger: a table row, a card, a file.
- A filter or view setting where the panel stays open while several options change.
- A command list too long for a toolbar and too short to need search.

## When not to use

- A list of links to another page. Use a `navigation-menu` or plain links: an item that
  navigates is a link, and a menu item is not one.
- A value you select and read back. Use `select`, which keeps the chosen value in the trigger.
- A destructive answer that must be confirmed. Use `alert-dialog`; a menu item is a
  one-keystroke action and closes immediately.
- More than about a dozen entries, or entries the user has to search. Use `command`.

## API

### `DropdownMenu`

| Prop           | Type                       | Default | Description                                     |
| -------------- | -------------------------- | ------- | ----------------------------------------------- |
| `open`         | `boolean`                  | –       | Controlled open state.                          |
| `defaultOpen`  | `boolean`                  | `false` | Uncontrolled initial state.                     |
| `onOpenChange` | `(open: boolean) => void`  | –       | Fires on every open and close, including Escape. |
| `modal`        | `boolean`                  | `true`  | Traps focus and makes the page inert while open. |

### `DropdownMenuTrigger`

Native button props and `render`. The trigger owns `aria-haspopup="menu"` and
`aria-expanded`; pass a `Button` through `render` rather than wrapping one, so those land on
the element the user presses.

### `DropdownMenuContent`

| Prop          | Type                                          | Default    | Description                                    |
| ------------- | --------------------------------------------- | ---------- | ---------------------------------------------- |
| `side`        | `"top" \| "bottom" \| "left" \| "right"`      | `"bottom"` | Preferred side; flips when there is no room.   |
| `align`       | `"start" \| "center" \| "end"`                 | `"start"`  | Alignment along the trigger's edge.            |
| `sideOffset`  | `number`                                      | `4`        | Gap between trigger and panel, in pixels.       |
| `alignOffset` | `number`                                      | `0`        | Shift along the alignment axis.                 |
| `className`   | `string`                                      | –          | Merged last.                                    |

### Items

| Part                     | Props                                                              | Notes                                             |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------- |
| `DropdownMenuItem`       | `onClick`, `disabled`, `inset`, `variant`, `closeOnClick`            | `variant`: `"default" \| "destructive"`.          |
| `DropdownMenuCheckboxItem` | `checked`, `defaultChecked`, `onCheckedChange`, `inset`            | Keeps the menu open.                              |
| `DropdownMenuRadioGroup` | `value`, `defaultValue`, `onValueChange`                            | One selection for the group.                      |
| `DropdownMenuRadioItem`  | `value` (required), `disabled`, `inset`                             | Keeps the menu open.                              |
| `DropdownMenuSub`        | –                                                                  | Groups a submenu trigger and its content.         |
| `DropdownMenuSubTrigger` | `disabled`, `inset`                                                | Renders the chevron.                              |
| `DropdownMenuSubContent` | Same as `DropdownMenuContent`                                      | `side="right"`, `alignOffset={-3}` by default.    |

### Structure

`DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`,
`DropdownMenuShortcut`, `DropdownMenuPortal`.

## Motion contract

| Phase         | Properties                                        | Token             | Interruptible                |
| ------------- | ------------------------------------------------- | ----------------- | ---------------------------- |
| open          | panel `opacity 0 → 1`, `scale 0.96 → 1` from the trigger origin | `popup.anchored` · `duration.fast` | yes (reopen mid-exit) |
| close         | panel `opacity → 0`, `scale → 0.96`               | `exit.fade` · `duration.fast` | yes                |
| check / radio | mark `opacity` + `scale`                          | `state.morph`     | yes                          |
| reduced       | panel fades, no scale; the mark cross-fades at full size | `exit.fade` | yes                         |
| none          | every `--motion-duration-*` resolves to `0ms`; the mark jumps | –      | –                            |

Opening and closing are one CSS transition on `opacity` and `scale`, driven by Base UI's
`data-starting-style` / `data-ending-style`, so an interrupted close reverses rather than
restarts. The panel grows out of `--transform-origin`, which Base UI points at the trigger;
a submenu grows out of its item the same way, because both levels render the same panel.

The highlighted row is a colour change, not motion: `data-highlighted` switches the item's
background. A travelling highlight would be a shared element across items — `layout.move`,
which belongs to `tabs` and `toggle-group`, not to a menu that can be entered at any row.

## Keyboard interactions

| Keys                      | Action                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `Enter` / `Space` / `ArrowDown` | Opens the menu and highlights the first item.                 |
| `ArrowDown` / `ArrowUp`   | Moves the highlight; it wraps at the ends.                          |
| `Home` / `End`            | First and last item.                                                |
| Typeahead letters         | Highlights the next item whose label starts with them.              |
| `Enter` / `Space`         | Runs the highlighted item and closes the menu.                      |
| `ArrowRight`              | Opens the highlighted submenu; `ArrowLeft` closes it.               |
| `Escape`                  | Closes the menu, returns focus to the trigger, runs nothing.        |
| `Tab`                     | Closes the menu and moves to the next control in the page.          |

## Accessibility

- Base UI wires the trigger with `aria-haspopup="menu"` and `aria-expanded`, and renders the
  panel as `role="menu"` with `menuitem`, `menuitemcheckbox`, and `menuitemradio` parts.
- A menu item is not a link. If an entry navigates, render an anchor inside it
  (`render={<a href="…" />}` on a `MenuItem` still needs the role, so prefer a plain link).
- `DropdownMenuLabel` inside a `DropdownMenuGroup` is the group's accessible name. Outside a
  group it is a caption: visible to sighted users, not announced as a label.
- `DropdownMenuShortcut` is text, not a binding. Announce the shortcut in the item's label
  only when it is registered, or the reader is told about a key that does nothing.
- The menu is modal by default: the page behind it is inert while it is open, so a stray
  `Tab` cannot reach a control the user cannot see.

## Responsive behavior

The panel caps at `--available-height` and scrolls, and the positioner flips the side and
shifts along the cross axis to stay inside the viewport. On touch, the menu opens on tap and
the highlighted item follows the tap; there is no hover state to design around. `min-w-[8rem]`
keeps short menus readable, and the panel does not stretch to the trigger's width — a menu
is as wide as its widest item.

## Performance

- One portal per open menu; closing unmounts it after the exit transition.
- The panel animates `opacity` and `scale` only, on one element. Nothing measures layout, and
  no JavaScript runs per frame.
- Items carry no per-item motion: the only animated state is the check mark, and it animates
  two properties on a 14px span.
- Budget: T2 (10 KB gzip). A page with a dozen closed menus pays for one component's source,
  no mounted popups, and no timers.

## Notes for AI

- Put the action on `onClick`. Base UI's menu item has no `onSelect`; a handler that only
  exists on `onSelect` never fires.
- Pass the trigger through `render` so `aria-haspopup` lands on the button, not on a wrapper.
- Group items before labelling them: a `DropdownMenuLabel` outside a `DropdownMenuGroup` is a
  caption, and a group without a label is announced as an unnamed group.
- Do not put a form with validation inside a menu. A menu is a list of commands; `popover`
  is the surface for controls.

---

Full index: https://cadence.dev/llms.txt
