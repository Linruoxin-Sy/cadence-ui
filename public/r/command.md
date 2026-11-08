# Command

> Search and run actions from a keyboard-driven command palette.

- Registry item: https://cadence.dev/r/command.json
- Install: `npx shadcn@latest add @cadence/command`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/command
```

For manual installation copy `command/index.tsx`, install `cmdk` and `lucide-react`, and install the
`dialog`, `input-group`, `cadence-utils`, and `cadence-provider` registry dependencies.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react cmdk
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — transitive registry dependency.
- [@cadence/dialog](https://cadence.dev/r/dialog.json) — direct registry dependency.
- [@cadence/input](https://cadence.dev/r/input.json) — transitive registry dependency.
- [@cadence/textarea](https://cadence.dev/r/textarea.json) — transitive registry dependency.
- [@cadence/input-group](https://cadence.dev/r/input-group.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| dialog | `@components/cadence/dialog/index.tsx` | [JSON files[].content](https://cadence.dev/r/dialog.json) |
| input | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| textarea | `@components/cadence/textarea/index.tsx` | [JSON files[].content](https://cadence.dev/r/textarea.json) |
| input-group | `@components/cadence/input-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/input-group.json) |
| command | `@components/cadence/command/index.tsx` | [JSON files[].content](https://cadence.dev/r/command.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: dialog](https://cadence.dev/r/dialog.json)

[Source files: input](https://cadence.dev/r/input.json)

[Source files: textarea](https://cadence.dev/r/textarea.json)

[Source files: input-group](https://cadence.dev/r/input-group.json)

[Source files: command](https://cadence.dev/r/command.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all fourteen target files, including every shared `lib/` file and the
Button, Dialog, Input, Textarea and Input Group sources. Input Group imports
all three controls even when Command only renders its input. Keep the mirrored
`cadence/` tree, relative imports and `"use client"` directives intact. The
provider files and `motion` are required imports; wrapping your application in
`CadenceProvider` is optional.

Complete the linked base theme setup, including Cadence's easing tokens, and
ensure Tailwind scans the copied files. These payloads contain no additional
Command-specific CSS or assets. Inline commands do not animate. CommandDialog
inherits Dialog's scale and fade in full mode, opacity only in reduced, and
zero-duration transitions in none. Filtering, highlighting and list height
changes remain immediate. The system reduced-motion preference also applies
without a provider and to an explicitly nested full provider.

Usage, the top palette and all eleven body examples use this dependency graph.
Button is already included through Dialog and Input Group; `cmdk` also supplies
the examples' `useCommandState`. No example-only package or file is needed.

Keep Usage and the stateful palette, keyword, shortcut, controlled, caller-owned
result and Without motion compositions in client modules. A custom filter is
a function prop; SearchableList also subscribes to the actual Command store
with `useCommandState`, so A custom filter and Composing the search input need
a client caller too. Refs, event handlers and other function props require
the same boundary. Static compositions such as Keyboard and pointer navigation,
An unavailable input and Persistent help while filtering can be rendered from a Server Component
with serializable props; the examples' client directives remain valid. A
Server Component can also render a client composition with serializable data.
The site's preview shell is not consumer setup. Search, selection and dialog
interaction require hydrated JavaScript.

Compose `CommandInput` and `CommandList` inside `Command`, with items inside
groups. `CommandDialog` supplies the dialog surface, title and description;
it does not create a Command root or an opener. The caller owns open state,
action execution, routing, requests and any global shortcut listener.
`CommandShortcut` is only a visual hint. Root `value` controls the highlight;
input `value` controls the query; item `onSelect` runs the action. Supply stable
item values and optional keywords for cmdk's local filter, or set
`shouldFilter={false}` and manage results in the caller.

Give Command an accessible `label`. Reuse Usage's SearchableList inside that
root when hiding a zero-result list and announcing empty feedback outside it;
its input keeps `aria-controls` pointing to the mounted list and reports
`aria-expanded={false}` while empty. CommandInput retains cmdk's `asChild`
input composition, while the Base UI dialog uses `render`. Disabled items
cannot run and are skipped by arrow navigation. The list scrolls within its
300px maximum height; the parent owns inline width. The inline examples use
an unmatched initial value to avoid cmdk scrolling its default highlighted
item into view on mount; dialog palettes retain the default first highlight.

## Usage

The common palette keeps the caller's action and open state together. Its search and list are inside an explicit Command root.
The local SearchableList composition reads cmdk's result count with useCommandState. A miss collapses the suggestion
list and announces the empty text outside it. The composed input sets aria-expanded accordingly; the same list and
its aria-controls target remain mounted. This avoids presenting an expanded listbox without options.

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function Palette({
  label = "Open command palette",
  showCloseButton = false,
}: {
  label?: string;
  showCloseButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Workspace commands"
        description="Find an action, then press Enter to run it."
        showCloseButton={showCloseButton}
      >
        <Command label="Workspace actions">
          <SearchableList placeholder="Search workspace...">

            <CommandGroup heading="Workspace">
              {["projects", "search", "settings"].map((value) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={(action) => {
                    setExecuted(`Executed: ${action}`);
                    setOpen(false);
                  }}
                >
                  {value}
                </CommandItem>
              ))}
            </CommandGroup>
          </SearchableList>
        </Command>
      </CommandDialog>
    </div>
  );
}
```

## Dialog palette

Keep Command explicit inside CommandDialog. This named palette supplies its own title and description, enables the built-in close button, and closes after an action. The top palette uses the default hidden close button; Escape still dismisses it. Each opener owns independent open and executed-action state. Install `@cadence/button` for the buttons in these examples.

<ComponentExample name="dialog" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

function Palette({
  label = "Open command palette",
  showCloseButton = false,
}: {
  label?: string;
  showCloseButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Workspace commands"
        description="Find an action, then press Enter to run it."
        showCloseButton={showCloseButton}
      >
        <Command label="Workspace actions">
          <SearchableList placeholder="Search workspace...">

            <CommandGroup heading="Workspace">
              {["projects", "search", "settings"].map((value) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={(action) => {
                    setExecuted(`Executed: ${action}`);
                    setOpen(false);
                  }}
                >
                  {value}
                </CommandItem>
              ))}
            </CommandGroup>
          </SearchableList>
        </Command>
      </CommandDialog>
    </div>
  );
}

export function NamedPalette() { return <Palette label="Open named palette" showCloseButton />; }
```

## Keywords and disabled actions

Inline examples reserve the unmatched initial `defaultValue="none"` to start without a highlight.
cmdk otherwise scrolls its default highlighted item into view on mount, which can move a long page.
Typing or using arrow keys then selects and scrolls the actual matching item normally.
The controlled example uses the same initial unmatched value; dialog palettes retain the default first item.
SearchableList shows empty feedback only for a nonempty query with zero registered matches. The initial
nonempty result layout stays the same in server markup and after hydration. Filtering and counting stay with cmdk.

Stable item values and optional keywords participate in local fuzzy filtering. Search for user to find Profile or find to find Search files. Disabled items remain visible when they match, but arrows skip them and they cannot run. Groups hide when none of their items match; the default separator hides during a search.

<ComponentExample name="keywords" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function Keywords() {
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="Account actions" className="rounded-lg border">
        <SearchableList placeholder="Try user or find...">

          <CommandGroup heading="Workspace">
            <CommandItem value="search" keywords={["find"]} onSelect={setExecuted}>
              Search files
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem value="profile" keywords={["account", "user"]} onSelect={setExecuted}>
              Profile
            </CommandItem>
            <CommandItem value="billing" disabled>
              Billing unavailable
            </CommandItem>
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}
```

## Shortcut hints

CommandShortcut displays a hint beside an action. It registers no global shortcut. Click or press Enter here to record the command; an application owns any real routing or keyboard listener and its cleanup.

<ComponentExample name="shortcuts" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function Shortcuts() {
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="Navigation actions" className="rounded-lg border">
        <SearchableList placeholder="Search navigation...">

          <CommandGroup heading="Navigation">
            <CommandItem value="settings" onSelect={setExecuted}>
              Settings<CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
            <CommandItem value="projects" onSelect={setExecuted}>
              Projects<CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}
```

## Controlled highlight and query

The root value is the highlighted command, not a submitted form value or a record that an action ran. CommandInput owns a separate search string. Arrow keys only move the highlight; item onSelect records execution. The external button clears the query and highlights settings without running it.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function Controlled() {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState("none");
  const [executed, setExecuted] = useState("none");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command label="Controlled actions" value={highlight} onValueChange={setHighlight} className="rounded-lg border">
        <SearchableList placeholder="Search controlled actions..." value={query} onValueChange={setQuery}>

          <CommandGroup heading="Workspace">
            {["projects", "settings"].map((value) => (
              <CommandItem key={value} value={value} onSelect={setExecuted}>
                {value}
              </CommandItem>
            ))}
          </CommandGroup>
        </SearchableList>
      </Command>
      <Button
        variant="outline"
        onClick={() => {
          setQuery("");
          setHighlight("settings");
        }}
      >
        Highlight settings externally
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        Query: {query || "empty"}; highlighted: {highlight || "none"}; executed: {executed}
      </p>
    </div>
  );
}
```

## A custom filter

A custom filter returns a score from 0 to 1. This fixed policy accepts prefixes of stable values or keywords, ignoring case; pref matches Settings through preferences, while ttings does not. Filtering and list height update immediately.

<ComponentExample name="filter" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode } from "react";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function PrefixFilter() {
  return (
    <Command
      defaultValue="none"
      label="Prefix actions"
      className="w-full max-w-sm rounded-lg border"
      filter={(value, search, keywords = []) =>
        [value, ...keywords].some((text) => text.toLowerCase().startsWith(search.trim().toLowerCase())) ? 1 : 0
      }
    >
      <SearchableList placeholder="Match a prefix, such as pref..." emptyMessage="No prefix matches.">

        <CommandGroup heading="Actions">
          <CommandItem value="settings" keywords={["preferences"]}>
            Settings
          </CommandItem>
          <CommandItem value="projects">Projects</CommandItem>
        </CommandGroup>
      </SearchableList>
    </Command>
  );
}
```

## Caller-owned results

Set shouldFilter=false when the caller supplies the visible result set and its order. This example filters a fixed local city array; it makes no network request. The caller supplies the empty text; SearchableList reads the actual registered result count, collapses the empty list and announces the message outside it. An application owns request cancellation, loading, errors and authorization.

<ComponentExample name="results" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function CallerResults() {
  const [query, setQuery] = useState("");
  const [executed, setExecuted] = useState("No action yet");
  const results = ["Paris", "London", "Tokyo"].filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Command defaultValue="none" label="City actions" shouldFilter={false} className="rounded-lg border">
        <SearchableList placeholder="Search local city data..." value={query} onValueChange={setQuery} emptyMessage="No city found.">
          <CommandGroup heading="Cities">
            {results.map((city) => (
              <CommandItem key={city} value={city} onSelect={setExecuted}>
                Open {city}
              </CommandItem>
            ))}
          </CommandGroup>
        </SearchableList>
      </Command>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
    </div>
  );
}
```

## Keyboard and pointer navigation

The left list stops at its first and last enabled item and keeps the default Ctrl+N/J/P/K bindings. The right list loops with arrows, disables those optional bindings, and disables pointer-hover highlighting. Clicking an enabled item still activates it. Both lists skip the disabled middle row; neither setting changes native text editing.

<ComponentExample name="navigation" />

```tsx
"use client";

import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

export function Navigation() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Command defaultValue="none" label="Bounded actions" loop={false} className="rounded-lg border">
        <CommandInput placeholder="Bounded; Ctrl+N enabled" />
        <CommandList>
          <CommandGroup heading="Bounded">
            <CommandItem value="first">First</CommandItem>
            <CommandItem value="unavailable" disabled>
              Unavailable
            </CommandItem>
            <CommandItem value="last">Last</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <Command
        defaultValue="none"
        label="Looping actions"
        loop
        vimBindings={false}
        disablePointerSelection
        className="rounded-lg border"
      >
        <CommandInput placeholder="Looping; arrow keys" />
        <CommandList>
          <CommandGroup heading="Looping">
            <CommandItem value="first">First</CommandItem>
            <CommandItem value="unavailable" disabled>
              Unavailable
            </CommandItem>
            <CommandItem value="last">Last</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
```

## An unavailable input

Disable the input when search is unavailable, and separately disable every unavailable action. Disabling the search field alone does not disable other items. The native disabled input cannot receive keyboard focus.

<ComponentExample name="disabled" />

```tsx
"use client";

import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

export function DisabledInput() {
  return (
    <Command defaultValue="none" label="Unavailable search" className="w-full max-w-sm rounded-lg border">
      <CommandInput disabled placeholder="Search unavailable" />
      <CommandList>
        <CommandGroup heading="Unavailable">
          <CommandItem value="offline" disabled>
            Offline action
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
```

## Persistent help while filtering

forceMount on the Help group and its item keeps the help action available for every query. alwaysRender keeps the decorative rule visible. The Workspace group still follows normal filtering and hides on a miss. Persistent actions need their own valid behavior in the application; this specimen only demonstrates visibility.

<ComponentExample name="mounted" />

```tsx
"use client";

import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/cadence/command";

export function MountedActions() {
  return (
    <Command defaultValue="none" label="Persistent help" className="w-full max-w-sm rounded-lg border">
      <CommandInput placeholder="Try a query with no matches..." />
      <CommandList>
        <CommandGroup heading="Workspace">
          <CommandItem value="projects">Projects</CommandItem>
        </CommandGroup>
        <CommandSeparator alwaysRender />
        <CommandGroup heading="Help" forceMount>
          <CommandItem value="help" forceMount>
            Search the help center
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
```

## Composing the search input

SearchableList uses CommandInput's cmdk asChild composition API with one ref-forwarding InputGroupInput. The child sets truthful aria-expanded while preserving input-group styling; this example also supplies native inputMode and autoComplete. The Base UI dialog continues to use its own render API.

<ComponentExample name="custom-input" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode } from "react";
import { InputGroupInput } from "@/components/cadence/input-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

export function CustomInput() {
  return (
    <Command defaultValue="none" label="Custom search field" className="w-full max-w-sm rounded-lg border">
      <SearchableList placeholder="Search with a composed input..." inputMode="search" autoComplete="off">

        <CommandGroup heading="Workspace">
          <CommandItem value="projects">Projects</CommandItem>
          <CommandItem value="settings">Settings</CommandItem>
        </CommandGroup>
      </SearchableList>
    </Command>
  );
}
```

## Without motion

The first palette is explicitly inside mode=none from its first mount. The second opts back into full within that subtree; the operating system reduced-motion preference still wins. Ordinary examples inherit the site header mode and speed. Inline filtering and highlighting remain immediate in every mode.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { useCommandState } from "cmdk";
import { type ComponentProps, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { InputGroupInput } from "@/components/cadence/input-group";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/cadence/command";

function SearchableList({ children, emptyMessage = "No actions found.", ...inputProps }: Omit<ComponentProps<typeof CommandInput>, "children" | "asChild"> & { children: ReactNode; emptyMessage?: string }) {
  const empty = useCommandState((state) => state.search.length > 0 && state.filtered.count === 0);
  return (
    <>
      <CommandInput {...inputProps} asChild>
        <InputGroupInput aria-expanded={!empty} />
      </CommandInput>
      {empty && <CommandEmpty><span role="status">{emptyMessage}</span></CommandEmpty>}
      <CommandList hidden={empty}>{children}</CommandList>
    </>
  );
}

function Palette({
  label = "Open command palette",
  showCloseButton = false,
}: {
  label?: string;
  showCloseButton?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [executed, setExecuted] = useState("No action yet");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {executed}
      </p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Workspace commands"
        description="Find an action, then press Enter to run it."
        showCloseButton={showCloseButton}
      >
        <Command label="Workspace actions">
          <SearchableList placeholder="Search workspace...">

            <CommandGroup heading="Workspace">
              {["projects", "search", "settings"].map((value) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={(action) => {
                    setExecuted(`Executed: ${action}`);
                    setOpen(false);
                  }}
                >
                  {value}
                </CommandItem>
              ))}
            </CommandGroup>
          </SearchableList>
        </Command>
      </CommandDialog>
    </div>
  );
}

export function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <div className="flex w-full flex-wrap gap-4">
        <Palette label="Open instant palette" />
        <CadenceProvider mode="full">
          <Palette label="Open nested full palette" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

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
| `Command` | cmdk root props: `label`, `value`, `defaultValue`, `onValueChange`, `filter`, `shouldFilter`, `loop`, `vimBindings`, `disablePointerSelection` | `shouldFilter=true`, `loop=false`, `vimBindings=true`, `disablePointerSelection=false`; value is the highlighted command |
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

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. Ordinary specimens inherit the site header; the named Without motion example
uses explicit fixed local providers. The Dialog surface retains Base UI callback/render/ref semantics. Command parts use
cmdk’s native string class and object style props; cmdk owns filtering and keyboard selection.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| ArrowDown / ArrowUp | Move highlight, skipping disabled rows |
| Home / End | First / last enabled item |
| Ctrl+N / J, Ctrl+P / K | Next / previous item when vimBindings is enabled (default) |
| Enter | Run the highlighted item's `onSelect` |
| Escape | Close the dialog; an inline command has no dismissal behavior |
| Tab / Shift+Tab | Focus traversal, trapped inside an open dialog |

## Accessibility

cmdk owns combobox/listbox roles, `aria-activedescendant`, and selected/disabled attributes.
Give `Command` a `label` to name its search field. The dialog supplies a title, description and focus trap. The caller opens it from a real button;
dismissal restores focus to the initiating control. In these examples, a zero-result list is hidden, the input reports aria-expanded=false,
and CommandEmpty announces text outside the list. No-result messages are not executable options. SearchableList must stay inside Command
because useCommandState reads that root's actual cmdk store; it adds no second filter.
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
