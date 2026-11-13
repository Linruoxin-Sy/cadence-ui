# Avatar

> People in comments, assignees, and member lists.

- Registry item: https://cadence.dev/r/avatar.json
- Install: `npx shadcn@latest add @cadence/avatar`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, exit.fade, geometry.resize, text.change, number.roll, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/avatar
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react
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
| avatar | `@components/cadence/avatar/index.tsx` | [JSON files[].content](https://cadence.dev/r/avatar.json) |
| avatar | `@components/cadence/lib/avatar-layout.ts` | [JSON files[].content](https://cadence.dev/r/avatar.json) |
| avatar | `@components/cadence/lib/empty-media.ts` | [JSON files[].content](https://cadence.dev/r/avatar.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: avatar](https://cadence.dev/r/avatar.json)

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

Keep `avatar/index.tsx`, `lib/avatar-layout.ts` and `lib/empty-media.ts` at the listed
relative paths so the shared imports resolve. Preserve the component's `"use client"`
directive: `@base-ui/react/avatar` manages image loading, errors and fallback visibility
after hydration. Avatar installs the shared motion, provider, geometry, text and number
registry items; its own motion is a presence fade, a measured size change, changed-run
text and a scoped palette, all subject to the provider's full/reduced/none mode.

`AvatarBadge`, `AvatarGroup` and `AvatarGroupCount` are exports from the same Avatar
file. Use them directly from the Usage import path; no separate Badge or group
component installation is needed. Include `AvatarFallback` with meaningful initials
and supply image `alt` text, or `alt=""` when an adjacent name already identifies
the person. Give a meaningful presence badge a text alternative such as the
`sr-only` span in Presence, including when the small size hides its icon.

Usage needs your own `/ada.png`. Image and fallback uses an external GitHub image,
deliberately invalid image data to demonstrate failure, and an avatar without an
image. Replace those sources with your own assets; Base UI switches between image
and fallback natively as availability changes. A source swap on a retained image
layer (`keepMounted`) fades the newly current paint; the initial availability swap
never fades. The top preview uses inline SVG portrait data, initials and a presence
dot with a native `sr-only` span. Sizes and Group use initials only. These examples
need no additional npm packages beyond the installed registry items; the site's
preview frame is not part of the consumer setup.

The Presence example additionally imports `CheckIcon` from `lucide-react`. Install
it only when copying that example; it is not an Avatar dependency:

```package-manager
npm install lucide-react
```

## Usage

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/cadence/avatar";

export function Author() {
  return (
    <Avatar>
      <AvatarImage src="/ada.png" alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}
```

## Sizes

`size` sets `data-size` on each root. Small, default and large are 24, 32 and 40 CSS pixels; children follow their own root rather than a shared page setting.

<ComponentExample name="sizes" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarSizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
```

## Image and fallback

Always include a fallback. The first avatar shows initials while its image loads, then the image replaces them. The second deliberately supplies invalid image bytes to demonstrate an error; the third has no image at all. Base UI owns this loading state and swaps availability natively; a changed source on a retained image layer fades the newly current paint instead of replaying the fallback.

<ComponentExample name="image-fallback" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarImageAndFallback() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="shadcn">
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
        <span>Image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Grace Hopper">
          <AvatarImage src="data:image/png;base64,invalid" alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <span>Failed image</span>
      </div>
      <div className="grid justify-items-center gap-2 text-sm">
        <Avatar aria-label="Ada Lovelace">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <span>No image</span>
      </div>
    </div>
  );
}
```

## Changing identity and size

A changed source on a retained image layer fades the new paint in; `keepMounted` keeps
that layer mounted so Base UI does not remount it. An explicit `size` change interpolates
the measured box and a direct numeric count reels, while a formatted `+3` string stays
text. The controls revise one specimen without replacing it; they use the Button item.

<ComponentExample name="changing" />

```tsx
"use client";

import { useState } from "react";
import {
  Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";
import { Button } from "@/components/cadence/button";

export function AvatarChanging() {
  const [large, setLarge] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const [count, setCount] = useState(1);
  const person = alternate
    ? { src: "/grace.svg", initials: "GH", name: "Grace Hopper" }
    : { src: "/ada.svg", initials: "AL", name: "Ada Lovelace" };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <Avatar size={large ? "lg" : "default"} aria-label={person.name}>
          <AvatarImage src={person.src} alt={person.name} keepMounted />
          <AvatarFallback>{person.initials}</AvatarFallback>
        </Avatar>
        <AvatarGroup aria-label="Reviewers">
          <AvatarGroupCount aria-label={`${count} more reviewers`}>{count}</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => setAlternate((value) => !value)}>Swap identity</Button>
        <Button variant="outline" onClick={() => setLarge((value) => !value)}>Toggle size</Button>
        <Button variant="outline" onClick={() => setCount((value) => value + 1)}>Add reviewer</Button>
      </div>
    </div>
  );
}
```

## Presence

A badge is presence feedback, not a loading pulse. Its dot follows the root size and only fades on its own insertion or removal; a supplied icon is hidden at the smallest size. Keep a text alternative even when the icon disappears.

<ComponentExample name="presence" />

```tsx
import { CheckIcon } from "lucide-react";
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarPresence() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Ada Lovelace, ${size}`}>
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge>
            <CheckIcon aria-hidden="true" />
            <span className="sr-only">Online</span>
          </AvatarBadge>
        </Avatar>
      ))}
    </div>
  );
}
```

## Group

Group overlaps a short list and leaves overflow counting to the caller. Give all members of a group the same size; the count tile follows that group. These three independent groups show the supported sizes without linking their state.

<ComponentExample name="group" />

```tsx
import {
  Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage,
} from "@/components/cadence/avatar";

export function AvatarGroups() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <AvatarGroup key={size} aria-label={`Reviewers, ${size}`}>
          <Avatar size={size} aria-label="Ada Lovelace"><AvatarFallback>AL</AvatarFallback></Avatar>
          <Avatar size={size} aria-label="Grace Hopper"><AvatarFallback>GH</AvatarFallback></Avatar>
          <Avatar size={size} aria-label="Katherine Johnson"><AvatarFallback>KJ</AvatarFallback></Avatar>
          <AvatarGroupCount aria-label="3 more reviewers">+3</AvatarGroupCount>
        </AvatarGroup>
      ))}
    </div>
  );
}
```

## When to use

- A person or an entity next to content they own: a comment, an assignee, a commit.
- A stack of participants, with a `+3` tile for the rest.
- A presence indicator on a collaborator, via `AvatarBadge`.

## When not to use

- A logo that must stay legible at small sizes; use the image with a fixed box.
- A decorative illustration; avatars imply a person or an account.
- More than about five faces. Past that the stack stops being readable — use
  `AvatarGroupCount` with a name list in the tooltip.

## API

| Part               | Props                        | Notes                                                        |
| ------------------ | ---------------------------- | ------------------------------------------------------------ |
| `Avatar`           | `size`, Base UI root props   | `size`: `"default" \| "sm" \| "lg"`. Sets `data-size`.        |
| `AvatarImage`      | Base UI image props          | `src`, `alt`; `keepMounted` retains the layer for a source fade. |
| `AvatarFallback`   | Base UI fallback props       | Rendered while loading and after an error.                    |
| `AvatarBadge`      | native span props            | Corner dot; sized from the root's `data-size`.                |
| `AvatarGroup`      | native div props             | Overlapping stack with a ring in the page colour.             |
| `AvatarGroupCount` | native div props             | The `+3` tile that closes a stack.                            |

All parts carry `data-slot`, so `[&>[data-slot=avatar]]:size-6` style overrides are
possible without a prop. A plain string child of `AvatarFallback` stays on the fallback
host, while a plain string or number child of `AvatarBadge` or `AvatarGroupCount` renders
inside a retained display span (`avatar-badge-text`/`avatar-group-count-text` or
`-number`); rich children are passed through untouched.

Root, Image and Fallback accept Base UI state callbacks for `className` and `style`.
Caller classes merge last; Badge and group parts use native string classes and object styles.

## Motion contract

Authored intensity is **medium**: Avatar coordinates an avatar group's presence and membership extent while each avatar owns its own size, retained image paint, changed text and scoped palette.

The image/fallback availability swap itself stays native and is never delayed. A paired
"half-drawn" crossfade is not attempted: Base UI decides when the image is displayable,
and only a changed source on a retained image layer fades the current paint.

| Behaviour                        | Recipe / form                 | Notes                                                                 |
| -------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Insertion, removal and image paint | `data.transition/one-shot`  | One opacity channel per retained avatar, badge, group or count tile.  |
| Retained removal                 | `exit.fade/one-shot`          | Removes the retained host after the fade; no outgoing child copy.     |
| Explicit size or membership      | `geometry.resize/measured`    | Measures the committed native box; reduced/none commit it immediately. |
| Changed display text             | `text.change/changed-runs`    | Changed-run opacity only, with no travel, scale or stagger.           |
| Direct count quantity            | `number.roll/reels`           | A plain numeric count only; `+3` strings remain text.                 |
| Scoped palette                   | `state.color/css-transition`  | One surface/foreground owner per painted fallback, badge or count.    |

Under `none`, every transition, delay and loop is disabled and the final size, text,
quantity and palette commit immediately. `prefers-reduced-motion` keeps the short
opacity and colour feedback while removing the measured size and any travel.

## Accessibility

- `AvatarImage` is an `<img>`: always pass a real `alt`. With a name beside the
  avatar, use `alt=""` so it is not announced twice.
- `AvatarFallback` prints initials. Those initials are the accessible name when the
  image is missing, so derive them from the person's actual name.
- `AvatarBadge` is a visual dot. Give it a text alternative when the presence state
  matters — e.g. `<span className="sr-only">Online</span>` inside it, or an
  `aria-label` on the badge.
- An avatar that links to a profile must be wrapped in an `<a>` with an accessible
  name; the image `alt` alone is not a link name.

## Responsiveness and performance

Avatar sizes are explicit rather than breakpoint-driven. Groups overlap avatars; the caller limits
the visible count and supplies overflow text. Base UI owns image loading and fallback state after
hydration.

T0 adds a measured size adapter and a short presence/palette runtime; unchanged avatars
interpolate nothing. Base UI behavior requires hydration; native HTML behavior remains
browser-owned. Server-rendered markup does not imply that every interaction works without
JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped source;
dependencies and application bundles are measured separately.

## Notes for AI

- Always render an `AvatarFallback`; without it a failed image leaves an empty hole.
- Do not add a pulsing or looping state to the presence dot. The badge fades on its own
  insertion or removal; a continuous loading pulse belongs to Skeleton, not Avatar.
- A plain string child is changed-run text; a plain numeric count child is a quantity
  reel. A formatted `+3` stays text by design.

---

Full index: https://cadence.dev/llms.txt
