# Carousel

> A swipeable collection with previous and next controls.

- Registry item: https://cadence.dev/r/carousel.json
- Install: `npx shadcn@latest add @cadence/carousel`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: data.transition

## Installation

```install
npx shadcn@latest add @cadence/carousel
```

## Usage

```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/cadence/carousel";

export function Example() {
  return (
    <Carousel aria-label="Featured projects" className="mx-12 max-w-sm" tabIndex={0}>
      <CarouselContent className="touch-pan-y">
        {[1, 2, 3].map((slide) => (
          <CarouselItem key={slide} aria-label={`${slide} of 3`}>
            <div className="rounded-lg border p-8">Project {slide}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
```

## Multiple visible slides

```tsx
<Carousel aria-label="Projects" opts={{ align: "start", loop: true }}>
  <CarouselContent className="-ml-2 touch-pan-y">
    {[1, 2, 3, 4].map((slide) => (
      <CarouselItem key={slide} className="pl-2 md:basis-1/2">
        Project {slide}
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

## Vertical collection

```tsx
<Carousel orientation="vertical" aria-label="Updates" className="my-12">
  <CarouselContent className="h-64 touch-pan-x">
    <CarouselItem>First update</CarouselItem>
    <CarouselItem>Second update</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

## API and plugins

```tsx
"use client";
import { useEffect, useState } from "react";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/components/cadence/carousel";

export function WithApi() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    return () => { api.off("select", update); };
  }, [api]);
  return (
    <>
      <Carousel setApi={setApi} aria-label="Projects">
        <CarouselContent>
          <CarouselItem>First</CarouselItem>
          <CarouselItem>Second</CarouselItem>
        </CarouselContent>
      </Carousel>
      <button onClick={() => api?.scrollNext()}>Next project</button>
      <p aria-live="polite">Project {selected + 1}</p>
    </>
  );
}
```

Pass Embla plugins through `plugins`; keep plugin instances stable. The API is the actual Embla
8.6.0 instance, including events, `reInit`, `plugins`, `scrollTo`, `scrollProgress` and `destroy`.
Plugins are never removed by a motion mode. Stop autoplay or independent animation plugins under
reduced/none yourself, and provide pause controls. Cadence clamps the engine's interpolation even
when a plugin or API call explicitly requests `jump=false`.

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

| Phase | Behaviour |
| --- | --- |
| Enter / exit | No authored entrance or removal animation. |
| Interaction | `data.transition`, engine form: Embla alone translates the track. Default duration.base maps to 22 attraction units via carouselClock; timeScale scales it. Explicit full-mode opts.duration remains native. |
| Interruption | Next/previous/drag retarget Embla's existing location and velocity. Release uses the effective base clock, including breakpoint options, instead of a hard-coded release duration. |
| Reduced | Track and loop relocation transforms retain the correct state position. Direct dragging remains available. All autonomous engine interpolation is zero; no CSS/Motion transform animation is added. |
| None | Same immediate state positioning, with every engine duration zero even for explicit API/plugin duration requests. |
| Buttons | Composed Button owns its declared feedback.press recipe; reduced/none remove press scale. Static control placement/vertical rotation are layout. |

A mode downgrade settles the existing target without resetting selection. Engine friction,
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
