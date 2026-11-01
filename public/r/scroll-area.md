# Scroll Area

> Constrained lists and wide content with native scrolling and custom scrollbars.

- Registry item: https://cadence.dev/r/scroll-area.json
- Install: `npx shadcn@latest add @cadence/scroll-area`
- Type: registry:ui
- Since: 0.4.0


## Installation

```install
npx shadcn@latest add @cadence/scroll-area
```

## Usage

```tsx
import { ScrollArea } from "@/components/cadence/scroll-area";

export function Notes() {
  return (
    <ScrollArea aria-label="Release notes" className="h-48 w-full rounded-md border">
      <ul className="flex flex-col gap-3 p-4 pr-6">
        {Array.from({ length: 20 }, (_, i) => <li key={i}>Release {i + 1}</li>)}
      </ul>
    </ScrollArea>
  );
}
```

## Horizontal scrolling

Add a horizontal ScrollBar inside ScrollArea and let content exceed the viewport width.
The built-in vertical scrollbar only appears when vertical overflow exists.

```tsx
<ScrollArea aria-label="Project timeline" className="w-full rounded-md border">
  <div className="flex w-max gap-4 p-4 pb-6">
    {["Research", "Design", "Build", "Review", "Ship"].map((phase) => (
      <div key={phase} className="w-40">{phase}</div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

## Caller rendering and sizing

Root props and ref belong to the outer container, not the inner scrolling viewport.
A custom render element must forward its props, children and ref. State callbacks
for classes and styles remain supported. Reserve space around content for overlaid tracks.

```tsx
<ScrollArea
  ref={rootRef}
  render={<section />}
  aria-label="Activity"
  className={(state) => state.hasOverflowY ? "h-48 rounded-md border" : "max-h-48"}
  style={{ maxWidth: "100%" }}
>
  <div className="p-4 pr-6">{activity}</div>
</ScrollArea>
```

## When to use

- Long activity feeds constrained by a panel height.
- Horizontal timelines or collections wider than their available space.
- Bounded lists that need custom scrollbars while retaining native scrolling.

## When not to use

- For ordinary page content: allow the document to scroll.
- For paged slides: use Carousel.
- For reading progress or smooth scrolling effects: this component adds neither.

## API

| Export | Props and defaults |
| --- | --- |
| `ScrollArea` | Base UI `ScrollArea.Root.Props`; no additional defaults. |
| `ScrollBar` | Base UI `ScrollArea.Scrollbar.Props`; `orientation="vertical"`, `keepMounted=false`. |

Both exports forward native events, ARIA, style, ref and Base UI `render`.
Classes merge last, including state callback classes. Root also forwards
`overflowEdgeThreshold` (Base UI default zero). Scrollbar props target the track;
the thumb is created internally. Root creates the viewport, default vertical track
and corner. ScrollArea's `children` render inside the viewport, including any
additional horizontal track, matching the pinned upstream composition.

Slots: `scroll-area`, `scroll-area-viewport`, `scroll-area-scrollbar`,
`scroll-area-thumb`. The scrollbar includes `data-orientation`.
Root classes, padding, borders and styles remain on the root; content padding
belongs on a child. Root ref does not address the viewport. No viewport prop or
ref API is invented; query its slot from the root for application-owned imperative scrolling.

## Motion contract

T0: empty recipe set, no provider, hook, timing token or authored animation.
Enter, exit and resize are immediate. Full, reduced and none share static markup.
The primitive positions and sizes its thumb from actual native scroll geometry;
those transforms represent user position and remain functional in every mode.
No smoothing, automatic scrolling, entrance or opacity transition is added.

| Mode | Authored motion |
| --- | --- |
| full | none |
| reduced | none |
| none | none |

Upstream focus-ring and colour feedback remain CSS state feedback. Native wheel,
touch momentum and keyboard scrolling follow browser/platform preferences.
Caller-added smooth scrolling and CSS animation are application-owned.

## Accessibility

- Base UI supplies a focusable viewport when overflow exists with a visible keyboard focus ring.
  Tab enters the viewport and its interactive descendants; arrows, Page Up/Down,
  Home/End retain native browser scrolling. No custom keyboard model is added.
- Give the root a meaningful accessible name, as in Usage. Keep list or document
  semantics in the content and label interactive controls individually.
- Tracks and thumbs are pointer controls; keyboard users scroll the native viewport.
- Constrain height for vertical overflow and width for horizontal overflow. The
  viewport retains all content on narrow screens; size a grid parent with `min-w-0`.
- Base UI updates geometry on native scrolling and viewport resize. The pinned
  wrapper has no Content part: content-only growth may leave the thumb stale until
  a scroll or viewport resize occurs. Cadence preserves that upstream behaviour. It adds no
  measurement loop, data processing or virtualization. Paginate or virtualize large
  datasets in the application.

## Responsiveness and performance

Give the root explicit dimensions so its viewport can scroll; horizontal scrolling needs the
corresponding ScrollBar. Parent grids may need min-w-0. Base UI manages custom scrollbar interaction
while content uses native scrolling; it does not virtualize children.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Preserve root/viewport ownership, native scrolling and Base UI render/ref support.
- Add ScrollBar with horizontal orientation for wide content; its default stays vertical.
- Do not add decorative fading, smooth scrolling or animation to this T0 component.

---

Full index: https://cadence.dev/llms.txt
