# Toast

> Transient notifications with accessible actions and dismissal.

- Registry item: https://cadence.dev/r/toast.json
- Install: `npx shadcn@latest add @cadence/toast`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/toast
```

For manual installation copy `toast/index.tsx`, install `@base-ui/react` and `lucide-react`, and install
`button`, `cadence-utils`, and `cadence-provider`.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — transitive registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — transitive registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.

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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| toast | `@components/cadence/toast/index.tsx` | [JSON files[].content](https://cadence.dev/r/toast.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: toast](https://cadence.dev/r/toast.json)

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

Copy all ten target files, including Button and every shared `lib/` file.
Keep the mirrored `cadence/` tree, relative imports and `"use client"`
directives intact. The provider files and `motion` are required imports;
wrapping your application in `CadenceProvider` is optional. Complete the
linked base theme setup, including Cadence's easing tokens, and ensure
Tailwind scans the copied files. No additional Toast-specific CSS or assets
are required. Usage, the top preview and all eight body examples use this
same dependency graph, with no example-only package or file.

Mount one `Toaster` for the shared `toast` manager in a stable application
location, within any `CadenceProvider` that should control its motion.
`Toaster` supplies the Base UI provider, portal, viewport and notification
list, and can wrap your application children. `CadenceProvider` controls
motion; it does not mount a toaster. For an isolated notification area,
create a stable manager with `useState(createToastManager)` and pass that
same manager to its one provider. Give independently mounted viewports
distinct names through `viewportProps={{ "aria-label": "Export notifications" }}`.
The custom composition instead mounts `ToastProvider`, `ToastPortal`,
`ToastViewport` and a list that reads `useToastManager` under that provider.

Keep Usage and all eight interactive body compositions in client modules.
The shared `toast` export is a client-side manager; call `add`, `update` and
`close` from application events. Custom manager objects, hook calls, refs,
event handlers, `actionProps.onClick` and state callbacks belong in the same
client boundary. A Server Component can render a client notification
composition with serializable props or wrap children in `Toaster` using its
default manager; do not create or pass a manager across the server boundary.
The site's preview shell is not consumer setup. Notification interactions
require hydrated JavaScript.

The caller owns message data, request state, action effects and persistent
results. Keep the id returned by `add` to update or close that notification;
`close()` clears the manager's notifications. An action does not close its
toast automatically: call `close(id)` when that is the intended result.
Toaster's defaults remain Base UI's 5000ms timeout and limit of three;
`timeout={0}` keeps a notification until dismissal. Hover and focus pause
the primitive's timers. The Timers example explicitly uses a limit of two;
older limited notifications remain mounted, hidden and inert.

Full mode uses token-backed opacity and scale; reduced keeps opacity
transitions only, and none removes transitions. Base UI's direct pointer
tracking and swipe dismissal remain available in every mode. Stack positions
and natural content height update immediately. Loading is a static glyph.
`CadenceProvider`'s `timeScale` changes animation clocks, not notification
timeouts, and the system reduced-motion preference still applies to a
nested full provider. Base UI owns swipe recognition and dismissal; custom
composition selects the physical swipe direction. F6 enters the active
viewport, Tab reaches the notification and its controls, and Escape closes
the focused notification. Keep important information in persistent UI and
choose announcement priority for the message's urgency.

## Usage

Mount one toaster within your `CadenceProvider`. Call the shared manager from event handlers.

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { toast, Toaster } from "@/components/cadence/toast";

export function Notifications() {
  return (
    <Toaster>
      <Button onClick={() => toast.add({ title: "Changes saved", description: "Your workspace is up to date.", type: "success" })}>
        Save notification
      </Button>
    </Toaster>
  );
}
```

## Notification types

Types select a glyph, not request handling. Plain, success, info, warning, error and loading are fixed independent commands. Loading is a static glyph in every motion mode.

<ComponentExample name="types" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Types() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Types notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-wrap gap-2">
      {([undefined, "success", "info", "warning", "error", "loading"] as const).map(type => <Button key={type ?? "plain"} variant="outline" onClick={() => manager.add({ title: `${type ?? "plain"} notification`, type })}>Show {type ?? "plain"}</Button>)}
      <Button variant="ghost" onClick={() => manager.close()}>Clear types</Button>
    </div>
  </Toaster>;
}
```

## Actions and dismissal

The caller owns the undo operation and persistent result. This action explicitly closes its notification; action activation alone does not imply dismissal.

<ComponentExample name="actions" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Actions() {
  const [manager] = useState(createToastManager);
  const [result, setResult] = useState("Item available");
  return <Toaster viewportProps={{ "aria-label": "Archive notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-col gap-3">
      <Button onClick={() => {
        setResult("Item archived");
        const id = manager.add({ title: "Item archived", actionProps: { children: "Restore item", onClick: () => { setResult("Item restored"); manager.close(id); } } });
      }}>Archive item</Button>
      <p role="status">{result}</p>
    </div>
  </Toaster>;
}
```

## Announcement priority

Low priority uses polite announcements. High priority is for urgent information. Neither arrival moves focus; F6 enters the active viewport and Escape dismisses the focused toast.

<ComponentExample name="priority" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Priority() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Priority notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => manager.add({ title: "Draft saved", priority: "low" })}>Polite notification</Button>
      <Button variant="outline" onClick={() => manager.add({ title: "Connection unavailable", description: "Your draft remains on this device.", type: "error", priority: "high" })}>Urgent notification</Button>
      <Button variant="ghost" onClick={() => manager.close()}>Clear priority</Button>
    </div>
  </Toaster>;
}
```

## Caller-owned progress

Queue, finish and dismiss are explicit application events. This example performs no request and runs no simulated timer. The same manager id updates the existing toast; the persistent result remains after dismissal.

<ComponentExample name="progress" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Progress() {
  const [manager] = useState(createToastManager);
  const [id, setId] = useState<string>();
  const [result, setResult] = useState("No export queued");
  return <Toaster viewportProps={{ "aria-label": "Export notifications" }} toastManager={manager} timeout={0}>
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button disabled={!!id} onClick={() => { setId(manager.add({ title: "Export queued", type: "loading", onClose: () => setId(undefined) })); setResult("Export queued"); }}>Queue export</Button>
        <Button variant="outline" disabled={!id} onClick={() => { if (id) manager.update(id, { title: "Export ready", description: "Download it from your exports page.", type: "success" }); setResult("Export ready"); }}>Finish export</Button>
        <Button variant="ghost" disabled={!id} onClick={() => { if (id) manager.close(id); setId(undefined); }}>Dismiss export</Button>
      </div>
      <p role="status">{result}</p>
    </div>
  </Toaster>;
}
```

## Timeout and visible limit

The provider uses a 5000ms timeout and shows at most two notifications. Hovering or focusing pauses timers. The pinned primitive marks older notifications as limited rather than immediately removing them. A per-notification timeout of zero keeps a message until dismissed.

<ComponentExample name="timers" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { createToastManager, Toaster } from "@/components/cadence/toast";

export function Timers() {
  const [manager] = useState(createToastManager);
  return <Toaster viewportProps={{ "aria-label": "Timer notifications" }} toastManager={manager} timeout={5000} limit={2}>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => manager.add({ title: "Timed notification", description: "Closes after five seconds without hover or focus." })}>Add timed notification</Button>
      <Button variant="outline" onClick={() => manager.add({ title: "Persistent notification", timeout: 0 })}>Add persistent notification</Button>
      <Button variant="ghost" onClick={() => manager.close()}>Clear timers</Button>
    </div>
  </Toaster>;
}
```

## Custom composition

Compose the real provider, portal, viewport and parts to customize content. This example omits the type glyph. Each specimen owns one manager and one viewport; applications normally mount one toaster for their shared manager.

<ComponentExample name="composition" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
export function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}
```

## Swipe directions

Each trigger owns an independent notification with a fixed physical swipe direction. Swipe recognition belongs to Base UI. Reduced and none omit Cadence's swipe-variable transform; Base UI still tracks the pointer directly with no transition in every mode. Swipe dismissal and keyboard controls remain available.

<ComponentExample name="swipe" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}

export function Swipe() {
  return <div className="flex flex-wrap gap-2">{(["up", "down", "left", "right"] as const).map(direction => <Composition key={direction} direction={direction} label={`Swipe ${direction}`} />)}</div>;
}
```

## Without motion

These fixed local providers demonstrate none and full nested within none. The operating system reduced-motion preference still takes precedence. Ordinary examples inherit the header mode and speed.

<ComponentExample name="without-motion" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  createToastManager,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToastManager,
 } from "@/components/cadence/toast";

function NotificationList({ direction = "right" }: { direction?: "up" | "down" | "left" | "right" }) {
  const { toasts } = useToastManager();
  return toasts.map(item => <Toast key={item.id} toast={item} swipeDirection={direction}>
    <ToastContent>
      <div className="flex min-w-0 flex-1 flex-col gap-1"><ToastTitle /><ToastDescription /></div>
      <ToastAction /><ToastClose />
    </ToastContent>
  </Toast>);
}
function Composition({ direction = "right", label = "Show custom notification" }: { direction?: "up" | "down" | "left" | "right"; label?: string }) {
  const [manager] = useState(createToastManager);
  return <ToastProvider toastManager={manager} timeout={0}>
    <Button variant="outline" onClick={() => manager.add({ title: "Custom notification", description: `Swipe ${direction} or use the close button.` })}>{label}</Button>
    <ToastPortal><ToastViewport aria-label={`${label} notifications`}><NotificationList direction={direction} /></ToastViewport></ToastPortal>
  </ToastProvider>;
}

export function WithoutMotion() {
  return <CadenceProvider mode="none"><div className="flex flex-wrap gap-2">
    <Composition label="Show instant notification" />
    <CadenceProvider mode="full"><Composition label="Show nested full notification" /></CadenceProvider>
  </div></CadenceProvider>;
}
```

## When to use

- Brief, nonblocking confirmation after an application action.
- An optional undo action with a visible close button.
- Caller-owned progress updated from existing application state.

## When not to use

- Inline validation errors: use Field and an error slot.
- Critical decisions requiring acknowledgment: use Alert Dialog.
- Persistent records or long instructions: use page content.

## API

| Part | Props | Default / behavior |
| --- | --- | --- |
| `Toaster` | Base UI Provider props, `children`, `toastManager`, `viewportProps` | shared `toast` manager; optional `viewportProps` forwards Viewport props except `children`; renders portal, viewport and list |
| `ToastProvider` | `timeout`, `limit`, `toastManager`, `children` | Base UI defaults: 5000ms, limit 3 |
| `ToastPortal` | Base UI Portal props, `container`, `keepMounted` | document portal |
| `ToastViewport` | Base UI Viewport props, `className` | fixed bottom right; F6 hotkey |
| `Toast` | Base UI Root props, required `toast`, `swipeDirection`, `render`, `className` | native swipe directions and dismissal |
| `ToastContent` | Base UI Content props, `render`, `className` | horizontal content layout |
| `ToastTitle` / `ToastDescription` | Base UI title / description props | text from the toast object |
| `ToastAction` | Base UI Action props | outline Button, size sm; actionProps from toast |
| `ToastClose` | Base UI Close props, `children` | ghost Button, icon-sm; label "Close toast", X glyph |
| `toast` / `createToastManager` | Base UI manager exports | add / update / close state supplied by caller |
| `useToastManager` | Base UI hook | provider's toast list and manager methods |

All parts forward upstream props and refs. Classes merge user values last. Button render defaults
match pinned upstream. Each rendered part retains its `toast-*` data slot.

## Motion contract

Authored intensity is **medium**: Toast opens and closes its existing popup surface; content and native focus retain their current owners.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| open | opacity 0 to 1, scale from `--motion-scale-in` in full | `popup.anchored/css-transition`, duration.base, ease.out | yes, CSS transition |
| close / limited | opacity to 0; exit scale on close in full | `exit.fade/css-transition`, duration.base | yes |
| swipe | Base UI pointer tracking in every mode; swipe-variable transform in full | primitive-owned gesture | yes |
| stack / content updates | bottom and natural height update instantly | no layout transition | n/a |
| reduced | opacity transitions only; no animated scale or swipe transform | duration.base × 0.6 | yes |
| none | zero duration; native pointer tracking remains immediate | zero duration | n/a |

Notifications remain expanded in a vertical stack; there is no collapsed height or stack-scale animation.
Base UI owns timeout pausing, lifecycle, swipe recognition and removal. No extra animation scheduler is added.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. Ordinary examples inherit the site header mode on the same component tree. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| F6 | Move focus to the notification viewport |
| Tab / Shift+Tab | Traverse action and close controls |
| Escape | Dismiss the focused notification |
| Enter / Space | Activate the focused action or close button |

## Accessibility

Base UI announces notification title and description at the selected priority. Focus is not moved when a
toast arrives. Actions and close controls are named buttons. Important content must also exist in persistent
application UI; a notification should never be its only location. Timers pause during hover or focus. Give each independently mounted viewport a distinct, meaningful name with `Toaster viewportProps={{ "aria-label": "Export notifications" }}` or `ToastViewport aria-label` when composing the parts. The default remains “Notifications”; the manager and live-region behavior are unchanged.

## Responsive behavior

The viewport keeps 1rem margins on small screens and a max-sm width. On desktop it sits at bottom right.
Long descriptions wrap. Keep messages short so stacked notifications do not fill the screen.

## Performance

T2, 10 KB gzip source budget. Only opacity, scale and native swipe transform transition. Stack geometry
and content sizing update instantly; no measurement occurs during render and no height tween runs.

## Notes for AI

- Keep one provider per manager and mount its viewport once.
- Use Base UI `render`, retain each slot, and preserve the three mode branches.
- Caller state drives add/update/close; do not add request or validation orchestration.
- Related: `alert`, `alert-dialog`, `button`, `field`.

---

Full index: https://cadence.dev/llms.txt
