# Scroll Area motion contract

Status: target design; implementation and verification pending.

Scroll Area gives subtle feedback about scrollability while keeping scrolling native. `ScrollArea` and `ScrollBar` wrap Base UI Root/Viewport/Scrollbar/Thumb/Corner. Scroll coordinates and thumb position/extent remain immediate; authored motion is limited to scrollbar/viewport paint and bounded directly owned display-content changes.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This design adds no automatic scrolling, scroll smoothing or content animation engine.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "scrollbar": ["scroll-area#ScrollBar"],
    "thumb": ["scroll-area#ScrollBar"],
    "viewport": ["scroll-area#ScrollArea"],
    "text": ["scroll-area#ScrollArea"],
    "value": ["scroll-area#ScrollArea"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                           | References                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Appearance      | Default: scrollbar paint fades according to the primitive's actual visibility/interaction state. A later inserted outer surface may inherit parent presence; its entire content is not independently revealed.                    | default: `scroll-area.scrollbar.enter`, `scroll-area.scrollbar.exit` |
| Size            | Not applicable to interpolation of viewport, scroll extent or thumb size: native geometry must track real content immediately. A composed child may own a content change without making ScrollArea chase it.                      | not-applicable: `@viewport`, `@thumb`                                |
| Surface colour  | Default: scrollbar/thumb state colours where defined; viewport focus shadow/outline and all paint declared by that focused owner settle immediately. The hit region stays stable; scrollability does not invent a disabled state. | default: `scroll-area.thumb.colour`, `scroll-area.viewport.colour`   |
| Text colour     | Default for an explicitly changing viewport foreground, or inherited from its existing parent colour owner; rich child components retain their own foregrounds.                                                                   | default: `scroll-area.viewport.colour`                               |
| Changed text    | Default for a direct plain string child of the owned viewport; composed for rich child content. No descendant scanner, document rewrite or editor interception is introduced.                                                     | default: `scroll-area.text.replace`; composed: `@text`               |
| Changed numbers | Default for a supported direct viewport display quantity; composed for rich numeric children. Scroll offsets/extents and numeric identifiers are not displayed counters.                                                          | default: `scroll-area.value.change`; composed: `@value`              |

## Choreography and modes

| Trigger and owner                                             | Full                                                                                                                                                                                                            | Reduced                                                                                       | None                           | Binding → preset → recipe                                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scrollbar becomes visible/hidden; scrollbar paint             | Short opacity entry/exit from current paint state, using existing visibility semantics.                                                                                                                         | Short opacity only.                                                                           | Immediate semantic visibility. | `scroll-area.scrollbar.enter` → `presence.inline` → `data.transition/opacity`; `scroll-area.scrollbar.exit` → `presence.exit` → `exit.fade/opacity` |
| Thumb/track hover or drag state                               | Scoped background/border colour; no geometric thickness or hit-target tween.                                                                                                                                    | Short colour.                                                                                 | Final colours immediately.     | `scroll-area.thumb.colour` → `state.color` → `state.color/surface`                                                                                  |
| Viewport focus or explicit foreground change                  | DOM focus within the viewport settles its entire declared paint immediately and cancels its colour clock. An unrelated verified foreground revision may tween only while that owner is not focus/invalid gated. | Focus/invalid-gated owner paint is immediate; other verified foreground feedback stays short. | Final paint immediately.       | `scroll-area.viewport.colour` → `state.color` → `state.color/surface-foreground`                                                                    |
| Direct plain display child revision; viewport content         | Changed text runs without stagger or changed quantity reels; only bounded safe display content participates.                                                                                                    | Changed-text opacity only; quantities immediately.                                            | Final content immediately.     | `scroll-area.text.replace` → `text.replace` → `text.change/changed-runs`; `scroll-area.value.change` → `number.compact` → `number.roll/reels`       |
| Wheel, touch, keyboard, thumb drag or content/viewport resize | Native scroll coordinates, thumb translation/extent and corner geometry update directly.                                                                                                                        | Same direct operation.                                                                        | Same direct operation.         | `scroll-area.viewport.direct` → `engine.native` → `native/base-ui-scroll-area` (Base UI plus native scrolling/scrollbar geometry)                   |

## Interruption and lifecycle

- Hover/scroll/focus changes reverse the existing scrollbar fade instead of stacking timers. Do not change the primitive's visibility policy or add an arbitrary idle delay.
- Direct input always takes effect immediately in all modes. The library does not intercept wheel/touch to run an authored tween; native user-driven momentum remains native operation. Direct text selection or active manipulation suppresses replacement/reels in an intersecting display scope; final content and scroll range still commit immediately. Native focus-reveal scrolling is not replaced with a custom smooth-scroll effect.
- If content changes, preserve native scroll anchoring unless the owning message/list composition explicitly owns another policy. ScrollArea does not decide whether the reader should be at the end.
- Unmount removes paint/content writers and primitive listeners. Live reduced cancels reels and retains only permitted short paint; none or zero recipe clock settles library-authored paint/content work. This does not disable direct native scrolling or OS momentum. Reopening a parent does not replay existing content or synthesize a scroll destination.

## Geometry and performance

An optional child's outgoing text, reels or row paint is excluded from scrollable overflow as well
as intrinsic size under the shared retention rule. Its transform/absolute position must not lengthen
the range, create another scrollbar or become a scroll-anchor/snap target. Preserve the legitimate
extent change of current content and any existing native child-size owner. If no safe paint boundary
exists, that child omits the decorative effect; ScrollArea does not hide the problem by resetting the
offset, disabling anchoring or adding another scroll controller.

Base UI/native scrolling owns both scroll axes, scrollbar ranges and thumb extents. There is no animated measured-size host here: native layout reflows at destination dimensions and immediately updates scroll range. Direct display strings lay out at final width, with replacement paint excluded from scroll-extent measurement; long text beyond shared diff bounds commits immediately. Do not measure every child, observe each line or attach a second scroll-position smoothing loop. The authored moving set consists only of the existing scrollbar paint layers and bounded changed direct content, not a reveal of every visible descendant. Existing viewport clipping is functional overflow, not a decorative text crop. Preserve focus visibility, horizontal/vertical bars, corner occupancy and pointer targets. A child geometry animation may change scroll extent, but this primitive never adds a second height spring or tries to animate thumb extent after it.

Browser/OS momentum and native CSS scroll snapping remain part of the existing scroll owner, including
after pointer release. They are not Embla/Drawer autonomous clocks and are not cancelled by a generic
`engine.native` policy. A caller-authored smooth-scroll controller has its own explicit composition
and mode obligations; ScrollArea does not add one or change a caller's snap policy.

## Acceptance scenarios

- Pending: replace a direct long string/quantity and remove a composed child near both scroll ends.
  Inspect scroll extents and offsets during the effect and after cleanup, including native snap and
  touch momentum. Only current content/owned geometry changes the range; decorative cleanup does
  not cause a second scroll correction or reset native input.

- Pending: switch full/reduced/none and zero clock during a native touch fling and native scroll snap.
  Authored scrollbar/text effects follow their mode, while native coordinates, capture and snap policy
  remain intact. Compare an explicitly composed authored navigation controller separately.

- Pending: wheel/touch/keyboard and drag each scrollbar during fade-in/out; scroll and thumb remain synchronized without input lag.
- Pending: insert content above/below the viewport, resize it, and toggle horizontal overflow; native anchoring/ranges stay correct.
- Pending: put focused controls and a separately animated child inside the viewport; no focus crop or competing geometry writer appears.
- Pending: verify all modes, live downgrade, zero clock, parent close/reopen and unmount; no authored loop survives while direct scroll still works.
- Pending: change a direct string/quantity while a native text selection, touch fling or thumb drag is active; compare with rich editor children and an oversized direct text node. Native selection, anchoring and scroll extents stay authoritative, with bounded immediate content fallback.

- Pending: focus the viewport or a descendant while its foreground transition runs. The viewport owner's entire declared paint settles immediately; a separately owned scrollbar may keep permitted verified hover feedback. Native focus-reveal scrolling remains unchanged.
