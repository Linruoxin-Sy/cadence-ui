# Button Group

> Toolbars and related actions on the same object.

- Registry item: https://cadence.dev/r/button-group.json
- Install: `npx shadcn@latest add @cadence/button-group`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, exit.fade, layout.move, geometry.resize, state.color, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/button-group
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/separator](https://cadence.dev/r/separator.json) — direct registry dependency.
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
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| separator | `@components/cadence/lib/separator-layout.ts` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| button-group | `@components/cadence/button-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/button-group.json) |
| button-group | `@components/cadence/lib/button-group-layout.ts` | [JSON files[].content](https://cadence.dev/r/button-group.json) |
| button-group | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/button-group.json) |
| button-group | `@components/cadence/lib/kbd-layout.ts` | [JSON files[].content](https://cadence.dev/r/button-group.json) |
| button-group | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/button-group.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: separator](https://cadence.dev/r/separator.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: button-group](https://cadence.dev/r/button-group.json)

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

Copy the complete manual file list at its listed relative paths. Button Group includes shared
presence, geometry, text, numeric and colour controllers, and imports Separator even when
`ButtonGroupSeparator` is omitted. Separator retains its own rule owner. The optional provider
controls modes and clocks. Keep the source files'
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
including its motion and provider helpers, into the same relative tree. Button retains its own
press, colour, plain-label and quantity feedback. The group consumes the same geometry cause once
and moves a separate segment layer; it introduces no selection state or shared highlight.

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

## Changing joined actions

Stable keys keep existing controls and their native refs intact when a middle action arrives or leaves.
Save changes only its owned label; More/ Less changes membership; Copy increments the directly owned
page quantity. The output's native live region announces the final value immediately.

<ComponentExample name="changing" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ButtonGroup, ButtonGroupText } from "@/components/cadence/button-group";

export function ChangingActions() {
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pages, setPages] = useState(99);
  return (
    <ButtonGroup aria-label="Document actions" style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
      <Button key="save" variant="outline" size="sm" onClick={() => setSaved(value => !value)}>
        {saved ? "Saved" : "Save"}
      </Button>
      {more && <Button key="duplicate" variant="outline" size="sm" onClick={() => setPages(value => value + 1)}>Copy</Button>}
      <ButtonGroupText key="pages" render={<output aria-label="Pages" aria-live="polite" />} className="px-2">{pages}</ButtonGroupText>
      <ButtonGroupText key="status" render={<output aria-label="Document status" />} className="px-2">{saved ? "Saved" : "Ready"}</ButtonGroupText>
      <Button key="more" variant="outline" size="sm" onClick={() => setMore(value => !value)}>{more ? "Less" : "More"}</Button>
    </ButtonGroup>
  );
}
```

This motion specimen uses the verified Courier New / normal feature configuration. Components keep
caller typography; unknown font features use the native immediate text/number fallback.
Direct strings use changed-run text; direct numbers are quantities with compact reels. Mixed JSX,
including `{zoom}%` in the zoom examples, retains its caller-owned structure. Native render elements
such as this output keep their actual host. Render callbacks, editable content and unknown member
layouts keep immediate native presentation.

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
| `ButtonGroupText`       | `render`, native div      | Label/readout; direct strings and quantities enhance their retained native host. |
| `ButtonGroupSeparator`  | `Separator` props         | Vertical by default; `self-stretch`, `bg-input`.               |
| `buttonGroupVariants`   | `orientation`             | Exported for composing a custom group root.                    |

Joining applies to direct controls and internal safe segment layers. Control `data-slot` values,
native refs and events stay on their original hosts. Stable React keys enable membership/reorder
motion. Rich/render-callback controls, native editors and unknown layouts keep native structure
and immediate collection geometry. No toolbar arrow-key model is added.

`ButtonGroupSeparator` accepts Base state callbacks for `className` and `style`, merged after defaults. `ButtonGroupText` uses native string classes and style objects.

## Motion contract

Authored intensity is **medium**: A single joined-group destination coordinates segment opacity, compact reflow, changed labels and quantity reels without selection state or duplicate child press feedback.

T0 remains the historical source/profile category.

| Recipe / form | Properties | Preset | Interruptible |
| --- | --- | --- | --- |
| `data.transition/one-shot` | Independent group/new segment opacity; inherited rule entry/orientation replacement | `presence.inline` | Yes; initial SSR/hydration stays visible |
| `exit.fade/one-shot` | Paint-only removed segment opacity; inherited rule exit | `presence.exit` | Yes; the removed control unregisters immediately |
| `layout.move/one-shot` | Stable keyed segment-layer position on the orientation axis | `layout.compact` | Yes; independent of child press |
| `geometry.resize/measured` | One bounded natural group axis; inherited definite rule length | `geometry.compact` | Yes; no chasing child spring frames |
| `state.color/css-transition` | Text surface, border, shadow and foreground; inherited rule background | `state.color` | Yes; unknown/unreadable paint paths stay immediate |
| `text.change/changed-runs` | Only changed runs in direct plain ButtonGroupText | `text.replace`, stagger none | Yes; retained text stays retained |
| `number.roll/reels` | Direct numeric quantities in ButtonGroupText | `number.compact` | Yes; exact semantic value commits immediately |
| reduced | Short eligible segment/text opacity and colour; immediate layout and quantities | Reduced policy | Active spatial work cancels |
| none / zero clock | Current content and native geometry immediately; zero presentation delay | Immediate policy | Existing one-shot writers cancel |

An independent group entrance includes its initial controls once. Composed Button and Separator
retain their own later actions and mode scopes. Removed controls leave their tab, form and ref
registrations immediately; only a bounded inert plain-text visual may finish its exit. Unavailable
identities/layers, clipping, native size engines and dependent geometry use the affected immediate
fallback. Parent removal cancels subordinate work. Ordinary focused controls can follow safe member
layers; focused/composing editors and captured pointers settle affected geometry without replay on
blur/release. Orientation and responsive reflow commit natively.

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

SSR, first hydration and no-JavaScript markup expose final content; hydrated state changes use
the shared controllers. Automatic collection work is bounded before member measurement, includes
retained outgoing visuals and the group shell, and keeps only the latest target. Rich content,
editing and dependent geometry preserve native layout rather than measurement clones.

The historical T0 4 KiB own-source comparison, shared runtime/page costs, CLS and device FPS remain
advisory/deferred under ADR-023. Functional migration does not establish performance acceptance.
Composed controls retain their own dependencies; complete installation files are required.

## Notes for AI

- Use `ButtonGroup` for actions on one object, `toggle-group` for a value the form
  reads. They look alike and behave differently.
- Do not add gaps between children: the rounded/border collapse is what makes the
  group read as one control.
- `ButtonGroupSeparator` is already `self-stretch`; do not set a height.

---

Full index: https://cadence.dev/llms.txt
