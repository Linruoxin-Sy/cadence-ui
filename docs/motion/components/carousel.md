# Carousel motion contract

Status: target design; implementation and verification pending.

Carousel motion follows physical navigation: the slide track stays directly attached to a drag, and Embla owns snapping, loop relocation and settling. `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious` and `CarouselNext` retain the existing orientation, options, plugins and API callback surface. This design does not introduce dots, autoplay or an auto-height plugin.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Native-engine bindings name an authority, not a new recipe.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default for an independently inserted carousel surface; navigation does not replay slide entrances. A caller's slide-level reveal is composed and cannot overwrite the track transform. |
| Size | Inherited/native: Embla's layout/resize path owns slide and track geometry. Auto-height, if already supplied by a caller plugin, remains that plugin's exclusive geometry responsibility; no default second shell tween. |
| Surface colour | Inherited from previous/next Button state; slide surfaces belong to their actual content components. |
| Text colour | Inherited from controls and slide content. No track-wide colour sweep. |
| Changed text | Default for a direct plain CarouselItem string; arbitrary slide trees remain composed. A slide change itself does not mean its unchanged text changed. |
| Changed numbers | Default for a direct finite numeric display in a CarouselItem; rich numeric content is composed. Slide positions/ids are not synthesized into a new counter. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| Pointer drag; Embla track | Direct one-to-one drag in the real orientation. | Direct drag retained; no decorative inertia. | Direct drag retained. | `carousel.track.drag` → `engine.native` → Embla native direct operation |
| Previous/next, focus navigation or release snap; Embla | Existing engine settles to its selected snap/momentum target with the documented attraction-unit clock adapter, not a CSS duration. | Direct drag stays continuous; release/API/focus settling reaches the engine's valid destination immediately. | Same direct drag with immediate autonomous settling. | `carousel.track.navigate` → `data.update` → Embla engine form of `data.transition` |
| Independent late insertion; root paint | Opacity-only surface entry outside the track's transform ownership. | Short opacity. | Visible immediately. | `carousel.surface.enter` → `presence.surface` → `enter.pop` |
| Previous/next hover/disabled/press | Inherit Button colour and press feedback; preserve the control hit target. | Short colour, no scale. | Immediate feedback. | `carousel.control.colour` → `state.color` → planned `state.color`; `carousel.control.press` → `feedback.press` → `feedback.press` |
| Direct slide text/number value changes | Changed text runs without stagger; numeric place-value rolling, independent of track position. | Changed text opacity only; number immediately. | Final content immediately. | `carousel.text.replace` → `text.replace` → planned `text.change`; `carousel.number.change` → `number.compact` → `number.roll` |

## Interruption and lifecycle

- New navigation interrupts the current Embla settling target; dragging immediately takes direct ownership. No second Motion/CSS transform, native smooth-scroll clock or queued slide transition is added.
- Preserve the existing Embla instance, selected snap and plugin identity on mode changes. The documented mode adapter clamps/cancels autonomous settling for reduced/none and zero recipe clock without calling a destructive reinitialization solely to animate. While a pointer owns direct drag, keep the current tracked position and pointer ownership; do not treat a downgrade as a command to jump to an older snap. On release, the engine resolves its current valid target with an immediate clock.
- Full-mode opts.duration and breakpoint-specific options retain the existing Embla precedence/calibration; they never bypass the mode ceiling. API navigation, focus navigation, drag release and plugin calls through the engine all use the same adapter. Actual reInit caused by options, slides or resize reattaches the policy to the fresh engine and restores wrappers/listeners on the old one.
- Caller-supplied continuous plugins remain explicit compositions and must stop automatic advance or independent CSS/WAAPI motion under reduced/none, including their schedules rather than merely making advances instantaneous. Preserve caller plugin objects and pause controls. A zero recipe clock settles Cadence-adapted engine work; it is not a substitute for a caller plugin's separate continuous clock policy. This requirement does not add autoplay to ordinary Carousel.
- Slide removal, loop relocation, resize and focus changes resolve through Embla's API. Unmount detaches listeners/plugins and local paint writers; reopening an enclosing surface does not replay past navigation.

## Geometry and performance

Embla alone measures and writes the track's orientation-dependent translation, slide placement, snap range and loop geometry. Keep slide content at destination layout; never scale text or independently animate slide width during direct manipulation. Viewport clipping is the existing carousel overflow boundary; controls and focus outlines remain usable outside it. Additional text/reel effects are limited to changed visible slide content under the shared aggregate work bound; newly visible recycled content starts at its latest value instead of replaying offscreen revisions. Large collections use caller-provided bounded/manual or virtualized content strategies compatible with Embla's actual snap model; Cadence does not invent invisible slide measurements or change snap count to meet a budget. Avoid per-frame slide measurements, duplicate offscreen slides for presence or a second global listener system. A caller auto-height adapter must document its own mode cancellation and natural-content/sizing-host separation before adding height continuity.

## Acceptance scenarios

- Pending: drag, reverse navigation and press next repeatedly in horizontal/vertical and loop configurations; pointer tracking remains one-to-one.
- Pending: change mode or zero clock during settling and during drag; snap semantics, controls, engine instance and plugins remain consistent.
- Pending: resize/remove slides, focus offscreen content and update a direct text/number child; no track writer conflict or stale slide replay occurs.
- Pending: verify SSR, caller plugins, parent presence, unmount and any explicitly composed auto-height behaviour within its own bounds.
- Pending: downgrade midway through an actively held drag, release after downgrade, call API navigation with jump=false, and trigger reInit with an active plugin. Pointer position must not jump to an old snap; no obsolete engine wrapper, autoplay schedule or duplicated clock survives.
