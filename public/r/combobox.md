# Combobox

> Picking from a long list you can filter by typing.

- Registry item: https://cadence.dev/r/combobox.json
- Install: `npx shadcn@latest add @cadence/combobox`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/combobox
```

Combobox examples that use external actions also require `@cadence/button`.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — transitive registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — transitive registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — transitive registry dependency.
- [@cadence/input](https://cadence.dev/r/input.json) — transitive registry dependency.
- [@cadence/textarea](https://cadence.dev/r/textarea.json) — transitive registry dependency.
- [@cadence/input-group](https://cadence.dev/r/input-group.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| input | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| input | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/input.json) |
| textarea | `@components/cadence/textarea/index.tsx` | [JSON files[].content](https://cadence.dev/r/textarea.json) |
| input-group | `@components/cadence/input-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/input-group.json) |
| input-group | `@components/cadence/lib/button-group-layout.ts` | [JSON files[].content](https://cadence.dev/r/input-group.json) |
| input-group | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/input-group.json) |
| combobox | `@components/cadence/combobox/index.tsx` | [JSON files[].content](https://cadence.dev/r/combobox.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: input](https://cadence.dev/r/input.json)

[Source files: textarea](https://cadence.dev/r/textarea.json)

[Source files: input-group](https://cadence.dev/r/input-group.json)

[Source files: combobox](https://cadence.dev/r/combobox.json)

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

Copy all thirteen target files, including every shared `lib/` file and the
Button, Input, Textarea and Input Group sources. Keep the mirrored `cadence/`
tree, relative imports and `"use client"` directives intact. Input Group imports
all three controls even when this composition only renders its input and button.
The provider files and `motion` are required imports; wrapping your application
in `CadenceProvider` is optional.

Complete the base theme setup linked above, including Cadence's easing tokens,
and ensure Tailwind scans the copied files. These payloads contain no additional
Combobox-specific CSS or assets. Full mode scales and fades the popup and animates
the selection tick. Reduced keeps opacity and removes scale; none disables those
transitions from the first frame. Filtering and list placement update immediately
in every mode. Standalone components respect the system motion preference, as
does a nested full provider.

Usage, the top specimen and every body example use only this dependency graph.
Button for Controlled values and submission is already included transitively
through Input Group; no extra file or npm package is needed. Logical sides also
uses `DirectionProvider` from the already required `@base-ui/react`; pair its
direction with the DOM `dir` attribute, as shown.

In Next.js App Router, keep all fifteen shown Usage/example compositions in
client modules. Each passes a function to `ComboboxList`; Groups and separators
also uses a `ComboboxCollection` callback. Multiple values uses
`useComboboxAnchor` and function-valued `ComboboxValue` children. Controlled
values and submission, Object values and Caller-owned results additionally own
state, handlers or effects. Synchronous `useId` alone does not require a client
caller, but the list callbacks in Disabled, read-only and invalid do. Function
props such as `filter`, label/value converters, equality comparators, `render`,
`className(state)` and `style(state)`, and refs or event handlers also need that
boundary. A Server Component can render one of these client compositions with
serializable data props. The site's preview shell is not consumer setup;
hydrated filtering, selection and dismissal require JavaScript.

`ComboboxInput` includes the input-group frame, native input, optional trigger
and optional clear control. Name the input with a visible associated label or
`aria-label`; name a separate trigger too. `ComboboxContent` includes the portal,
positioner and popup; compose `ComboboxEmpty` and `ComboboxList` inside it.
The default placement is bottom/start with a side offset of 6. Base UI handles
collision fallback, highlighting, keyboard navigation and dismissal. The list
scrolls within the available popup height. On narrow screens, prefer top/bottom
placement: the default minimum popup width can override the available width in
inline-side layouts. If using inline sides, explicitly reduce the content's
minimum width and verify the result. In a multiple-value composition, use
an array selection, render chips with `ComboboxValue`, attach
`useComboboxAnchor` to `ComboboxChips`, and pass the same ref to the content.
Hiding chip remove buttons does not prevent Backspace removal; use root
`readOnly` when changes must be forbidden.

The caller owns the catalogue, selected `value`, input query and `open` state
when controlled, labels, validation, error text, submission and remote results.
Pass `items` for the render-function lists shown here; `defaultValue` initializes
an uncontrolled selection. Object values use `itemToStringLabel`,
`itemToStringValue` and a stable identity or `isItemEqualToValue` comparator.
For externally filtered results, pass `filter={null}` and keep cancellation,
loading/error feedback and result ordering in the caller. `ComboboxEmpty`
represents no matches, not a pending request.

`name` supplies the selected value to native FormData; multiple selections
produce repeated entries. Typing a query alone does not commit a selection.
`required` enables native constraint validation, `disabled` prevents editing and
omits the value from FormData, and `readOnly` preserves the selection while still
allowing the popup to be browsed. Supply `aria-invalid` on the input and associate
caller-owned error text. Controlled values and submission uses `noValidate` and
only records the submission in local state. No validation or form-state package
is needed.

## Usage

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
export function FrameworkPicker() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput aria-label="Framework" placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
```

`items` is the catalogue. Typing filters it; selection commits a catalogue value.

## Groups and separators

Pass each group its own items so filtering can remove empty groups. Collection renders the filtered children; the separator belongs between the two catalogues, not between every row.

<ComponentExample name="groups" />

```tsx
"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/cadence/combobox";

export function GroupedPicker() {
  const groups = [
    { value: "Frontend", items: ["React", "Vue", "Svelte"] },
    { value: "Backend", items: ["Go", "Rust", "Elixir"] },
  ];
  return (
    <Combobox items={groups}>
      <ComboboxInput className="w-56 max-w-full" aria-label="Stack" placeholder="Choose a stack" />
      <ComboboxContent>
        <ComboboxEmpty>No stack found.</ComboboxEmpty>
        <ComboboxList>
          {(group: (typeof groups)[number], index: number) => (
            <React.Fragment key={group.value}>
              {index > 0 && <ComboboxSeparator />}
              <ComboboxGroup items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            </React.Fragment>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
```

## Clear and trigger controls

The four fixed fields compare both flags independently. Clear removes a selected value; its presence hides the built-in chevron. Hiding the trigger does not disable keyboard opening or turn Enter into form submission.

<ComponentExample name="controls" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerControls() {
  return (
    <div className="flex flex-wrap gap-4">
      {[
        { label: "Trigger only", showTrigger: true, showClear: false },
        { label: "Clear and trigger", showTrigger: true, showClear: true },
        { label: "Clear only", showTrigger: false, showClear: true },
        { label: "Input only", showTrigger: false, showClear: false },
      ].map((props) => (
        <Combobox key={props.label} items={frameworks} defaultValue="Astro">
          <ComboboxInput
            className="w-48 max-w-full"
            aria-label={props.label}
            showTrigger={props.showTrigger}
            showClear={props.showClear}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}
```

## Multiple values

Each editor owns its selection and anchor. The first allows chip removal; the second hides remove buttons with showRemove=false. This is an affordance choice: Backspace can still remove a value. Use readOnly on the root when editing must be forbidden.

<ComponentExample name="multiple" />

```tsx
"use client";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/cadence/combobox";

function TopicEditor({ removable }: { removable: boolean }) {
  const anchor = useComboboxAnchor();
  const topics = ["Design", "Docs", "Testing", "Release"];
  return (
    <Combobox multiple items={topics} defaultValue={["Design", "Docs"]}>
      <ComboboxChips ref={anchor} className="w-64 max-w-full">
        <ComboboxValue>
          {(value: string[]) => (
            <>
              {value.map((topic) => (
                <ComboboxChip key={topic} showRemove={removable}>
                  {topic}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label={removable ? "Editable topics" : "Topics without remove buttons"}
                placeholder="Add topic"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No topic found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
export function TopicPickers() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <TopicEditor removable />
      <TopicEditor removable={false} />
    </div>
  );
}
```

## Disabled, read-only and invalid

Disabled fields cannot be edited or opened. Read-only keeps a selected value available for focus and submission; the popup can still be opened and browsed, but choosing another row does not change that value. The caller supplies the invalid attribute and associated error; an unavailable item stays visible but cannot be selected.

<ComponentExample name="states" />

```tsx
"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerStates() {
  const error = React.useId();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Combobox items={frameworks} disabled defaultValue="Remix">
        <ComboboxInput className="w-48 max-w-full" disabled aria-label="Disabled framework" />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <Combobox items={frameworks} readOnly defaultValue="Astro">
        <ComboboxInput className="w-48 max-w-full" aria-label="Read-only framework" />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <div className="grid gap-2">
        <Combobox items={frameworks}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label="Required framework"
            aria-invalid="true"
            aria-describedby={error}
            placeholder="Choose an available framework"
          />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item} disabled={item === "Nuxt.js"}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p id={error} className="text-sm text-destructive">
          Choose an available framework.
        </p>
      </div>
    </div>
  );
}
```

## Controlled values and submission

The caller owns the selected value, input query, open state and submitted result. Use the external action to set Astro, then edit independently. The native FormData entry comes from name; typing a query alone does not commit it as a selection. This example uses noValidate so validation remains with the caller.

<ComponentExample name="controlled" />

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/cadence/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function ControlledPicker() {
  const [value, setValue] = React.useState<string | null>("Remix");
  const [query, setQuery] = React.useState("Remix");
  const [open, setOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState("Not submitted");
  return (
    <form
      noValidate
      className="grid justify-items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get("framework") ?? ""));
      }}
    >
      <Combobox
        items={frameworks}
        name="framework"
        value={value}
        onValueChange={setValue}
        inputValue={query}
        onInputValueChange={setQuery}
        open={open}
        onOpenChange={setOpen}
      >
        <ComboboxInput className="w-56 max-w-full" aria-label="Controlled framework" showClear />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValue("Astro");
            setQuery("Astro");
          }}
        >
          Set Astro externally
        </Button>
        <Button type="submit">Submit selection</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Selected: {value ?? "none"}; submitted: {submitted}
      </p>
    </form>
  );
}
```

## Object values

Convert object labels and submitted values explicitly. Compare stable ids when an application recreates option objects; object identity need not be the selection identity.

<ComponentExample name="objects" />

```tsx
"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

export function ObjectPicker() {
  const people = [
    { id: "ada", name: "Ada Lovelace" },
    { id: "grace", name: "Grace Hopper" },
    { id: "margaret", name: "Margaret Hamilton" },
  ];
  const [value, setValue] = React.useState<(typeof people)[number] | null>({ id: "ada", name: "Ada Lovelace" });
  return (
    <div className="grid gap-3">
      <Combobox
        items={people}
        value={value}
        onValueChange={setValue}
        itemToStringLabel={(person) => person.name}
        itemToStringValue={(person) => person.id}
        isItemEqualToValue={(a, b) => a.id === b.id}
      >
        <ComboboxInput className="w-64 max-w-full" aria-label="Assignee" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No person found.</ComboboxEmpty>
          <ComboboxList>
            {(person: (typeof people)[number]) => (
              <ComboboxItem key={person.id} value={person}>
                {person.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p role="status" className="text-sm text-muted-foreground">
        Assignee id: {value?.id ?? "none"}
      </p>
    </div>
  );
}
```

## Caller-owned results

The caller filters this local catalogue asynchronously and passes filter=null to avoid a second client filter. The microtask stands in for an application search function, not a network request. Replace it with your own service; keep cancellation, pending/error feedback and result ordering in the caller. Cleanup rejects stale completions; an empty result and a pending request are different states.

<ComponentExample name="results" />

```tsx
"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

export function ResultPicker() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<string[]>(["London", "Paris", "Tokyo"]);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    setPending(true);
    Promise.resolve(
      ["London", "Paris", "Tokyo"].filter((city) => city.toLowerCase().includes(query.toLowerCase())),
    ).then((next) => {
      if (active) {
        setResults(next);
        setPending(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);
  return (
    <div className="grid gap-2">
      <Combobox items={results} filter={null} onInputValueChange={setQuery}>
        <ComboboxInput className="w-56 max-w-full" aria-label="City" placeholder="Search a city" />
        <ComboboxContent>
          {pending ? (
            <p role="status" className="p-2 text-sm">
              Searching cities…
            </p>
          ) : (
            <ComboboxEmpty>No city found.</ComboboxEmpty>
          )}
          <ComboboxList>
            {(city: string) => (
              <ComboboxItem key={city} value={city}>
                {city}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p role="status" className="text-sm text-muted-foreground">
        {pending ? "Searching" : `${results.length} cities returned`}
      </p>
    </div>
  );
}
```

## Highlight and loop boundaries

Compare the default manual highlight and wrapping navigation with autoHighlight and loopFocus=false. Filtering updates rows immediately; autoHighlight chooses a highlighted suggestion, while Enter commits it. Moving the highlight alone does not change the selected value.

<ComponentExample name="highlight" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function HighlightPickers() {
  return (
    <div className="flex flex-wrap gap-4">
      {[false, true].map((automatic) => (
        <Combobox key={String(automatic)} items={frameworks} autoHighlight={automatic} loopFocus={!automatic}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label={automatic ? "Automatic bounded highlight" : "Manual looping highlight"}
            placeholder={automatic ? "Automatic, bounded" : "Manual, looping"}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}
```

## Physical sides

These fixed fields request top, bottom, left and right independently. Base UI can flip or shift a popup to keep it inside the viewport; a requested side is not a guarantee on narrow screens.

<ComponentExample name="sides" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerSides() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Picker key={side} label={`Side ${side}`} side={side} />
      ))}
    </div>
  );
}
```

## Alignment

Start, center and end align the popup against the field. The single-value popup is anchored to the native input, with a minimum width 28px larger than that input (not the surrounding input-group frame). This makes the three alignments visible. Chips use the container width instead.

<ComponentExample name="alignments" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerAlignments() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["start", "center", "end"] as const).map((align) => (
        <Picker key={align} label={`Align ${align}`} align={align} />
      ))}
    </div>
  );
}
```

## Logical sides

Logical inline-start and inline-end follow the reading direction. This fixed RTL scope supplies both Base UI direction and the DOM dir attribute; the rest of the page stays independent.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function LogicalPickers() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-4">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Picker key={side} label={`RTL ${side}`} side={side} />
        ))}
      </div>
    </DirectionProvider>
  );
}
```

## Modal and non-modal fields

The default modal=false permits outside pointer interaction. modal=true limits outside interaction while open and locks desktop document scrolling. Both use the same typeable input and native Tab dismissal; modal does not turn a combobox into a dialog.

<ComponentExample name="modality" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerModality() {
  return (
    <div className="flex flex-wrap gap-4">
      {[false, true].map((modal) => (
        <Combobox key={String(modal)} items={frameworks} modal={modal}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label={modal ? "Modal framework" : "Non-modal framework"}
            placeholder={modal ? "Modal" : "Non-modal"}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}
```

## Separate trigger

A separate named ComboboxTrigger can open the same input. Hide the built-in chevron to avoid duplicating it. This is still a typeable field; the button does not replace the input or its accessible name.

<ComponentExample name="custom-trigger" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function _Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function SeparateTrigger() {
  return (
    <Combobox items={frameworks}>
      <div className="flex items-center gap-2">
        <ComboboxInput
          className="w-48 max-w-full"
          aria-label="Separate-trigger framework"
          showTrigger={false}
          placeholder="Choose a framework"
        />
        <ComboboxTrigger aria-label="Browse frameworks" />
      </div>
      <ComboboxContent>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}
```

## Without motion

The first fixed provider disables panel and indicator motion from the first mounted frame. The nested full provider restores its local clock, subject to the system reduced-motion preference. Ordinary examples inherit the site header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";
import { CadenceProvider } from "@/components/cadence/lib/provider";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

export function PickerMotion() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <Picker label="Instant framework" />
        <CadenceProvider mode="full">
          <Picker label="Nested full framework" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- Choosing one value from a list too long to scan: countries, assignees, repositories.
- A search field that filters a catalogue while keeping typed queries separate from committed values.
- Several values from the same catalogue, where each choice should stay visible as a chip.
- A picker whose options arrive from a search endpoint rather than from a constant.

## When not to use

- Fewer than about eight fixed options. Use `select`; a popup that has to be opened to show three items is
  slower than three radios.
- Commands rather than values — navigation, actions, "go to file". Use `command`.
- Free text with no catalogue behind it. Use `input`.
- A control that must not accept typing, such as a language picker in a settings form. Use `select`.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Combobox` | `items`, `value`, `defaultValue`, `onValueChange`, `multiple`, `disabled`, `name`, `required`, `onInputValueChange`, `itemToStringLabel` | Base UI root. `items` drives what the popup filters and what the render callbacks receive. |
| `ComboboxInput` | `showTrigger` (`true`), `showClear` (`false`), `disabled`, native input props | The field: a bare input inside an input-group frame, with the chevron and the optional clear button. |
| `ComboboxTrigger` | native button props | The chevron on its own, for a field built by hand. |
| `ComboboxValue` | render callback or children | The selected label; in the chips layout it renders the chips. |
| `ComboboxContent` | `side` (`"bottom"`), `sideOffset` (`6`), `align` (`"start"`), `alignOffset` (`0`), `anchor` | Portals, positions, and sizes to `--anchor-width`. |
| `ComboboxList` | children or render function `(item, index) => ReactNode` | Scrolls, and takes the height the popup has left. |
| `ComboboxItem` | `value`, `disabled` | Renders the label and the tick. |
| `ComboboxGroup` / `ComboboxLabel` | `items` on the group | Structural; the group's `items` let filtering drop it whole. |
| `ComboboxEmpty` | children | Shown when the filter matches nothing. |
| `ComboboxSeparator` | separator props | A hairline between unrelated groups. |
| `ComboboxChips` / `ComboboxChip` / `ComboboxChipsInput` | `showRemove` (`true`) on the chip | The multi-value layout. |
| `ComboboxCollection` | collection props | Escape hatch for virtualised lists. |
| `useComboboxAnchor` | – | A ref to anchor the popup to the chips frame. |

`ComboboxClear` is internal on purpose: it belongs to `ComboboxInput`'s layout, and a component that owns
an undo affordance should not also hand out half of one.

## Motion contract

Authored intensity is **medium**: Combobox opens and closes its existing popup surface; content and native focus retain their current owners.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| open | popup `opacity` 0→1, `scale` `--motion-scale-in`→1 | `popup.anchored/css-transition` | yes: a CSS transition, so reopening reverses it |
| close | popup `opacity` 1→0, `scale` 1→`--motion-scale-in` | `exit.fade/css-transition` | yes |
| select | tick `scale` `0.96`→1, `opacity` 0→1 | `state.morph/one-shot` | yes: a spring, retargeted from the current value |
| filter | none — rows are replaced, not moved | – | – |
| reduced | popup and tick fade without scaling; tick stays at full size | – | – |
| none | every duration is zero | – | – |

The scale grows out of `--transform-origin`, which Base UI writes from the positioner, so the panel opens
from the field rather than from its own centre. The list itself never animates: a filter runs on every
keystroke, and a row that is still travelling when the next character arrives is a list the reader has to
chase.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. Ordinary examples inherit the site header on the same component tree; the named Without motion example demonstrates explicit local overrides. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive. Base UI 1.9's typeable focus manager hides background
nodes from assistive technology while leaving their tab stops enabled. Cadence adds native
temporary negative tab indices only to newly hidden focus stops, preserving outside pointer activation; Tab releases them before normal focus navigation and
Base UI's blur dismissal. Existing hidden/inert nodes and parent dialogs keep their owners; cleanup preserves caller tabindex changes. `ComboboxInput` string classes style the field frame;
state callback classes style the native input with its real Base UI input state.

## Keyboard interactions

- `ArrowDown` or `Alt+ArrowDown` opens the popup; with it open, `ArrowDown`/`ArrowUp` move the highlight.
- Typing filters the list. `autoHighlight` (default `false`) optionally highlights the first match.
- `Enter` selects the highlighted item and closes the popup.
- With the popup open, `Escape` dismisses it. With it already closed, `Escape` clears the query and selected values.
- `Tab` closes the popup and moves focus to the next control.
- `Backspace` in the chips layout deletes the last chip when the input is empty.

## Accessibility

- Base UI renders the input as a `combobox` with `aria-expanded`, `aria-controls`, and
  `aria-activedescendant`, and the list as a `listbox` whose rows are `option`s.
- Name the field: `aria-label` on `ComboboxInput`, or a `Field`/`Label` pair around it. The placeholder is
  not a name.
- The selected row keeps `aria-selected="true"`; the tick is a visual duplicate, never the only signal.
- The empty state is a sibling of the list inside the popup; it is readable feedback, not a selectable option.
- Under reduced motion nothing is conveyed by the panel's scale: the list is there, the tick is at full
  size, and `aria-selected` carries the state.

## Validation and data ownership

The caller owns selection values, validation, error text, submission and any remote
loading/filtering. Render supplied aria-invalid/data-invalid and associate described
errors; this component does not validate or install a form-state library.

## Responsive behavior

The single-value popup anchors to the native input, not the input-group frame, and has a minimum width
`--spacing(7)` larger than that input. Its maximum width follows available space, but the minimum can
override it in narrow inline-side placements and let the popup extend outside the viewport. Prefer
top/bottom placement there, or explicitly reduce the content's minimum width and check the result. It flips above the field near the viewport edge, and the list — not the
popup — scrolls inside `--available-height`. In the chips layout the frame wraps to a second line instead
of scrolling horizontally, and the popup widens to the chips container.

## Performance

- One CSS transition on `opacity` and `scale` per open and per close; no JS animation loop, and no layout
  read.
- Each mounted row keeps its indicator and uses the token spring for selection changes. Filtering replaces
  rendered rows immediately instead of animating the list layout.
- The filter is synchronous over whatever `items` holds; a remote list is a debounce in the caller, not a
  behaviour of this component.
- Budget: T2 (10 KB gzip).

## Notes for AI

- Always pass `items` to `Combobox`; it drives filtering and is what the `ComboboxList` render callback
  receives. Without it the list renders nothing.
- Use `value`/`onValueChange` for a controlled picker, `defaultValue` otherwise — same contract as `select`.
- `multiple` requires the chips layout; do not pair `multiple` with a plain `ComboboxInput`.
- Do not add a "loading" prop: async feedback is the caller's state, and `ComboboxEmpty` is for an empty
  result, not for a pending one.
- For invalid state pass `aria-invalid` on `ComboboxInput`; the frame styles the border and the ring from
  the attribute.

---

Full index: https://cadence.dev/llms.txt
