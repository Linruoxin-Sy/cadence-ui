# Alert

> Errors, warnings, and page-level status messages.

- Registry item: https://cadence.dev/r/alert.json
- Install: `npx shadcn@latest add @cadence/alert`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: enter.pop, exit.fade, state.color, geometry.resize, text.change, number.roll, data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/alert
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.
- [@cadence/cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json) — direct registry dependency.

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
| cadence-surface-presence | `@components/cadence/lib/surface-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-surface-presence.json) |
| alert | `@components/cadence/alert/index.tsx` | [JSON files[].content](https://cadence.dev/r/alert.json) |
| alert | `@components/cadence/lib/alert-icon.ts` | [JSON files[].content](https://cadence.dev/r/alert.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: alert](https://cadence.dev/r/alert.json)

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

Copy every file in the Manual list at its listed relative path. Alert uses `motion`
and `class-variance-authority`, plus the shared provider, measured geometry, text,
number, colour and surface-presence helpers. It is a client component; its initial
server-rendered message remains visible and hydration does not replay entrance.
`CadenceProvider` is optional and controls full, reduced or none and the shared clock.

The icon examples use `lucide-react`. Changing messages and With an action also use
[Button](/components/button); install them when retaining those examples:

```package-manager
npm install lucide-react
```

```install
npx shadcn@latest add @cadence/button
```

The caller owns message data, dismissal and remounting. A surviving `AnimatePresence`
owner from `motion/react` permits exit; immediate caller unmount has no retained exit.
No example needs image assets or the site's preview frame.

## Usage

```tsx
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

export function QuotaNotice() {
  return (
    <Alert>
      <CircleAlert />
      <AlertTitle>You are close to the build limit</AlertTitle>
      <AlertDescription>12 of 15 builds used this month.</AlertDescription>
    </Alert>
  );
}
```

## Changing messages

Message semantics update immediately in one live region. Only changed primitive title/description
text fades; direct numeric children are quantities and roll, while strings such as `ERR_042`
remain text. The original direct icon keeps the grid column. A keyed decorative replacement
can crossfade through one inert outgoing visual. Rich descriptions and action controls retain
their existing nodes and native behavior. The title keeps its one-line clamp and tracking. Change tone switches the palette while keeping the current message.

<ComponentExample name="changing" />

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/cadence/alert";
import { Button } from "@/components/cadence/button";

export function ChangingAlert() {
  const [failed, setFailed] = useState(false);
  const [destructive, setDestructive] = useState(false);
  const [count, setCount] = useState(19);
  const [show, setShow] = useState(true);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setFailed((value) => !value)}>
          Update message
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount((value) => value + 1)}>
          Add retry
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDestructive((value) => !value)}>
          Change tone
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShow((value) => !value)}>
          {show ? "Hide message" : "Show message"}
        </Button>
      </div>
      <AnimatePresence>
        {show && (
          <Alert
            key="message"
            variant={destructive ? "destructive" : "default"}
            style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
          >
            {failed ? (
              <TriangleAlertIcon key="warning" aria-hidden="true" />
            ) : (
              <CircleAlertIcon key="info" aria-hidden="true" />
            )}
            <AlertTitle>{failed ? "Deploy failed" : "Deploy pending"}</AlertTitle>
            <AlertDescription>
              {failed ? "ERR_042: previous release live. Retry this build." : "Awaiting build result."}
            </AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => setShow(false)}>
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        )}
      </AnimatePresence>
      <Alert style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
        <AlertTitle>Retries remaining</AlertTitle>
        <AlertDescription>{count}</AlertDescription>
      </Alert>
    </div>
  );
}
```

## With an action

`AlertAction` occupies a separate column spanning both text rows. Dismiss clears the caller-owned message; Show alert mounts it again. Alert does not own dismissal state or provide an `onClose` prop. The composed Button inherits the ambient Cadence settings.

<ComponentExample name="action" />

```tsx
"use client";

import { useState } from "react";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/cadence/alert";
import { Button } from "@/components/cadence/button";

export function AlertWithAction() {
  const [visible, setVisible] = useState(true);
  if (!visible) return <Button variant="outline" size="sm" onClick={() => setVisible(true)}>Show alert</Button>;
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Deploy failed</AlertTitle>
      <AlertDescription>Build 42 exited with code 1. The previous release is still live.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={() => setVisible(false)}>Dismiss</Button>
      </AlertAction>
    </Alert>
  );
}
```

## Without an icon

When there is no direct icon child, the icon column collapses to zero and the text uses the available width. The title and description still carry the complete message.

<ComponentExample name="without-icon" />

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

export function AlertWithoutIcon() {
  return (
    <Alert>
      <AlertTitle>Read-only mode</AlertTitle>
      <AlertDescription>Billing needs attention before you can edit.</AlertDescription>
    </Alert>
  );
}
```

## Destructive

`variant="destructive"` changes the text and icon colour while retaining the card surface. Describe the failure in words so colour is not the only signal. The default neutral form appears in Usage and beside it in the top specimen.

<ComponentExample name="destructive" />

```tsx
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/cadence/alert";

export function DestructiveAlert() {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Payment declined</AlertTitle>
      <AlertDescription>Update your payment method before the next invoice.</AlertDescription>
    </Alert>
  );
}
```

## When to use

- The result of an action the user just took, where the outcome needs a sentence of
  explanation: a failed deploy, a partial import, a quota that is nearly full.
- A state of the page that is not an error but changes what is possible — degraded
  mode, read-only mode, a plan that expired yesterday.
- A warning attached to a region rather than to a control, so it survives scrolling
  away from the field it is about.

## When not to use

- A confirmation that needs no reading ("Saved"). Use `toast`: an alert stays in the
  layout, and stale success messages become noise.
- A decision that blocks progress. That is `alert-dialog`, which traps focus on
  purpose.
- Ordinary guidance or onboarding copy. An `alert` is a live region; using it for
  static text makes screen readers interrupt the user for nothing.

## API

| Part               | Props                    | Notes                                                          |
| ------------------ | ------------------------ | -------------------------------------------------------------- |
| `Alert`            | `variant`, native props  | `variant`: `"default" \| "destructive"`. Always `role="alert"`. |
| `AlertTitle`       | native div props         | One line, medium weight, second grid column.                    |
| `AlertDescription` | native div props         | Muted text; paragraphs inside keep relaxed leading.             |
| `AlertAction`      | native div props         | Third grid column, spans both rows.                            |

Every part sets `data-slot` (`alert`, `alert-title`, `alert-description`,
`alert-action`), so a consumer can restyle without new props:
`[&>[data-slot=alert-title]]:text-base`.

Destructive descriptions use the full destructive text token for readable contrast in both themes. An action has its own grid column so it cannot cover the title or description.

## Motion contract

Authored intensity is **medium**: One live alert surface coordinates opacity, readable height, changed message text, quantity reels and keyed decorative icon replacement; composed actions keep native ownership.

The surface coordinates its changed content without travel or child entrance cascades. The root has one combined surface/foreground paint owner;
explicit title and description colours have their own disjoint owners. The currentColor icon
inherits root paint once. Buttons retain their own interaction contract.

| Recipe / form | Full | Reduced | None |
| --- | --- | --- | --- |
| `enter.pop/one-shot` | Dynamic surface opacity entrance; no initial SSR/hydration replay | Short opacity | Immediate |
| `exit.fade/one-shot` | Retained opacity exit; actions become inert and the outgoing region loses its role immediately | Short opacity | Immediate removal |
| `geometry.resize/measured` | Clamped, readable message/action height at destination width | Immediate | Immediate |
| `state.color/css-transition` | Scoped readable root and explicit foreground colour feedback | Short colour | Zero duration and delay |
| `text.change/changed-runs` | Primitive Title/Description string: changed-only opacity, no stagger; unchanged Text identity survives | Short changed opacity | Exact text immediately |
| `number.roll/reels` | Direct numeric Title/Description quantity: compact place-value reels; semantic value immediate | Exact number immediately | Exact number immediately |
| `data.transition/one-shot` | Explicit keyed decorative SVG: bounded outgoing/incoming opacity; no SVG path morph | Short opacity | Immediate |

Repeated updates replace the current target without queuing obsolete messages. Live reduced
settles geometry/reels, and none or zero clock cancels all local effects. Reopening a retained
surface uses the current message without remounting the live region. A parent entrance consumes
the same cause once; independent later message updates keep their own owners.

Height interpolation only exposes safe remaining space. If final content would clip, focus/editing
would drift, sizing is constrained, the map is unknown, or a native writer owns an axis, that axis
commits immediately. Icon retention requires an explicit key, aria-hidden SVG and bounded static
shapes. Unsupported SVG/style/transforms or native opacity ownership replace immediately. Rapid
icon replacement retires existing layers immediately. Arbitrary root children and rich descriptions
are never recursively tokenized. Unknown font features keep the native text/number fallback and
caller typography.

## Accessibility

- `role="alert"` makes the alert an assertive live region. Mount it when a meaningful state appears; update its committed message only when
  the status changes. Visual copies are inert and hidden; they add no live regions or names.
- The icon is decorative — mark it `aria-hidden` if it duplicates the title. An
  icon inside a link or a button is different: that one needs its own name.
- `variant="destructive"` is colour plus a title that says what happened. Never rely
  on the colour alone: the message has to be readable in greyscale.
- The action is a real control. If it is the only way forward, it must be reachable
  by keyboard and come after the message in DOM order (it does).

## Responsiveness and performance

Alerts fill their parent and reserve separate columns for icon, text and optional action. Keep
action labels short or adapt the composition for narrow containers; the caller owns long-content
wrapping.

T0 is a compatibility/documentation tier. Alert uses the shared motion runtime and bounded
known-slot work. Passive wrapping and unsupported geometry settle natively; required content and
action focus rings remain visible. The initial SSR/no-JS message is visible; hydrated handlers
require JavaScript. The demo uses Courier New with normal font features to expose the supported
text path; consumers keep their existing typography and native fallback for unknown features.

The historical 4 KiB gzip own-source reference and component/page/runtime/FPS/CLS budgets are
advisory during functional migration under ADR-023. This migration makes no performance acceptance
claim; separate performance governance remains pending.

## Notes for AI

- Use an alert for a state that persists; use `toast` for a moment.
- Keep exactly one `role="alert"` per message. Nesting parts does not add roles —
  only `Alert` sets one.
- Do not pass an `onClose` and hide it with opacity; that is a toast, not an alert.

---

Full index: https://cadence.dev/llms.txt
