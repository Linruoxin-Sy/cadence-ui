# Textarea

> Comments, descriptions, and other longer text.

- Registry item: https://cadence.dev/r/textarea.json
- Install: `npx shadcn@latest add @cadence/textarea`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, geometry.resize, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/textarea
```

Usage, the examples and the top preview also use [Label](/components/label). Install
it when copying those compositions:

```install
npx shadcn@latest add @cadence/label
```

The Controlled value and character count example also renders [Button](/components/button)
for its external action:

```install
npx shadcn@latest add @cadence/button
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.

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
| textarea | `@components/cadence/textarea/index.tsx` | [JSON files[].content](https://cadence.dev/r/textarea.json) |
| textarea | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/textarea.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: textarea](https://cadence.dev/r/textarea.json)

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

Textarea needs the files and packages listed above: the component, the shared library
files the registry installs with it, and the motion runtime they use. No additional
item-specific CSS is required. Keep `textarea/index.tsx` and the `lib/` files at the
listed relative paths so the shared imports resolve. Give the textarea an accessible
name with a label and matching `htmlFor` / `id` as shown in Usage. Content-driven growth
uses CSS `field-sizing: content` through Tailwind's `field-sizing-content` utility;
there is no JavaScript auto-grow fallback.

For the labelled compositions, follow [Label's installation](/components/label#installation)
and copy its component file alongside Textarea; the shared `lib/` files and their
packages are already included above. For the Controlled example's action, follow
[Button's installation](/components/button#installation), including its dependencies and
motion setup. Label and Button are example dependencies, not dependencies of Textarea.
Button is rendered only in Controlled; the unused `Button` and `useState` imports in the
other example snippets can be omitted. React's `useId` and `useState` need no additional
package beyond the React setup above.

## Usage

```tsx
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function Comment() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="comment">Comment</Label>
      <Textarea id="comment" rows={4} placeholder="Leave a note for the reviewer" />
    </div>
  );
}
```

## Auto-growing

`field-sizing-content` lets a supporting browser grow the box as you type. This example caps growth at `max-h-48`, then scrolls its contents. Growth keeps native ownership: there is no JavaScript resize fallback and no height transition behind the caret.

<ComponentExample name="auto-growing" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function GrowingTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Growing note</Label>
      <Textarea id={id} className="min-h-16 max-h-48" placeholder="Type another line…" />
    </div>
  );
}
```

## Resizable by the user

`field-sizing-fixed` opts out of content-driven sizing so the browser’s vertical resize handle controls the height. `resize-y` preserves the parent’s width; the minimum and maximum keep resizing bounded. Dragging the handle is a native interaction: the height follows the pointer with no easing.

<ComponentExample name="resizable" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function ResizableTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Resizable note</Label>
      <Textarea id={id} rows={3} className="field-sizing-fixed resize-y min-h-24 max-h-64" defaultValue="Drag the lower corner to make more room." />
    </div>
  );
}
```

## Explicit height revision

A caller-owned `rows` change is the one size change Cadence animates. Opting out of content sizing makes `rows` the author of the block, so switching the row count while the editor is unfocused interpolates the height once; typing, a focused editor and the browser's own resize handle stay immediate.

<ComponentExample name="rows-revision" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function RowsRevisionTextarea() {
  const id = useId();
  const [rows, setRows] = useState(3);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Review note</Label>
      <Textarea id={id} rows={rows} className="field-sizing-fixed" defaultValue={"Ready for review.\nSecond line."} />
      <Button variant="outline" onClick={() => setRows((current) => (current === 3 ? 7 : 3))}>
        {rows === 3 ? "Give me more room" : "Restore the shorter box"}
      </Button>
    </div>
  );
}
```

## Invalid

The caller supplies the invalid attribute and error text. Editing keeps the supplied error state until the caller changes it; Textarea does not evaluate the message.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function InvalidTextarea() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Biography</Label>
      <Textarea id={id} aria-invalid="true" aria-describedby={`${id}-error`} defaultValue="I build design systems that…" />
      <p id={`${id}-error`} className="text-sm text-destructive">Keep it under 280 characters.</p>
    </div>
  );
}
```

## Disabled and read-only

Disabled fields cannot be edited or focused and are omitted from native form submission. Read-only text stays focusable and selectable and remains part of submission.

<ComponentExample name="disabled-readonly" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function TextareaAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Textarea id={`${id}-disabled`} name="disabled" disabled defaultValue="Editing is unavailable." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Textarea id={`${id}-readonly`} name="summary" readOnly defaultValue="The release notes are ready for review." />
      </div>
    </div>
  );
}
```

## Controlled value and character count

The caller owns the text, native `maxLength` and its described character count. The external action replaces only this draft. This counter communicates the limit without adding a validation API. A controlled value update is native reflow, so it never animates the box.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Textarea } from "@/components/cadence/textarea";

export function ControlledTextarea() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Review note</Label>
      <Textarea id={id} value={value} onChange={(event) => setValue(event.target.value)} maxLength={280} aria-describedby={`${id}-count`} />
      <p id={`${id}-count`} role="status" className="text-sm text-muted-foreground">{value.length} / 280 characters</p>
      <Button variant="outline" onClick={() => setValue("Ready for review.")}>Use review note</Button>
    </div>
  );
}
```

## When to use

- A sentence or a paragraph: a comment, a description, a commit message, a note.
- A field where the user's text is longer than the visible box should be.
- Anywhere the browser's native resize handle is useful.

## When not to use

- A single line (email, name, slug); use `input`.
- Rich text. A `textarea` holds plain text; formatting needs an editor, which is
  out of scope for this library.
- A value that must stay fixed in height; a `textarea` grows, and a fixed box hides
  the overflow from the user.

## API

| Prop        | Type     | Default | Description               |
| ----------- | -------- | ------- | ------------------------- |
| `className` | `string` | –       | Merged last.              |

All native `textarea` props are forwarded, including `rows`, `maxLength`,
`required`, `readOnly`, `disabled`, and `aria-*`.

## Motion contract

Authored intensity is **subtle**: Textarea fades its own later insertion, transitions only the chrome and foreground it paints, and interpolates one explicit rows or authored-height revision while the editor is unfocused; typing, field-sizing growth, selection and pointer resizing keep native ownership.

The native control stays the only editor node. Cadence never duplicates the
editor, mirrors the value or measures each keystroke, so typing, composition,
selection and `field-sizing` growth stay the browser's own.

| Recipe | Owner and full behaviour | reduced | none |
| ------ | ------------------------ | ------- | ---- |
| `data.transition/one-shot` | Independent insertion of a later-mounted field fades the control's own opacity. A presenting Field or group owns the entrance instead, and focus, a hidden host or a missing presenting parent keeps native paint. | Short opacity. | Immediate. |
| `state.color/css-transition` | Background, foreground, border and the scoped focus/invalid shadow. DOM focus-within, invalid state, a theme-owned switch and any palette we cannot prove settle every declared property at its target; otherwise an authored colour change transitions. | Short eligible colour. | Zero duration and delay. |
| `geometry.resize/measured` | One explicit block revision — a caller `rows` change or an authored px height — measured once from the committed box at the final width and clamped to the CSS min/max height. A focused editor, typing, composition, pointer work and the native resize handle, value-driven reflow, `field-sizing` growth, passive wrapping and a caller clock on the same axis all commit final geometry immediately. | Immediate height. | Immediate height. |

Focus and invalid changes retarget directly; there is no shake, queued warning or
validation logic. Entering composition or editing cancels any conflicting size work, and
blur does not replay skipped work. Parent removal owns any exit, so the control is never
held in a retained fade that postpones native focus cleanup. Live reduction finishes
geometry, and `none` or a zero clock also cancels colour and opacity without leaving a
copied value behind. A native scroll position is never reset for an animation.

## Accessibility

- Renders a native `<textarea>`, so Enter inserts a newline and Escape does not
  close anything — expected behaviour in a form.
- Give it a `label`, and never rely on the placeholder as a name.
- If you cap the length with `maxLength`, say so in the description; a silent stop
  in typing reads as a broken field.
- `resize-y` keeps the horizontal layout stable; full `resize` lets a long word
  break the page.
- The height transition never clips the focus outline or the visible text; when the
  destination would scroll, the box settles at its native size instead.

## Validation and data ownership

Same contract as `input`: the field renders state, you own the state.

| The component does                                 | You do                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| Styles `aria-invalid="true"`                       | Deciding validity (length, format, required)             |
| Renders what `aria-describedby` points at           | Writing the error text and the counter ("12 / 280")      |
| Forwards `required`, `readOnly`, `disabled`, `name` | Form state and submission                                |

Character counters are yours to render: the component does not count. Keep the
count in the description slot and point `aria-describedby` at it, so a screen
reader hears it before the limit is hit.

## Responsiveness and performance

The textarea fills its parent, has a minimum height and uses CSS field-sizing-content where
supported. The browser owns growth and user resizing; provide a height or overflow policy for long
text when needed. There is no JavaScript auto-grow fallback.

The motion runtime adds one opacity entrance, a scoped colour clock on the paint the
component declares, and one measured block-height owner for an eligible `rows` or
authored-height revision. Active typing, passive resizing and `field-sizing` growth do
no measurement, and no transition runs behind the caret. This item's own shipped source
budget remains advisory under ADR-023; dependencies and application bundles are measured
separately.

## Notes for AI

- Do not implement auto-resize with a `scrollHeight` loop; `field-sizing-content`
  is the CSS-only answer and it matches upstream.
- Never own the character count in component state. Render it next to the field and
  wire it through `aria-describedby`.
- Do not animate a value change, a width change or a native resize. Only an explicit
  `rows` or authored px height is eligible, and only while the editor is unfocused.

---

Full index: https://cadence.dev/llms.txt
