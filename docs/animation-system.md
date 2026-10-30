# Animation system design

> This is the project's core differentiator. The goal is not "more effects" but **motion that composes, degrades, tests, and explains itself**. Every component must honour the Motion Contract defined here.

---

## 1. Five principles

| #   | Principle                    | Meaning                                                                                 | Counter-example                                      |
| --- | ---------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| M1  | Motion explains causality    | Where an element came from, where it went, and why it changed must be legible           | Gratuitous bounce, spin, flicker                     |
| M2  | One protagonist per action   | Only one element "speaks" at a time                                                     | Translate + scale + rotate + recolour simultaneously |
| M3  | Duration follows hierarchy   | Small controls fast, panels medium, whole pages slow                                    | 600 ms button, 120 ms page                           |
| M4  | Interruptible and re-entrant | Re-opening while a close animation runs reverses smoothly                               | Hard cuts with CSS keyframes                         |
| M5  | Reduced means equivalent     | Under reduced motion no information or state is lost; only translation/scale is removed | State changes become invisible after reduction       |

---

## 2. Token system

### 2.1 One authored timing, three runtime modes

There is no runtime "intensity" multiplier. Durations, distances, easings, and springs are authored
once in `lib/motion.ts`; the only thing that changes at runtime is the mode (§6), and the system
preference can force that mode.

| Mode      | What changes                                  | Set by                                              |
| --------- | --------------------------------------------- | --------------------------------------------------- |
| `full`    | nothing: the authored timing                  | default                                             |
| `reduced` | transform/scale dropped, tween durations ×0.6 | `prefers-reduced-motion`, or the provider           |
| `none`    | every duration `0`, no transition at all      | `CadenceProvider mode="none"`, `data-motion="none"` |

`meta.intensity` (`subtle` / `medium` / `expressive`) is **documentation metadata**: it records how
loud a component's authored motion is, so a catalogue can group by it. No token reads it, and it is
not adjustable at runtime.

> An earlier draft shipped `--motion-intensity`, `--motion-distance-*`, and `--motion-scale-in` to
> users while nothing read them: JS components resolve timing through `transitionFor()` from
> `lib/motion.ts`, and CSS-only popups read `--motion-duration-*`. A token nobody reads is a promise
> nobody keeps, so the unread ones were deleted. `--motion-scale-in` came back with the anchored
> panels (`popover`, `tooltip`, `hover-card`), which do read it: their scale is now a token rather
> than a number in a class. `--motion-intensity` and the distance tokens have no reader and stay
> gone; an anchored panel grows out of its anchor instead of sliding towards it (§3.1).

### 2.2 Base tokens

```ts
// registry/cadence/lib/motion.ts
export const duration = {
  instant: 0.1, // state changes, presses
  fast: 0.16, // small element exit
  base: 0.22, // default
  slow: 0.32, // panels, drawers
  page: 0.45, // full page / large blocks
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1], // enter: fast start, slow settle
  inOut: [0.65, 0, 0.35, 1], // movement within the screen
  in: [0.7, 0, 0.84, 0], // exit
} as const;

export const spring = {
  press: { type: "spring", visualDuration: 0.24, bounce: 0.12 },
  snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;
```

### 2.3 CSS-side exposure

```css
/* app/globals.css */
@theme inline {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

:root {
  --motion-duration-instant: 100ms;
  --motion-duration-fast: 160ms;
  --motion-duration-base: 220ms;
  --motion-duration-slow: 320ms;
  /* the CSS side of `scale.in`; anchored panels read it for their enter scale */
  --motion-scale-in: 0.96;
}

/* the same 0.6 factor transitionFor() applies to tween recipes */
[data-motion="reduced"] {
  --motion-duration-instant: 60ms;
  --motion-duration-fast: 96ms;
  --motion-duration-base: 132ms;
  --motion-duration-slow: 192ms;
}

/* `none` is a forced downgrade: a CSS popup must finish on the first frame */
[data-motion="none"] {
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 0ms;
  --motion-duration-base: 0ms;
  --motion-duration-slow: 0ms;
}

/* no provider, and therefore no data-motion attribute: the OS preference still
   has to shorten the CSS-only clock */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-instant: 60ms;
    --motion-duration-fast: 96ms;
    --motion-duration-base: 132ms;
    --motion-duration-slow: 192ms;
  }
}
```

`--ease-*` generates the `ease-cadence-out` utility class. Durations stay CSS variables rather than
forced utilities, because Tailwind's `--duration-*` is not a theme namespace. A CSS-only popup reads
them through the shorthand arbitrary value:

```tsx
// dialog.tsx — CSS-only, so the token is the class
"transition-[opacity,scale] duration-(--motion-duration-base) ease-cadence-out";
```

That is the only pattern that keeps `data-motion="none"` honest without a JS branch: the attribute zeroes
the variables on the element itself, and the transition has nothing left to run.

The block above exists in exactly three places — `app/globals.css`, the `cadence-theme` registry
item, and this document. They are not kept in sync by hand: `registry:check` parses all three into a
`scope → variable → value` map (`scripts/motion-tokens.mjs`) and fails on a scope, a variable, or a
value that differs. Three formats cannot be textually identical, so "equivalent" means that parsed
map, not the bytes.

---

## 3. Recipe catalogue

A recipe is a "reusable motion formula", returned by `useCadenceMotion().transition(recipe, opts)`. Components may only use the recipes below; adding a recipe means editing this document and going through review.

| Recipe            | Purpose                                                                                                  | Key parameters                  | Implementation                                                                               | reduced behaviour                            |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `reveal`          | Fade and rise on entering the viewport                                                                   | `distance`, `delay`             | `whileInView` + `viewport={{once:true}}`                                                     | Fade only, no translation                    |
| `enter.pop`       | Popovers and cards appearing                                                                             | `origin`, `scale`               | scale + opacity, `transformOrigin` follows the anchor                                        | Fade only                                    |
| `exit.fade`       | Element disappearing                                                                                     | `duration`                      | opacity to 0                                                                                 | Same (opacity kept)                          |
| `exit.shrink`     | Closing a popover                                                                                        | `scale`                         | scale to 0.96 + opacity                                                                      | Fade only                                    |
| `popup.anchored`  | Base UI popups                                                                                           | `side`, `align`                 | `data-starting-style`/`data-ending-style` or Motion `render`                                 | No scale, pure cross-fade                    |
| `layout.move`     | List/grid reordering                                                                                     | `spring`                        | `layout` prop + `LayoutGroup`                                                                | Layout disabled, instant jump                |
| `layout.shared`   | Shared elements (tab indicator, card expansion)                                                          | `layoutId`                      | `layoutId` + `spring.morph`                                                                  | Disabled, immediate switch                   |
| `list.stagger`    | Items appearing one by one                                                                               | `stagger`, `delayChildren`      | variants + `staggerChildren`                                                                 | All fade in together (no stagger)            |
| `gesture.drag`    | Drag / swipe to dismiss                                                                                  | `axis`, `threshold`, `velocity` | `drag` + `useMotionValue` + `animate` spring-back                                            | Dragging disabled, use a button              |
| `scroll.progress` | Reading progress, parallax                                                                               | `offset`                        | `useScroll` + `useSpring`                                                                    | Static value (no smoothing)                  |
| `scroll.story`    | Scroll-narrative timeline                                                                                | `trigger`, `scrub`              | GSAP ScrollTrigger (optional dependency)                                                     | End state shown directly                     |
| `text.reveal`     | Headline reveals word by word / line by line                                                             | `by`, `stagger`                 | variants + child spans                                                                       | Whole block fades in                         |
| `text.split`      | Character by character (GSAP)                                                                            | `type`                          | GSAP SplitText (optional)                                                                    | Shown as a whole                             |
| `number.roll`     | Numeric changes                                                                                          | `precision`, `spring`           | `useSpring` + `Intl.NumberFormat`                                                            | New value shown directly                     |
| `data.transition` | Data surfaces changing state in place                                                                    | `mode`, `loop`                  | continuous: CSS `animate-*` loop, opacity only. One-shot: `cm.transition("data.transition")` | Loop kept (opacity only); transforms dropped |
| `state.morph`     | A control's own indicator morphing between two states (label/width, check tick, radio dot, switch thumb) | `axis`, `scale`                 | `animate()` or `layout` + ResizeObserver, or Motion driven by the primitive's render state   | Indicator at full size, thumb jumps          |
| `feedback.press`  | Press feedback                                                                                           | `scale`                         | `whileTap`                                                                                   | Colour change only                           |

Theme switching is deliberately absent. A view transition is a document-level operation: it resolves
to no Motion `Transition`, so it cannot be a recipe and no component declares it. The site's theme
toggle does it directly when it wants to.

### 3.1 Code for the key recipes

#### `popup.anchored` (anchored panels, CSS-only)

```tsx
const cm = useCadenceMotion();

<Popover.Popup
  data-motion={cm.mode}
  className={cn(
    "origin-(--transform-origin) transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast)",
    "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
    !cm.reduced && "data-[starting-style]:scale-(--motion-scale-in) data-[ending-style]:scale-(--motion-scale-in)",
  )}
/>;
```

Base UI writes `--transform-origin` on the popup from the positioner, so the scale grows out of the
anchor rather than out of the element's centre. No distance is involved: a slide would need a distance
token plus one class per side, and it moves the edge the positioner just lined up. `dialog` and
`alert-dialog` use the same shape without the anchor: they keep their centre origin and read the same
`--motion-scale-in` and duration tokens.

#### `reveal`

```tsx
const cm = useCadenceMotion();
<motion.div
  initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.sm }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10% 0px" }}
  transition={cm.transition("reveal")}
/>;
```

#### `state.morph` (label/width morphing)

```tsx
const width = useMotionValue<number | "auto">("auto");
const slotRef = useRef<HTMLSpanElement>(null);

useLayoutEffect(() => {
  const el = slotRef.current;
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    if (!entry) return;
    if (reduced) return width.jump(entry.contentRect.width);
    animate(width, entry.contentRect.width, spring.morph);
  });
  ro.observe(el);
  return () => ro.disconnect();
}, [reduced, width]);

<motion.span style={{ width }} className="inline-flex justify-center overflow-hidden">
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span
      key={labelKey}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -3, filter: "blur(2px)" }}
      transition={cm.transition("state.morph")}
    >
      {children}
    </motion.span>
  </AnimatePresence>
</motion.span>;
```

> Detail: the outgoing element must leave the document flow via `popLayout`, otherwise it stretches the container back to the old width. `ResizeObserver` only fires when content size changes, so it does not fight the animation (the animation changes the outer slot's width).

#### `state.morph` (control indicators: tick, dot, thumb)

Form controls own the state, so the animation is driven by the primitive's render
state rather than by props the consumer passes. Base UI hands the current state to
a `render` callback; Motion takes over the element from there. The indicator must
be `keepMounted`, otherwise it unmounts before it can animate out.

```tsx
<CheckboxPrimitive.Indicator
  keepMounted
  render={(props, state) => (
    <motion.span
      {...props}
      initial={false}
      animate={state.checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduced ? 1 : 0.96 }}
      transition={cm.transition("state.morph")}
    />
  )}
/>;
```

For a thumb whose end position is decided by layout (the switch), measure the
travel instead of writing it down — `track.clientWidth - thumb.offsetWidth` — and
re-measure from a `ResizeObserver`. Under `reduced` the thumb still moves to the
new end, with `{ duration: 0 }`: position is information, the animation is not.

#### `layout.shared` (Tabs indicator)

```tsx
{
  items.map((item) => {
    const active = item.value === value;
    return (
      <button key={item.value} role="tab" aria-selected={active} className="relative">
        {active && (
          <motion.span
            layoutId="cadence-tab-indicator"
            className="absolute inset-0 -z-10 rounded-md bg-muted"
            transition={cm.transition("layout.shared")}
          />
        )}
        {item.label}
      </button>
    );
  });
}
```

> No DOM measurement needed: `layoutId` performs FLIP between renders automatically. Under reduced motion do not render the animated indicator (apply the background via `className` instead) — `layout` animations are not governed by `MotionConfig` (`layout` counts as a disabled transform animation and Motion does turn it off, but handle it explicitly anyway).

#### `gesture.drag` (bottom sheet)

```tsx
const y = useMotionValue(0);
const opacity = useTransform(y, [0, 200], [1, 0.6]);

<motion.div
  drag="y"
  style={{ y, opacity }}
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={{ top: 0, bottom: 0.5 }}
  onDragEnd={(_, info) => {
    const shouldClose = info.offset.y > 120 || info.velocity.y > 700;
    if (shouldClose) setOpen(false);
    else animate(y, 0, spring.snappy);
  }}
/>;
```

Key points: `dragConstraints` set to 0 makes dragging downward-only; after closing, `AnimatePresence` plays the exit; in `onDragEnd` do not call `setOpen(false)` without springing back, or a quick flick gets misread.

#### `number.roll`

```tsx
const springValue = useSpring(value, { stiffness: 120, damping: 20 });
useEffect(() => springValue.set(value), [value, springValue]);
const text = useTransform(springValue, (v) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: precision }).format(v)
);
return <motion.span aria-label={formatted}>{text}</motion.span>;
```

> Screen readers hear the final value (`aria-label`); intermediate frames never enter the accessibility tree. Use `aria-live="polite"` only for "result" numbers (e.g. checkout totals) to avoid announcing every frame.

#### `scroll.progress`

```tsx
const { scrollYProgress } = useScroll();
const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
return <motion.div style={{ scaleX }} className="origin-left h-0.5 bg-primary" aria-hidden />;
```

#### `scroll.story` (GSAP, optional dependency)

```tsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ScrollStory({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return; // show the end state directly
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope.current, start: "top 70%", end: "bottom 30%", scrub: 0.6 },
      });
      tl.from("[data-story-step]", { y: 48, opacity: 0, stagger: 0.12 });
      return () => tl.scrollTrigger?.kill();
    },
    { scope, dependencies: [reduced] },
  );

  return <div ref={scope}>{children}</div>;
}
```

### 3.2 Continuous recipes run in CSS

Some recipes do not end: a placeholder pulse, a shimmer, a marquee. A page can
render dozens of these at once, and every Motion animation costs a frame callback
and a tree outside React's control. So the **continuous form of a recipe is CSS**,
and its timing comes from an `--animate-*` theme token rather than from a literal
inside the component:

```tsx
// skeleton: `data.transition`, continuous form
const pulse = cm.mode === "none" ? "animate-none" : "animate-pulse";

<div data-slot="skeleton" data-motion={cm.mode} className={cn("bg-accent", pulse)} />;
```

Rules for the continuous form:

1. **Opacity only** (or `filter`, at ≤ 4px blur). A loop on `transform` or on a
   layout property keeps the compositor busy forever.
2. **Gated by `data-motion`**: `none` resolves to `animate-none`, so a screenshot
   test and a print stylesheet get a still frame.
3. **Kept under `reduced`** when it is opacity-only: M5 removes travel and scale,
   not the ability to see that something is loading. A loop that would need motion
   to read its state must be replaced by a static state under `reduced`.
4. **Declared, implemented, documented.** `meta.motion` and the docs table name the
   recipe; the class in the component is the implementation. There is no
   `cm.transition()` call because there is no JS animation — that is a property of
   the continuous form, not a missing branch.

#### The one exception: single-element rotation

Rule 1 has exactly one carve-out. `spinner` uses `animate-spin`, which loops on
`transform: rotate`. It qualifies because all five hold, and a component that misses
one of them does not:

1. **One element.** Not a row, not a list, not a whole surface.
2. **Rotation only.** Nothing translates, scales, or changes size, so no layout is
   read and no neighbour moves.
3. **The rotation is the information.** A spinner means "work in progress"; a static
   icon would say the opposite. Under `reduced` it keeps spinning for the same reason
   an opacity loop does (M5 removes travel and scale, not the ability to see that
   something is loading) — and the accessible name still carries the state:
   `role="status"` + `aria-label="Loading"`.
4. **Still gated by `data-motion`.** `none` resolves to `animate-none`, so a
   screenshot, a print stylesheet, and a reduced-data page get a still frame.
5. **Nothing beyond a glyph.** A logo, a hero image, or a card that rotates is
   decoration and is rejected in review.

Anything else that needs a transform loop — a marquee, a shimmer sliding across a
surface — stays rejected: those move content, and content that moves forever is the
compositor tax this section exists to prevent.

---

## 4. Four ways to integrate Base UI with Motion

A Base UI popup enters a "closing" phase before it unmounts, waiting for the animation to finish. Understanding these four patterns is what makes "rich animation" land in practice (official docs: [Base UI Animation](https://base-ui.com/react/handbook/animation.md)).

### Pattern A: pure CSS transition (recommended for simple popups)

```css
.popup {
  transform-origin: var(--transform-origin);
  transition:
    opacity 160ms var(--ease-cadence-out),
    transform 160ms var(--ease-cadence-out);
}
.popup[data-starting-style],
.popup[data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

Pros: interruptible, zero JS, the most robust. Cons: limited expressiveness for complex choreography (many elements, sequences).

### Pattern B: Motion + `AnimatePresence` + `keepMounted`

```tsx
const [open, setOpen] = useState(false);

<Popover.Root open={open} onOpenChange={setOpen}>
  <Popover.Trigger className="…">Open</Popover.Trigger>
  <AnimatePresence>
    {open && (
      <Popover.Portal keepMounted>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup
            render={
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 2 }}
                transition={spring.snappy}
              />
            }
          />
        </Popover.Positioner>
      </Popover.Portal>
    )}
  </AnimatePresence>
</Popover.Root>;
```

### Pattern C: `keepMounted` always mounted, driven by `state.open`

```tsx
<Popover.Popup
  render={(props, state) => (
    <motion.div
      {...(props as HTMLMotionProps<"div">)}
      initial={false}
      animate={{ opacity: state.open ? 1 : 0, scale: state.open ? 1 : 0.96 }}
      transition={spring.snappy}
    />
  )}
/>;
```

Suits popups that need "pre-rendered + zero first-frame delay".

### Pattern D: manual teardown (when the animation has no opacity)

```tsx
const actionsRef = useRef<{ unmount: () => void }>(null);

<Dialog.Root
  open={open}
  onOpenChange={(next, details) => {
    if (!next) details.preventUnmountOnClose();
    setOpen(next);
  }}
  actionsRef={actionsRef}
>
  {/* custom-drawn animation; call actionsRef.current?.unmount() when it ends */}
</Dialog.Root>;
```

> Selection rule: **use A whenever A suffices**; use B for multi-element choreography; use C when the first frame must have zero delay; use D for custom-drawn animations without opacity.

---

## 5. Composition-layer API

```ts
export type CadenceMode = "full" | "reduced" | "none";
export type Recipe =
  | "reveal"
  | "enter.pop"
  | "exit.fade"
  | "exit.shrink"
  | "popup.anchored"
  | "layout.move"
  | "layout.shared"
  | "list.stagger"
  | "gesture.drag"
  | "scroll.progress"
  | "scroll.story"
  | "text.reveal"
  | "text.split"
  | "number.roll"
  | "data.transition"
  | "state.morph"
  | "feedback.press";

export function useCadenceMotion(): {
  mode: CadenceMode;
  /** drop transform / scale / layout — true for both `reduced` and `none` */
  reduced: boolean;
  /** `mode === "none"` only: a CSS-driven component must resolve to zero duration */
  disabled: boolean;
  transition(recipe: Recipe, options?: { delay?: number; distance?: number; timeScale?: number }): Transition;
  distance: typeof distance;
  spring: typeof spring;
};
```

Implementation notes:

- `mode === "none"` → every transition is `{ duration: 0 }`;
- `mode === "reduced"` or a system preference → drop `y/x/scale/rotate/filter`, keep only `opacity`, duration ×0.6;
- `timeScale` (provider prop, default `1`) multiplies durations, spring `visualDuration`, and delays; the docs
  site's 0.25× preview passes `4`. It scales nothing inside `none` — a disabled transition stays disabled;
- a nested provider inherits the mode and the scale it does not set, so a subtree can slow down (or be
  silenced) without resetting the page to `full`; passing `mode` explicitly is how it opts back in;
- with no provider, return `full` (components work standalone, wrapping is not mandatory);
- the object returned by `transition()` can be passed straight to Motion's `transition` prop, optionally composed with `delay`.

> `reduced` and `disabled` are deliberately two flags. A component that branches on `reduced` alone
> will keep a 100ms fade under `none` — that is the failure the two-flag split exists to prevent.

---

## 6. Three-layer strategy for reducing motion

| Layer     | Trigger                                                                      | Effect                                    | Implementation                                                   |
| --------- | ---------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| System    | `prefers-reduced-motion: reduce`                                             | Disable transform/layout, keep opacity    | `MotionConfig reducedMotion="user"` + CSS media query            |
| Product   | `data-motion="reduced"`                                                      | Drop transform/scale, tween duration ×0.6 | `transitionFor()` folds it; the CSS variables carry the same 0.6 |
| Component | `data-motion="none"` (local attribute) or a component's `disableMotion` prop | Force motion off for one component        | Branch on `useCadenceMotion().mode` inside the component         |

**Hard constraint**: a component that expresses a state change _only_ through animation is unacceptable. Toast dismissal, error messages, and success ticks must be perceivable outside the animation via text, an icon, or `aria-live`.

---

## 7. Performance budgets and implementation rules

| Metric                            | Budget                                                                                   | How it is checked         |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------- |
| Motion runtime (initial)          | ≤ 48 KB gzip (full `motion` ≈ 43 KB; the optional `LazyMotion` path brings it to ~30 KB) | Build analysis            |
| Per-component added JS            | ≤ 8 KB gzip (shared runtime excluded)                                                    | Build script              |
| Initial JS per page               | ≤ 120 KB gzip                                                                            | Next build output         |
| Frame rate                        | ≥ 55 fps on a mid-range mobile device                                                    | Playwright trace / manual |
| CLS                               | < 0.02                                                                                   | Lighthouse / Playwright   |
| Simultaneously animating elements | ≤ 20 (stagger scenarios)                                                                 | Code review               |
| Total stagger duration            | ≤ 400 ms                                                                                 | Code review               |

Implementation rules:

1. **Animate only `transform` / `opacity` / `filter`**; `filter: blur()` is costly, so use it only on small text areas and at ≤ 4px.
2. **No layout-read loops**: `getBoundingClientRect` and `offsetWidth` are read inside event/`ResizeObserver` callbacks only, and reads precede writes.
3. **`will-change` is removed once done**: add it only while animating, remove it afterwards (or let Motion manage it).
4. **`layout` animations trigger layout measurement**: for lists over 50 items, switch to manual transform or paginate.
5. **Springs must not overshoot**: `bounce ≤ 0.2` for UI elements; larger values are for marketing only.
6. **Lazy-load GSAP**: the `scroll.story` component imports `gsap` dynamically so it never hits first paint.
7. **Keep `AnimatePresence` subtrees small**: wrap only the elements that need an exit, never a whole page.

---

## 8. SSR and hydration

| Rule                                            | Reason                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `initial={false}` for above-the-fold elements   | Avoids the server rendering the end state and the client replaying the animation, which causes flicker |
| Do not read `matchMedia`/`window` during render | No value on the server; use `useReducedMotion` (which uses `useSyncExternalStore` internally)          |
| No random values or times as initial state      | Server and client would disagree                                                                       |
| `layoutId` only appears client-side             | Use `"use client"` within the RSC boundary                                                             |
| Popups do not render by default (`open=false`)  | Avoids an extra tree on first paint                                                                    |
| Every animated component is `"use client"`      | The server never runs animations                                                                       |

---

## 9. Testing motion

### 9.1 Three test layers

| Layer       | Tool                         | Assertions                                                                       |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------- |
| Unit        | Vitest + RTL                 | API behaviour, `data-motion` branches, accessibility attributes, no `@/` imports |
| Interaction | Playwright                   | Final state after open/close/keyboard/drag                                       |
| Visual      | Playwright`toHaveScreenshot` | 3 states (open, closed, mid-animation) × 2 themes × 2 motion modes               |

### 9.2 reduced-motion matrix

```ts
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`dialog ${reducedMotion} ${mode}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(`/components/dialog?motion=${mode}`);
      await page.getByRole("button", { name: "Open" }).click();
      const content = page.getByRole("dialog");
      await expect(content).toBeVisible();
      // after the animation it must be fully visible with no residual transform
      await expect.poll(() => content.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
      if (reducedMotion === "reduce" || mode !== "full") {
        await expect.poll(() => content.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      }
    });
  }
}
```

### 9.3 Asserting the motion "contract"

Every component declares its Motion Contract in its documentation; tests read that table directly:

```ts
const contract = {
  button: { press: ["scale"], reduced: [] },
  dialog: { enter: ["opacity", "scale"], exit: ["opacity", "scale"], reduced: ["opacity"] },
};
```

CI check: the set of animated properties found in source ⊆ the declared contract; under reduced mode no transform properties appear.

### 9.4 a11y and visual regression

- `@axe-core/playwright`: run once per component page, 0 violations;
- keyboard script: Tab/Shift+Tab, arrow keys, Esc, Enter/Space;
- visual regression: screenshot key frames only, threshold `maxDiffPixelRatio: 0.01`, so font differences do not turn everything red.

---

## 10. Anti-pattern list (sent straight back in review)

- ❌ `transition: all 0.3s` (uncontrollable; animates layout properties)
- ❌ Using `setTimeout` to end an animation (not interruptible, out of sync with the real duration)
- ❌ Reading `offsetHeight` in `useEffect` and then writing styles (forces synchronous layout)
- ❌ Driving one element with both CSS transitions and Motion (double-write conflict)
- ❌ Spring `bounce > 0.3` on informational UI
- ❌ Infinite loops (marquee, shimmer) that cannot pause or ignore reduced motion
- ❌ Hiding critical information behind an animation (errors, load failures)
- ❌ Unmounting an element outside `AnimatePresence` and expecting an exit animation
- ❌ Adding `overflow: hidden` to `body`/`html` without cleanup (a common drawer bug)
- ❌ Relying on `:hover` as the only state indicator (unusable on touch)

---

## 11. Motion review checklist

- [ ] Which causality does this animation explain? (If you cannot say it in one sentence, delete it.)
- [ ] Who is the protagonist? Is only one element moving at a time?
- [ ] Can the close animation be smoothly interrupted by re-opening?
- [ ] Under reduced motion, is the information complete and the state still recognisable?
- [ ] Does it animate only transform/opacity/filter? Does it trigger layout?
- [ ] Does it use this document's tokens and recipes? Are there new magic numbers?
- [ ] Is there a matching Playwright assertion or screenshot?
- [ ] Is it still acceptable on low-end devices (4× CPU throttle)?
- [ ] Does the duration match the element's place in the hierarchy?
- [ ] Can it be fully disabled with `data-motion="none"`?
