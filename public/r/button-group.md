# Button Group

> Toolbars and related actions on the same object.

- Registry item: https://cadence.dev/r/button-group.json
- Install: `npx shadcn@latest add @cadence/button-group`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/button-group
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/separator](https://cadence.dev/r/separator.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| button-group | `@components/cadence/button-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/button-group.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: separator](https://cadence.dev/r/separator.json)

[Source files: button-group](https://cadence.dev/r/button-group.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Keep `button-group/index.tsx`, `separator/index.tsx` and `lib/cn.ts` at the
listed relative paths. Button Group imports Separator even when you do not
render `ButtonGroupSeparator`; both components share the `cn` helper.
Button Group and Separator are static T0 components in full, reduced and none
modes; no motion runtime, provider or additional item-specific CSS is required
beyond the base theme and Tailwind utilities. Keep their source files'
`"use client"` directives. In Next.js App Router, a Server Component can render
these client parts with serializable props. Calling the exported
`buttonGroupVariants` function belongs in a `"use client"` module.

Usage, Vertical, “Static text inside the group”, “A rule between two controls”,
and the top preview also use [Button](/components/button). Install it when
keeping those compositions:

```install
npx shadcn@latest add @cadence/button
```

For manual installation, follow Button's Manual tab and copy every listed file,
including its motion and provider helpers, into the same relative tree. Button
adds `motion` to the package list above; its provider files are required imports,
while wrapping the application is optional. Button's press scale plays only in
full mode and is dropped in reduced and none. The group adds no animation.

Usage, Vertical and the top preview also use `lucide-react` for their plus/minus
icons. Install it when keeping those icons; Button Group and Button themselves
do not require an icon package:

```package-manager
npm install lucide-react
```

Keep Usage, Vertical and the top preview's existing `"use client"` boundaries
for their state and event handlers. Put “Static text inside the group” and
“A rule between two controls” in a `"use client"` module too: they call
`buttonVariants()` from Button's client module, even though their links retain
native navigation. The caller owns the zoom value, limits and actions; Button
Group supplies grouping and layout, without a toolbar arrow-key model.

## Usage

```tsx
"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { ButtonGroup, ButtonGroupText } from "@/components/cadence/button-group";

export function ZoomControls() {
  const [zoom, setZoom] = useState(100);
  return (
    <ButtonGroup aria-label="Zoom">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom out"
        onClick={() => setZoom((value) => Math.max(25, value - 25))}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <ButtonGroupText render={<output aria-live="polite" />}>{zoom}%</ButtonGroupText>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom in"
        onClick={() => setZoom((value) => Math.min(200, value + 25))}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}
```

## Vertical

The vertical group stacks controls and keeps only the outer corners rounded. It does not create a toolbar keyboard model: Tab still follows DOM order. This zoom value is owned by this instance.

<ComponentExample name="vertical" />

```tsx
"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";
import { ButtonGroup, ButtonGroupText } from "@/components/cadence/button-group";

export function VerticalControls() {
  const [zoom, setZoom] = useState(100);
  return (
    <ButtonGroup orientation="vertical" aria-label="Vertical zoom" className="w-16 [&>*]:w-full">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom out"
        onClick={() => setZoom((value) => Math.max(25, value - 25))}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <ButtonGroupText render={<output aria-live="polite" />}>{zoom}%</ButtonGroupText>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Zoom in"
        onClick={() => setZoom((value) => Math.min(200, value + 25))}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}
```

## Static text inside the group

ButtonGroupText joins a non-interactive label or readout to controls. `render` changes its element without extra wrappers. This label is a span, and the adjacent link opens the actual registry guide.

<ComponentExample name="static-text" />

```tsx
import { buttonVariants } from "@/components/cadence/button";
import { ButtonGroup, ButtonGroupText } from "@/components/cadence/button-group";

export function GroupWithText() {
  return (
    <ButtonGroup aria-label="Registry reference">
      <ButtonGroupText render={<span />}>Guide</ButtonGroupText>
      <a className={buttonVariants({ variant: "outline", size: "sm" })} href="/docs/registry">
        Registry
      </a>
    </ButtonGroup>
  );
}
```

## A rule between two controls

Specify the separator orientation separately from the group: a horizontal group needs a vertical rule; a vertical group needs a horizontal rule. Each separator stretches across the group, and the real navigation links keep their native link semantics.

<ComponentExample name="separator" />

```tsx
import { buttonVariants } from "@/components/cadence/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/cadence/button-group";

export function GroupRules() {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <ButtonGroup aria-label="Setup guides">
        <a className={buttonVariants({ size: "sm" })} href="/docs/installation">
          Install
        </a>
        <ButtonGroupSeparator />
        <a className={buttonVariants({ size: "sm" })} href="/docs/theming">
          Theme
        </a>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Motion guides">
        <a className={buttonVariants({ size: "sm" })} href="/docs/motion">
          Motion
        </a>
        <ButtonGroupSeparator orientation="horizontal" />
        <a className={buttonVariants({ size: "sm" })} href="/docs/motion-modes">
          Modes
        </a>
      </ButtonGroup>
    </div>
  );
}
```

## When to use

- Two to five controls that act on the same object: bold/italic/underline, cut/copy,
  approve/reject, a zoom stepper.
- A segmented control where the current option is a button state (`variant="default"`
  vs `"ghost"`), not a radio group.
- A label plus an action, where the label should read as part of the control — use
  `ButtonGroupText` for the static half.

## When not to use

- More than about five options. Beyond that the shape stops helping and a `select` or
  a menu is faster.
- Mutually exclusive choices that need arrow-key navigation and a form value. That is
  `toggle-group`, or a `radio-group` inside a `field`.
- A single button. The group adds nothing; use `button`.

## API

| Part                    | Props                     | Notes                                                          |
| ----------------------- | ------------------------- | -------------------------------------------------------------- |
| `ButtonGroup`           | `orientation`, native div | `horizontal \| vertical`; `role="group"`, `data-orientation`.  |
| `ButtonGroupText`       | `render`, native div      | Static label; swapped element via Base UI `render`.            |
| `ButtonGroupSeparator`  | `Separator` props         | Vertical by default; `self-stretch`, `bg-input`.               |
| `buttonGroupVariants`   | `orientation`             | Exported for composing a custom group root.                    |

The joining rules are `[&>*]` selectors, so any child that renders a `data-slot` — a
button, an input, a select trigger — participates without a prop.

`ButtonGroupSeparator` accepts Base state callbacks for `className` and `style`, merged after defaults. `ButtonGroupText` uses native string classes and style objects.

## Motion contract

No motion (T0). The group does not animate. Adjacent buttons share a border, and the
only depth cue is `focus-visible:relative` plus `z-10`, which lifts the focused
control above its neighbours so its ring is not clipped.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

The buttons inside keep their own press feedback; the group never adds a second
animation on top of it.

## Accessibility

- `role="group"` needs a name: pass `aria-label` (or `aria-labelledby`) when there is
  no visible heading. Without one, a screen reader says "group" and nothing else.
- Tab order follows DOM order, not visual order. In `vertical`, keep the DOM order the
  same as the visual stack.
- Icon-only buttons inside a group must each carry an `aria-label`; the group label
  does not name them.
- Do not mark the active segment with colour alone — use `aria-pressed` on a toggle
  button, or a `data-state` attribute your CSS keys off.

## Responsiveness and performance

Groups use intrinsic width and a caller-selected orientation; no breakpoint switches it
automatically. Stack or constrain long groups at the application level rather than hiding focused
controls.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Composed controls retain their own dependencies and motion
contracts. Server-rendered markup does not imply that every interaction works without JavaScript.
The registry enforces a 4 KiB gzip budget for this item's own shipped source; dependencies and
application bundles are measured separately.

## Notes for AI

- Use `ButtonGroup` for actions on one object, `toggle-group` for a value the form
  reads. They look alike and behave differently.
- Do not add gaps between children: the rounded/border collapse is what makes the
  group read as one control.
- `ButtonGroupSeparator` is already `self-stretch`; do not set a height.

---

Full index: https://cadence.dev/llms.txt
