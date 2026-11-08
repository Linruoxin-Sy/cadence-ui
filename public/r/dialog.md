# Dialog

> Focused tasks such as renaming, inviting, or confirming.

- Registry item: https://cadence.dev/r/dialog.json
- Install: `npx shadcn@latest add @cadence/dialog`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/dialog
```

This also installs `button`, which the dialog uses for its close control.
The editing example additionally uses `@cadence/field` and `@cadence/input`.

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
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.

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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| dialog | `@components/cadence/dialog/index.tsx` | [JSON files[].content](https://cadence.dev/r/dialog.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: dialog](https://cadence.dev/r/dialog.json)

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

Copy all ten files in the target list. Keep `dialog/index.tsx` and
`button/index.tsx` beside the shared `lib/` directory, with their relative
imports and `"use client"` directives intact. Button is required by Dialog's
built-in close controls, even if your own trigger uses a native button. Copy all
files from the motion, utilities and provider payloads. The popup uses CSS
transitions, but its provider imports and the installed Button still require
`motion`; wrapping the application in `CadenceProvider` is optional.

Complete the base theme setup linked above, including Cadence's easing and scale
tokens, and ensure Tailwind scans the copied files. There is no additional
Dialog-specific CSS. Each portalled overlay and panel resolves its own token
clock, including provider `timeScale`: full fades the overlay and fades/scales
the panel, reduced keeps opacity only, and none removes transitions and hidden
entry/exit opacity from the first frame. Without a wrapper, Dialog follows the
system motion preference. Use the included provider for explicit scopes; a
nested full scope still respects the system reduced-motion preference.

Usage, Editing a project and the top specimen also use [Field](/components/field)
and [Input](/components/input). Install them when copying the editing form:

```install
npx shadcn@latest add @cadence/field @cadence/input
```

For manual installation, follow their Manual tabs too: add `field/index.tsx`,
`label/index.tsx`, `separator/index.tsx` and `input/index.tsx` alongside the shared
files already listed here. They add no npm packages beyond Dialog's complete
dependency command. The other examples' rendered controls need only Dialog,
the included Button and, for Explicit motion scopes, the included provider.
Several snippets retain unused Field/Input imports; install those items if you
copy the imports verbatim, or remove the unused imports. No example needs an
extra asset; `lucide-react` already supplies the built-in close icon. The site's
preview shell is not consumer setup.

In Next.js App Router, keep the editing, controlled and footer export examples
in a client module because they own state and event handlers. Long content also
needs a client module for its focus ref. Without the built-in close button,
Modal and non-modal behavior, and Explicit motion scopes can be composed in a
Server Component with the shown JSX elements and serializable props; their
existing client directives may also be kept. `render={<Button />}` does not by
itself require a caller client boundary. A function-valued `render`,
`className(state)` or `style(state)`, event handler, or client-side hook such as
`useState` or `useRef` needs that boundary. Preserve the installed sources'
client directives in either case.

`DialogContent` already includes its portal and backdrop; do not add another
overlay around the standard composition. Give every panel a `DialogTitle` and
keep a visible close action when hiding the corner button. The default modal
traps focus and locks page scrolling; `modal={false}` and `"trap-focus"` change
that behavior but still keep DialogContent's backdrop. Base UI handles focus,
Escape and dismissal; the caller owns controlled open state, draft/saved data,
submission, validation and persistence. Cancel does not reset the editing
example's draft. For long content, supply the maximum height, scrolling and
initial focus target shown below so the heading and final close action remain
reachable. Hydrated interactions require JavaScript.

## Usage

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function EditingDialog() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("cadence-ui");
  const [saved, setSaved] = useState("cadence-ui");
  return (
    <div className="flex flex-col items-start gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The URL stays the same. Existing links keep working.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor={id}>Project name</FieldLabel>
              <Input id={id} value={name} onValueChange={setName} required />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit">Save name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground" role="status">
        Project: {saved}
      </p>
    </div>
  );
}
```

## Editing a project

The form owns its draft and saved name. Save submits the form and closes it; Cancel dismisses without saving. Reopening keeps the caller-owned draft. Each instance uses its own ID and state.

<ComponentExample name="editing" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function EditingDialog() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("cadence-ui");
  const [saved, setSaved] = useState("cadence-ui");
  return (
    <div className="flex flex-col items-start gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The URL stays the same. Existing links keep working.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor={id}>Project name</FieldLabel>
              <Input id={id} value={name} onValueChange={setName} required />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit">Save name</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground" role="status">
        Project: {saved}
      </p>
    </div>
  );
}
```

## Controlled

An external application action can open the dialog without a DialogTrigger. The root reports Escape and outside dismissal through onOpenChange; the caller closes after finishing. Base UI restores focus to the previously focused opener when there is no trigger.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from application state
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application-owned dialog</DialogTitle>
            <DialogDescription>
              The caller owns open. Escape and outside presses still report changes.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setOpen(false)}>Finish task</Button>
        </DialogContent>
      </Dialog>
      <p role="status" className="text-sm text-muted-foreground">
        Dialog {open ? "open" : "closed"}
      </p>
    </div>
  );
}
```

## Without the built-in close button

showCloseButton=false removes only the corner control. Supply a visible DialogClose; Escape and outside dismissal still work.

<ComponentExample name="without-close" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function WithoutCloseDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Review changes</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>
            The corner button is hidden. This visible action and Escape still close the dialog.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Done reviewing</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Footer with a close action

DialogFooter showCloseButton adds a Close action. Preparing the export updates caller state and keeps the panel open; closing remains a separate action.

<ComponentExample name="footer-close" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function FooterCloseDialog() {
  const [prepared, setPrepared] = useState(false);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Export details</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export details</DialogTitle>
          <DialogDescription>Prepare the export without dismissing the panel.</DialogDescription>
        </DialogHeader>
        <p role="status" className="text-sm">
          {prepared ? "Export prepared" : "Ready to export"}
        </p>
        <DialogFooter showCloseButton>
          <Button onClick={() => setPrepared(true)}>Prepare export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Long content

Constrain the panel height and enable overflow-y-auto when its body is long. The panel scrolls independently and the final Close action remains reachable. The component does not impose a scrolling height for every consumer. Initial focus targets the heading so opening a long panel starts at the top; Tab can then reach its close controls.

<ComponentExample name="long-content" />

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/cadence/dialog";

export function LongContentDialog() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Read the changelog</DialogTrigger>
      <DialogContent initialFocus={titleRef} className="max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>Release notes</DialogTitle>
          <DialogDescription>Scroll this panel to read every change.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm text-muted-foreground">
          {Array.from({ length: 16 }, (_, index) => index + 1).map((change) => (
            <p key={change}>
              Change {change}: Components keep their native semantics, caller-owned data, and documented full, reduced,
              and none motion behavior.
            </p>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
```

## Modal and non-modal behavior

The fixed triggers cover modal=true (the default), false, and trap-focus. True traps focus and locks page scrolling; false removes focus trapping and scroll locking; trap-focus retains the focus trap without locking page scrolling. DialogContent still renders its backdrop in every case, so an outside pointer press hits that backdrop and dismisses the panel; modal=false does not remove it. Use Popover for an anchored non-modal surface without this backdrop. Every panel still has a name and close action.

<ComponentExample name="modality" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function DialogModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Dialog key={String(modal)} modal={modal}>
          <DialogTrigger render={<Button variant="outline" />}>{String(modal)}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modal: {String(modal)}</DialogTitle>
              <DialogDescription>
                True traps focus and locks page scrolling; false removes the focus trap and scroll lock; trap-focus keeps the focus
                trap without scroll locking. DialogContent still renders a backdrop.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
```

## Explicit motion scopes

These are explicit overrides: the first dialog starts under none, so both its portal overlay and panel have zero duration from insertion. The second restores full inside that none scope; the system reduced-motion preference still wins. Ordinary examples inherit the site header instead.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/cadence/dialog";
import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function DialogMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Open without motion</DialogTrigger>
          <DialogContent data-testid="initial-none">
            <DialogHeader>
              <DialogTitle>Immediate dialog</DialogTitle>
              <DialogDescription>Both overlay and panel start with zero duration.</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
        <CadenceProvider mode="full">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Open nested full</DialogTrigger>
            <DialogContent data-testid="nested-full">
              <DialogHeader>
                <DialogTitle>Nested full dialog</DialogTitle>
                <DialogDescription>
                  This explicit scope restores timing; the system reduced preference still wins.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A focused task that must interrupt the page: rename, invite, confirm.
- Content that needs a modal, a focus trap, and an obvious escape route.
- A short form whose result matters more than the page behind it.

## When not to use

- Non-blocking hints and menus; use `popover` or `tooltip`.
- Long multi-step flows; use a page or a wizard.
- Mobile sheets with drag gestures; use `drawer`.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Dialog` | `open`, `defaultOpen`, `onOpenChange`, `modal` | Base UI root; `modal` defaults to `true`, also accepts `false` or `"trap-focus"`. |
| `DialogTrigger` | native button props, `render` | Opens the dialog. |
| `DialogContent` | `showCloseButton`, `render`, `className` | Renders portal, overlay, and popup. |
| `DialogOverlay` | `className` | Only needed when replacing `DialogContent`. |
| `DialogClose` | native button props, `render` | Closes the dialog. |
| `DialogHeader` / `DialogFooter` | `className`; footer `showCloseButton=false` | Layout; footer can add a Close action. |
| `DialogTitle` | `className` | Required accessible name. |
| `DialogDescription` | `className` | Optional supporting text. |

## Motion contract

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | overlay `opacity 0 → 1`; panel `opacity 0 → 1` + `scale 0.96 → 1` | `popup.anchored` · `duration.fast` / `duration.base` | yes |
| exit | overlay `opacity → 0`; panel `opacity → 0` + `scale → 0.96` | `exit.fade` · `duration.fast` / `duration.base` | yes (reopen mid-exit) |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (overlay 96ms, panel 132ms) | `exit.fade` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so no transition runs | – | – |

The panel stays mounted while its exit transition runs; Base UI delays unmount until the
transition ends, so reopening mid-exit reverses cleanly.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Cycles focus inside the dialog. |
| Escape | Closes the dialog and returns focus to the trigger. |
| Enter / Space | Activates the focused control. |

## Accessibility

- Base UI provides `role="dialog"`, `aria-modal`, `aria-labelledby` / `aria-describedby`,
  focus trapping, focus return, scroll lock, and Escape handling.
- The close button is a real button with a screen-reader-only label.
- `DialogTitle` is required; a dialog without an accessible name is invalid.
- Content is unmounted after the exit transition, so focus is never lost mid-flight.

## Responsive behavior

The panel is centred and capped at `max-w-lg`; on narrow viewports it keeps a 1rem gutter.
For long content, the caller adds a maximum height and `overflow-y-auto`, as in Long content above,
so the popup scrolls independently. Hydrated open/close interactions require JavaScript; no-JS retains the triggers and readable examples.

## Performance

- One popup tree is mounted only while open.
- Animates opacity and scale only; no layout reads and no JavaScript animation loop.

## Notes for AI

- Always render a `DialogTitle`; it is the accessible name.
- Keep the confirming action specific ("Delete project", not "OK").
- Do not animate height inside the dialog; mount content instead.

---

Full index: https://cadence.dev/llms.txt
