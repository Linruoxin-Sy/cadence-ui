# Input Group

> Currency fields, URLs, and inputs with inline actions.

- Registry item: https://cadence.dev/r/input-group.json
- Install: `npx shadcn@latest add @cadence/input-group`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, exit.fade, layout.move, state.color, geometry.resize, text.change, number.roll, feedback.press

## Installation

**Command**

```install
npx shadcn@latest add @cadence/input-group
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — transitive registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/input](https://cadence.dev/r/input.json) — direct registry dependency.
- [@cadence/textarea](https://cadence.dev/r/textarea.json) — direct registry dependency.

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

Copy every file in the target list, keeping `input-group/index.tsx`,
`button/index.tsx`, `input/index.tsx`, `textarea/index.tsx` and the shared `lib/`
files in the listed relative tree. Input Group imports Button, Input and Textarea
even when a composition does not render every part. Its Button dependency needs
the motion and provider helpers; those files are required imports, while wrapping
the application in `CadenceProvider` is optional. No additional item-specific CSS
is required beyond the base theme and Tailwind utilities.

The frame owns one insertion opacity, its own border/background/shadow paint and
its committed block size; a keyed addon fades in and out and projects its retained
position, and plain display text and quantities change in place. `InputGroupButton`
composes Button, so it keeps Button's press, colour, label, quantity and exit
owners instead of gaining a second writer. The control keeps native editing: Cadence
never mirrors the value, moves the caret or measures a keystroke.

Usage and the top preview also use [Kbd](/components/kbd). Install it when keeping
the shortcut hint:

```install
npx shadcn@latest add @cadence/kbd
```

For manual installation, copy `files[].content` from the
[Kbd payload](https://cadence.dev/r/kbd.json) to
`@components/cadence/kbd/index.tsx`, reusing the `lib/cn.ts` already listed above.
Kbd adds no npm dependencies beyond the shared helpers. It displays a shortcut
hint; registering a keyboard shortcut belongs to the application.

Usage, “A button in the frame” and the top preview also use `lucide-react` for
their search/clear icons. Install it when keeping those icons; Input Group's
recursive component dependencies do not require an icon package:

```package-manager
npm install lucide-react
```

Keep the source files' existing `"use client"` directives. In Next.js App Router,
a Server Component can compose the client parts in Usage and Alignments with
serializable props. Keep the existing client boundaries in “A button in the
frame”, “A textarea with a footer”, Invalid and the preview; their hooks and
event handlers stay there. Calling the exported `inputGroupAddonVariants` or
`inputGroupButtonVariants` functions also belongs in a client module.

Use `InputGroupInput` or `InputGroupTextarea` for the control and give it an
accessible name; addon text is not a label. Clicking an addon focuses its sibling
input, unless the click is on a button or the caller prevents it; this convenience
does not focus a textarea. Buttons keep their native focus and activation. The
caller owns values, clearing, character limits, submission, error messages and
`aria-invalid`/`aria-describedby`. Input Group renders that state and performs no
validation; no validation package or schema setup is needed.

## Usage

```tsx
import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/cadence/input-group";
import { Kbd } from "@/components/cadence/kbd";

export function SearchField() {
  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components" aria-label="Search components" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}
```

## Alignments

`align` places an addon before or after the control, inline or on its own block row. Each input below is independent. Addon text is not a label: the input still needs an accessible name. The prefix click focuses its own input.

<ComponentExample name="alignments" />

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/cadence/input-group";

export function AddonAlignments() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Inline start" placeholder="cadence.dev" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Inline end" placeholder="cadence" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.dev</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>Recipient</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Block start" placeholder="you@example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Block end" placeholder="review-notes" />
        <InputGroupAddon align="block-end">
          <InputGroupText>Lowercase letters and hyphens.</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
```

## A button in the frame

InputGroupButton has four addon sizes: `xs`, `sm`, `icon-xs`, and `icon-sm`. These independent controls all clear their own domain. Pointer and keyboard activation keep the real button focus; the addon focus convenience steps aside for buttons. Use InputGroupButton inside an addon so sizing and button semantics agree.

<ComponentExample name="button" />

```tsx
"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/cadence/input-group";

export function FrameButtons() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      {(["xs", "sm", "icon-xs", "icon-sm"] as const).map((size) => (
        <ClearDomain key={size} size={size} />
      ))}
    </div>
  );
}

function ClearDomain({ size }: { size: "xs" | "sm" | "icon-xs" | "icon-sm" }) {
  const [value, setValue] = useState("cadence.dev");
  return (
    <InputGroup>
      <InputGroupInput aria-label={`Domain ${size}`} value={value} onChange={(event) => setValue(event.target.value)} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size={size} aria-label={`Clear domain ${size}`} onClick={() => setValue("")}>
          {size.startsWith("icon") ? <XIcon aria-hidden="true" /> : "Clear"}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
```

## A textarea with a footer

Use InputGroupTextarea for multiline content and `block-end` for the footer. The caller owns the draft, character limit and submission. Send clears only this draft and reports its submitted text; it is disabled while the draft is empty.

<ComponentExample name="textarea" />

```tsx
"use client";

import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/cadence/input-group";

export function NoteComposer() {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState("");
  return (
    <form
      className="grid w-full max-w-sm gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(note);
        setNote("");
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          aria-label="Note"
          rows={3}
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Leave a note for the reviewer…"
        />
        <InputGroupAddon align="block-end">
          <InputGroupText>{note.length}/280</InputGroupText>
          <InputGroupButton type="submit" size="sm" variant="default" className="ml-auto" disabled={!note.trim()}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p role="status" className="text-sm text-muted-foreground">
        {sent ? `Sent: ${sent}` : "No note sent."}
      </p>
    </form>
  );
}
```

## Invalid

The application supplies `aria-invalid` and the error description. The group responds with a destructive border and never validates the value itself. Editing this field does not silently clear an application error.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/cadence/input-group";

export function InvalidEmail() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="email"
          aria-label="Email"
          defaultValue="unavailable@example.com"
          aria-invalid
          aria-describedby={id}
        />
      </InputGroup>
      <p id={id} className="text-sm text-destructive">
        This email address is unavailable.
      </p>
    </div>
  );
}
```

## When to use

- A field with a fixed prefix or suffix: a currency symbol, `https://`, a unit, a
  domain.
- A control that needs one inline action: search with a shortcut hint, a chooser with
  a clear button, an invite field with a submit button.
- A textarea with a footer — a character count, a send button — where the footer must
  look attached to the field.

## When not to use

- A bare text field. Use `input`; the group would only re-create its border.
- A whole toolbar of actions. Use `button-group` beside the field, or a `form` layout:
  four buttons inside one field is a cramped target.
- A label. Use `field` and `FieldLabel`; an addon is not an accessible name.

## API

| Part                  | Props                    | Notes                                                          |
| --------------------- | ------------------------ | -------------------------------------------------------------- |
| `InputGroup`          | native div props         | The frame; `role="group"`, focus and invalid state via `:has()`. |
| `InputGroupAddon`     | `align`, native div      | `inline-start \| inline-end \| block-start \| block-end`, `data-align`. |
| `InputGroupButton`    | `size`, `variant`, `type`| `xs \| sm \| icon-xs \| icon-sm`; ghost by default.            |
| `InputGroupText`      | native span props        | Muted text or an icon; not a label.                            |
| `InputGroupInput`     | `input` props            | Control with the frame's chrome removed; `data-slot="input-group-control"`. |
| `InputGroupTextarea`  | `textarea` props         | Same, for multi-line.                                          |

The frame watches `[data-slot=input-group-control]` for `:focus-visible` and
`[aria-invalid=true]`, which is why the control can be borderless and the group still
shows the ring.

`InputGroupButton` preserves Button state callbacks for `className` and `style`, with caller classes last. The input and textarea wrappers keep their native props.

## Motion contract

Authored intensity is **subtle**: The frame owns one insertion, its surface paint and its committed block extent while addons keep their own presence and positions and every composed control keeps its own entrance, colour, box, press and label owners.

The control stays the only editor node: typing, composition, selection, autofill and
the value are the browser's. The frame never interpolates the inline axis, because
`w-full` makes that size the parent's, and it yields the block axis to a focused
editor, a pointer or composition gesture and any caller clock on the same axis.

| Recipe | Owner and full behaviour | reduced | none |
| ------ | ------------------------ | ------- | ---- |
| `data.transition/one-shot` | The frame fades once on a later insertion, and each addon runs its own later-insertion opacity on its own host. A presenting parent, a hidden host or a missing presenting document keeps native paint. | Short opacity. | Immediate. |
| `exit.fade/one-shot` | A retained keyed addon fades its own opacity out before its completion removes it; an unkeyed removal commits immediately instead of inventing an identity. | Short opacity. | Immediate removal. |
| `layout.move/one-shot` | Retained addons project their previous committed box onto the destination through one transform owner, separate from the frame box and from any press transform. | Final positions immediately. | Final positions immediately. |
| `geometry.resize/measured` | One committed block revision of the frame, measured after commitment and clamped to the CSS min/max height. A focused editor, a pointer or composition gesture, an unreadable destination and a caller clock on the block axis all settle immediately. | Immediate height. | Immediate height. |
| `state.color/css-transition` | The frame owns its border, background and shadow; InputGroupText owns its display foreground. DOM focus-within, invalid state, a theme-owned switch and any palette we cannot prove settle the declared properties at their target. | Short eligible colour. | Zero duration and delay. |
| `text.change/changed-runs` | Plain strings in InputGroupText or an addon replace only their changed runs with `stagger: none`; rich children keep their own composed owners and an editable value never becomes a text surrogate. | Changed-run opacity only. | Final text. |
| `number.roll/reels` | A direct display quantity in InputGroupText or an addon reels on its own host and shares the frame's geometry transaction only when the displayed content actually changes. | Final digits immediately. | Final digits immediately. |
| `feedback.press/one-shot` | A composed `InputGroupButton` keeps Button's single press visual on Button's own inner layer; the frame adds no press writer and moves no editor. | Inherited no-scale feedback. | Native activation without animation. |

Removing an addon cancels its measurement and position work before the exit
completes, and a retained addon is inert and `aria-hidden` while it fades. Live
reduction settles frame and addon geometry and quantity reels while permitted
addon and changed-run opacity and eligible colour reconcile under their reduced
contracts. `none` or a zero clock settles one-shot work at the effective target,
and returning to full never replays a consumed membership or content change.

## Accessibility

- The addon text is not a name. Give the control an `aria-label`, or put a `FieldLabel`
  around the group through `field`.
- `role="group"` on the frame and on each addon groups the pieces for assistive tech;
  add `aria-label` to the frame only if the group needs a name of its own.
- The addon focuses the input on click — a convenience for pointer users. Keyboard
  users tab straight into the control, which is already the shortest path.
- Buttons inside the frame keep their own names. An icon-only clear button needs
  `aria-label="Clear"`.
- `aria-invalid` must be on the control, not on the frame; the frame reacts to it.

## Validation and data ownership

P11: the group shows invalid state, it never decides it.

| `InputGroup` does                                        | You do                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Draws the destructive border when a control is invalid    | Deciding what is invalid                                 |
| Moves focus to the input when the addon is clicked        | Wiring `aria-invalid` and `aria-describedby`             |
| Renders the buttons you give it                           | Submit, retry, error mapping                             |

There is no `validate`, `schema`, or `resolver` prop, and no validation library is
imported. [Field](/components/field) shows how the invalid state and its message are wired.

## Responsiveness and performance

The group fills its parent and permits shrinking. Block-start/end addons use column layout; inline
addons share the input row. The caller owns long addon labels, button wrapping and narrow-screen
composition.

The frame adds one opacity channel, one block-size owner and one transform projection per
retained addon; it duplicates no editor, value mirror or per-keystroke measurement. Composed
controls retain their own dependencies and motion contracts, and interactive children and
application handlers still need their own client code. Server-rendered markup does not imply
that every interaction works without JavaScript. The tier's gzip figure is an advisory
reference under ADR-023, not a functional limit.

## Notes for AI

- Never wrap `input` in this group to "add a border"; the input already has one.
- Put state on `InputGroupInput` (`aria-invalid`, `disabled`, `readOnly`) — the frame is
  chrome, and it inherits the appearance.
- Use `InputGroupButton`, not `Button`, inside the frame: the sizes are on the addon
  scale, and the addon's click handler recognises it as a button.

---

Full index: https://cadence.dev/llms.txt
