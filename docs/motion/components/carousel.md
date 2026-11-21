# Carousel motion contract

Status: target design implemented on the installed path and verified by the component suite, the browser mode matrix and the review evidence in `.cache/carousel/`. The marker stays `legacy` because the shared adoption subgate has no installed recogniser for the `data.transition/embla` engine form and the strict joint runtime gate is still pending; this document records the target, not a v2 certification.

Carousel motion follows physical navigation: the slide track stays directly attached to a drag, and Embla owns snapping, loop relocation and settling. `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious` and `CarouselNext` retain the existing orientation, options, plugins and API callback surface. This design does not introduce dots, autoplay or an auto-height plugin.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Native-engine bindings name an authority, not a new recipe.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "track": ["carousel#CarouselContent"],
    "surface": ["carousel#Carousel"],
    "control": ["carousel#CarouselNext", "carousel#CarouselPrevious", "button#Button"],
    "text": ["carousel#CarouselItem"],
    "number": ["carousel#CarouselItem"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                  | References                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Appearance      | Default for an independently inserted carousel surface; navigation does not replay slide entrances. A caller's slide-level reveal is composed and cannot overwrite the track transform.                                  | default: `carousel.surface.enter`                      |
| Size            | Inherited/native: Embla's layout/resize path owns slide and track geometry. Auto-height, if already supplied by a caller plugin, remains that plugin's exclusive geometry responsibility; no default second shell tween. | inherited: `carousel.track.layout`; composed: `@track` |
| Surface colour  | Inherited from previous/next Button state; slide surfaces belong to their actual content components.                                                                                                                     | inherited: `carousel.control.colour`                   |
| Text colour     | Inherited from controls and slide content. No track-wide colour sweep.                                                                                                                                                   | inherited: `carousel.control.colour`                   |
| Changed text    | Default for a direct plain CarouselItem string; arbitrary slide trees remain composed. A slide change itself does not mean its unchanged text changed.                                                                   | default: `carousel.text.replace`; composed: `@text`    |
| Changed numbers | Default for a direct finite numeric display in a CarouselItem; rich numeric content is composed. Slide positions/ids are not synthesized into a new counter.                                                             | default: `carousel.number.change`; composed: `@number` |

## Choreography and modes

| Trigger and owner                                                | Full                                                                                                                                | Reduced                                                                                                      | None                                                 | Binding → preset → recipe                                                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer drag; Embla track                                        | Direct one-to-one drag in the real orientation.                                                                                     | Direct drag retained; no decorative inertia.                                                                 | Direct drag retained.                                | `carousel.track.drag` → `engine.native` → `native/embla` (Embla native direct operation)                                                           |
| Slide membership, viewport size or options change / Embla layout | Native engine remeasurement establishes valid slide/snap geometry immediately; no Cadence slide-size spring is added.               | Same native layout.                                                                                          | Same native layout.                                  | `carousel.track.layout` → `engine.native` → `native/embla`                                                                                         |
| Previous/next, focus navigation or release snap; Embla           | Existing engine settles to its selected snap/momentum target with the documented attraction-unit clock adapter, not a CSS duration. | Direct drag stays continuous; release/API/focus settling reaches the engine's valid destination immediately. | Same direct drag with immediate autonomous settling. | `carousel.track.navigate` → `data.update` → `data.transition/embla`                                                                                |
| Independent late insertion; root paint                           | Opacity-only surface entry outside the track's transform ownership.                                                                 | Short opacity.                                                                                               | Visible immediately.                                 | `carousel.surface.enter` → `presence.surface` → `enter.pop/opacity`                                                                                |
| Previous/next hover/disabled/press                               | Inherit Button colour and press feedback; preserve the control hit target.                                                          | Short colour, no scale.                                                                                      | Immediate feedback.                                  | `carousel.control.colour` → `state.color` → `state.color/surface-foreground`; `carousel.control.press` → `feedback.press` → `feedback.press/scale` |
| Direct slide text/number value changes                           | Changed text runs without stagger; numeric place-value rolling, independent of track position.                                      | Changed text opacity only; number immediately.                                                               | Final content immediately.                           | `carousel.text.replace` → `text.replace` → `text.change/changed-runs`; `carousel.number.change` → `number.compact` → `number.roll/reels`           |

## Interruption and lifecycle

- New navigation interrupts the current Embla settling target; dragging immediately takes direct ownership. No second Motion/CSS transform, native smooth-scroll clock or queued slide transition is added.
- Preserve the existing Embla instance, selected snap and plugin identity on mode changes. The documented mode adapter clamps/cancels autonomous settling for reduced/none and zero recipe clock without calling a destructive reinitialization solely to animate. While a pointer owns direct drag, keep the current tracked position and pointer ownership; do not treat a downgrade as a command to jump to an older snap. On release, the engine resolves its current valid target with an immediate clock.
- Full-mode opts.duration and breakpoint-specific options retain the existing Embla precedence/calibration; they never bypass the mode ceiling. API navigation, focus navigation, drag release and plugin calls through the engine all use the same adapter. Actual reInit caused by options, slides or resize reattaches the policy to the fresh engine and restores wrappers/listeners on the old one.
- Caller-supplied continuous plugins remain explicit compositions and must stop automatic advance or independent CSS/WAAPI motion under reduced/none, including their schedules rather than merely making advances instantaneous. Preserve caller plugin objects and pause controls. A zero recipe clock settles Cadence-adapted engine work; it is not a substitute for a caller plugin's separate continuous clock policy. This requirement does not add autoplay to ordinary Carousel.
- Slide removal, loop relocation, resize and focus changes resolve through Embla's API. Unmount detaches listeners/plugins and local paint writers; reopening an enclosing surface does not replay past navigation.

## Geometry and performance

Embla alone measures and writes the track's orientation-dependent translation, slide placement, snap range and loop geometry. Keep slide content at destination layout; never scale text or independently animate slide width during direct manipulation. Viewport clipping is the existing carousel overflow boundary; controls and focus outlines remain usable outside it. Additional text/reel effects are limited to changed visible slide content under the shared aggregate work bound; newly visible recycled content starts at its latest value instead of replaying offscreen revisions. Large collections use caller-provided bounded/manual or virtualized content strategies compatible with Embla's actual snap model; Cadence does not invent invisible slide measurements or change snap count to meet a budget. Avoid per-frame slide measurements, duplicate offscreen slides for presence or a second global listener system. A caller auto-height adapter must document its own mode cancellation and natural-content/sizing-host separation before adding height continuity.

The independent surface entrance affects only the outer root's paint. It does not add an opacity fallback to track navigation or slide snapping; a focused or directly manipulated slide settles any ancestor entrance before native interaction proceeds. The root also publishes a presentation scope, so slide content inserted with the carousel shares that cause instead of stacking a second entrance, while content added later still enters through its own owner.

A direct plain display child resolves its own visibility at commit from Embla's cached `slidesInView`/`slideNodes` records; no additional IntersectionObserver, per-frame measurement or per-slide listener set is created. Navigation keeps the engine's transform writer single.

## Acceptance scenarios

- Verified in the browser mode matrix (full/reduced/none × no-preference/reduce): next/previous, reverse navigation, drag, loop relocation, vertical and RTL alignment, breakpoint/`reInit` options and slide add/remove keep one-to-one tracking and a single track writer (`tests/e2e/carousel.spec.ts`).
- Verified: mode and clock downgrades during autonomous settling keep the instance, plugin identity, selection and final snap, and system reduced-motion cancels the running engine interpolation without a jump (`tests/e2e/carousel.spec.ts` live-downgrade test; `tests/components/carousel.test.tsx` clock/identity cases). A downgrade during an actively held pointer drag is exercised only as the native duration clamp: the engine keeps pointer ownership and the release resolves its current target with the immediate clock; no separate mid-drag E2E script exists.
- Verified: viewport resize, slide removal, focus into offscreen content and direct text/number child changes keep the track identity and never replay stale content (`tests/e2e/carousel.spec.ts` mutation and direct-display tests; the unit suite asserts the offscreen display change reaches its latest value in the commit that changed it).
- Verified: SSR/no-JS markup, cold deep links, caller plugins, parent presence and unmount (`tests/e2e/component-examples.spec.ts` no-JS enumeration, the carousel deep-link cases and the plugin/`setApi` unit cases). Composed auto-height plugins remain caller-owned and out of this task.
- Verified: mid-settling downgrade, release after downgrade, `scrollTo` with `jump=false` and an active plugin across `reInit` keep one engine wrapper, no duplicated clock and no obsolete listener (`tests/components/carousel.test.tsx` plus the browser live-downgrade assertion). Continuous caller plugins must still stop their own schedules under reduced/none; that obligation is documented here and not asserted for a plugin this task does not ship.
- Not measured here: performance-only budgets and real-device frame acceptance. Source growth is recorded (4,218 → 5,400 gzip bytes for the component file, inside the T4 advisory reference) and the browser display-change test records the layout shift it observed; ADR-023 defers separate performance acceptance.
