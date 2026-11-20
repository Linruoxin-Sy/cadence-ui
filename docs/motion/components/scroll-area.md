# Scroll Area motion contract

Status: implemented contract; functional evidence is required by the per-item v2 gate.

Scroll Area gives subtle feedback about scrollability while keeping scrolling native. `ScrollArea` and
`ScrollBar` wrap Base UI Root/Viewport/Scrollbar/Thumb/Corner. Scroll coordinates and thumb
position/extent remain immediate; authored motion is limited to scrollbar paint, scoped state colour and
bounded direct display content.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This design adds no automatic scrolling, scroll
smoothing or content animation engine.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "scrollbar": ["scroll-area#ScrollBar"],
    "thumb": ["scroll-area#ScrollBar"],
    "viewport": ["scroll-area#ScrollArea"],
    "text": ["scroll-area#ScrollArea"],
    "value": ["scroll-area#ScrollArea"]
  },
  "regions": {
    "scrollbar": ["scroll-area-scrollbar"],
    "thumb": ["scroll-area-thumb"],
    "viewport": ["scroll-area-viewport"],
    "text": ["scroll-area-text"],
    "value": ["scroll-area-number"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                                                                    | References                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Appearance      | Default: the track the primitive inserts when the viewport gains overflow fades in from its current paint. The same primitive removes the track when overflow ends, so there is no retained node to fade out and no second visibility policy is added.                                | default: `scroll-area.scrollbar.enter`                                                             |
| Size            | Not applicable to viewport, scroll extent or thumb geometry: native and caller-owned layout must track real content immediately. A composed child may own a content change without making ScrollArea chase it.                                                                        | not-applicable: `@viewport`, `@thumb`                                                              |
| Surface colour  | Default: the thumb and track declared background paint plus the viewport's declared scoped foreground/focus paint, including caller state classes and theme/context changes. No geometric thickness or hit-target tween is added; hover and drag themselves change no declared paint. | default: `scroll-area.thumb.colour`, `scroll-area.scrollbar.colour`, `scroll-area.viewport.colour` |
| Text colour     | Default: the viewport's declared foreground and focus paint. DOM focus within the viewport settles its whole declared paint immediately; an unrelated verified foreground revision may tween. Rich child components retain their own foregrounds.                                     | default: `scroll-area.viewport.colour`                                                             |
| Changed text    | Default for a direct plain string child of the owned viewport; composed for rich child content and caller-owned display components. No descendant scanner, document rewrite or editor interception is introduced.                                                                     | default: `scroll-area.text.replace`                                                                |
| Changed numbers | Default for a direct numeric display child of the owned viewport; composed for rich numeric children. Scroll offsets/extents and numeric identifiers are not displayed counters.                                                                                                      | default: `scroll-area.value.change`                                                                |

## Choreography and modes

| Trigger and owner                                                    | Full                                                                                                                               | Reduced                                                                           | None                       | Binding → preset → recipe/form                                                                                                    |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Viewport gains overflow; the primitive inserts the track / scrollbar | Short opacity entry from the current paint; the primitive's own mount stays the visibility authority.                              | Short opacity only.                                                               | Immediate visibility.      | `scroll-area.scrollbar.enter` → `presence.inline` → `data.transition/opacity`                                                     |
| Thumb declared paint revision / thumb                                | Scoped background-colour transition; no thickness or hit-target interpolation.                                                     | Short colour only.                                                                | Final colour immediately.  | `scroll-area.thumb.colour` → `state.color` → `state.color/surface`                                                                |
| Track declared paint revision / scrollbar                            | Scoped background-colour transition on the track; the primitive's visibility stays the mount authority.                            | Short colour only.                                                                | Final colour immediately.  | `scroll-area.scrollbar.colour` → `state.color` → `state.color/surface`                                                            |
| Viewport foreground or focus paint revision / viewport               | Verified foreground feedback tweens; DOM focus within the viewport settles the entire declared paint and cancels the colour clock. | Focus/invalid paint is immediate; other verified foreground feedback stays short. | Final paint immediately.   | `scroll-area.viewport.colour` → `state.color` → `state.color/surface-foreground`                                                  |
| Direct plain string child revision / viewport display content        | Changed text runs without stagger or travel; unchanged graphemes keep their identity.                                              | Changed-text opacity only.                                                        | Final content immediately. | `scroll-area.text.replace` → `text.replace` → `text.change/changed-runs`                                                          |
| Direct numeric child revision / viewport display quantity            | Changed places reel without stagger; the latest value replaces the old target.                                                     | Exact current value immediately.                                                  | Final value immediately.   | `scroll-area.value.change` → `number.compact` → `number.roll/reels`                                                               |
| Wheel, touch, keyboard, thumb drag or content/viewport resize        | Native scroll coordinates, thumb translation/extent and corner geometry update directly.                                           | Same direct operation.                                                            | Same direct operation.     | `scroll-area.viewport.direct` → `engine.native` → `native/base-ui-scroll-area` (Base UI plus native scrolling/scrollbar geometry) |

## Interruption and lifecycle

Hover, scroll and focus reverse or settle the existing scrollbar fade instead of stacking timers. The
contract never changes the primitive's visibility policy, adds an idle delay or unbinds `keepMounted`.

Direct input always takes effect immediately in all modes. The component does not intercept wheel,
touch or keyboard to run an authored tween, and native momentum and CSS scroll snapping remain part of
the existing scroll owner. Direct text selection or active manipulation suppresses replacement or
reels in an intersecting display scope; final content and scroll range still commit immediately.

If content changes, native scroll anchoring is preserved unless the owning composition explicitly
owns another policy. ScrollArea does not decide whether the reader should be at the end.

Unmount removes the paint and content writers together with the track presence owner. A live reduced
downgrade cancels the reel clock and retains only short opacity and colour; none or a zero recipe clock
settles every library-authored writer immediately. This never disables direct native scrolling or OS
momentum, and reopening a parent does not replay existing content or synthesize a scroll destination.

## Geometry and performance

An optional child's outgoing text, reels or row paint is excluded from scrollable overflow as well as
intrinsic size under the shared retention rule. Its transform or absolute position must not lengthen
the range, create another scrollbar or become a scroll-anchor or snap target. Preserve the legitimate
extent change of current content. If no safe paint boundary exists, the child omits the decorative
effect; ScrollArea does not hide the problem by resetting the offset, disabling anchoring or adding
another scroll controller.

Base UI/native scrolling owns both scroll axes, scrollbar ranges and thumb extents. The authored moving
set is the existing track paint plus bounded changed direct content only, never a reveal of every
visible descendant. Direct display strings lay out at final width; long text beyond the shared diff
bounds commits immediately. No per-child measurement, per-line observer or second scroll-position
smoothing loop is added.

Existing viewport clipping is functional overflow, not a decorative text crop. Focus visibility,
horizontal and vertical bars, corner occupancy and pointer targets are preserved. A child geometry
animation may change scroll extent, but this primitive never adds a second height spring or animates
thumb extent afterwards.

## Acceptance scenarios

- Insert a long direct string or quantity and remove a composed child near both scroll ends; inspect
  scroll extents and offsets during the effect and after cleanup, including native touch momentum.
  Only current content changes the range, and decorative cleanup causes no second scroll correction.
- Switch full/reduced/none and the zero clock during a native touch fling: authored scrollbar and
  display effects follow their mode while native coordinates, capture and snap policy remain intact.
- Wheel, touch, keyboard and thumb drag each scroll the viewport during a track fade; scroll and thumb
  stay synchronized without input lag, and the track fade reverses rather than stacking.
- Insert content above or below the viewport, resize it and toggle horizontal overflow; native
  anchoring and ranges stay correct and a `keepMounted` track stays resident without a new range.
- Put focused controls and a separately animated child inside the viewport; no focus crop and no
  competing geometry writer appears, and focus with an in-flight foreground tween settles the whole
  declared paint immediately.
- Verify all modes, a live downgrade, the zero clock, parent close/reopen and unmount; no authored loop
  survives while direct scroll still works.
