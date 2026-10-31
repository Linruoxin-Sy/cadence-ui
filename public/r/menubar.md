# Menubar

> Application menus along the top of a window.

- Registry item: https://cadence.dev/r/menubar.json
- Install: `npx shadcn@latest add @cadence/menubar`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

```install
npx shadcn@latest add @cadence/menubar
```

## Usage

```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/cadence/menubar";

export function EditorMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => save()}>Save</MenubarItem>
          <MenubarItem onClick={() => publish()}>Publish…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => undo()}>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

## Moving between menus

Once a menu is open, `ArrowRight` and `ArrowLeft` switch to the neighbouring top-level menu
without closing the bar. That traversal is the reason to use `menubar` over three
`dropdown-menu`s: the menus know about each other.

```tsx
<Menubar>
  <MenubarMenu>…</MenubarMenu>
  <MenubarMenu>…</MenubarMenu>
  <MenubarMenu>…</MenubarMenu>
</Menubar>
```

## Shortcuts and groups

`MenubarShortcut` right-aligns a key hint, and `MenubarGroup` with `MenubarLabel` splits a
long menu into named sections.

```tsx
<MenubarGroup>
  <MenubarLabel>Export</MenubarLabel>
  <MenubarItem onClick={() => exportAs("pdf")}>
    PDF
    <MenubarShortcut>⇧⌘P</MenubarShortcut>
  </MenubarItem>
  <MenubarItem onClick={() => exportAs("png")}>
    PNG
    <MenubarShortcut>⇧⌘E</MenubarShortcut>
  </MenubarItem>
</MenubarGroup>
```

## Selection items and submenus

The selection parts are the menu's: a checkbox item keeps the panel open while the state
changes, and a submenu opens to the right of the item it belongs to.

```tsx
<MenubarCheckboxItem defaultChecked onCheckedChange={setSidebar}>
  Sidebar
</MenubarCheckboxItem>

<MenubarSub>
  <MenubarSubTrigger>Theme</MenubarSubTrigger>
  <MenubarSubContent>
    <MenubarRadioGroup value={theme} onValueChange={setTheme}>
      <MenubarRadioItem value="light">Light</MenubarRadioItem>
      <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
    </MenubarRadioGroup>
  </MenubarSubContent>
</MenubarSub>
```

## When to use

- A desktop-style application shell with a menu across the top.
- A documentation tool or editor where File / Edit / View are the mental model.
- A dense toolbar whose commands need names, shortcuts, and grouping.

## When not to use

- A web page's main navigation. Use links or `navigation-menu`: a menu bar hides its
  destinations behind a click.
- One trigger with a list of actions. Use `dropdown-menu`.
- Commands a user reaches for a dozen times a minute. First-class buttons beat two clicks.

## API

`Menubar` takes `modal` (default `true`), `disabled`, and `orientation` (default
`"horizontal"`). Every other part mirrors `dropdown-menu` under menubar slots:

| Part                                                                                  | Notes                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `MenubarMenu`                                                                         | One top-level menu; wraps the trigger and its content.    |
| `MenubarTrigger`                                                                      | The label in the bar. Opens on click, `Enter`, `ArrowDown`. |
| `MenubarContent`                                                                      | The panel: `min-w-[12rem]`, `sideOffset={8}`, `alignOffset={-4}`. |
| `MenubarItem`                                                                         | `onClick`, `inset`, `variant`.                            |
| `MenubarCheckboxItem` / `MenubarRadioGroup` / `MenubarRadioItem`                        | Selection that keeps the panel open.                      |
| `MenubarSub` / `MenubarSubTrigger` / `MenubarSubContent`                                | A nested menu.                                           |
| `MenubarGroup` / `MenubarLabel` / `MenubarSeparator` / `MenubarShortcut` / `MenubarPortal` | Structure.                                            |

## Motion contract

| Phase         | Properties                                     | Token             | Interruptible |
| ------------- | ---------------------------------------------- | ----------------- | ------------- |
| open          | panel `opacity 0 → 1`, `scale 0.96 → 1` from the trigger | `popup.anchored` · `duration.fast` | yes |
| close         | panel `opacity → 0`, `scale → 0.96`            | `exit.fade` · `duration.fast` | yes |
| check / radio | mark `opacity` + `scale`                       | `state.morph`     | yes           |
| reduced       | panel fades, no scale; the mark cross-fades    | `exit.fade`       | yes           |
| none          | every duration resolves to `0ms`               | –                 | –             |

The bar itself does not animate. Switching from one open menu to the next replaces one panel
with another; there is no shared element between them, and a highlight sliding along the bar
would suggest a continuity the markup does not have.

## Keyboard interactions

| Keys                        | Action                                                        |
| --------------------------- | ------------------------------------------------------------- |
| `ArrowLeft` / `ArrowRight`  | Moves between top-level menus; while open, opens the neighbour. |
| `ArrowDown` / `Enter`       | Opens the focused menu and highlights its first item.          |
| `ArrowUp` / `ArrowDown`     | Moves the highlight inside an open menu.                       |
| `Home` / `End`              | First and last item.                                           |
| `Escape`                    | Closes the menu and returns focus to its trigger.              |
| `Tab`                       | Leaves the bar for the next control in the page.               |

## Accessibility

- The root is `role="menubar"` with `aria-orientation`; each trigger is `aria-haspopup="menu"`
  and reports `aria-expanded`, so the bar announces its structure rather than a row of
  buttons that happen to open panels.
- Roving focus keeps one tab stop for the whole bar: `Tab` enters it once and leaves it once,
  which is what makes a menu bar usable without forty presses.
- `MenubarLabel` inside a `MenubarGroup` is that group's accessible name.
- Shortcut hints are text. Register the keys yourself, or a screen reader will announce a
  shortcut that does nothing.

## Responsive behavior

A menubar is a desktop pattern: on a narrow viewport the triggers wrap inside the bordered
bar rather than scrolling horizontally. For touch, prefer `dropdown-menu` behind a single
trigger, or a `navigation-menu`; long-pressing a menu bar is not a gesture anyone expects.

## Performance

- One portal per open menu; a closed bar mounts only its triggers.
- No motion on the bar itself, and the open panel is the same `opacity` + `scale` transition
  as every other popup in the library.
- Budget: T2 (10 KB gzip). The item parts come from `dropdown-menu` through a
  `registryDependencies` entry, so the two install once and the menu behaviour is one file.

## Notes for AI

- Use `menubar` only for an application shell. For a site's navigation, links are the
  correct element and `navigation-menu` is the right component.
- Wrap each top-level menu in `MenubarMenu`; a bare `MenubarTrigger` has no menu to open.
- Keep the bar to a handful of menus. Each one is a click away from invisible content.

---

Full index: https://cadence.dev/llms.txt
