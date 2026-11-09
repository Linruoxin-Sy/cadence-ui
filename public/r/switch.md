# Switch

> Settings that take effect immediately, such as alerts or visibility.

- Registry item: https://cadence.dev/r/switch.json
- Install: `npx shadcn@latest add @cadence/switch`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/switch
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
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
| switch | `@components/cadence/switch/index.tsx` | [JSON files[].content](https://cadence.dev/r/switch.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: switch](https://cadence.dev/r/switch.json)

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

Copy all nine files in the target list, including every file from the motion,
utilities and provider payloads. Keep `switch/index.tsx` beside the shared `lib/`
directory with its relative imports and the sources' `"use client"` directives
intact. The thumb uses `ControlSpan`, whose imports also reach `native-div.tsx`
and `press-button.tsx`; copying only `provider.tsx` is not enough. The provider
files and `motion` package are required even without an application wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. There is no additional Switch-specific CSS, icon package or external
asset. `state.morph` animates only the thumb's horizontal transform in full;
reduced and none jump to the checked endpoint without travel animation. The
track colour is state feedback. Both `default` and `sm` measure their own travel
with `ResizeObserver`; the first measured position settles immediately, including
an initially checked switch in none. Standalone switches follow the system
motion preference. The optional `CadenceProvider` controls a subtree's mode and
timing; a nested full scope still respects system reduced motion.

Usage, the top specimen and the labelled examples also need
[Label](/components/label). Controlled additionally uses [Button](/components/button).
Install the items needed by your example:

```install
npx shadcn@latest add @cadence/label @cadence/button
```

For manual installation, follow their Manual tabs too: add `label/index.tsx`
and, when using Button, `button/index.tsx`. Their shared files are already in
Switch's target list. Label adds no npm package; Button also requires:

```package-manager
npm install class-variance-authority
```

Explicit motion scopes uses only Switch and the included provider. No example
needs another package or external asset. The site's preview shell is not
consumer setup.

In Next.js App Router, Controlled needs a client module for `useState`,
`onCheckedChange` and the external button's click handler. Usage, Sizes, In a
settings row, Disabled and read-only, and Explicit motion scopes can be composed
in a synchronous Server Component using the shown `useId` or stable unique IDs,
JSX and serializable props; their existing client directives may also be kept.
An event handler, a function-valued `render`, `className(state)` or `style(state)`,
or a client-side hook such as `useState` or `useRef` needs a caller client
boundary. Preserve the installed sources' client directives in either case.

Give every switch a visible label linked by `htmlFor` and a unique `id`, or an
`aria-label`; connect help text with `aria-describedby`. With the default renderer,
the visible control is a `span` with `role="switch"` beside a hidden native
checkbox input. The supplied `id` belongs to that input and Base UI connects the
label to the visible control. Use `defaultChecked` for an uncontrolled initial
state, or own `checked` with `onCheckedChange` for a controlled switch.

Tab focuses an enabled switch; Space and Enter toggle it. `disabled` prevents
interaction and removes it from the tab sequence. `readOnly` keeps it focusable
while preventing changes. Keep the control from shrinking and let the surrounding
label and description wrap, as the settings row does.

For native submission, supply `name` and optionally `value` and `form`. A checked,
enabled switch contributes its name/value entry, with `"on"` as the default value.
An unchecked switch contributes nothing unless `uncheckedValue` supplies an
explicit off value. Disabled switches contribute neither value; a checked
read-only switch retains its entry. `required` uses browser constraint validation
to prevent submission while unchecked. The caller owns allowed state, error
messages, submission, server-side validation and persistence, including save
failures for immediate settings. Cadence forwards supplied `aria-invalid`;
provide a visible error message, as it adds no destructive track style.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSettings() {
  const id = useId();
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>Deploy alerts</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          A notification for every failed build.
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-help`} />
    </div>
  );
}
```

## Sizes

Both `default` and `sm` are fixed here, each initially off and on. Travel is measured from the track and thumb, so either size lands at its own endpoint. Each switch remains independently interactive.

<ComponentExample name="sizes" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSizes() {
  const id = useId();
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <div className="flex items-center gap-3">
        <Switch id={`${id}-off`} />
        <Label htmlFor={`${id}-off`}>Off</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-on`} defaultChecked />
        <Label htmlFor={`${id}-on`}>On</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-off`} size="sm" />
        <Label htmlFor={`${id}-small-off`}>Small</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-on`} size="sm" defaultChecked />
        <Label htmlFor={`${id}-small-on`}>Small, on</Label>
      </div>
    </div>
  );
}
```

## Controlled

The caller owns this immediate preference and status. Turn alerts off demonstrates an external update, separate from the other examples. This example keeps state locally; a real application persists the preference and reports save failures.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function ControlledSwitch() {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Switch id={id} checked={on} onCheckedChange={setOn} />
        <Label htmlFor={id}>Alerts</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Alerts {on ? "on" : "off"} in this example
      </p>
      <Button variant="outline" size="sm" onClick={() => setOn(false)}>
        Turn alerts off
      </Button>
    </div>
  );
}
```

## In a settings row

The label names the setting and the description explains its effect. The switch keeps its size while the caller’s row lets the text wrap.

<ComponentExample name="settings" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSettings() {
  const id = useId();
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>Deploy alerts</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          A notification for every failed build.
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-help`} />
    </div>
  );
}
```

## Disabled and read-only

Disabled switches retain their state and leave the tab order. Read-only stays focusable but cannot change. The disabled row marker also dims the label; neither state is a substitute for explaining why a setting is unavailable.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function DisabledSwitches() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, off</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, on</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only setting</Label>
      </div>
    </div>
  );
}
```

## Explicit motion scopes

The checked switch is explicitly `none` from its first render. Its thumb still reaches the measured checked endpoint, then jumps immediately when toggled. The neighbour explicitly restores `full` inside that scope, subject to system reduced-motion preferences. Ordinary switches follow the site header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Switch } from "@/components/cadence/switch";

export function StaticSwitch() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Switch aria-label="Static switch" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Switch aria-label="Explicit full switch" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A setting that takes effect immediately: public/private, alerts on/off, a feature
  flag.
- A row in a settings list, where the label describes the thing and the switch
  describes its state.
- A preference with no submit button. Flipping it saves.

## When not to use

- The change is only applied on submit; use `checkbox`, which is the familiar form
  control for a pending decision.
- One of several options; use `radio-group`.
- A formatting command on a selection; use `toggle`.

## API

| Prop              | Type                        | Default     | Description                                    |
| ----------------- | --------------------------- | ----------- | ---------------------------------------------- |
| `checked`         | `boolean`                   | –           | Controlled state.                              |
| `defaultChecked`  | `boolean`                   | `false`     | Uncontrolled initial state.                    |
| `onCheckedChange` | `(checked, details) => void`| –           | Fired on click and on Space.                   |
| `size`            | `"sm" \| "default"`         | `"default"` | Track and thumb scale.                         |
| `disabled`        | `boolean`                   | `false`     | Ignores interaction and form submission.       |
| `readOnly`        | `boolean`                   | `false`     | Focusable, submitted, not changeable.          |
| `required`        | `boolean`                   | `false`     | Blocks submit until switched on.               |
| `name`, `value`   | `string`                    | –           | Form field identity and submitted value.       |
| `className`       | `string` / state callback                    | –           | Merged last.                                   |

## Motion contract

Recipe: `state.morph`. The thumb travels from one end of the track to the other
while the track recolours. The travel distance is measured from the rendered track
and thumb — no hard-coded pixel value — so a custom size still lands flush.

| Phase   | Properties                         | Token          | Interruptible |
| ------- | ---------------------------------- | -------------- | ------------- |
| on      | `translateX 0 → track − thumb`     | `state.morph`  | yes           |
| off     | the same distance, reversed        | `state.morph`  | yes           |
| reduced | no travel animation; the thumb jumps to the new end | – | –     |
| none    | no transition                      | –              | –             |

Under `reduced` the thumb still ends up in the right place: position is state, not
decoration. What is dropped is the animation, so the movement is instant.

## Keyboard interactions

| Keys    | Action                                  |
| ------- | --------------------------------------- |
| `Tab`   | Moves focus to the switch.              |
| `Space` | Toggles the switch, unless `readOnly`.  |
| `Enter` | Toggles with the default Base UI keyboard handling, unless `readOnly`. |

## Accessibility

- Base UI renders `role="switch"` with `aria-checked` and a hidden input, so the
  value is submitted with the form.
- The state is not carried by colour alone: the thumb position, the track colour,
  and `aria-checked` change together.
- Give it a name with `Label htmlFor` or `aria-label`. "On" is a state, not a name.
- A switch that saves immediately should announce the outcome (a `toast` or an
  inline status), because there is no submit step to confirm it.

## Validation and data ownership

| The component does                              | You do                                          |
| ------------------------------------------------ | ----------------------------------------------- |
| Forwards `name`, `value`, `disabled`, `required` | Persisting the setting and handling failures     |
| Forwards supplied `aria-invalid`                   | Deciding whether the switch needs one at all     |
| Renders the on/off state                         | Announcing that the change was saved             |

Invalid semantics do not add a destructive track style; supply a visible error message when needed.
There is no `validate` or `schema` prop. [Field](/components/field) shows how the invalid state
and its message are wired.

## Responsive behavior

The control is fixed-size at every breakpoint; the row around it is what changes.
In a narrow layout, let the label and description wrap above the switch instead of
shrinking the track.

## Performance

One `ResizeObserver` per switch measures the travel, so a font or layout change
does not desynchronise the thumb. The animation itself is a single `transform`
transition with no layout reads during interaction.

## Notes for AI

- Use `switch` only for immediate settings. If there is a Save button, use
  `checkbox`.
- Do not animate the track colour as motion; colour is state feedback.
- Keep the label outside the switch. A switch with no label has no accessible name.

---

Full index: https://cadence.dev/llms.txt
