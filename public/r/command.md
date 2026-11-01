# Command

> Search and run actions from a keyboard-driven command palette.

- Registry item: https://cadence.dev/r/command.json
- Install: `npx shadcn@latest add @cadence/command`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

```install
npx shadcn@latest add @cadence/command
```

For manual installation copy `command/index.tsx`, install `cmdk` and `lucide-react`, and install the
`dialog`, `input-group`, `cadence-utils`, and `cadence-provider` registry dependencies.

## Usage

```tsx
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/cadence/command";

export function Actions() {
  return (
    <Command label="Quick actions" className="max-w-sm rounded-lg border">
      <CommandInput placeholder="Search actions..." />
      <CommandList>
        <CommandEmpty>No actions found.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem value="projects" onSelect={() => console.log("projects")}>Open projects</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
```

## Dialog palette

The Base UI composition keeps `Command` explicit inside `CommandDialog`. The visually hidden title
and description live inside the popup so the portalled dialog remains named.

```tsx
import * as React from "react";
import { Button } from "@/components/cadence/button";
import { Command, CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/cadence/command";

export function Palette() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open palette</Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search actions..." />
          <CommandList>
            <CommandGroup heading="Workspace">
              <CommandItem value="projects" onSelect={() => setOpen(false)}>Open projects</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
```

## Keywords and disabled actions

```tsx
<CommandGroup heading="Account">
  <CommandItem value="profile" keywords={["account", "user"]}>Profile</CommandItem>
  <CommandItem value="billing" disabled>Billing unavailable</CommandItem>
</CommandGroup>
```

## Shortcut hints

```tsx
import { CommandGroup, CommandItem, CommandShortcut } from "@/components/cadence/command";

<CommandGroup heading="Navigation">
  <CommandItem value="settings">Settings <CommandShortcut>Ctrl+S</CommandShortcut></CommandItem>
</CommandGroup>
```

A shortcut is a visual hint; register application shortcuts in the caller. The component does not
install global keyboard listeners.

## When to use

- Search application actions without navigating a menu hierarchy.
- Offer keyboard navigation across grouped commands.
- Present a controlled command palette in a dialog.

## When not to use

- Use `Combobox` to choose a form value.
- Use `DropdownMenu` for a short list without search.
- Use a search page for remote results requiring pagination.

## API

| Part | Props | Default / behavior |
| --- | --- | --- |
| `Command` | cmdk root props: `label`, `value`, `defaultValue`, `onValueChange`, `filter`, `shouldFilter`, `loop` | `shouldFilter=true`, `loop=false`; value is the highlighted command |
| `CommandDialog` | Base UI Dialog root props, `title`, `description`, `className`, `showCloseButton`, required `children` | title `"Command Palette"`, description `"Search for a command to run..."`, `showCloseButton=false` |
| `CommandInput` | cmdk input props, `value`, `onValueChange`, `placeholder`, `disabled` | Typing filters locally; the root supplies the accessible label |
| `CommandList` | cmdk list props, `className` | Scrollable, max height 300px; no height tween |
| `CommandEmpty` | cmdk empty props, `className` | Shown when no command matches |
| `CommandGroup` | cmdk group props, `heading`, `value`, `forceMount` | Give a heading or unique value |
| `CommandItem` | cmdk item props, `value`, `keywords`, `disabled`, `onSelect` | Enter or click runs the action; disabled rows are skipped |
| `CommandSeparator` | cmdk separator props, `alwaysRender` | Hidden during search unless always rendered |
| `CommandShortcut` | span props, `className` | Hint only; no keyboard handler |

Parts merge user classes last and forward refs and remaining props. cmdk retains its `asChild` API;
the Base UI dialog uses `render`. The check glyph follows upstream's `data-checked`; the highlight's
`data-selected` is not a committed choice.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| open | dialog opacity 0 to 1 and scale from `--motion-scale-in`; backdrop opacity 0 to 1 | `popup.anchored` via Dialog, `duration.base` / `duration.fast` | yes, CSS transitions |
| close | dialog and backdrop fade out, panel scales back in full mode | `exit.fade` via Dialog | yes |
| filter / highlight | instant replacement and background feedback, no row motion | none | n/a |
| reduced | opacity only; scale classes absent | mode durations | yes |
| none | dialog and backdrop durations resolve to zero | zero duration | n/a |

The inline command has no animation. `CommandDialog` inherits Dialog's recipes and mode branches;
it adds no transition of its own. Fixed centering translation is layout, not motion.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| ArrowDown / ArrowUp | Move highlight, skipping disabled rows |
| Home / End | First / last enabled item |
| Enter | Run the highlighted item's `onSelect` |
| Escape | Close the dialog; an inline command has no dismissal behavior |
| Tab / Shift+Tab | Focus traversal, trapped inside an open dialog |

## Accessibility

cmdk owns combobox/listbox roles, `aria-activedescendant`, and selected/disabled attributes.
Give `Command` a `label` to name its search field. The dialog supplies a title, description,
focus trap, and focus restoration. Empty results are text, not executable options.
Separators are decorative (`aria-hidden`) because a listbox permits options and option groups.

## Responsive behavior

The inline palette fills its container. The dialog keeps viewport margins and a desktop max width.
The list scrolls independently so the search input stays reachable on short screens.

## Performance

Filtering and list height changes are instant. No layout animation, row stagger, or application
request orchestration is added. T2 source budget: 10 KB gzip; cmdk is a declared dependency.

## Notes for AI

- Put items inside groups, inside a list, inside `Command`.
- Keep `Command` inside `CommandDialog`; the dialog does not create a cmdk root.
- Use item `onSelect`; the caller owns routing and async work.
- `CommandShortcut` registers no shortcut. Related: `combobox`, `dialog`, `dropdown-menu`.

---

Full index: https://cadence.dev/llms.txt
