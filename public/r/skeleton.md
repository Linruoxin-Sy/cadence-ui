# Skeleton

> Placeholders while cards, tables, and lists load.

- Registry item: https://cadence.dev/r/skeleton.json
- Install: `npx shadcn@latest add @cadence/skeleton`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/skeleton
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
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
| skeleton | `@components/cadence/skeleton/index.tsx` | [JSON files[].content](https://cadence.dev/r/skeleton.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: skeleton](https://cadence.dev/r/skeleton.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Keep `skeleton/index.tsx` and all shared `lib/` files at the listed relative paths,
including every file in the motion and provider items. Preserve the `"use client"`
directives. Skeleton uses a CSS opacity pulse, but its `useCadenceMotion` import
still requires the shared provider files and their `motion` dependency. Wrapping
the application in `CadenceProvider` is optional; without it, Skeleton follows the
system motion preference.

Full and reduced modes both keep Tailwind's `animate-pulse` opacity loop. None
uses `animate-none` and keeps the placeholder at full opacity. The loop clock is
the theme's `--animate-pulse` token; provider `timeScale` does not change it.
Without motion uses the included provider with `mode="none"`, so that example is
static from the server render. No additional item-specific CSS is required beyond
the base theme and Tailwind utilities.

Swapping in the real content also uses [Button](/components/button). Install it
when using that example:

```install
npx shadcn@latest add @cadence/button
```

For a manual Button installation, follow its Manual tab as well; it adds
`@base-ui/react` and `class-variance-authority` alongside the shared dependencies
already listed here. Keep the example's `"use client"` directive for React state.
Usage, Text lines, Avatar and name, Without motion and the top preview need no
other registry items, npm packages or image assets. Their shapes use Skeleton and
native elements; Avatar and name does not import the Avatar component. The caller
owns sizes and loading state: set `aria-busy` on the containing region and reserve
space for the loaded content. The site's preview frame is not consumer setup.

## Usage

```tsx
import { Skeleton } from "@/components/cadence/skeleton";

export function CardPlaceholder() {
  return (
    <div className="grid w-full max-w-sm gap-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
```

## Text lines

Match line lengths to the incoming paragraph and put the busy state on the containing region. These blocks are decorative and do not receive focus.

<ComponentExample name="text-lines" />

```tsx
import { Skeleton } from "@/components/cadence/skeleton";

export function TextLines() {
  return (
    <div className="grid w-full max-w-sm gap-2" role="status" aria-busy="true" aria-label="Loading paragraph">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}
```

## Avatar and name

A circular block and two short lines reserve the shape of a person row. The caller chooses sizes; Skeleton has no size or shape variants.

<ComponentExample name="avatar-name" />

```tsx
import { Skeleton } from "@/components/cadence/skeleton";

export function AvatarAndName() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3" role="status" aria-busy="true" aria-label="Loading person">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
```

## Swapping in the real content

The application owns loading and the response. Load profile simulates that response; Reload profile returns to the placeholder. Keep the region mounted and reserve its height while only its children change. The action remains outside the busy region so it stays available.

<ComponentExample name="swap-content" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Skeleton } from "@/components/cadence/skeleton";

export function SwappingContent() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <section aria-label="Profile" aria-busy={loading} aria-live="polite" className="flex min-h-14 items-center gap-3">
        {loading ? (
          <>
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="grid gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </>
        ) : (
          <>
            <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm">AL</div>
            <div className="grid text-sm"><strong>Ada Lovelace</strong><span>Engineer</span></div>
          </>
        )}
      </section>
      <Button variant="outline" size="sm" onClick={() => setLoading((value) => !value)}>
        {loading ? "Load profile" : "Reload profile"}
      </Button>
    </div>
  );
}
```

## Without motion

This one example explicitly fixes its provider to `none`, including the server render and first paint. The shape stays at full opacity with no animation even when the header is full. All other examples inherit the header; reduced keeps their opacity pulse.

<ComponentExample name="without-motion" />

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Skeleton } from "@/components/cadence/skeleton";

export function StaticSkeleton() {
  return (
    <CadenceProvider mode="none">
      <div className="w-full max-w-sm" role="status" aria-busy="true" aria-label="Loading without motion">
        <Skeleton className="h-4 w-full" />
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A first load longer than about 300 ms, where the shape of the incoming content is
  known: a card, a table row, a list item, a comment.
- A region that swaps content in place, so the layout does not jump when the real
  content arrives.
- A page that renders several independent regions which resolve at different times.

## When not to use

- A wait under 300 ms. The placeholder appears and disappears before it can be
  read, which reads as a flicker.
- An action the user just triggered (a save, a submit); use the button's own busy
  state or a `spinner`, so the feedback lands where the user is looking.
- Content whose shape you do not know. A placeholder that is the wrong shape is
  worse than a spinner: it promises a layout that never arrives.

## API

| Prop        | Type     | Default | Description                                        |
| ----------- | -------- | ------- | -------------------------------------------------- |
| `className` | `string` | –       | Merged last — the shape (`h-4 w-2/3`) lives here.   |

All native `div` props are forwarded. `data-slot="skeleton"` and `data-motion` are
always set.

## Motion contract

Recipe: `data.transition`, a continuous opacity loop. It is implemented in CSS
(`animate-pulse`) rather than in Motion, because a page can render dozens of
placeholders and each Motion loop costs a frame callback; the pulse only touches
`opacity`, so it can never trigger layout.

| Phase   | Properties                | Token                          | Interruptible |
| ------- | ------------------------- | ------------------------------ | ------------- |
| pulse   | `opacity 1 → 0.5 → 1`     | `data.transition` / `animate-pulse` (theme timing) | yes (CSS)     |
| reduced | same pulse, opacity only  | `animate-pulse`                | yes (CSS)     |
| none    | no animation; full opacity | `animate-none`                 | –             |

Reduced keeps the pulse on purpose: M5 removes travel and scale, not opacity, and a
static grey block is easier to mistake for content that already loaded. `none`
stops it completely, which is what a screenshot test or a print stylesheet needs.

## Keyboard interactions

None. A skeleton is not focusable and never receives input; focus stays on whatever
the user was doing when the region started loading.

## Accessibility

- The skeleton itself is decorative: its text is nothing, so it is not announced.
- The **region** owns the state: `aria-busy="true"` while loading, removed when done.
  Add `aria-live="polite"` there only if the region resolves without any other
  change the user would notice.
- Shape is a promise. Keep the placeholder's height close to the real content, or
  the swap reintroduces exactly the layout shift the skeleton was meant to avoid.
- Under `data-motion="none"` the block stays visible at full opacity: the loading
  state is still communicated by shape and by `aria-busy`, never by motion alone.

## Responsive behavior

A skeleton takes its size from utilities, so it follows whatever grid it is dropped
into. Avoid a hard-coded pixel height on a full-width block; use a ratio
(`aspect-video`) or a relative height so the placeholder matches the real card at
every breakpoint.

## Performance

- One CSS animation per element, on `opacity` only; no JS loop, no layout read.
- The pulse is compositor-friendly, but the animation-system budget still applies:
  fewer than twenty simultaneously animating elements. For a long list, render one
  placeholder row per screen rather than one per future row.
- No `will-change`: the browser promotes an opacity animation on its own.

## Notes for AI

- Never animate a skeleton into the real content with a custom cross-fade; swap the
  children and let the container's height stay put.
- Put the loading state on the region (`aria-busy`), not on each block.
- Do not use a skeleton as a generic "loading…" indicator for an action; a `spinner`
  next to the control is clearer.

---

Full index: https://cadence.dev/llms.txt
