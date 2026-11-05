# Kbd

> Keyboard shortcuts in tooltips, menus, and command lists.

- Registry item: https://cadence.dev/r/kbd.json
- Install: `npx shadcn@latest add @cadence/kbd`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/kbd
```

The Inside a tooltip example also needs Button and Tooltip:

```install
npx shadcn@latest add @cadence/button @cadence/tooltip
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| kbd | `@components/cadence/kbd/index.tsx` | [JSON files[].content](https://cadence.dev/r/kbd.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: kbd](https://cadence.dev/r/kbd.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Kbd needs only the two files and packages listed above; no motion runtime, provider or
additional item-specific CSS is required. Keep `kbd/index.tsx` and `lib/cn.ts` at the
listed relative paths so the shared `cn` import resolves.

For the Inside a tooltip example, also follow the installation instructions for
[Button](/components/button#installation) and [Tooltip](/components/tooltip#installation),
including their dependencies and setup. Those components keep their own motion contracts;
they are not dependencies of Kbd itself.

## Usage

```tsx
import { Kbd, KbdGroup } from "@/components/cadence/kbd";

export function ShortcutHint() {
  return (
    <span className="text-sm text-muted-foreground">
      Search <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
    </span>
  );
}
```

## Single key

Use one `Kbd` for one physical key. It is a hint, with no focus stop or keyboard handler.

<ComponentExample name="single" />

```tsx
import { Kbd } from "@/components/cadence/kbd";

export function EscapeHint() {
  return <Kbd>Esc</Kbd>;
}
```

## A combination

`KbdGroup` renders the keys with one gap between them and keeps the sequence
together for screen readers.

<ComponentExample name="combination" />

```tsx
import { Kbd, KbdGroup } from "@/components/cadence/kbd";

export function CommandHint() {
  return (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  );
}
```

## Inside a tooltip

A `Kbd` inside `data-slot="tooltip-content"` inverts its colours automatically, so
the hint stays legible on the tooltip surface.
Focus or hover the trigger to see it. Install `@cadence/tooltip` and `@cadence/button`
for this composition; the application owns any save action or shortcut handler.
Tooltip and Button keep their own motion contracts and inherit the site's motion settings.

<ComponentExample name="tooltip" />

```tsx
import { Button } from "@/components/cadence/button";
import { Kbd, KbdGroup } from "@/components/cadence/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function SaveHint() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Save changes</TooltipTrigger>
      <TooltipContent>
        Save <KbdGroup><Kbd>⌘</Kbd><Kbd>S</Kbd></KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}
```

## When to use

- A shortcut hinted next to a command: search, save, new item.
- A key the user should press in a flow: `Tab`, `Esc`, `↑ ↓`.
- Inside a `tooltip` or a `dropdown-menu` item, where space is short.

## When not to use

- A key that is part of running text. Write it in prose; a pill interrupts the
  sentence.
- A button that runs a command. A `kbd` is a label, not a control — it has no
  keyboard path and no press state.
- Long sequences of more than three keys. Put the shortcut in a table instead.

## API

| Part       | Props                        | Notes                                            |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `Kbd`      | native `kbd` props           | One key. `data-slot="kbd"`.                      |
| `KbdGroup` | native `div` props           | Wraps several keys with `data-slot="kbd-group"`. |

KbdGroup keeps the pinned native div prop type while rendering a `kbd` element.

## Motion contract

No motion (T0). A key hint is a label; it must not pulse or slide while the user
is reading it.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- Renders a real `<kbd>` element, which assistive technology reports as keyboard
  input — the same information a sighted user reads from the key shape.
- The shortcut is text, so it survives every reduced-motion mode and every colour
  theme.
- If a hint is icon-only, put the key name in `aria-label` on the `Kbd`.
- Do not attach `tabIndex`; a shortcut hint is not focusable.

## Responsiveness and performance

Keys and key groups use intrinsic inline sizes. The caller owns wrapping or scrolling long shortcut
descriptions; these labels do not register keyboard shortcuts.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry enforces a 4 KiB gzip budget for
this item's own shipped source; dependencies and application bundles are measured separately.

## Notes for AI

- Use the platform's own glyphs (`⌘`, `⇧`, `↵`) rather than words, and keep one
  `Kbd` per physical key.
- If the shortcut is a live command, render a `button` and put the `Kbd` inside it.

---

Full index: https://cadence.dev/llms.txt
