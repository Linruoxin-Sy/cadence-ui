# Carousel

> A swipeable collection with previous and next controls.

- Registry item: https://cadence.dev/r/carousel.json
- Install: `npx shadcn@latest add @cadence/carousel`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/carousel
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority embla-carousel-react@8.6.0 lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
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
| carousel | `@components/cadence/carousel/index.tsx` | [JSON files[].content](https://cadence.dev/r/carousel.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: carousel](https://cadence.dev/r/carousel.json)

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

Copy all ten target files, including every file from the motion and provider
helpers, into the same `cadence/` tree so their relative imports resolve.
Preserve the sources' `"use client"` directives and the exact
`embla-carousel-react@8.6.0` pin: the motion policy integrates with that
engine's internals. Complete the base theme setup linked above and ensure
Tailwind scans the copied files. No additional item-specific CSS is required.
The provider files are required imports; an application wrapper is optional.
Standalone components follow the system motion preference. Use
`CadenceProvider` to control a subtree as shown above.

Usage, Multiple visible slides, Vertical collection, Looping, Right-to-left,
Drag behavior, Alignment and initial position, and Without motion use
serializable props and children and can be composed in a Server Component.
Changing slides needs a client caller for state and handlers. API and plugins
needs a client caller for hooks, `setApi`, plugin lifecycle functions and
external navigation; Custom controls needs one for `useCarousel` and its
handlers. Refs, function-valued options and Button render/state callbacks
also require a client caller. Button and CadenceProvider are already included
in this installation graph; the top preview and examples need no additional
component or example-only npm dependencies.

Keep CarouselContent and CarouselItem inside Carousel; call `useCarousel`
only beneath that root. Supply stable slide keys, a region label, slide labels,
and any current-slide announcement yourself. The root is not focusable by
default: supply `tabIndex={0}` and a visible focus style when needed. Both
orientations use ArrowLeft / ArrowRight; native navigation buttons support
Enter / Space. Interactive slide content must accommodate that root capture
handler. Offscreen slides remain mounted and accessible.

Constrain the parent width, size slides with basis classes, and leave space
for the outboard controls. CarouselContent props, classes and ref address
the inner track, not its fixed overflow-hidden viewport. Horizontal tracks
use `touch-pan-y`; vertical tracks need an explicit height and
`touch-pan-x`. Set `orientation="vertical"` to select that axis; it takes
precedence over `opts.axis`. RTL needs both native `dir="rtl"` and
`opts.direction="rtl"`; the default control positions and icons stay as shown.

SSR renders static markup; Embla initializes its position and options after
hydration. Embla owns track translation, snapping, drag, loop, focus, resize
and slide-mutation handling. Navigate through its API rather than adding a
second transform or CSS transition to the track. Full mode interpolates;
reduced and none keep the correct slide position and direct pointer tracking
while making autonomous engine interpolation immediate. A live downgrade
settles the existing target without resetting selection. Button retains its
own press-feedback policy.

Keep plugin instances stable and clean up API subscriptions. The caller owns
data updates, external selection/status, and independent plugin animation or
autoplay; pause those under reduced/none and provide pause controls. Carousel
does not bundle autoplay, data fetching or virtualization. Caller overrides
of navigation `onClick`, `disabled`, or root `onKeyDownCapture` replace the
corresponding defaults, so preserve the intended navigation yourself.

## Usage

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";
export function BasicExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Project highlights"
        tabIndex={0}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

## Multiple visible slides

Size slides with caller classes. This fixed layout shows two at `md` and one on narrow screens; the collection remains finite and uses start alignment.

<ComponentExample name="multiple" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function MultipleExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Project pairs"
        tabIndex={0}
        opts={{ align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`} className="md:basis-1/2">
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

## Vertical collection

Set `orientation="vertical"`, an explicit track height, and `touch-pan-x`. The pinned keyboard capture still uses ArrowLeft / ArrowRight on this axis; ArrowUp / ArrowDown are not carousel commands.

<ComponentExample name="vertical" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function VerticalExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Vertical updates"
        tabIndex={0}
        orientation="vertical"
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="h-40 touch-pan-x">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

## Looping

This fixed loop wraps in both directions. Embla may disable looping if there is too little content to fill the viewport; four full-width slides provide sufficient content here.

<ComponentExample name="looping" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function LoopingExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Looping projects"
        tabIndex={0}
        opts={{ loop: true, align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

## Right-to-left

Set both native `dir="rtl"` and `opts.direction="rtl"`. The pinned controls still mean previous / next in collection order; their icons and physical positions are not automatically mirrored.

<ComponentExample name="rtl" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function RtlExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="RTL projects"
        tabIndex={0}
        opts={{ direction: "rtl", align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        dir="rtl"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

## Drag behavior

Compare default snap dragging, `dragFree`, and `watchDrag: false` directly. Reduced/none preserve direct pointer tracking and stop autonomous release interpolation. Free drag can stop between snaps; the buttons still navigate normally.

<ComponentExample name="drag" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function DragExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <div className="grid gap-3">
          <p className="text-sm font-medium">Snapping drag</p>
          <Carousel
            aria-label="Snapping drag"
            tabIndex={0}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Free drag</p>
          <Carousel
            aria-label="Free drag"
            tabIndex={0}
            opts={{ dragFree: true }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Buttons only</p>
          <Carousel
            aria-label="Buttons only"
            tabIndex={0}
            opts={{ watchDrag: false }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
```

## Changing slides

These two caller-owned updates are limited to this example. Resize changes the real parent width; Change slides adds/removes the last keyed slide. Embla observes geometry and slide mutations and rebuilds its snaps. Existing slide DOM stays mounted; removing the selected last item clamps to a valid snap.

<ComponentExample name="changing-slides" />

```tsx
"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";
import { Button } from "@/components/cadence/button";
import { useState } from "react";

export function ChangingExample() {
  const [narrow, setNarrow] = useState(false);
  const [count, setCount] = useState(4);
  return (
    <div className="grid w-full max-w-lg gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setNarrow(!narrow)}>
          Resize track
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount(count === 4 ? 5 : 4)}>
          Change slides
        </Button>
      </div>
      <div className="px-12 py-12">
        <Carousel
          aria-label="Changing projects"
          tabIndex={0}
          opts={{ align: "start" }}
          className={`${narrow ? "mx-auto w-3/4" : "w-full"} outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        >
          <CarouselContent className="touch-pan-y">
            {[1, 2, 3, 4, 5].slice(0, count).map((slide) => (
              <CarouselItem key={slide} aria-label={`${slide} of ${count}`}>
                <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}
```

## API and plugins

Use the real Embla API for external navigation and subscribe with cleanup. A stable lifecycle-only plugin reports readiness without adding animation. This example also keeps a native narrow-screen duration override; reduced/none clamp its interpolation. Install Button for the external action.

<ComponentExample name="api" />

```tsx
"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";
import { Button } from "@/components/cadence/button";
import { useEffect, useMemo, useState } from "react";
import type { CarouselApi } from "@/components/cadence/carousel";

export function ApiExample() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [ready, setReady] = useState(false);
  const plugins = useMemo(
    () => [
      {
        name: "exampleStatus",
        options: {},
        init() {
          setReady(true);
        },
        destroy() {
          setReady(false);
        },
      },
    ],
    [],
  );
  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap() + 1);
    update();
    api.on("select", update).on("reInit", update);
    return () => {
      api.off("select", update).off("reInit", update);
    };
  }, [api]);
  return (
    <div className="grid w-full max-w-lg gap-4">
      <Button size="sm" variant="outline" onClick={() => api?.scrollTo(3, false)}>
        Go to last slide
      </Button>
      <div className="px-12 py-12">
        <Carousel
          aria-label="API projects"
          tabIndex={0}
          className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          setApi={setApi}
          plugins={plugins}
          opts={{ breakpoints: { "(max-width: 480px)": { duration: 37 } } }}
        >
          <CarouselContent className="touch-pan-y">
            {[1, 2, 3, 4].map((slide) => (
              <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <p role="status" className="text-center text-sm text-muted-foreground">
        Slide {current} of 4{ready ? " · Ready" : ""}
      </p>
    </div>
  );
}
```

The API is the actual Embla 8.6.0 instance, including events, `reInit`, `plugins`, `scrollTo`, `scrollProgress`, and `destroy`. Keep plugin instances stable. Plugins are not removed by motion mode changes: pause autoplay and independent plugin animation under reduced/none yourself and provide pause controls. Cadence clamps engine interpolation even when an API or plugin requests `jump=false`.

## Alignment and initial position

Compare `start`, `center`, and `end` with a fixed `startIndex: 1`. Each slide is two-thirds width and `containScroll: false` preserves the requested edge alignment instead of trimming the endpoint snaps. Arbitrary Embla options are pass-through configuration, not additional Cadence variants.

<ComponentExample name="alignment" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function AlignmentExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: start</p>
          <Carousel
            aria-label="Align start"
            tabIndex={0}
            opts={{ align: "start", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: center</p>
          <Carousel
            aria-label="Align center"
            tabIndex={0}
            opts={{ align: "center", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: end</p>
          <Carousel
            aria-label="Align end"
            tabIndex={0}
            opts={{ align: "end", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
```

## Custom controls

Use `useCarousel` inside the root for caller-owned controls with native disabled states. This horizontal row replaces the default outboard buttons; Button retains its own motion contract. The hook throws outside a Carousel.

<ComponentExample name="custom-controls" />

```tsx
"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";
import { Button } from "@/components/cadence/button";
import { useCarousel } from "@/components/cadence/carousel";

function ProjectControls() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button size="sm" variant="outline" disabled={!canScrollPrev} onClick={scrollPrev}>
        Earlier project
      </Button>
      <Button size="sm" disabled={!canScrollNext} onClick={scrollNext}>
        Later project
      </Button>
    </div>
  );
}

export function CustomControlsExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Custom project controls"
        tabIndex={0}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <ProjectControls />
      </Carousel>
    </div>
  );
}
```

## Without motion

The first collection explicitly fixes `mode="none"`; its position updates immediately while dragging remains available. The second explicitly restores full mode inside this example, still respecting the system reduced-motion preference. Other examples inherit the header. Install the provider from `@cadence/cadence-provider`.

<ComponentExample name="without-motion" />

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function WithoutMotionExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <CadenceProvider mode="none">
          <div className="grid gap-3">
            <p className="text-sm font-medium">Fixed none</p>
            <Carousel
              aria-label="Immediate projects"
              tabIndex={0}
              className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CarouselContent className="touch-pan-y">
                {[1, 2, 3, 4].map((slide) => (
                  <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                    <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </CadenceProvider>
        <CadenceProvider mode="full">
          <div className="grid gap-3">
            <p className="text-sm font-medium">Nested full</p>
            <Carousel
              aria-label="Nested full projects"
              tabIndex={0}
              className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CarouselContent className="touch-pan-y">
                {[1, 2, 3, 4].map((slide) => (
                  <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                    <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </CadenceProvider>
      </div>
    </div>
  );
}
```

## When to use

- Browse a short collection of related projects, cards or photos.
- Show one highlighted item with explicit previous/next navigation.
- Allow touch swiping alongside keyboard and button navigation.

## When not to use

- Use Tabs for named views that must remain directly selectable.
- Use Scroll Area for continuous reading or long lists.
- Keep essential content discoverable without relying on automatic advance.

## API

| Part | Contract |
| --- | --- |
| Root | Native div props/ref; `orientation="horizontal"` (or `vertical`); `opts` and `plugins` use Embla types; `setApi(api)` receives the public instance. |
| Track | Native div props/ref/style/classes target the **inner track**. Its fixed overflow-hidden outer viewport owns the `carousel-content` slot and Embla ref. |
| Slide | Native div props/ref; group/slide semantics. Default full basis; caller classes size each slide. |
| Previous / Next | All Button props, including render, ref, state callback classes/styles and events. Defaults: outline, icon-sm. Caller disabled/onClick override the navigation defaults as upstream does. |
| Context hook | Context with API, viewport ref, original options, orientation, navigation functions and canScroll states. Throws outside Carousel. |
| API type | Exported Embla instance type (possibly undefined before initialization). |

The fixed Base UI API and new-york-v4 visuals are pinned at `96da9cc7f1aa`.
Navigation buttons retain the Base API's icon-sm default with the visual source's round size-8
shape. Orientation controls the axis even if opts.axis differs, as upstream does. Options such
as startIndex, align, loop, dragFree, watchDrag, breakpoints and direction pass to Embla.
For RTL set both native `dir="rtl"` and `opts.direction="rtl"`.

## Motion contract

Authored intensity is **medium**: The existing Embla owner slides the collection while native drag and final slide position remain authoritative.

| Phase | Recipe | Behaviour |
| --- | --- | --- |
| Enter / exit | — | No authored entrance or removal animation. |
| Interaction | `data.transition/one-shot` | `data.transition/one-shot`, engine form: Embla alone translates the track. Default duration.base maps to 22 attraction units via carouselClock; timeScale scales it. Explicit full-mode opts.duration remains native. |
| Interruption | — | Next/previous/drag retarget Embla's existing location and velocity. Release uses the effective base clock, including breakpoint options, instead of a hard-coded release duration. |
| Reduced | — | Track and loop relocation transforms retain the correct state position. Direct dragging remains available. All autonomous engine interpolation is zero; no CSS/Motion transform animation is added. |
| None | — | Same immediate state positioning, with every engine duration zero even for explicit API/plugin duration requests. |
| Buttons | — | Composed Button owns its declared feedback.press recipe; reduced/none remove press scale. Static control placement/vertical rotation are layout. |

A mode downgrade settles autonomous navigation without resetting selection. A held drag keeps its
native position and ownership; its release reaches the current engine target immediately. Local authored
tokens and effective overrides supply the default clock, while real API reInit/breakpoint/plugin options
retain their native precedence. Mode and clock edits keep the instance and plugin identities.
Hidden/offscreen, print and forced-colours cancel owned settling without replay on restoration. Engine friction,
geometry and momentum destinations remain Embla-owned. Independent plugin animations remain
caller-owned. Removing the track transform would display the wrong slide and is not reduction.

## Keyboard and accessibility

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Reach native controls and any focusable slide content. |
| Enter / Space | Activate a focused navigation button. |
| ArrowLeft / ArrowRight | Previous / next from inside the region, on both orientations (pinned upstream behaviour). |

Supply a region label and per-slide labels, and optionally a polite status as in the preview.
The root is not focusable by default; use tabIndex and a visible focus class when desired.
Embla scrolls focused offscreen slide content into view. Caller onKeyDownCapture replaces the
upstream capture handler; caller onClick similarly replaces the navigation action. This is not
a tab widget and does not hide offscreen content from assistive technology. Avoid interactive
content whose arrow handling conflicts with the root capture handler.

## Responsiveness and performance

Size slides with basis utilities and pair inner negative margins with slide padding. Vertical
tracks require an explicit height. Set touch-pan-y on horizontal tracks and touch-pan-x on
vertical tracks to preserve cross-axis page scrolling. Leave room for controls outside the viewport.
Embla observes viewport/slide geometry and slide mutations, reinitializing snaps as needed;
options/plugins reinitialize through the native React adapter. No layout reads happen in render.
SSR renders static first-slide markup, then Embla initializes after hydration. No autoplay,
virtualization or per-slide Motion instances are bundled. Only track transforms animate.

## Notes for AI

- Preserve opts, plugins, setApi, useCarousel and all native part props when adapting examples.
- Use the exposed Embla API for selection rather than applying another transform to the track.
- Keep selected position under reduced/none; assert the lack of interpolation, not transform:none.
- Use Button for individual actions, Tabs for directly named panels, and Scroll Area for long content.

---

Full index: https://cadence.dev/llms.txt
