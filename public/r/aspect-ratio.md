# Aspect Ratio

> Images, videos, and embeds that must keep their shape.

- Registry item: https://cadence.dev/r/aspect-ratio.json
- Install: `npx shadcn@latest add @cadence/aspect-ratio`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: enter.pop, exit.fade, geometry.resize, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/aspect-ratio
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
| aspect-ratio | `@components/cadence/aspect-ratio/index.tsx` | [JSON files[].content](https://cadence.dev/r/aspect-ratio.json) |
| aspect-ratio | `@components/cadence/lib/aspect-ratio-layout.ts` | [JSON files[].content](https://cadence.dev/r/aspect-ratio.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: aspect-ratio](https://cadence.dev/r/aspect-ratio.json)

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

Keep `aspect-ratio/index.tsx`, `lib/aspect-ratio-layout.ts` and the shared `motion`,
`provider`, `geometry` and `surface-presence` files at the listed relative paths. The
wrapper keeps its own ratio geometry and surface paint, so Aspect Ratio needs no other
registry item. An optional provider controls its mode.

Aspect ratio is a client component: it keeps one opacity channel, one measured size
axis and one scoped surface palette on the reserved wrapper, and needs the `motion`
runtime. Keep the source's `"use client"` directive. The Usage and body examples
render this client part from a Server Component in Next.js App Router; they do not
add event handlers.

Pass a positive numeric `ratio` such as `16 / 9`; there is no default. The component
writes `--ratio` for Tailwind v4's `aspect-(--ratio)` utility. Give the parent an
appropriate width, then size and crop the media child with classes such as
`size-full object-cover`. The caller supplies the media's accessible name, such as
image `alt`, video `aria-label` or iframe `title`.

Usage, Square, Video, Multiple ratios in one grid and the top preview need no
additional components or npm packages. Supply your own `/cover.jpg` for Usage.
Square and the grid include inline SVG image data; Video uses native media controls,
an inline poster and caption track, and an external MDN sample clip with
`preload="none"` and no autoplay. Replace the clip and provide captions for your own
spoken content. These media assets are caller-owned, with no extra media package
required.

## Usage

```tsx
import { AspectRatio } from "@/components/cadence/aspect-ratio";

export function Cover() {
  return (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
      <img src="/cover.jpg" alt="Dashboard preview" className="size-full object-cover" />
    </AspectRatio>
  );
}
```

## Square

Use a ratio of `1` for a square crop. The image fills the reserved frame with `object-cover`; the ratio box owns layout, while the child owns its crop and accessible name. This self-contained illustration can be replaced by your own image.

<ComponentExample name="square" />

```tsx
"use client";

import { AspectRatio } from "@/components/cadence/aspect-ratio";

export function SquareImage() {
  return (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1} className="overflow-hidden rounded-full">
        <img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E" alt="Illustrated mountains under a golden sun" className="size-full object-cover" />
      </AspectRatio>
    </div>
  );
}
```

## Video

A `16 / 9` frame reserves room for video before it loads. Native controls belong to the media itself and stay usable; there is no autoplay. This silent sample loads from MDN only when requested. Replace its source with your own clip and supply captions when it contains speech.

<ComponentExample name="video" />

```tsx
"use client";

import { AspectRatio } from "@/components/cadence/aspect-ratio";

export function VideoFrame() {
  return (
    <div className="w-full max-w-md">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
        <video controls preload="none" aria-label="Silent flower video" poster="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E" className="size-full object-cover">
          <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
          <track kind="captions" label="No spoken audio" srcLang="en" src="data:text/vtt,WEBVTT%0A%0A" default />
          Your browser does not support video playback.
        </video>
      </AspectRatio>
    </div>
  );
}
```

## Multiple ratios in one grid

`ratio` accepts a positive numeric width divided by height, rather than a finite list of variants. Here `4 / 3`, `1`, and `3 / 4` reserve different shapes at the same column width. The parent chooses columns and narrow-screen wrapping; media loading does not determine the frame heights.

<ComponentExample name="grid" />

```tsx
"use client";

import { AspectRatio } from "@/components/cadence/aspect-ratio";

export function RatioGrid() {
  const image = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E";
  return (
    <div className="grid w-full max-w-lg grid-cols-1 items-start gap-4 sm:grid-cols-3">
      {[{ ratio: 4 / 3, label: "4 : 3" }, { ratio: 1, label: "1 : 1" }, { ratio: 3 / 4, label: "3 : 4" }].map(({ ratio, label }) => (
        <figure key={label} className="grid gap-2">
          <AspectRatio ratio={ratio} className="overflow-hidden rounded-md">
            <img src={image} alt="Illustrated mountains and sun" className="size-full object-cover" />
          </AspectRatio>
          <figcaption className="text-center text-xs text-muted-foreground">{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
```

## Switching the ratio

Changing `ratio` on a mounted box is the one intentional geometry change this
component owns. The wrapper interpolates the physical dimension the new ratio moved
and leaves the definite width with its parent; the media keeps `object-cover` so each
intermediate frame crops instead of stretching. Reduced mode commits the final box
before paint, and none mode does the same with no delay at all.

<ComponentExample name="switch" />

```tsx
"use client";

import { useState } from "react";
import { AspectRatio } from "@/components/cadence/aspect-ratio";

export function RatioSwitch() {
  const [wide, setWide] = useState(true);
  const image = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 240%22%3E%3Crect width=%22320%22 height=%22240%22 fill=%22%23334155%22/%3E%3Ccircle cx=%22240%22 cy=%2264%22 r=%2228%22 fill=%22%23fbbf24%22/%3E%3Cpath d=%22M0 240V180L100 80L240 240ZM120 240L240 120L320 200V240Z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E";
  return (
    <div className="grid w-full max-w-md gap-3">
      <AspectRatio ratio={wide ? 16 / 9 : 1} className="overflow-hidden rounded-lg bg-muted">
        <img src={image} alt="Illustrated mountains and sun" className="size-full object-cover" />
      </AspectRatio>
      <button type="button" onClick={() => setWide((current) => !current)} className="justify-self-start rounded-md border px-3 py-1.5 text-sm">
        {wide ? "Square it" : "Widen it"}
      </button>
    </div>
  );
}
```

## When to use

- An image, video, or embed whose intrinsic size is unknown until it loads.
- A thumbnail grid that must not reflow as the images arrive.
- A placeholder that will be replaced by media of a known shape.

## When not to use

- Fixed-size icons or avatars; give them a size and be done.
- Text blocks. A ratio box around text clips exactly the content that needs to grow.
- A container whose height should follow its content — that is a normal block.

## API

| Prop        | Type     | Default | Description                                            |
| ----------- | -------- | ------- | ------------------------------------------------------ |
| `ratio`     | `number` | –       | Width ÷ height. Required — there is no sensible default. |
| `className` | `string` | –       | Merged last; `overflow-hidden` and the radius go here.  |

The ratio is written as `--ratio`, and the box uses `aspect-(--ratio)`. Your own
`style` is preserved: the custom property is merged after it.

## Motion contract

Authored intensity is **subtle**: Aspect Ratio fades its own reserved wrapper, interpolates the one physical dimension a ratio change moved and transitions an authored wrapper surface; media decode and parent resizing keep native ownership.

| Cause / owner | Recipe / form | Full | Reduced | None |
| --- | --- | --- | --- | --- |
| Independent insertion / wrapper | `enter.pop/one-shot` | Opacity entrance, reserved space already final | Short opacity | Immediate |
| Retained removal / wrapper | `exit.fade/one-shot` | One wrapper fade on the retained host | Short opacity | Immediate |
| `ratio` changes / wrapper | `geometry.resize/measured` | One dependent physical axis interpolated | Final ratio geometry immediately | Immediate |
| Authored wrapper surface changes | `state.color/css-transition` | Scoped surface colour | Short colour | Immediate |

Only the axis the new ratio actually moved is animated; the definite dimension stays
with its owner and the CSS ratio is never tweened. When the axis settles, the pixel
constraint is released so later parent constraints recompute native geometry. Give
the media `object-cover`, `object-contain`, `object-none` or `object-scale-down` so an
intermediate frame crops rather than stretches it; `object-fit: fill`, a caller
transition on the same axis, a `content-box` wrapper, an `auto`/content-derived ratio
and an unknown or zero frame each commit that axis immediately.

Mount the wrapper inside `AnimatePresence` to retain its exit; without a surviving
owner, removal is immediate. A retained exit keeps the original media subtree, so
focus, form participation and media resources stay with the parent. Re-entering the
same wrapper retargets the current opacity instead of replaying the entrance. Rapid
ratio changes retarget from the current presentation, and a simultaneous parent
resize or writing-mode change invalidates the old axis measurement. Live reduction
finishes geometry before paint; none and a zero clock also cancel fades and colour.

Image decode, video loading and responsive reflow never restart the entrance or
reset the ratio. Descendant text and interactive children keep their own colour
owners; the wrapper only transitions the surface palette it paints.

## Accessibility

- The box is a layout element with no role. Put the meaning on the media: a real
  `alt` on images, a `title` on iframes.
- A background-only ratio box (no media yet) is decorative — keep it empty, or give
  it `aria-hidden` if it would otherwise be an empty accessible node.
- Media that animates (autoplay video, GIF) counts against both the CLS budget and
  the reduced-motion contract; pause or replace it under
  `prefers-reduced-motion`.

## Responsiveness and performance

The frame derives height from its available width and ratio. Give it a constrained parent and size
media to fill the frame; the caller owns breakpoint-specific ratios and image loading.

Server-rendered markup reserves the final box, so the media cannot shift the layout while it loads.
The wrapper contributes one bounded measurement, one size writer and one border-box observer; it
never measures descendants or intercepts image decode. Interactive children and application handlers
still need their own client code, and server-rendered markup does not imply that every interaction
works without JavaScript. Source and bundle limits remain advisory during the Motion v2 functional
migration (ADR-023) and are reassessed separately; this item renders no interpolating property in
reduced or none mode.

## Notes for AI

- Always pass a `ratio`; `16 / 9` for video, `1` for avatars, `4 / 3` for photos.
- Put `object-cover` on the child, not on the ratio box. The box only reserves
  space; the child fills it.

---

Full index: https://cadence.dev/llms.txt
