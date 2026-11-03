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

Catalogue intensity is the strongest authored behaviour available in the component (including
its documented composition), independent of the selected runtime mode, complexity and tier:

- `subtle`: static UI, local press/glyph feedback, opacity-only entry/progress/loading, or a
  small control indicator. Static T0 belongs here; this label does not promise animation.
- `medium`: a surface enters/exits, a panel/indicator moves or resizes, a collection slides,
  or chart geometry interpolates. Carousel and Chart's `data.transition` moves geometry;
  Calendar, Bubble, Skeleton, Spinner and Attachment's data feedback stays local.
- `expressive`: coordinated identity/ownership transfers across surfaces (`handoff`, currently
  Select). This is not a claim that every spring or every T3 component is expressive.

`scripts/catalog-intensity.mjs` enforces this policy against the declared recipe forms and the
explicit data-geometry owners. Registry/frontmatter equality remains mandatory. A new behaviour
must update this design and the policy together; never alter motion to obtain a filter label.

The reduced tween multiplier is exported as `reducedDurationScale` from `lib/motion.ts`.
CSS popup adapters and `transitionFor()` read that same token rather than repeating the multiplier.

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
  travel: { type: "spring", visualDuration: 0.3, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;
```

Springs are **authored** as `visualDuration + bounce`, but not every recipe hands that form to
Motion. `visualDuration` makes a spring _time-defined_: when an animation is interrupted, Motion
discards the inherited velocity, so the new target starts from rest. That is the right trade for a
press or a popup scale (the distance is tiny, and inherited velocity would oscillate), but it is the
wrong trade for a layout recipe that can be retargeted mid-flight. Those recipes declare
`continuity: "velocity"`, and `transitionFor()` restates the token as `stiffness`/`damping`/`mass`
after applying `timeScale`. The spring is then _physics-defined_ and Motion carries the current
velocity into the new target (`motion-dom`'s `spring.ts`, 13.5.1). The authored values do not change,
the 4× preview still scales correctly, and the conversion lives in `lib/motion.ts` rather than in a
component.

### 2.2.1 Zero recipe clock

`timeScale` accepts finite non-negative numbers. Zero is a valid clock, including
provider inheritance, an explicit nested override and a per-call override. Every
recipe resolves it to `{ duration: 0, delay: 0 }` before spring conversion; direct
`physicalSpring(0)` also returns a zero-duration transition. Passing a zero visual
duration to Motion's spring generator is insufficient: it can select default
physics, and dividing by zero produces invalid physics. Negative or non-finite
`timeScale` (on the provider or an active recipe) and direct `physicalSpring`
`visualDuration` inputs throw `RangeError`; `none` still ignores recipe options.

Zero timing preserves the effective mode and semantic target: a full-mode held
press still has its press scale, reached immediately. It does not set `reduced`
or `disabled`, and it does not stop continuous CSS `--animate-*` loops. Newly
started or retargeted recipe animations use the resolved clock. An existing
consumer must observe clock changes to cancel a same-target flight; the resolver
alone cannot guarantee that every writer does so. Native CSS transitions already
in flight are not promised live retiming on clock changes; forced `none`
cancellation retains its separate contract.

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

| Recipe            | Purpose                                                                                 | Key parameters                  | Implementation                                                                                                        | reduced behaviour                            |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `reveal`          | Fade and rise on entering the viewport                                                  | `distance`, `delay`             | `whileInView` + `viewport={{once:true}}`                                                                              | Fade only, no translation                    |
| `enter.pop`       | Popovers and cards appearing                                                            | `origin`, `scale`               | scale + opacity, `transformOrigin` follows the anchor                                                                 | Fade only                                    |
| `exit.fade`       | Element disappearing                                                                    | `duration`                      | opacity to 0                                                                                                          | Same (opacity kept)                          |
| `exit.shrink`     | Closing a popover                                                                       | `scale`                         | scale to 0.96 + opacity                                                                                               | Fade only                                    |
| `popup.anchored`  | Base UI popups                                                                          | `side`, `align`                 | `data-starting-style`/`data-ending-style` or Motion `render`                                                          | No scale, pure cross-fade                    |
| `layout.move`     | List/grid reordering                                                                    | `spring`                        | `layout` prop + `LayoutGroup` + physics-defined spring                                                                | Layout disabled, instant jump                |
| `layout.shared`   | Shared elements (tab indicator, card expansion)                                         | `layoutId` / measured targets   | `layoutId` or a persistent measured indicator (§3.1.4) + physics-defined `spring.morph`                               | Disabled, immediate switch                   |
| `list.stagger`    | Items appearing one by one                                                              | `stagger`, `delayChildren`      | variants + `staggerChildren`                                                                                          | All fade in together (no stagger)            |
| `gesture.drag`    | Drag / swipe to dismiss                                                                 | `axis`, `threshold`, `velocity` | `drag` + `useMotionValue` + `animate` spring-back                                                                     | Dragging disabled, use a button              |
| `scroll.progress` | Reading progress, parallax                                                              | `offset`                        | `useScroll` + `useSpring`                                                                                             | Static value (no smoothing)                  |
| `scroll.navigate` | Navigate to a document section after an explicit link activation                        | measured destination            | Motion number tween writes native scroll offsets; `duration.page` + `ease.inOut` (§3.1.5)                             | Immediate destination                        |
| `scroll.story`    | Scroll-narrative timeline                                                               | `trigger`, `scrub`              | GSAP ScrollTrigger (optional dependency)                                                                              | End state shown directly                     |
| `text.reveal`     | Headline reveals word by word / line by line                                            | `by`, `stagger`                 | variants + child spans                                                                                                | Whole block fades in                         |
| `text.split`      | Character by character (GSAP)                                                           | `type`                          | GSAP SplitText (optional)                                                                                             | Shown as a whole                             |
| `number.roll`     | Numeric changes                                                                         | `precision`, `spring`           | `useSpring` + `Intl.NumberFormat`                                                                                     | New value shown directly                     |
| `data.transition` | Data surfaces changing state in place                                                   | `mode`, `loop`                  | continuous: CSS `animate-*` loop, opacity only. One-shot: `cm.transition("data.transition")`                          | Loop kept (opacity only); transforms dropped |
| `state.morph`     | A control's own state changing in place (check tick, radio dot, switch thumb, OTP slot) | `axis`, `scale`                 | `animate()` or `layout` + ResizeObserver, or Motion driven by the primitive's render state                            | Indicator at full size, thumb jumps          |
| `geometry.resize` | A control's measured width/height following its content (select trigger, disclosure)    | `axis`, `min`                   | `animate()` on a motion value, or the Base UI disclosure CSS form below; measure content and clamp to the closed size | Instant size change, opacity kept            |
| `handoff`         | A value flying from a source that unmounts to a destination that mounts elsewhere       | `origin`                        | inverse transform from `measureOrigin()` + physics spring                                                             | Cross-fade at the destination                |
| `feedback.press`  | Press feedback                                                                          | `scale`                         | Native press ownership + committed controls                                                                           | Colour change only                           |

Four recipes opt into `continuity: "velocity"`: `layout.move`, `layout.shared`, `geometry.resize`, and
`handoff`. All four exist to be retargeted while they are still moving (a list reorders twice, a tab
indicator is clicked mid-flight, a second option is selected before the first label lands), and all
travel far enough that losing the velocity is visible. Every other spring stays time-defined on
purpose: `press` is a sub-pixel scale and a popup scales by 4%, where Motion's own guard against
inherited velocity exists for good reason. A recipe that needs continuity must be argued for in this
table, not switched on in a component.

`geometry.resize` is also the only recipe that resolves to zero duration under `reduced` instead of
a short tween: a 160 ms width tween is still layout motion, and the size is information, so it
jumps. `handoff` keeps the short tween under reduced but the component drops the transform and
cross-fades at the destination.

Theme switching is deliberately absent. A view transition is a document-level operation: it resolves
to no Motion `Transition`, so it cannot be a recipe and no component declares it. The site's theme
toggle does it directly when it wants to.

A gesture the primitive owns is not a recipe either. Base UI's drawer moves the sheet through
`--drawer-swipe-*` custom properties, and those variables are the framework's gesture engine, not an
animation Cadence authors: swapping them for `gesture.drag` would mean re-implementing the drag. So
`drawer` declares `popup.anchored` + `exit.fade` and documents the swipe in its Motion contract table.
`gesture.drag` stays in the catalogue for a component that drives Motion directly.

Control adapters use committed layout effects on the client (ordinary effects on the server)
with value/transition signatures, compatible with React
19.0, rather than requiring React 19.2's `useEffectEvent`. For a zero-clock retarget they stop
the old controller, set the target immediately and reassert it once in Motion's public
`frame.update` phase. Motion 13.5.1 queues same-target writes there; an earlier full-mode
write must not overwrite the later none target. Cleanup cancels that reassertion and stops
the controls. This is ordering within `state.morph` / `data.transition`, not a new recipe,
delay, remount or nonzero none transition. The OTP effect similarly keys only on character,
mode and clock, so focus and unrelated renders do not replay a character.
Stopping before paint applies to asynchronous controlled commits as well as input events.
Checkbox and Radio explicitly give scale a zero clock in reduced mode; opacity keeps its recipe.
The same adapter owns CodeBlock's floating Actions, copy glyphs and expand orientation:
an unchanged target must still cancel/retarget when its mode or clock changes.
Press buttons use native pointer/Enter/blur lifecycle to drive this adapter, and disabled/aria-disabled
or a removed press recipe resolves the scale immediately to one without replacing the button.
Only a primary, left-button pointer can start feedback. Its pointerId owns that held gesture:
another contact cannot start feedback or release it. Trusted outside pointerup/pointercancel
releases only that owner; Enter has separate ownership. Blur, disabled and removed recipe cancel
ownership, and unmount removes the outside listeners without synthesizing pointer events.
It also clears the private held gesture: native disabled can swallow pointerup, so
re-enabling the button must not revive that cancelled press. Base owns focus/activation.
Slider uses Base's dragging state, rather than tap, and likewise resolves a disabled thumb
to scale one with a zero clock. CodeBlock copy glyphs explicitly snap scale under reduced.
Select's measured value uses intrinsic `width: auto` in reduced/none. Base can commit
new label text in its own subtree before the parent's ResizeObserver runs; a cached
numeric width must not survive that paint. A single MotionValue owns width in every
mode: jump it to auto and synchronously write that same auto target under reduced/none,
stopping its spring. Switching the style from a MotionValue to a React string permits
an older queued Motion render to overwrite React's auto. Keep the numeric measurement
in the target ref; full resolves its first auto measurement instantly, then springs
on later label changes. The synchronous write is the same prepaint fold policy as CodeBlock.

### 3.0 Sidebar composition

Sidebar uses `layout.move` for the desktop offcanvas panel's own-width transform. The reserved
gap and icon-mode widths update immediately; they are functional layout, with no width, left/right,
margin, padding or height interpolation. Reduced/none use the static off-edge position, with zero
transform duration. The same panel and its children survive desktop toggles and rapid reversals.
Mobile delegates enter/exit to Sheet; button, tooltip and skeleton children retain their own recipes.
No new geometry engine or measured resize recipe is introduced.

Sidebar's scalar owner jumps at zero clock (resetting velocity), stops its MotionValue as well as its returned handle on cleanup, and guards detached `onUpdate` writes.

### 3.0.1 Bubble surface entry

Bubble uses the one-shot `data.transition` recipe for opacity-only entry through
CSS `@starting-style`. It resolves duration locally via `cm.transition()` so nested
providers restore their clock. Full/reduced both fade; none removes starting opacity
and sets zero duration, including live cancellation. Text chunks, variants, alignment,
reactions and resize remain immediate on stable nodes. Static reaction offsets are
positioning, not motion. Bubble has no streaming runtime or measured geometry.

### 3.1.1 `data.transition` for Embla collections

Carousel uses the engine form of `data.transition`: Embla 8.6.0 exclusively owns track
translation, snap geometry, loop relocation, dragging, focus and resize. Never add a CSS or
Motion transform writer to its track. Position is state, like the Switch thumb: reduced/none
retain the selected slide's translate and direct pointer tracking, but every autonomous engine
interpolation resolves to zero. There is no entrance/exit animation or opacity fallback to add.

Resolve `cm.transition("data.transition").duration` in full, retaining
`duration.base * cm.timeScale` as the base option under reduced/none. The engine options must stay stable
across mode changes; the policy clamps the runtime clock. Convert with the shared
`carouselClock.unitsPerSecond` calibration (100 engine attraction units per authored second,
not milliseconds or a wall-clock guarantee). Default full timing is therefore duration.base →
22 attraction units; timeScale scales this value. Explicit `opts.duration`, including breakpoint
values, remains caller-owned in full mode. On pointer release, use the engine's effective base
duration instead of DragHandler's hard-coded 25/43-unit release clock. Embla retains its native
friction, momentum target and interruption from the current location/velocity.

A private lifecycle plugin wraps each fresh engine's `scrollBody.useDuration`: full passes values
through; reduced/none clamp all calls to zero, including drag tracking/release, API calls with
`jump=false`, focus and user plugins using the engine. Restore on destroy and reattach on reInit.
Apply the current mode through a ref so mode changes do not reinitialize or reset selection;
when downgrading in flight, flush the engine's existing target through update/render immediately.
Plugins that create independent CSS/WAAPI animations or automatic advance own those behaviours;
callers must stop autonomous plugins for reduced/none and provide pause controls for autoplay.
Do not silently remove user plugins. Navigation buttons inherit Button's `feedback.press` recipe;
it remains declared on Button rather than duplicated on Carousel.

Only transforms animate; no track layout tween or render-time measurement. Browser proof must cover
three modes × system preferences, correct final position, reversal, drag release, both axes,
loop/options, plugins/API, dynamic slides and resize. Engine internals are pinned to 8.6.0 and must
be reviewed on upgrade. CSS-only computed transition assertions alone cannot prove this engine.

Embla's existing active-engine cancellation runs in the committed layout phase for reduced/none and a zero clock, so no old trajectory survives the first paint.

### 3.1.2 `data.transition` for Recharts data geometry

Chart uses Recharts 3.10.1's public AnimationControllerProvider. The cause is a series entering or
changing data, not a container mounting. This T4 engine form is an explicit exception to the
transform/opacity/filter rule: SVG paths, sectors and bar geometry interpolate data coordinates,
not DOM layout. No measurement loop or wrapper reveal is added. Recharts owns interpolation and
retargeting from its current series state; Cadence owns the numeric progress clock and easing.

Full uses the data.transition duration and ease tokens (including provider timeScale). Explicit
series animationDuration, animationBegin and animationEasing cannot extend or bypass that clock;
isAnimationActive=false still opts out. Reduced and none complete geometry immediately: fading
an entire chart would obscure comparison, so neither adds an opacity fallback. Static positional
SVG transforms remain in every mode because they encode data coordinates, not animation.
Recharts starts controllers in a passive effect. For its eight installed series, Cadence also supplies a terminal `animationInterpolateFn` in reduced/none or at zero clock, so their first rendered data geometry does not depend on that passive callback. Traversal preserves element types and keys, custom shapes and other props; full mode preserves the caller interpolator, and instantaneous modes call a custom interpolator at its terminal progress. A running downgrade or zero recipe clock completes every registered animation without remounting the chart. Positive live clock changes integrate subsequent frame deltas against the current token duration, preserving numeric progress. Updates
and resize must preserve axes, legend and keyboard tooltip state. No SSR replay wrapper is used.

ChartTooltip disables Recharts' positional CSS animation in every mode; pointer/focus changes
are immediate. Tooltip content, formatters, cursor and caller props remain supported. Independent
custom shapes, nested animation controllers and caller-authored CSS/WAAPI own their own motion;
they must implement the same mode contract. Do not substitute blanket CSS animation suppression
for the engine controller. Review the public controller integration on Recharts upgrades.

### 3.1.3 `data.transition` for calendar month grids

Calendar keeps DayPicker 9.13.2 in charge of selection, displayed months and keyboard focus.
A stable Month component provides its date to the persistent MonthGrid. A changed month moves
that actual table from signed `distance.sm` to zero and opacity zero to one on the data.transition
clock through a native WAAPI effect (seconds converted to milliseconds, token easing converted
to cubic-bezier). Cancelling removes the effect synchronously, including during live downgrades;
there is no Motion DOM visual-element cache to reapply an interrupted transform. There is no mount reveal, outgoing duplicate, delayed content, layout tween or keyed remount.
Rapid changes cancel the previous tween and present the latest month; reversing uses the new direction.
Reduced uses opacity only; none shows the new table immediately. A live mode or clock change cancels
and settles both properties. Grid height changes immediately (including variable week counts).
Caller components override the corresponding defaults and own their motion; caller styles win.
DayPicker's optional `animate` API remains forwarded, but its CSS animation engine requires the caller's
stylesheet; Cadence does not import that stylesheet or activate a second animation clock.
Day buttons retain native button semantics and static selection/range styling, using buttonVariants
without Button's independent press recipe. Navigation uses the same static variants.

### 3.1.4 `layout.shared` for the Toc reading indicator

Toc is T3. One persistent decorative indicator follows the active link using the
`layout.shared` physics spring. A ResizeObserver caches link offsets/heights, including
wrapped labels; committed target changes read that cache, not layout. Two Motion values
represent its top/bottom edges, preserving velocity when retargeted. One native style
writer converts those edges to translateY/scaleY on a one-pixel base; it clamps both
edges to the measured rail. No width/height interpolation or list reflow is authored.

Initial placement, reappearance after a cleared selection, reduced, none and zero
clock all jump. Reduced/none use instant native top/height placement and no transform;
live downgrades synchronously stop both springs before paint without replacing the
indicator or links. Restoring full starts at the settled position. Clock changes
retarget the existing values. The server uses the active link's static border until
the first measurement, so no-JS navigation retains a visible current section.
Text/aria-current follow the current section immediately. Click navigation follows
§3.1.5; the site's mobile disclosure remains instant. There is no scroll.progress or popup recipe.

### 3.1.5 `scroll.navigate` for explicit section navigation

T3 Toc links animate the actual scrolling host's offset with `duration.page` and
`ease.inOut`, scaled by the provider clock. This is an explicit exception to the
transform/opacity/filter property rule: moving the native scroll offset preserves
sticky layout, focus, history and scroll tracking. Never translate the article to
simulate scrolling, use a second native smooth-scroll clock, or read layout per frame.
Measure the target, scroll margins/padding and host bounds in the click handler,
clamp the destination, and use instant native scroll writes from one Motion tween.

Reduced, none and zero clock navigate immediately. A live downgrade completes the
current destination before paint; positive clock changes retime from the current
offset. Repeated links cancel the old writer and start from the current position.
Wheel, touch, pointer, scrolling keys, resize, history traversal, external hash changes
and unmount cancel it, with no later snap to the abandoned destination. Completion
focuses the heading without another scroll, preserving any caller tabindex. Modified
clicks, caller-cancelled events and missing targets retain native link behavior.
Keep URL query/history state and hashchange notifications. Initial hashes, reload,
back/forward and no-JS links remain native and never replay the click animation.

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

The loop clock belongs to the framework theme's `--animate-pulse` / `--animate-spin`
token, including live theme retuning. Provider `timeScale` scales recipes and local
popup clocks; it does not multiply these continuous theme clocks. Removing the
animation class under none cancels the loop on the existing node.

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

## 4. Base UI integration

### Native event boundary for press controls

Button, Toggle and ToggleGroupItem share `lib/press-button.tsx`; their default renderer uses `motion.create()` around a native button adapter.
React `onAnimationStart`, `onDrag`, `onDragStart` and `onDragEnd` travel in a private
prop bag to the native button, beyond Motion's reserved-prop filtering. These remain
React native events, including capture/bubble, cancellation and the real currentTarget;
they must never receive Motion animation definitions or pan information. The adapter
also commits the Base/caller ref independently of Motion’s stable ref callback,
cleaning up the previous callback/object ref on identity changes and unmount without
replacing the DOM node. This preserves React 19 cleanup ownership. It adds no DOM wrapper.
The private `whileTap` input selects `scale.press`; native pointer and Enter handlers drive
committed controls with the token transition. Release outside the button uses cleaned-up
window pointer listeners; disabled, recipe removal and blur clear the visual press.
Motion 13.5.1's keyboard tap synthesizes a bubbling pointercancel on a later blur, even
after keyup. That event can cancel a new Base Slider drag, so the adapter does not install
Motion tap listeners. Caller native events and Base activation/focus still run on the same node.
Caller `render` still replaces the default renderer through Base UI. This boundary
does not establish compatibility for other Motion-rendered parts or prove live-mode
cancellation of an already running gesture.

### Native event boundary for public div parts

ProgressIndicator's default renderer and floating CodeBlockActions use `lib/native-div.tsx`.
Its `motion.create()` native div adapter carries the four reserved React handlers and
caller ref in private props, restoring them to the same DOM node and committing ref
identity changes with React 19 cleanup, as for press controls above. Progress keeps
committed control animation; Actions uses the same committed controller for opacity,
including same-target mode/clock retargeting. No recipe, token, DOM wrapper, or caller render ownership changes. Internal
ControlDiv/ControlSpan consumers are not implicitly migrated or certified.

A Base UI popup enters a "closing" phase before it unmounts, waiting for the animation to finish. Understanding these four patterns is what makes "rich animation" land in practice (official docs: [Base UI Animation](https://base-ui.com/react/handbook/animation.md)).

### Supported animation owners

| Owner                  | Contract                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Base CSS popup         | Token-backed starting/ending classes; local portal clock; opacity-only reduced; visible first frame and zero duration under none |
| Motion popup           | Base render + actual mount lifecycle; recipe timing; preserve focus/portal ownership through reversal and cancellation           |
| Persistent layout host | One Motion value/controller owns the property; measured/clamped geometry and immediate reduced/none targets                      |
| Exit teardown          | Keep the actual surface until exit completion; native callbacks and unmount cleanup must settle it deterministically             |

Never add a second CSS/Motion/engine writer to the same property. Evaluate Base class/style callbacks
before caller-last merging. Live downgrade cancels geometry before paint, retains permitted opacity
under reduced and cancels every motion clock under none. Re-entry reverses the actual surface rather
than remounting its focus owner. A portal resolves the local provider clock, including nested full
under outer none subject to the OS preference. Native CSS clock changes do not promise in-flight
retiming; mode downgrade/none cancellation remains mandatory.

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
  | "scroll.navigate"
  | "scroll.story"
  | "text.reveal"
  | "text.split"
  | "number.roll"
  | "data.transition"
  | "state.morph"
  | "geometry.resize"
  | "handoff"
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

- The provider's MotionConfig fallback uses `duration.base` and `ease.out`, scaled by
  the clock. Shipped Motion parts pass explicit recipe transitions (including controls.start
  and imperative animate calls); their recipe mode branches own reduced/none. The default
  is not a blanket policy for caller-authored Motion components. It does not suppress arbitrary
  caller-authored targets or cancel an already running animation; components own those branches.
- `mode === "none"` → every transition is `{ duration: 0 }`;
- `mode === "reduced"` or a system preference → drop `y/x/scale/rotate/filter`, keep only `opacity`, duration ×0.6;
- `timeScale` (provider prop, default `1`) multiplies durations, spring `visualDuration`, and delays; the docs
  site's speed gear passes `4` for its `0.25×` setting. It scales nothing inside `none` — a disabled transition
  stays disabled;
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

| Metric                            | Budget                                             | How it is checked                                           |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Motion runtime (initial)          | ≤ 48 KB gzip (measure the actual required runtime) | Build analysis                                              |
| Per-component added JS            | ≤ 8 KB gzip (shared runtime excluded)              | Build script                                                |
| Initial JS per page               | ≤ 120 KB gzip                                      | Production browser request audit (`site-js-budget.spec.ts`) |
| Frame rate                        | ≥ 55 fps on a mid-range mobile device              | Playwright trace / manual                                   |
| CLS                               | < 0.02                                             | Lighthouse / Playwright                                     |
| Simultaneously animating elements | ≤ 20 (stagger scenarios)                           | Code review                                                 |
| Total stagger duration            | ≤ 400 ms                                           | Code review                                                 |

Implementation rules:

1. **Animate only `transform` / `opacity` / `filter`**; `filter: blur()` is costly, so use it only on small text areas and at ≤ 4px. The documented exceptions are chart SVG data geometry (§3.1.2), native scroll offsets through `scroll.navigate` (§3.1.5), disclosure height and `geometry.resize`. The latter two are measured, clamped to the closed size, confined to T3 continuity components, and resolve to zero duration under reduced/none.
2. **No layout-read loops**: `getBoundingClientRect` and `offsetWidth` are read inside event/`ResizeObserver` callbacks only, and reads precede writes.
3. **`will-change` is removed once done**: add it only while animating, remove it afterwards (or let Motion manage it).
4. **`layout` animations trigger layout measurement**: for lists over 50 items, switch to manual transform or paginate.
5. **Springs must not overshoot**: `bounce ≤ 0.2` for UI elements; larger values are for marketing only. A physics-defined spring that inherits velocity can still cross its target once, so measured geometry also clamps the rendered value (rule 9).
6. **Lazy-load GSAP**: the `scroll.story` component imports `gsap` dynamically so it never hits first paint.
7. **Keep `AnimatePresence` subtrees small**: wrap only the elements that need an exit, never a whole page.
8. **Interruptible springs are physics-defined**: a recipe that can be retargeted mid-flight
   (`layout.move`, `layout.shared`, `geometry.resize`, `handoff`) declares `continuity: "velocity"`,
   and `transitionFor()` expands the token into `stiffness`/`damping`/`mass` after `timeScale`.
   Never hand a `visualDuration` spring to an element that must reverse smoothly.
9. **Measured geometry is clamped**: render `clampMeasuredSize(value, closedSize)` around the
   animated width/height, so a label never dips under the width it needs. Clamp the rendered value,
   not the spring: the underlying physics stays continuous.

---

### Measurement protocol

KB is decimal: page initial JS ≤120000 bytes, Motion ≤48000, component addition ≤8000.
Measure a production page in a fresh browser/context with CDP cache disabled and no storage,
interaction, scrolling, request blocking or script exclusions. Wait for the page, load/networkidle,
another 10 seconds, then networkidle. Count all automatic script/prefetch/async JS responses,
deduplicate absolute URLs, gzip each decoded body separately at level 6 and sum. Do not concatenate
chunks before compression or use transfer encoding/Content-Length as the gzip value. Preserve
response status, SHA-256, initiators and build/root manifests; errors or missing responses fail.
Existing inline theme bootstrap and serialized data are HTML, not external bundles; never move
application code to inline/data/eval or beyond the observation window to evade the gate.

Compiled component addition excludes a declared shared runtime baseline, retains dedicated dependencies
and explicitly distinguishes initial versus reachable async output. Source tier gzip, local-only
compiled code and full consumer addition are separate metrics. Mixed chunks cannot be assigned exact
package gzip by proportional raw-byte allocation. A lean fixture never certifies a complete route.

CLS uses the maximum session window (gap <1 second, total span <5 seconds), excluding recent-input
shifts; keep raw entries and report routes/viewports/actions/window. Cold-load passing results do not
prove untested interactions. FPS needs a real midrange device, environment/thermal/refresh metadata
and presented-frame traces across actual motion windows; desktop emulation or rAF frequency is not
equivalent. Repeat meaningful windows without averaging in idle time.

Reusable collectors: scripts/site-js-budget.mjs, audit-site-pages-js.mjs, audit-w3-site.mjs,
audit-w3-bundles.mjs and audit-w4-interaction-cls.mjs. Save results under .cache/audits; current
gates and future work belong to [the plan](parity-plan.md#8-next-work).

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

Animated component suites must execute `expectMotionContract(mode)` in full, reduced and none.
`tests/motion-contract-reporter.mjs` (configured in Vitest) enforces successful runtime calls for every
registry UI/block with a nonempty `meta.motion`; an import, comment, skipped test or dead call does not count. T0 structural suites
have no provider/helper obligation. The scaffold leaves an intentionally failing contract test until
the animated fixture is implemented.

The shared unit helper checks mounted `data-motion` parts, CSS state classes and local clocks,
continuous animation gating, and observed Motion targets/transitions. Only successful test cases
contribute runtime metadata; skipped suites do not count.
`registry:check` requires the named animated test file to exist. Test-only pass-through
observers preserve real Motion rendering and control methods. Neutral scale/translation is legal;
Switch/Progress retain positional transforms with an instant clock under reduced/none. Static
placement transforms and direct pointer geometry are not entrance animations. Spinner alone retains
its documented single-glyph spin under reduced. Decorative glyph orientation (for example CodeBlock's
expanded chevron) may retain a rotation target with a zero clock; a timed rotation still fails.
Imperative geometry fixtures opt into `instantImperative` for the reduced clock; none always checks
observed imperative clocks. Engine and native WAAPI animation tests supply an
explicit behavior assertion for their actual clock/keyframes; a wrapper's mode alone is insufficient.
Composition suites include the installed controls, rather than inventing a motion branch on the root.
Use a homogeneous provider fixture; retain dedicated nested-override tests for mixed mode trees.

This is executable unit evidence, not a browser animation sampler or a source property extractor.
The docs recipe set is checked separately by `registry:check`. Existing interaction assertions stay.
Computed Tailwind styles, same-target live cancellation, first paint, system preference, nested
providers, final measured positions and per-frame running geometry still need browser evidence.
Adopting the helper does not close the cross-library running-mode audit.

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
- [ ] Do the layout springs keep their velocity when retargeted (physics-defined, not `visualDuration`)?
- [ ] Is every measured size clamped to its closed size, and instant under reduced/none?
- [ ] Under reduced motion, is the information complete and the state still recognisable?
- [ ] Does it animate only transform/opacity/filter? Does it trigger layout?
- [ ] Does it use this document's tokens and recipes? Are there new magic numbers?
- [ ] Is there a matching Playwright assertion or screenshot?
- [ ] Is it still acceptable on low-end devices (4× CPU throttle)?
- [ ] Does the duration match the element's place in the hierarchy?
- [ ] Can it be fully disabled with `data-motion="none"`?

### Data Table composition (B8)

The `registry:block` Data Table is T2 because it composes Button `feedback.press`,
Checkbox / menu `state.morph`, and Dropdown Menu `popup.anchored` / `exit.fade`.
Its rows, column visibility, sorting, filters and page changes update immediately
in all three modes. There is no row reveal, `data.transition` or geometry recipe:
removing or reordering data must not remount the table or its filter input.
Stable application IDs key surviving rows. The installed controls own their
existing motion contracts. Dropdown Menu now owns its portal's token clock just
as Sheet does, resolves caller class/style callbacks last, and removes starting
opacity in `none`; nested full, reduced, none and live downgrade are checked with
the Data Table composition. Each composition must retain the installed controls' own contracts.

### Date Picker composition (B8)

The T2 `registry:block` composes Button `feedback.press`, Popover
`popup.anchored` / `exit.fade` and Calendar `data.transition`. The date label and
selection update immediately. Single/range selection never keys the popup or
calendar by the selected value. Month movement follows §3.1.3 unchanged.
Popover resolves duration.fast locally through the portal with timeScale and
reducedDurationScale; caller callback classes/styles are evaluated and merged
last. Full uses opacity and scale, reduced transitions opacity only, none uses
transition-none/duration-0 and removes hidden starting/ending opacity. Removing
the scale transition on downgrade cancels an active scale immediately. Nested
full under outer none restores the local clock, subject to OS reduce. Other popups require their own applicable lifecycle proof.

Site DocumentEntrance treats a consumed entrance as shown even when offscreen: restoring full mode after initial none must not re-hide or replay the same document host. SSR hidden, noscript and print restoration stay unchanged.
