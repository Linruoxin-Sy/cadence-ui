# Label

> Naming inputs, selects, and other form controls.

- Registry item: https://cadence.dev/r/label.json
- Install: `npx shadcn@latest add @cadence/label`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, geometry.resize, state.color, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/label
```

The Usage and Disabled examples also use [Input](/components/input). Install it when
copying those examples:

```install
npx shadcn@latest add @cadence/input
```

To reproduce the styled checkboxes in the top preview, also install
[Checkbox](/components/checkbox):

```install
npx shadcn@latest add @cadence/checkbox
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.

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
| label | `@components/cadence/label/index.tsx` | [JSON files[].content](https://cadence.dev/r/label.json) |
| label | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/label.json) |
| label | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/label.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: label](https://cadence.dev/r/label.json)

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

Install the complete listed closure and shared Cadence theme. The optional CadenceProvider
controls mode and clock; without it, Label follows system preference. Keep the listed
relative paths so copied helpers resolve. Associate the label with a control using
`htmlFor` and a matching `id`, or wrap the control as shown below.

For Usage and Disabled, also copy [Input's source file](https://cadence.dev/r/input.json)
to `@components/cadence/input/index.tsx` and install its additional package:

```package-manager
npm install @base-ui/react
```

The top preview's styled checkboxes require
[Checkbox's installation](/components/checkbox#installation) and its own dependencies and
motion setup. Input and Checkbox are example dependencies, not dependencies of Label.
The Wrapping example uses a native checkbox and needs no additional dependencies.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function EmailField() {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input id={id} type="email" autoComplete="email" />
    </div>
  );
}
```

## Wrapping instead of `htmlFor`

Either association works: `htmlFor` + `id`, or wrapping the control. Pick one per
field and keep it consistent.
This example wraps a native checkbox and needs no `id` or `htmlFor`. Clicking the
words toggles that checkbox; it does not affect the separate checkbox above.

<ComponentExample name="wrapping" />

```tsx
import { Label } from "@/components/cadence/label";

export function WrappedPreference() {
  return (
    <Label>
      <input type="checkbox" defaultChecked />
      Email me about releases
    </Label>
  );
}
```

## Disabled

The label follows the control without any prop: `peer-disabled:` handles a sibling
control placed before the label; `group-data-[disabled=true]:` handles a disabled group.
These two arrangements show both relationships. Set `disabled` on the actual
control; styling a label never disables an input. `useId` keeps repeated fields independent.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function DisabledFields() {
  const id = useId();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="group grid w-56 gap-2" data-disabled="true">
        <Label htmlFor={`${id}-slug`}>Slug</Label>
        <Input id={`${id}-slug`} disabled defaultValue="cadence" />
      </div>
      <div className="grid w-56 gap-2">
        <Input id={`${id}-workspace`} className="peer" disabled defaultValue="Cadence UI" />
        <Label htmlFor={`${id}-workspace`}>Workspace</Label>
      </div>
    </div>
  );
}
```

## Changing names and quantities

The control keeps its value, focus and selection when its label changes. Direct strings
replace only changed text. A direct number declares a display quantity and rolls changed
places; identifiers such as `"007"` stay strings. Rich labels, links and required markers
retain their native structure. Changing the name never delays its accessible value.

<ComponentExample name="changing" />

```tsx
"use client";

import { useId, useState } from "react";
import { Label } from "@/components/cadence/label";

export function ChangingName() {
  const id = useId();
  const [work, setWork] = useState(false);
  return (
    <div className="grid gap-3">
      <button type="button" onClick={() => setWork((value) => !value)}>Rename field</button>
      <Label htmlFor={id}>{work ? "Work email address" : "Email address"}</Label>
      <input id={id} type="email" defaultValue="ada@example.com" />
    </div>
  );
}
```

## When to use

- Every input, textarea, select, checkbox, radio, switch, and slider that needs a
  visible name.
- A group of controls that share one caption.
- A field whose purpose is not obvious from the placeholder alone (which is
  almost every field).

## When not to use

- As a placeholder. A placeholder disappears on the first keystroke and is not a
  name; use a real `Label`.
- As a heading. If the text introduces a section, use a heading so it appears in
  the document outline.
- For helper text or error text; those belong in the description/error slot so
  they can be wired through `aria-describedby`.

## API

| Prop        | Type              | Default | Description                          |
| ----------- | ----------------- | ------- | ------------------------------------ |
| `htmlFor`   | `string`          | –       | Id of the control this label names.  |
| `className` | `string`          | –       | Merged last.                         |

All native `label` props are forwarded.

## Motion contract

Authored intensity is **subtle**: Local opacity, changed name runs, compact quantity reels and readable intrinsic sizing preserve the native label association.
Initial SSR and hydration remain visible.

| Recipe | Owner and full behaviour | reduced | none |
| ------ | ------------------------ | ------- | ---- |
| `data.transition/one-shot` | Independent later insertion; root opacity only. A presenting parent consumes its initial child entrance. | Short opacity. | Immediate. |
| `geometry.resize/measured` | Measured intrinsic width and destination-width block size; a coordinating parent consumes the child axes. Passive reflow and unsafe/clipped growth stay immediate. | Native size immediately. | Native size immediately. |
| `state.color/css-transition` | Scoped foreground only. Verified readable neutral paths may transition; actual DOM focus-within or invalid state makes paint immediate. Unknown palettes and an inherited colour owner remain immediate. | Short eligible colour. | Zero duration and delay. |
| `text.change/changed-runs` | Direct strings replace changed graphemes with no stagger; native label/Text and unchanged content survive. Rich descendants remain native. | Short changed-only opacity, no travel. | Exact text immediately. |
| `number.roll/reels` | Direct quantities roll changed decimal places using exact React output. Strings remain text. Unsupported notation remains exact and immediate. | Final value immediately. | Final value immediately. |

Rapid revisions converge on the latest value. Live mode downgrade and zero clock cancel
active writers. Parent removal owns retention; Label creates no second activation target.
An external `htmlFor` control's focus does not create DOM focus-within on the label.
There is no floating label or input event handler.

## Accessibility

- Renders a native `<label>`; clicking it focuses the control with no JavaScript.
- The accessible name comes from the label's text, so never hide it with
  `display: none`. If the design needs a hidden label, use `sr-only`, not removal.
- `htmlFor` must point at an `id` that exists in the same document. Duplicate ids
  break the association silently.

## Responsiveness and performance

Labels use flex layout and inherit their available width. Keep long labels readable beside controls;
the caller owns stacking and responsive field layout.

Label uses the shared motion, text/number, colour and optional measurement runtime.
One primitive display is enhanced; mixed rich content and unknown typography retain native
paint without changing caller font features. Labels rewrap at final width, and growth that
could hide the name settles immediately. A native label/control association works without
JavaScript; application rename controls need hydration. The historical T0 4 KiB gzip source
reference excludes dependencies and remains advisory under ADR-023. Functional migration
does not certify page cost, device FPS or performance governance.

## Notes for AI

- One label per control. Do not add `aria-label` on the control as well; two names
  fight, and the visible one wins in some browsers and loses in others.
- Keep the label short and noun-shaped ("Email", "Workspace name"), and put the
  explanation in the description slot.

---

Full index: https://cadence.dev/llms.txt
