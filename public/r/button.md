# Button

> Commands such as save, submit, and delete.

- Registry item: https://cadence.dev/r/button.json
- Install: `npx shadcn@latest add @cadence/button`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: feedback.press

## Installation

**Command**

```install
npx shadcn@latest add @cadence/button
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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

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

The Sizes example also uses `lucide-react` for its icons. Install it only when using those icons;
Button itself does not require an icon package:

```package-manager
npm install lucide-react
```

## Usage

```tsx
import { Button } from "@/components/cadence/button";

export function Save() {
  return <Button>Save changes</Button>;
}
```

## Variants

`variant` sets the visual weight. There are six, and the default one is the primary action of
the surface it sits on; reach for a different weight only when the hierarchy asks for it.

| Variant | Use it for |
| --- | --- |
| `default` | The one primary action on the surface. |
| `secondary` | A supporting action next to the primary one. |
| `outline` | A neutral action that should not compete for attention. |
| `ghost` | Toolbar and icon-row actions, where the surface carries the shape. |
| `destructive` | An action that removes or overwrites data. |
| `link` | An in-flow action that reads as text. |

<ComponentExample name="variants" />

```tsx
import { Button } from "@/components/cadence/button";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}
```

## Sizes

`size` sets the height and padding. Four text sizes cover dense toolbars through page-level
calls to action; four square sizes cover icon-only buttons.

| Size | Height | Use it for |
| --- | --- | --- |
| `xs` | 24px | Dense toolbars and table rows. |
| `sm` | 32px | Secondary actions in compact layouts. |
| `default` | 36px | Most buttons. |
| `lg` | 40px | Page-level calls to action. |
| `icon-xs` | 24px | Icon only, dense. |
| `icon-sm` | 32px | Icon only, compact. |
| `icon` | 36px | Icon only, default. |
| `icon-lg` | 40px | Icon only, prominent. |

<ComponentExample name="sizes" />

```tsx
import { MoreHorizontalIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/cadence/button";

export function Sizes() {
  return (
    <div className="grid justify-items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="icon-xs" variant="ghost" aria-label="More"><MoreHorizontalIcon /></Button>
        <Button size="icon-sm" variant="outline" aria-label="Search"><SearchIcon /></Button>
        <Button size="icon" variant="outline" aria-label="Add item"><PlusIcon /></Button>
        <Button size="icon-lg" aria-label="Open settings"><SettingsIcon /></Button>
      </div>
    </div>
  );
}
```

Icon-only buttons always need an `aria-label`: the glyph is not a name.

## Links

For navigation, keep the link and take the styles: this preserves link semantics and
middle-click.

<ComponentExample name="links" />

```tsx
import { buttonVariants } from "@/components/cadence/button";

export function Links() {
  return <a href="/components" className={buttonVariants({ variant: "outline" })}>Browse components</a>;
}
```

## Composition

`render` replaces the underlying element; use it for custom button components, not for links.

The default button forwards native React events, including CSS `onAnimationStart`
and HTML `onDrag` / `onDragStart` / `onDragEnd`. These handlers receive native
React events; press feedback does not call them as animation lifecycle hooks.

<ComponentExample name="composition" />

```tsx
"use client";

import { type ComponentProps, useState } from "react";
import { Button } from "@/components/cadence/button";

function CustomButton(props: ComponentProps<"button">) {
  return <button type="button" {...props} />;
}

export function Composition() {
  const [count, setCount] = useState(0);
  return (
    <Button render={<CustomButton />} onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </Button>
  );
}
```

## Disabled

Use `disabled` while an action is unavailable. Keep the reason or current task in the label;
the component does not manage loading or application state for you.

<ComponentExample name="disabled" />

```tsx
import { Button } from "@/components/cadence/button";

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button disabled>Saving changes</Button>
      <Button variant="outline" disabled>Unavailable</Button>
    </div>
  );
}
```

## When to use

- The primary action of a form, dialog, or toolbar.
- A single, clearly labelled command: save, delete, invite.
- Anywhere the user expects a physical press response.

## When not to use

- Navigation between routes; use a link styled with `buttonVariants`.
- Toggling a persistent state; use `toggle` or `switch`.
- Submitting a long-running job that needs its own progress surface; pair the button with a
  spinner and a `disabled` state, or use `toast` for the result.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | Visual weight. |
| `size` | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` | `"default"` | Height and padding. |
| `render` | `ReactElement \| (props, state) => ReactElement` | – | Base UI composition; replaces `asChild`. |
| `className` | string or state callback | – | Merged last. |

All native button props are forwarded.

Base UI state callbacks for `className` are evaluated before merging caller classes last.
`style` accepts an object or a state callback and is forwarded to the primitive.

The default press button preserves native React `onAnimationStart`, `onDrag`,
`onDragStart` and `onDragEnd` events, including capture and cancellation. Callback
and object refs follow the same button; replacing a callback runs its React 19
cleanup before assigning the next ref. A caller `render` replaces the default
renderer and owns spreading its supplied props.

## Motion contract

Recipe: `feedback.press`, driven by the press gesture.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| press | `scale 1 → 0.97` while active | `feedback.press` / `spring.press` | yes (pointer up) |
| release | `scale 0.97 → 1` | `feedback.press` / `spring.press` | yes |
| reduced | no scale; colour and shadow only | – | – |
| none | no scale; colour and shadow only | – | – |

## Accessibility

- Renders a real `<button>` through Base UI, so Enter and Space activate it natively.
- Focus is visible through the ring tokens; disabled buttons are not focusable and keep
  `aria-disabled` semantics from Base UI.
- `aria-invalid` drives the destructive border and ring. The component does not validate
  anything — rules, schemas, and error copy stay in your form code; [Field](/components/field)
  shows the pairing.

## Responsiveness and performance

Buttons size to their label and selected size; the caller owns wrapping or stacking
an action row on small screens. Icon-only buttons need an accessible name. Base UI
activation and Motion press feedback require hydration; native button/link semantics
remain browser-owned in server markup. Press feedback uses transform through
feedback.press, with no layout interpolation. The T1 check budgets this item's own
shipped source at 6 KiB gzip, excluding installed dependencies and application code.

## Notes for AI

- Keep the label specific ("Delete project", not "OK").
- Do not add a `loading` boolean that hides the label; pass `disabled` and render a spinner
  next to the text so the action stays readable.

---

Full index: https://cadence.dev/llms.txt
