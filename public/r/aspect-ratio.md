# Aspect Ratio

> Reserves a box at a fixed ratio so media cannot shift the layout.

- Registry item: https://cadence.dev/r/aspect-ratio.json
- Install: `npx shadcn@latest add @cadence/aspect-ratio`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/aspect-ratio
```

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

```tsx
<AspectRatio ratio={1} className="overflow-hidden rounded-full">
  <img src="/avatar.jpg" alt="" className="size-full object-cover" />
</AspectRatio>
```

## Video

```tsx
<AspectRatio ratio={16 / 9}>
  <iframe
    src="https://www.youtube-nocookie.com/embed/…"
    title="Walkthrough"
    className="size-full"
    allowFullScreen
  />
</AspectRatio>
```

## Multiple ratios in one grid

Each box keeps its own ratio, so the grid stays stable while media loads:

```tsx
<div className="grid grid-cols-3 gap-4">
  <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-md"><img … /></AspectRatio>
  <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-md"><img … /></AspectRatio>
  <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-md"><img … /></AspectRatio>
</div>
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

## Notes for AI

- Always pass a `ratio`; `16 / 9` for video, `1` for avatars, `4 / 3` for photos.
- Put `object-cover` on the child, not on the ratio box. The box only reserves
  space; the child fills it.

---

Full index: https://cadence.dev/llms.txt
