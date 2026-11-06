# Menubar

> Application menus along the top of a window.

- Registry item: https://cadence.dev/r/menubar.json
- Install: `npx shadcn@latest add @cadence/menubar`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/menubar
```

The Controlled opening example also composes `@cadence/button`; install that item alongside Menubar when copying it.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/dropdown-menu](https://cadence.dev/r/dropdown-menu.json) — direct registry dependency.

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
| dropdown-menu | `@components/cadence/dropdown-menu/index.tsx` | [JSON files[].content](https://cadence.dev/r/dropdown-menu.json) |
| menubar | `@components/cadence/menubar/index.tsx` | [JSON files[].content](https://cadence.dev/r/menubar.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: dropdown-menu](https://cadence.dev/r/dropdown-menu.json)

[Source files: menubar](https://cadence.dev/r/menubar.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all ten target files, including Dropdown Menu and every shared `lib/` file.
Keep the mirrored `cadence/` tree, relative imports and `"use client"` directives
intact. The provider files and `motion` are required imports; wrapping your
application in `CadenceProvider` is optional. Complete the base theme setup
linked above, including Cadence's easing tokens, and ensure Tailwind scans the
copied files. These payloads contain no additional menubar-specific CSS or assets.

Usage, the top specimen and all examples except Controlled opening need only
Menubar and its listed dependencies. Controlled opening also composes Button.
Follow [Button's manual installation](https://cadence.dev/components/button#installation)
and copy its full [payload source](https://cadence.dev/r/button.json), adding
`@components/cadence/button/index.tsx` alongside the shared files already listed.
Its only additional npm dependency is:

```package-manager
npm install class-variance-authority
```

Right-to-left menus uses `DirectionProvider` from the already required
`@base-ui/react`; pair it with DOM `dir`, including portal content, as shown.

In Next.js App Router, keep Usage, Shortcuts and groups, Selection items,
Nested commands, Item variants and closing, and Controlled opening in client
modules: they own state and handlers. Moving between menus, Horizontal and
vertical, Disabled bars and commands, Panel sides, Panel alignment,
Right-to-left menus, Modal and non-modal menus, and Explicit motion scopes are
static compositions and can be rendered by a Server Component with serializable
props. Adding event handlers, refs or function-valued `render`, `className` or
`style` props requires a client caller; synchronous `useId` alone does not. Keep
the shipped client directives. The site's preview shell is not consumer setup.
Opening, navigation, selection and dismissal require hydration; without
JavaScript the bar labels and code remain readable.

Give the bar an accessible name and put each top-level trigger and content in
its own `MenubarMenu`. Content includes its own portal, positioner and popup;
do not wrap it in another portal. Content defaults to bottom/start with an 8px
side offset and -4px alignment offset. Submenus use Sub, SubTrigger and
SubContent; their inherited defaults are right/start, zero side offset and
-3px alignment offset. Base UI owns roving focus, typeahead, sibling traversal,
collision handling and dismissal. Vertical orientation also needs caller layout
classes. Keep trigger labels short and constrain wide panels with
`max-w-(--available-width)`; check their minimum width and actual narrow-screen
bounds. Review the pointer/Escape limitation under Moving between menus.

The caller owns command effects, authorization, controlled `open`, checkbox and
radio values, persistence, loading and errors. Control each menu with
`open`/`onOpenChange`; use a stable trigger `id` and matching `triggerId` when
opening it externally. The bar has no shared `open` prop. Ordinary items close
on activation unless `closeOnClick={false}`; checkbox and radio items stay open
by default. Uncontrolled item state resets when the closed panel unmounts, as
Selection items demonstrates. Disabled items may receive arrow-key focus but
cannot activate. Shortcut text does not register keys, and `inset` changes only
alignment. Use a real anchor through `render` for destinations; a label inside
Group names that group, while an ungrouped label is a caption.

The bar defaults to `modal={true}`: a click-opened menu limits outside pointer
interaction and locks desktop scrolling. Forward Tab leaves the bar and closes
the panel. From a panel item, Shift+Tab returns to the trigger with the panel
still open; another Shift+Tab leaves the bar and closes it. Escape closes and
returns to the trigger. `modal={false}` allows outside interaction. Menubar
reuses Dropdown Menu's popup and selection motion; the bar itself does not
animate. Full mode fades and scales panels and marks, reduced keeps opacity
without scale, and none removes transition time. Optional provider scopes
control mode and speed, subject to the OS reduced-motion preference.

## Usage

```tsx
"use client";

import { useState } from "react";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function EditorMenubar() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Editor">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("New local document")}>New</MenubarItem>
              <MenubarItem onClick={() => setResult("Saved locally")}>Save</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Undo selected locally")}>Undo</MenubarItem>
              <MenubarItem onClick={() => setResult("Redo selected locally")}>Redo</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem render={<a href="/docs/changelog" />}>Changelog</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm text-muted-foreground">{result}</p>
    </div>
  );
}
```

## Moving between menus

The bar coordinates sibling menus. Use Left/Right to move between horizontal triggers and between open menus. The first fixed bar uses the default looping focus; the second sets `loopFocus={false}` so traversal stops at either end.

Current limitation: after opening menus with the pointer and dismissing them with Escape, moving to a previously dismissed neighbour can focus its trigger while leaving the earlier panel open. Press Enter on the focused trigger to open that menu. This also occurs with unstyled Base UI primitives and with motion set to none. This pointer-history case remains an unresolved keyboard regression; fresh keyboard traversal is shown below.

<ComponentExample name="traversal" />

```tsx
"use client";

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuTraversal() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((loopFocus) => (
        <Menubar key={String(loopFocus)} loopFocus={loopFocus} aria-label={loopFocus ? "Looping menus" : "Bounded menus"}>
          {["File", "Edit", "View"].map((label) => (
            <MenubarMenu key={label}>
              <MenubarTrigger>{label}</MenubarTrigger>
              <MenubarContent>
                <MenubarGroup><MenubarItem>{label} command</MenubarItem></MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      ))}
    </div>
  );
}
```

## Horizontal and vertical

Orientation changes roving-focus keys, not layout classes. The vertical bar supplies `h-auto flex-col items-stretch` and places its panels on the right; the horizontal bar keeps the defaults. Up/Down traverses vertical triggers before a menu opens.

<ComponentExample name="orientation" />

```tsx
"use client";

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuOrientations() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <Menubar key={orientation} orientation={orientation} aria-label={`${orientation} menus`}
          className={orientation === "vertical" ? "h-auto flex-col items-stretch" : undefined}>
          {["File", "Edit"].map((label) => (
            <MenubarMenu key={label}>
              <MenubarTrigger>{label}</MenubarTrigger>
              <MenubarContent side={orientation === "vertical" ? "right" : "bottom"}>
                <MenubarGroup><MenubarItem>{label} command</MenubarItem></MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
          ))}
        </Menubar>
      ))}
    </div>
  );
}
```

## Shortcuts and groups

A `MenubarLabel` inside its `MenubarGroup` names that group. `inset` aligns labels and commands with selection marks. `MenubarShortcut` is a text hint only: this local example does not register a global shortcut or export a file. The Changelog item is a real link.

<ComponentExample name="grouping" />

```tsx
"use client";

import { useState } from "react";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/cadence/menubar";

export function GroupedCommands() {
  const [result, setResult] = useState("No export yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Export commands">
        <MenubarMenu>
          <MenubarTrigger>Export</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel inset>Document</MenubarLabel>
              <MenubarItem inset onClick={() => setResult("PDF selected locally")}>
                PDF<MenubarShortcut>⇧⌘P</MenubarShortcut>
              </MenubarItem>
              <MenubarItem inset onClick={() => setResult("PNG selected locally")}>PNG</MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Help</MenubarLabel>
              <MenubarItem render={<a href="/docs/changelog" />}>Changelog</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">{result}</p>
    </div>
  );
}
```

## Selection items

Checkboxes and radios keep the panel open by default. Sidebar and density are caller-owned values; Line numbers demonstrates independent uncontrolled state. Sidebar and density persist across panel lifetimes. Line numbers is an uncontrolled item: closing the panel unmounts it, so reopening restores its default.

<ComponentExample name="selection" />

```tsx
"use client";

import { useState } from "react";
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarLabel, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuSelection() {
  const [sidebar, setSidebar] = useState(true);
  const [density, setDensity] = useState("comfortable");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="View settings">
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel inset>Show</MenubarLabel>
              <MenubarCheckboxItem checked={sidebar} onCheckedChange={setSidebar}>Sidebar</MenubarCheckboxItem>
              <MenubarCheckboxItem defaultChecked inset>Line numbers</MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarRadioGroup aria-label="Density" value={density} onValueChange={setDensity}>
              <MenubarLabel>Density</MenubarLabel>
              <MenubarRadioItem value="compact" inset>Compact</MenubarRadioItem>
              <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">Sidebar: {sidebar ? "shown" : "hidden"}; density: {density}</p>
    </div>
  );
}
```

## Nested commands

A submenu belongs to its trigger, not to a neighbouring top-level menu. Right opens it and Left returns to its trigger in LTR. Selecting a destination updates only this local result and closes the menu tree.

<ComponentExample name="submenus" />

```tsx
"use client";

import { useState } from "react";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/cadence/menubar";

export function NestedCommands() {
  const [result, setResult] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Organize document">
        <MenubarMenu>
          <MenubarTrigger>Organize</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Kept here")}>Keep here</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger inset>Move to</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarGroup>
                    {["Backlog", "Review"].map((value) => (
                      <MenubarItem key={value} onClick={() => setResult(value)}>{value}</MenubarItem>
                    ))}
                  </MenubarGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">{result}</p>
    </div>
  );
}
```

## Item variants and closing

Default and destructive are item variants. `closeOnClick={false}` keeps the panel open for the middle action; it is separate from the visual `inset` choice. These handlers record local results and do not mutate a server document.

<ComponentExample name="items" />

```tsx
"use client";

import { useState } from "react";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function ItemBehaviors() {
  const [result, setResult] = useState("No item action yet");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Menubar aria-label="Item commands">
        <MenubarMenu>
          <MenubarTrigger>Actions</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem onClick={() => setResult("Renamed locally")}>Rename</MenubarItem>
              <MenubarItem inset closeOnClick={false} onClick={() => setResult("Still open")}>Keep open</MenubarItem>
              <MenubarItem variant="destructive" onClick={() => setResult("Deleted locally")}>Delete</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">{result}</p>
    </div>
  );
}
```

## Disabled bars and commands

Disable the entire bar, an individual trigger, or each item part independently. Disabled menu items may receive arrow-key focus, but cannot activate or change selection. The disabled submenu cannot open. Do not make disabled commands disappear from the keyboard model.

<ComponentExample name="disabled" />

```tsx
"use client";

import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/cadence/menubar";

export function DisabledCommands() {
  return (
    <div className="flex flex-wrap gap-3">
      <Menubar disabled aria-label="Disabled bar">
        <MenubarMenu><MenubarTrigger>Disabled bar</MenubarTrigger>
          <MenubarContent><MenubarGroup><MenubarItem>Unavailable</MenubarItem></MenubarGroup></MenubarContent>
        </MenubarMenu>
      </Menubar>
      <Menubar aria-label="Disabled commands">
        <MenubarMenu><MenubarTrigger disabled>Disabled trigger</MenubarTrigger>
          <MenubarContent><MenubarGroup><MenubarItem>Unavailable</MenubarItem></MenubarGroup></MenubarContent>
        </MenubarMenu>
        <MenubarMenu><MenubarTrigger>Unavailable commands</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarItem disabled>Delete locked document</MenubarItem>
              <MenubarCheckboxItem disabled defaultChecked>Locked sidebar</MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarRadioGroup defaultValue="locked">
              <MenubarRadioItem disabled value="locked">Locked density</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarGroup>
              <MenubarSub>
                <MenubarSubTrigger disabled>Unavailable destination</MenubarSubTrigger>
                <MenubarSubContent><MenubarGroup><MenubarItem>Never opened</MenubarItem></MenubarGroup></MenubarSubContent>
              </MenubarSub>
              <MenubarItem>Done</MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
```

## Controlled opening

Control an individual `MenubarMenu` with `open`/`onOpenChange`. The external action is part of this focused behavior example; `useId` and `triggerId` preserve its real File anchor. The bar itself has no shared `open` prop. Escape and selecting Save close through the same callback.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function ControlledMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("No controlled action");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>Open externally</Button>
      <Menubar aria-label="Controlled menu">
        <MenubarMenu open={open} onOpenChange={setOpen} triggerId={id}>
          <MenubarTrigger id={id}>File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup><MenubarItem onClick={() => setResult("Saved locally")}>Save</MenubarItem></MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p role="status" className="text-sm">{result}</p>
    </div>
  );
}
```

## Panel sides

These four fixed menus demonstrate physical sides without a placement selector. `sideOffset` defaults to 8px. Base UI may flip or shift to avoid the viewport; a requested side is not a guarantee on a narrow screen.

<ComponentExample name="sides" />

```tsx
"use client";

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Menubar key={side} aria-label={`${side} placement`}>
          <MenubarMenu><MenubarTrigger>{side}</MenubarTrigger>
            <MenubarContent side={side}><MenubarGroup><MenubarItem>Done</MenubarItem></MenubarGroup></MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}
```

## Panel alignment

Start, center and end compare the panel with its trigger on the cross axis. These examples explicitly set `alignOffset={0}` for exact alignment; the component default is -4px. Alignment is independent of side.

<ComponentExample name="alignments" />

```tsx
"use client";

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Menubar key={align} aria-label={`${align} alignment`}>
          <MenubarMenu><MenubarTrigger>{align}</MenubarTrigger>
            <MenubarContent align={align} alignOffset={0}><MenubarGroup><MenubarItem>Done</MenubarItem></MenubarGroup></MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}
```

## Right-to-left menus

Set both Base UI direction context and DOM direction, including portal content. In RTL, inline-start resolves to the right and inline-end to the left; horizontal trigger traversal reverses. Panels remain constrained to available viewport width.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function RtlMenus() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Menubar key={side} aria-label={`${side} RTL`}>
            <MenubarMenu><MenubarTrigger>{side}</MenubarTrigger>
              <MenubarContent side={side} className="min-w-0 w-48 max-w-(--available-width)">
                <MenubarGroup><MenubarItem>Done</MenubarItem></MenubarGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu><MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent><MenubarGroup><MenubarItem>About</MenubarItem></MenubarGroup></MenubarContent>
            </MenubarMenu>
          </Menubar>
        ))}
      </div>
    </DirectionProvider>
  );
}
```

## Modal and non-modal menus

The default `modal={true}` limits outside pointer interactions and locks desktop page scrolling while a click-opened menu is present. `false` allows the rest of the document to remain interactive. These are menu semantics: Forward Tab leaves the bar and closes the panel. From a panel item, Shift+Tab first returns to the bar trigger with its panel still open; a second Shift+Tab leaves the bar and closes it. Escape closes directly and returns to the trigger.

<ComponentExample name="modality" />

```tsx
"use client";

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {[true, false].map((modal) => (
        <Menubar key={String(modal)} modal={modal} aria-label={`modal ${modal}`}>
          <MenubarMenu><MenubarTrigger>{String(modal)}</MenubarTrigger>
            <MenubarContent><MenubarGroup><MenubarItem>Done</MenubarItem></MenubarGroup></MenubarContent>
          </MenubarMenu>
        </Menubar>
      ))}
    </div>
  );
}
```

## Explicit motion scopes

Only this named example overrides the header. The first panel mounts under `none`, with no animated first frame. The second nests `full` inside `none`; system reduced motion still wins. Ordinary examples inherit header mode and speed.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarMenu, MenubarTrigger } from "@/components/cadence/menubar";

export function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Menubar aria-label="Instant menu"><MenubarMenu><MenubarTrigger>Open without motion</MenubarTrigger>
          <MenubarContent data-testid="initial-none"><MenubarGroup><MenubarCheckboxItem>Sidebar</MenubarCheckboxItem></MenubarGroup></MenubarContent>
        </MenubarMenu></Menubar>
        <CadenceProvider mode="full">
          <Menubar aria-label="Nested full menu"><MenubarMenu><MenubarTrigger>Open nested full</MenubarTrigger>
            <MenubarContent data-testid="nested-full"><MenubarGroup><MenubarCheckboxItem>Sidebar</MenubarCheckboxItem></MenubarGroup></MenubarContent>
          </MenubarMenu></Menubar>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
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
`"horizontal"`), and `loopFocus` (default `true`). Vertical orientation needs caller layout classes. Each `MenubarMenu` accepts the menu root state props (`open`, `defaultOpen`, `onOpenChange`, `triggerId`); these do not belong on the bar. Every other part mirrors `dropdown-menu` under menubar slots:

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

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. Ordinary specimens inherit the header mode and speed; only the explicit
motion-scopes example overrides them. Header pointer interaction may close a menu normally. The
independent runtime fixture verifies live mode changes without an outside press. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive.

## Keyboard interactions

| Keys                        | Action                                                        |
| --------------------------- | ------------------------------------------------------------- |
| `ArrowLeft` / `ArrowRight`  | Traverses horizontal top-level menus (reversed in RTL); while open, opens the neighbour unless entering a submenu; after the pointer/Escape history described above, Enter may be needed. |
| `ArrowDown` / `Enter` / `Space` | Opens a horizontal menu; Up/Down traverses closed vertical triggers. |
| `ArrowUp` / `ArrowDown`     | Moves the highlight inside an open menu.                       |
| `Home` / `End`              | First and last item.                                           |
| `Escape`                    | Closes the menu and returns focus to its trigger.              |
| `Tab`                       | Leaves the open menu/bar for the next page control and closes the panel. |
| `Shift+Tab`                 | From a panel item, returns to its trigger and keeps the panel open; another Shift+Tab leaves the bar and closes it. |

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

A menubar is a desktop pattern. Its default bar is a single fixed-height flex row; it does not
automatically wrap triggers. Keep labels short, constrain panels to the available width, and
supply layout classes if wrapping or vertical presentation is required. For touch, prefer `dropdown-menu` behind a single
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
