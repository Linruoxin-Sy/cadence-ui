# Dropdown Menu

> Row actions, filters, and view settings behind one button.

- Registry item: https://cadence.dev/r/dropdown-menu.json
- Install: `npx shadcn@latest add @cadence/dropdown-menu`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/dropdown-menu
```

The examples compose `@cadence/button`; install that item alongside the menu when copying them.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
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
| dropdown-menu | `@components/cadence/dropdown-menu/index.tsx` | [JSON files[].content](https://cadence.dev/r/dropdown-menu.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: dropdown-menu](https://cadence.dev/r/dropdown-menu.json)

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
    --motion-stagger-reveal: 0.055s;
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
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
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

Copy all nine target files, including every shared `lib/` file. Keep the mirrored
`cadence/` tree, relative imports and `"use client"` directives intact. The provider
files and `motion` are required imports; wrapping your application in
`CadenceProvider` is optional. Complete the base theme setup linked above,
including Cadence's easing tokens, and ensure Tailwind scans the copied files.
These payloads contain no additional menu-specific CSS or assets.

Usage, the top specimen and every body example also compose Button. Follow
[Button's manual installation](https://cadence.dev/components/button#installation)
and copy its full [payload source](https://cadence.dev/r/button.json), adding
`@components/cadence/button/index.tsx` alongside the shared files already listed.
Its only additional npm dependency is:

```package-manager
npm install class-variance-authority
```

Logical placement uses `DirectionProvider` from the already required
`@base-ui/react`; pair its direction with the DOM `dir` attribute, as shown.

In Next.js App Router, keep Usage, Items, shortcuts, and destructive actions,
Checkbox and radio items, Submenus, Grouping and Controlled open in client
modules: they own state and handlers. Disabled controls, Placement, Alignment,
Logical placement, Non-modal menu and Explicit motion scopes are static
compositions and can be rendered by a Server Component using serializable props,
including the JSX element passed to `render`. Adding event handlers, refs or
function-valued `render`, `className` or `style` props requires a client caller.
Synchronous `useId` alone does not require one. The site's preview shell is not
consumer setup; hydrated opening, navigation, selection and dismissal require
JavaScript.

Compose a root, trigger and content. Pass Button through the trigger's `render`
prop so the primitive's accessible name, expanded state and events reach the
actual button. Content already includes its portal, positioner and popup; do
not add a second portal around it. Its defaults are bottom/start with a 4px
side offset and zero alignment offset. Submenus use Sub, SubTrigger and
SubContent; their defaults are right/start, zero side offset and -3px alignment
offset. Base UI owns collision handling, item focus, typeahead, submenu
navigation and dismissal. Cap caller-defined widths for narrow viewports and
verify the actual open panel bounds. In Placement, the fixed `w-52` can overflow
a narrow side placement; add `max-w-(--available-width)` and check the minimum
width too.

The caller owns commands and their effects, permissions, controlled `open`,
checkbox `checked` and radio-group `value`, persistence and error feedback.
Use `defaultOpen`, `defaultChecked` and `defaultValue` for uncontrolled initial
state. For external opening, Controlled open pairs a unique root `triggerId`
with the trigger's `id` to preserve the anchor. Put actions on `onClick`;
ordinary items close by default, `closeOnClick={false}` keeps them open, and
checkbox/radio items stay open by default. Disabled items expose their state
and remain discoverable with arrow keys but cannot activate. Shortcut text
does not register a key binding. Group labels name a DropdownMenuGroup;
ungrouped labels are captions. This menu supplies no form-state or validation
package, and the examples only update local status text.

Full mode scales and fades the popup and animates the checkbox/radio mark.
Reduced keeps opacity and removes scale; none disables those transitions from
the first mounted frame. A nested provider can restore full inside none,
subject to the system reduced-motion preference. Keep native menu focus and
dismissal behavior when supplying custom render elements or handlers; use
ordinary links or Navigation Menu for a navigation list and Popover for a task
form.

## Usage

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function RowActions() {
  const [result, setResult] = useState("No action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Renamed locally")}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResult("Duplicated locally")}>Duplicate</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {["Backlog", "In review", "Done"].map((value) => (
                    <DropdownMenuItem key={value} onClick={() => setResult(`Moved to ${value}`)}>
                      {value}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => setResult("Deleted locally")}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </div>
  );
}
```

## Items, shortcuts, and destructive actions

Default and destructive items are directly visible in one menu. inset aligns text with state indicators. Shortcut text is a visual hint, not a registered binding. closeOnClick=false keeps the local Keep open action available; other commands record a local result and close. No resource is deleted.

<ComponentExample name="items" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MenuCommands() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Commands</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Edit selected")}>
              Edit<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem inset closeOnClick={false} onClick={() => setResult("Still open")}>
              Keep open
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setResult("Delete selected locally")}>
              Delete<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Checkbox and radio items

The caller owns Comments and Density; Description is an independent uncontrolled item. Choosing these keeps the menu open so several settings can change in one visit. Their indicators expose aria-checked and inherit the header mode. The status reads back local values only.

<ComponentExample name="selection" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function ViewMenu() {
  const [comments, setComments] = useState(false);
  const [density, setDensity] = useState("comfortable");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>View</DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem defaultChecked inset>
              Description
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={comments} onCheckedChange={setComments}>
              Comments
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioItem value="compact" inset>
              Compact
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        Comments: {comments ? "shown" : "hidden"}; density: {density}
      </p>
    </div>
  );
}
```

## Submenus

The submenu has its own portal and shares the surface motion contract. ArrowRight opens it and ArrowLeft returns to the parent trigger; hover also opens it. The parent also offers a direct Keep here command. The inset submenu records a different local destination when an item runs.

<ComponentExample name="submenus" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MoveMenu() {
  const [destination, setDestination] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Move item</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDestination("Current group")}>Keep here</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {["Backlog", "Review"].map((value) => (
                    <DropdownMenuItem key={value} onClick={() => setDestination(value)}>
                      {value}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {destination}
      </p>
    </div>
  );
}
```

## Grouping

A label inside DropdownMenuGroup gives that group its accessible name. A label outside a group is only a visible caption, as Density is in the preceding radio example. Use separators between distinct command groups.

<ComponentExample name="grouping" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function GroupedMenu() {
  const [result, setResult] = useState("No grouped action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Grouped actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Project commands</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Pull request</DropdownMenuLabel>
            <DropdownMenuItem inset onClick={() => setResult("Review selected locally")}>
              Review
            </DropdownMenuItem>
            <DropdownMenuItem inset onClick={() => setResult("Summary selected locally")}>
              Copy summary
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>History</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setResult("Activity selected locally")}>View activity</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Controlled open

The external action opens the same controlled menu. A unique triggerId preserves the actual anchor. The caller owns the open flag and records local actions; native Escape and outside dismissal still work.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function ControlledMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("No action");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open externally
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen} triggerId={id}>
        <DropdownMenuTrigger id={id} render={<Button variant="outline" />}>
          Controlled actions
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setResult("Copied locally")}>Copy</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Disabled controls

The disabled trigger cannot open a menu. In the second menu, disabled commands, checkbox, radio and submenu triggers stay visible but cannot run. Base UI keeps disabled items keyboard-focusable so their unavailable state can be discovered. The enabled Done item remains available.

<ComponentExample name="disabled" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function DisabledMenus() {
  return (
    <div className="flex flex-wrap gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger disabled render={<Button variant="outline" />}>
          Disabled trigger
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Unavailable</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Unavailable commands</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>Delete locked item</DropdownMenuItem>
            <DropdownMenuCheckboxItem disabled defaultChecked>
              Locked visibility
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup defaultValue="locked">
            <DropdownMenuRadioItem value="locked" disabled>
              Locked density
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled>Unavailable destination</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Never opened</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>Done</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

## Placement

Each menu prefers a fixed physical side. Collision detection may flip or shift it inside the viewport. The default is bottom with a 4px gap.

<ComponentExample name="sides" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MenuSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((value) => (
        <DropdownMenu key={value}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
          <DropdownMenuContent side={value} className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>Close menu</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
```

## Alignment

Compare the three alignments independently of the placement side. Alignment is relative to the trigger; default align is start and alignOffset is zero.

<ComponentExample name="alignments" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MenuAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((value) => (
        <DropdownMenu key={value}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
          <DropdownMenuContent align={value} className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>Close menu</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
```

## Logical placement

Logical placement follows the direction provider: RTL inline-start prefers right and inline-end prefers left. Physical sides remain physical. The width cap follows Base UI's available-width variable so the panel fits the chosen side on a narrow viewport.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function LogicalMenus() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <div className="flex flex-wrap gap-3">
          {(["inline-start", "inline-end"] as const).map((value) => (
            <DropdownMenu key={value}>
              <DropdownMenuTrigger render={<Button variant="outline" />}>{value}</DropdownMenuTrigger>
              <DropdownMenuContent side={value} className="w-52 max-w-(--available-width)">
                <DropdownMenuGroup>
                  <DropdownMenuItem>Close menu</DropdownMenuItem>
                  <DropdownMenuItem>Done</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>
    </DirectionProvider>
  );
}
```

## Non-modal menu

Compare modal true and false. Both keep the usual command keyboard path and dismiss on Escape; false permits outside pointer interaction while the menu is open. Use a popover when the panel contains a task form.

<ComponentExample name="modality" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MenuModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((modal) => (
        <DropdownMenu key={String(modal)} modal={modal}>
          <DropdownMenuTrigger render={<Button variant="outline" />}>{String(modal)}</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              <DropdownMenuItem>Done</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
```

## Explicit motion scopes

Ordinary menus inherit the header. Only this example sets none and restores full in a nested provider; the OS reduced preference still wins. Popup and checkbox indicator both use that local clock.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/cadence/dropdown-menu";

export function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Open without motion</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="initial-none">
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem>Comments</DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <CadenceProvider mode="full">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>Open nested full</DropdownMenuTrigger>
            <DropdownMenuContent data-testid="nested-full">
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem>Comments</DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A row of actions behind one trigger: a table row, a card, a file.
- A filter or view setting where the panel stays open while several options change.
- A command list too long for a toolbar and too short to need search.

## When not to use

- A list of links for ordinary site navigation. Use a `navigation-menu` or plain links;
  a navigational command in a menu retains the menu's keyboard behavior.
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
| `modal`        | `boolean`                  | `true`  | Limits outside pointer interaction and locks desktop scrolling. Tab dismisses the menu. |

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
| `className`   | string or Base UI state callback                                      | –          | Merged last.                                    |

### `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`

| Part                     | Props                                                              | Notes                                             |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------- |
| `DropdownMenuItem`       | `onClick`, `disabled`, `inset`, `variant`, `closeOnClick`            | `variant`: `"default" \| "destructive"`.          |
| `DropdownMenuCheckboxItem` | `checked`, `defaultChecked`, `onCheckedChange`, `inset`            | Keeps the menu open.                              |
| `DropdownMenuRadioGroup` | `value`, `defaultValue`, `onValueChange`                            | One selection for the group.                      |
| `DropdownMenuRadioItem`  | `value` (required), `disabled`, `inset`                             | Keeps the menu open.                              |
| `DropdownMenuSub`        | –                                                                  | Groups a submenu trigger and its content.         |
| `DropdownMenuSubTrigger` | `disabled`, `inset`                                                | Renders the chevron.                              |
| `DropdownMenuSubContent` | Same as `DropdownMenuContent`                                      | `side="right"`, `alignOffset={-3}` by default.    |

### `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`

`DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`,
`DropdownMenuShortcut`, `DropdownMenuPortal`.

## Motion contract

Authored intensity is **medium**: Dropdown Menu opens and closes its existing popup surface; content and native focus retain their current owners.

| Phase         | Properties                                        | Token             | Interruptible                |
| ------------- | ------------------------------------------------- | ----------------- | ---------------------------- |
| open          | panel `opacity 0 → 1`, `scale 0.96 → 1` from the trigger origin | `popup.anchored/css-transition` · `duration.fast` | yes (reopen mid-exit) |
| close         | panel `opacity → 0`, `scale → 0.96`               | `exit.fade/css-transition` · `duration.fast` | yes                |
| check / radio | mark `opacity` + `scale`                          | `state.morph/one-shot`     | yes                          |
| reduced       | panel fades, no scale; the mark cross-fades at full size | `exit.fade/css-transition` | yes                         |
| none          | every `--motion-duration-*` resolves to `0ms`; the mark jumps | –      | –                            |

Opening and closing are one CSS transition on `opacity` and `scale`, driven by Base UI's
`data-starting-style` / `data-ending-style`, so an interrupted close reverses rather than
restarts. The panel grows out of `--transform-origin`, which Base UI points at the trigger;
a submenu grows out of its item the same way, because both levels render the same panel.

The highlighted row is a colour change, not motion: `data-highlighted` switches the item's
background. A travelling highlight would be a shared element across items — `layout.move`,
which belongs to `tabs` and `toggle-group`, not to a menu that can be entered at any row.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. The site header changes the inherited mode on the same component tree; the named
Explicit motion scopes example demonstrates fixed local overrides. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive.

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
- For a navigational command, use `DropdownMenuItem render={<a href="…" />}`. The anchor
  keeps its `href` and receives `role="menuitem"` and Base UI's focus and activation behavior.
  Do not nest a second interactive link inside an item.
- `DropdownMenuLabel` inside a `DropdownMenuGroup` is the group's accessible name. Outside a
  group it is a caption: visible to sighted users, not announced as a label.
- `DropdownMenuShortcut` is text, not a binding. Announce the shortcut in the item's label
  only when it is registered, or the reader is told about a key that does nothing.
- The default modal mode limits outside pointer interaction and locks desktop scrolling. `Tab`
  still dismisses the menu and continues the page order; this is not a dialog focus trap.

## Responsive behavior

The panel caps at `--available-height` and scrolls. The positioner can flip the side and
shift along the cross axis, but caller-defined widths can still exceed the available space
in side placements. Cap them with `max-w-(--available-width)` and verify open bounds;
reduce the `min-w-[8rem]` minimum too if the available space is narrower.
On touch, the menu opens on tap and
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

The popup owns its `duration.fast` clock, including provider timeScale and the
reduced duration multiplier. An explicit full provider restores the clock inside
an outer none scope. In none mode the popup removes starting/ending opacity and
uses zero duration on the first frame. Function-valued popup `className` and
`style` receive Base UI state and merge after the component defaults.

---

Full index: https://cadence.dev/llms.txt
