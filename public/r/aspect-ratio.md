# Aspect Ratio

> Images, videos, and embeds that must keep their shape.

- Registry item: https://cadence.dev/r/aspect-ratio.json
- Install: `npx shadcn@latest add @cadence/aspect-ratio`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/aspect-ratio
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| aspect-ratio | `@components/cadence/aspect-ratio/index.tsx` | [JSON files[].content](https://cadence.dev/r/aspect-ratio.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: aspect-ratio](https://cadence.dev/r/aspect-ratio.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

No additional item-specific CSS configuration is required beyond the base theme.

Aspect Ratio needs only the two files and packages listed above; no Base UI primitive,
motion runtime, provider or additional item-specific CSS is required. Keep
`aspect-ratio/index.tsx` and `lib/cn.ts` at the listed relative paths so the shared `cn`
import resolves. The component has no `"use client"` directive and renders a plain
`div` with CSS sizing. It has no animation in full, reduced or none mode; interactive
children still need their own client setup.

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

Authored intensity is **subtle**: Aspect Ratio declares no Cadence recipe; native content/layout and existing CSS state feedback remain unchanged.

No motion (T0). The whole point of the box is that it does not change size; a
transition here would reintroduce the layout shift it exists to prevent.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

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

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry enforces a 4 KiB gzip budget for
this item's own shipped source; dependencies and application bundles are measured separately.

## Notes for AI

- Always pass a `ratio`; `16 / 9` for video, `1` for avatars, `4 / 3` for photos.
- Put `object-cover` on the child, not on the ratio box. The box only reserves
  space; the child fills it.

---

Full index: https://cadence.dev/llms.txt
