# Toggle

> Bold, italic, preview, and other on/off modes.

- Registry item: https://cadence.dev/r/toggle.json
- Install: `npx shadcn@latest add @cadence/toggle`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press

## Installation

**Command**

```install
npx shadcn@latest add @cadence/toggle
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
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
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| toggle | `@components/cadence/toggle/index.tsx` | [JSON files[].content](https://cadence.dev/r/toggle.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: toggle](https://cadence.dev/r/toggle.json)

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

Copy all nine target files, keeping `toggle/index.tsx` beside the shared `lib/`
directory and preserving the relative imports and `"use client"` directives.
The default renderer imports `press-button.tsx`, which reaches
`control-animation.tsx` and `native-div.tsx`; copy every file in the motion,
utilities and provider payloads. The provider files and `motion` package are
required imports even when you do not wrap the application in a provider.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. Toggle needs no additional item-specific CSS or external asset. The
default renderer uses `feedback.press` for its press scale in full; reduced and
none keep scale at one with a zero clock. Pressed colours still communicate
state in every mode. Standalone toggles follow the system motion preference;
the optional `CadenceProvider` controls a subtree's mode and timing. A nested
full scope still respects system reduced motion.

Usage, the top specimen, With a label, Controlled and Inside a form use icons.
They need this example-only dependency; Toggle itself does not:

```package-manager
npm install lucide-react
```

Controlled and Inside a form also need [Button](/components/button):

```install
npx shadcn@latest add @cadence/button
```

For manual installation, follow Button's Manual tab and add `button/index.tsx`.
Its npm dependencies and shared files are already in Toggle's installation
graph. Variants, Sizes, Disabled and Explicit motion scopes need only Toggle
and the included helpers. The site's preview shell is not consumer setup.

In Next.js App Router, Controlled and Inside a form need a client module for
`useState`, change handlers and click or submit handlers. Usage, Variants,
Sizes, With a label, Disabled and Explicit motion scopes can be composed in a
synchronous Server Component with the shown JSX and serializable props. A
caller ref, event handler, function-valued `render`, `className(state)` or
`style(state)`, or a client-side hook such as `useState` or `useRef` needs a
caller client boundary. Keep the installed sources' client directives.

Use `defaultPressed` for initial uncontrolled state, or own `pressed` with
`onPressedChange` for controlled state. The callback receives the next boolean
and event details; `details.cancel()` vetoes the change. Give icon-only buttons
an `aria-label`; text children can supply the name. Enabled buttons are reached
with Tab and toggle with Space or Enter. `disabled` blocks activation and
removes the button from the tab order while retaining its pressed state.

The default element is a native `button` with `type="button"` and
`aria-pressed`. Toggle does not expose a submit-button `type` or `form`
association, generate a hidden input, or submit its pressed state through
`name`. Its `value` identifies an item in a Toggle Group, not a submitted
checked value. Inside a form explicitly maps caller state to a hidden input;
use Checkbox when you need a checked form control. The caller owns state,
persistence, validation, error text and any `aria-invalid` / `aria-describedby`
association.

Native animation and drag handlers, state-based classes/styles and refs pass
through the default renderer. A caller `render` replaces that renderer and
its press effect; spread the supplied props and preserve its ref and button
semantics. Keep `nativeButton` consistent with the rendered element.

## Usage

```tsx
import { Bold } from "lucide-react";
import { Toggle } from "@/components/cadence/toggle";

export function BoldToggle() {
  return (
    <Toggle aria-label="Bold" defaultPressed>
      <Bold />
    </Toggle>
  );
}
```

An icon-only toggle needs `aria-label`; the glyph is not a name.

## Variants

Default and outline each show an off and an initially pressed button. Outline adds a border on busy toolbar surfaces; every button still toggles independently.

<ComponentExample name="variants" />

```tsx
import { Toggle } from "@/components/cadence/toggle";

export function ToggleVariants() {
  return (
    <div className="flex flex-wrap gap-3">
      <Toggle>Default</Toggle>
      <Toggle defaultPressed>Default on</Toggle>
      <Toggle variant="outline">Outline</Toggle>
      <Toggle variant="outline" defaultPressed>
        Outline on
      </Toggle>
    </div>
  );
}
```

## Sizes

Small, default and large use fixed 32, 36 and 40px heights. Choose one for the surrounding toolbar rather than scaling its hit target.

<ComponentExample name="sizes" />

```tsx
import { Toggle } from "@/components/cadence/toggle";

export function ToggleSizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" size="lg">
        Large
      </Toggle>
    </div>
  );
}
```

## With a label

Text supplies the accessible name; the icon is decorative. An icon-only toggle, as in Usage, needs its own aria-label.

<ComponentExample name="label" />

```tsx
import { BoldIcon } from "lucide-react";
import { Toggle } from "@/components/cadence/toggle";

export function LabelledToggle() {
  return (
    <Toggle variant="outline">
      <BoldIcon />
      Bold
    </Toggle>
  );
}
```

## Controlled

The caller owns the italic command. Clear italic updates this instance externally; it leaves all other examples alone.

<ComponentExample name="controlled" />

```tsx
"use client";

import { ItalicIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Toggle } from "@/components/cadence/toggle";

export function ControlledToggle() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Toggle pressed={on} onPressedChange={setOn}>
        <ItalicIcon />
        Italic
      </Toggle>
      <p role="status" className="text-sm text-muted-foreground">
        {on ? "Italic enabled" : "Italic disabled"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setOn(false)}>
        Clear italic
      </Button>
    </div>
  );
}
```

## Disabled

Disabled off and on commands retain their pressed state and ignore pointer and keyboard input.

<ComponentExample name="disabled" />

```tsx
import { Toggle } from "@/components/cadence/toggle";

export function DisabledToggles() {
  return (
    <div className="flex flex-wrap gap-3">
      <Toggle disabled>Unavailable off</Toggle>
      <Toggle disabled defaultPressed variant="outline">
        Unavailable on
      </Toggle>
    </div>
  );
}
```

## Inside a form

Toggle renders a type="button", so its pressed state does not submit a form field. The caller explicitly maps state to a hidden input here; Save formatting reads real FormData. Use Checkbox for a native checked form value.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { BoldIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Toggle } from "@/components/cadence/toggle";

export function ToggleForm() {
  const [bold, setBold] = useState(false);
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid justify-items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(`Submitted bold: ${new FormData(event.currentTarget).get("bold") ?? "absent"}`);
      }}
    >
      <Toggle pressed={bold} onPressedChange={setBold}>
        <BoldIcon />
        Bold
      </Toggle>
      {bold && <input type="hidden" name="bold" value="enabled" />}
      <Button type="submit" size="sm">
        Save formatting
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
```

## Explicit motion scopes

The first toggle is inside a fixed none provider from its first DOM appearance. The second explicitly overrides that outer scope with full; the system reduced-motion preference still wins. Ordinary examples inherit the site header.

<ComponentExample name="without-motion" />

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Toggle } from "@/components/cadence/toggle";

export function StaticToggle() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <div data-testid="initial-none">
          <Toggle aria-label="Static toggle On" defaultPressed>
            On
          </Toggle>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <Toggle aria-label="Explicit full toggle Press">Press</Toggle>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A formatting or mode command that stays on until it is turned off: bold,
  italic, a preview pane, a grid/list switch.
- A compact toolbar button whose pressed state is visible next to its neighbours.
- A setting the user toggles repeatedly while working.

## When not to use

- The action is one-shot (save, delete, open); use `button`.
- A setting that takes effect immediately and permanently, like a preference; use
  `switch`.
- A group of related toggles that should read as one control; use `toggle-group`.

## API

| Prop               | Type                          | Default     | Description                              |
| ------------------ | ----------------------------- | ----------- | ---------------------------------------- |
| `pressed`          | `boolean`                     | –           | Controlled state.                        |
| `defaultPressed`   | `boolean`                     | `false`     | Uncontrolled initial state.              |
| `onPressedChange`  | `(pressed, details) => void`  | –           | Fired on click and on Space/Enter.       |
| `variant`          | `"default" \| "outline"`      | `"default"` | Visual weight.                           |
| `size`             | `"sm" \| "default" \| "lg"`   | `"default"` | Height and minimum width.                |
| `disabled`         | `boolean`                     | `false`     | Ignores interaction.                     |
| `className`        | `string` / state callback                      | –           | Merged last.                             |

`toggleVariants` is exported, so a custom part can share the same classes.

The default press button preserves native React `onAnimationStart`, `onDrag`,
`onDragStart` and `onDragEnd` events, including capture and cancellation. Callback
and object refs follow the same button; replacing a callback runs its React 19
cleanup before assigning the next ref. A caller `render` replaces the default
renderer and owns spreading its supplied props.

## Motion contract

Authored intensity is **subtle**: Press feedback scales the active control in place.

Recipe: `feedback.press/one-shot`. The button compresses to 0.97 while the pointer is down
and springs back on release.

| Phase   | Properties       | Token            | Interruptible |
| ------- | ---------------- | ---------------- | ------------- |
| press   | `scale 1 → 0.97` | `feedback.press/one-shot` | yes           |
| release | `scale 0.97 → 1` | `feedback.press/one-shot` | yes           |
| reduced | no scale; the pressed background is the only change | – | – |
| none    | no scale         | –                | –             |

The pressed background is a colour transition, which is state feedback and stays
in every mode — otherwise a `none` user could not see the state.

## Keyboard interactions

| Keys    | Action                          |
| ------- | ------------------------------- |
| `Tab`   | Moves focus to the toggle.      |
| `Space` | Toggles the pressed state.      |
| `Enter` | Toggles the pressed state.      |

## Accessibility

- Base UI renders a real `<button type="button">` with `aria-pressed`, so assistive
  technology announces it as a toggle button, not a plain button.
- Icon-only toggles need `aria-label`; the pressed state is announced separately.
- The pressed state is never colour-only: the fill and `aria-pressed` change
  together, and the press scale is never the only feedback.
- Avoid toggles in a navigation bar; a link that changes style is still a link.

## Validation and data ownership

| The component does                            | You do                                     |
| --------------------------------------------- | ------------------------------------------ |
| Forwards native button props and `disabled`          | Deciding what a pressed toggle means       |
| Exposes `aria-invalid` styling                | Validation and error text                  |
| Keeps the pressed state in `aria-pressed`     | Persisting it                              |

[Field](/components/field) shows how the invalid state and its message are wired.

## Responsive behavior

Sizes are fixed; in a toolbar that must shrink, drop to `size="sm"` rather than
scaling the button with a transform, which would blur the icon.

## Performance

One Motion element, pressing only on pointer down. No layout animation, no
measurement.

## Notes for AI

- Use `toggle` for a command that stays on; use `switch` for a preference that
  saves itself.
- Always provide `aria-label` for icon-only toggles.
- Do not add a `state.morph` label swap to a toggle; the press scale is the whole
  contract.

---

Full index: https://cadence.dev/llms.txt
