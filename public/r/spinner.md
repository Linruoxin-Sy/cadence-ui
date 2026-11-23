# Spinner

> Short waits such as saving, sending, or publishing.

- Registry item: https://cadence.dev/r/spinner.json
- Install: `npx shadcn@latest add @cadence/spinner`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: enter.pop, exit.fade, data.transition, geometry.resize, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/spinner
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install motion clsx tailwind-merge lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
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
| cadence-surface-presence | `@components/cadence/lib/surface-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-surface-presence.json) |
| spinner | `@components/cadence/spinner/index.tsx` | [JSON files[].content](https://cadence.dev/r/spinner.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: spinner](https://cadence.dev/r/spinner.json)

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

Keep `spinner/index.tsx` and all shared `lib/` files at the listed relative paths,
including every file in the motion, geometry and provider items. Preserve the
`"use client"` directives. The glyph's loop is a theme token, but its
`useCadenceMotion`, retained-presence and measured-box helpers still require those
shared files and their `motion` dependency. Wrapping the application in
`CadenceProvider` is optional; without it, Spinner follows the system motion
preference.

Full mode rotates the single glyph on Tailwind's `--animate-spin` theme clock;
reduced and none both leave the same named glyph still. Provider `timeScale`,
including zero, does not change the loop clock. Use `mode="none"` (or the OS
reduced-motion preference) to stop it, as the explicit `data-motion="none"`
example does from its first render. The same element owns a short opacity
entrance, its foreground colour clock and an explicit caller icon-size revision;
none of those touch the rotation. No additional item-specific CSS is required
beyond the base theme and Tailwind utilities.

Inside a button also uses [Button](/components/button). Install it when copying
that example:

```install
npx shadcn@latest add @cadence/button
```

For a manual Button installation, follow its Manual tab too; it adds
`button/index.tsx`, `@base-ui/react` and `class-variance-authority` alongside the
shared files and packages already listed here. Usage, Sized by the caller, A
specific label, `data-motion="none"` and the top specimen need no other registry items,
npm packages or assets. `lucide-react` is already an implementation dependency
for the loading glyph; the site's preview shell is not consumer setup.

In Next.js App Router, all five body examples can be composed in a Server
Component with their shown serializable props, including the nested provider.
Keep the installed sources' client boundaries. A caller that adds React state,
event handlers or browser APIs needs its own client module. The examples are
fixed loading states: the caller starts and finishes requests, mounts or removes
Spinner, sets and clears the region's `aria-busy`, and exposes completion or error
feedback. Keep a meaningful status label; inside the pending button, keep its
written label, `disabled` and `aria-busy`, and hide the redundant glyph with
`aria-hidden`. Reserve any changing label width and choose icon sizes that fit
the surrounding layout.

## Usage

```tsx
import { Spinner } from "@/components/cadence/spinner";

export function LoadingRegistry() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Spinner />
      <span className="text-muted-foreground">Loading the registry…</span>
    </div>
  );
}
```

## Inside a button

Keep the button’s written label and disable it while work is pending. `aria-busy` names the
button’s busy state; hide the redundant spinner glyph from assistive technology here so it does
not duplicate that label. This fixed pending state does not start a request or own its lifetime.
If switching from an idle label changes the width, reserve that width in the caller’s layout.

<ComponentExample name="button" />

```tsx
import { Button } from "@/components/cadence/button";
import { Spinner } from "@/components/cadence/spinner";

export function SavingButton() {
  return (
    <Button disabled size="sm" aria-busy="true">
      <Spinner aria-hidden="true" />
      Saving
    </Button>
  );
}
```

## Sized by the caller

The icon is `size-4` by default and inherits `currentColor`. The fixed 12, 16, 24 and 32 pixel
specimens show caller classes rather than a finite `size` prop. Muted text colour belongs to the
first specimen only; each glyph keeps its own accessible loading status and inherits header motion.

<ComponentExample name="sizes" />

```tsx
import { Spinner } from "@/components/cadence/spinner";

export function SpinnerSizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Spinner className="size-3 text-muted-foreground" />
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  );
}
```

## A specific label

“Loading” is the default accessible name. Say what is loading when surrounding text does not: this
standalone status announces “Saving invoice” without adding a focus stop. The caller decides when
to mount it and must expose completion or an error through its own result UI.

<ComponentExample name="label" />

```tsx
import { Spinner } from "@/components/cadence/spinner";

export function SavingInvoice() {
  return <Spinner aria-label="Saving invoice" />;
}
```

## Under `data-motion="none"`

This example explicitly fixes its provider to `none` from the first render, independently of the
header. The spinner stays visible and named, with no rotation or running animation; it is not a
post-mount mode switch. Other examples inherit the header. Full rotates; reduced and none both keep
the same still, named glyph, because the rotation is the busy signal rather than travel.

<ComponentExample name="without-motion" />

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Spinner } from "@/components/cadence/spinner";

export function StaticSpinner() {
  return (
    <CadenceProvider mode="none">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-label="Static loading" data-testid="static-spinner" />
        Loading the registry…
      </span>
    </CadenceProvider>
  );
}
```

## When to use

- An action the user just triggered: save, send, invite, publish. The spinner sits
  where the user is looking — inside the button, or immediately beside it.
- A wait with no measurable progress: a request that returns when it returns.
- A region that is loading and whose shape you cannot predict. When you *can* predict
  it, use `skeleton` instead: it keeps the layout stable.

## When not to use

- A wait under about 300 ms. The spinner appears and disappears before it can be read,
  which reads as a flicker. Keep the button's label and disable it.
- A known percentage. Use `progress`; a spinning wheel after "60%" is a regression.
- A page that is loading its first paint. There is nothing to spin inside yet — a
  skeleton or a server-rendered shell is better.
- A decorative "we're working on it" on a marketing page. Motion without a state
  change is decoration (P9).

## API

| Prop        | Type     | Default     | Description                                                    |
| ----------- | -------- | ----------- | -------------------------------------------------------------- |
| `className` | `string` | –           | Merged last — size and colour live here (`size-3`, `text-…`).   |
| `aria-label`| `string` | `"Loading"` | The accessible name; pass a specific one when it helps.         |

All native `svg` props are forwarded, including `ref` and any `width`/`height` the caller sets.
`data-slot="spinner"` and `data-motion` are always set, and `role="status"` with the label is the
announcement.

## Motion contract

Authored intensity is **subtle**: One SVG owns four disjoint properties: the opacity envelope of its own insertion/removal, the rotation that is its busy state, an explicit caller icon-size revision and its currentColor foreground clock.

The loop is the theme's `--animate-spin` clock rather than a Motion loop, for the same reason as
`skeleton`: a spinner sits next to the work the user is waiting on and must not add a frame
callback to it. Only `transform` (rotation) changes, so the loop never triggers layout, and
removal releases the loop before any retained fade rather than leaving a pinned animation.

| Recipe | Owner / properties | Full | Reduced | None |
| --- | --- | --- | --- | --- |
| `enter.pop/one-shot` | Glyph opacity on a later insertion | Short entrance; role and label are immediate | Short opacity | Immediate |
| `exit.fade/one-shot` | Glyph opacity on a retained removal | Rotation stops, then the fade | Short opacity, still glyph | Immediate removal |
| `data.transition/continuous` | Glyph `transform` (rotation) | Theme-clock rotation while current and visible | Still glyph, no rotation | Still glyph, no rotation |
| `geometry.resize/measured` | Reserved icon box, `width` and `height` | Bounded box continuity on an explicit caller size revision | Immediate box | Immediate box |
| `state.color/css-transition` | Glyph `color` / currentColor stroke | Scoped foreground clock | Short colour | Immediate |

Reduced and none both leave the same named glyph still: the rotation is the busy signal, so a
frozen glyph still says "waiting" only because its label says so. A containing button or badge owns
its own surface and its own entrance; when it already fades the same insertion, Spinner's opacity
envelope is consumed by that parent instead of racing it. Rotation and the entrance never write the
icon box, and passive reflow or responsive sizing never animates it.

## Keyboard interactions

None. The spinner is not focusable and takes no input; focus stays on the control that
started the work, which is where the user's next action will be.

## Accessibility

- `role="status"` is a polite live region: the label is announced when the spinner
  appears, without interrupting. Do not wrap it in another `aria-live` region.
- The label must carry the meaning. The rotation is never the only signal, and under
  `data-motion="none"` it is not a signal at all.
- Give the busy region `aria-busy="true"` and remove it when the work finishes, so the
  state survives even if the spinner unmounts early.
- Do not replace a button's label with a spinner and nothing else. Keep the word, or
  add an `sr-only` copy, or the control loses its name mid-action.
- Do not stack spinners. One per action; a page with five is a page with no feedback.

## Responsive behavior

The spinner is an inline icon, so it follows the text it sits in. Inside a button it
keeps the button's height; inside a heading, size it down (`size-3`) or it will
dominate the line. On touch targets, keep the surrounding button at least 44×44 by
size, not by growing the icon.

## Performance

- One CSS animation per element, on `transform` only; no JS loop, no per-frame layout read.
- The reserved icon box is read once per committed caller revision, not per frame, and rotation
  never writes it.
- Compositor-friendly, but the animation-system budget still applies: fewer than
  twenty simultaneously animating elements. For a list of pending rows, render one
  spinner for the list, not one per row.
- No `will-change`: the browser promotes a transform animation on its own.
- A hidden, offscreen or downgraded spinner holds no animation family at all, so an idle page
  pays nothing for a spinner that is still mounted.

## Notes for AI

- Use `spinner` for an action, `skeleton` for a layout. Getting this backwards is the
  most common loading-state mistake: a skeleton in a button, or a spinner where the
  content shape was known all along.
- Keep the button's text; add the spinner in front of it and disable the button.
- Under `data-motion="none"` the icon stays visible. Do not hide it to "respect" the
  preference — the state still has to be visible.

---

Full index: https://cadence.dev/llms.txt
