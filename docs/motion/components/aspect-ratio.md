# Aspect Ratio motion contract

Status: target design; implementation and verification pending.

AspectRatio maintains reserved media space and smooths an intentional ratio change without distorting the media. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["aspect-ratio#AspectRatio"],
    "layout": ["aspect-ratio#AspectRatio"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                         | References                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Appearance      | default: aspect-ratio wrapper for independent insertion; inherited when the media/card parent owns the same entrance.                                      | default: `aspect-ratio.root.enter`                                           |
| Size            | default: wrapper owns one ratio-dependent physical dimension when the other is definite and stable; parent constraints and passive resizing remain native. | default: `aspect-ratio.root.resize`; inherited: `aspect-ratio.layout.follow` |
| Surface colour  | default when an authored wrapper background/border changes; the default transparent wrapper otherwise has no colour transition to perform.                 | default: `aspect-ratio.root.colour`                                          |
| Text colour     | inherited for descendant text; composed if the caller supplies an independent overlay foreground owner.                                                    | inherited: `@root`; composed: `@root`                                        |
| Changed text    | composed: arbitrary children/media overlays are not a text slot owned by AspectRatio.                                                                      | composed: `@root`                                                            |
| Changed numbers | not applicable to the ratio prop, which describes geometry; composed for an explicit displayed numeric overlay.                                            | not-applicable: `@root`; composed: `@root`                                   |

## Choreography and modes

| Trigger / owner                                           | full                                                                                          | reduced                           | none       | Binding → preset → recipe/form                                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Independent insertion / wrapper                           | Opacity entrance with final reserved space already present.                                   | Short opacity.                    | Immediate. | `aspect-ratio.root.enter` → `presence.surface` → `enter.pop/opacity`                                                  |
| Ratio prop changes / wrapper                              | Resolve the native ratio-dependent physical dimension and interpolate that one eligible axis. | Final ratio geometry immediately. | Immediate. | `aspect-ratio.root.resize` → `geometry.compact` → `geometry.resize/measured`                                          |
| Wrapper colour target changes / wrapper                   | Scoped surface transition if a surface exists.                                                | Short colour.                     | Immediate. | `aspect-ratio.root.colour` → `state.color` → `state.color/surface`                                                    |
| Parent resize or media decoding / native layout and media | Reserved geometry tracks parent directly; the child owns any image reveal.                    | Same.                             | Same.      | `aspect-ratio.layout.follow` → `engine.native` → `native/css-layout` (native CSS layout and caller media (no recipe)) |

## Interruption and lifecycle

Repeated ratio changes retarget the same eligible physical dimension from its current presentation. A simultaneous parent constraint or writing-mode change recomputes native ratio geometry immediately and invalidates the old axis/measurement. Parent removal owns any retained exit; unmount cancels observation. Live reduction commits final geometry with permitted short opacity/colour; none or zero recipe clock cancels all one-shot geometry, presence and colour writers before paint. Image decode must never reset the ratio or restart the wrapper entrance.

## Geometry and performance

`ratio` means physical width divided by physical height, independent of writing mode. The ordinary definite-width/auto-height layout owns height; a supported definite-height/auto-width layout may instead own width. Preserve native box-sizing, intrinsic and min/max constraints when resolving that destination. Do not substitute inline-size/block-size into the same division without mapping their physical axes. If both dimensions are definite, neither is made ratio-driven by animation. If both are indefinite or the constraint relationship is cyclic/unknown, retain immediate native layout rather than inventing a dependent axis.

Animate only that one owned dependent axis; the definite dimension remains with its existing owner. Resolve one native destination for a supported finite positive ratio, never tweening CSS ratio and the dependent dimension simultaneously. Do not invent a fallback ratio for invalid input. Preserve caller overflow/object-fit and SSR media reservation; do not scale a bitmap or animate the ratio as displayed text. Lay child media/overlays at final geometry. If intermediate sizes would stretch media, newly crop final-visible content or disturb a focused descendant, commit the axis immediately. One bounded measurement and one size writer suffice; passive resizing and hidden/unknown recovery establish native layout without a zero-to-target reveal.

The ratio-derived pixel dimension is a temporary presentation constraint. Once it settles or yields
to parent resizing, release it to the current ratio/caller sizing owner so later constraints still
recompute native geometry. Do not leave the old pixel lock active or clear a caller's explicit
dimension while restoring native layout.

## Acceptance scenarios

Also pending: compare horizontal and vertical writing modes with definite width, definite height,
both dimensions fixed and an indefinite/cyclic allocation. Preserve the native physical ratio and
box-sizing result. Change writing mode during a ratio flight; no reciprocal-ratio mistake, stale
axis writer or override of a caller-fixed dimension survives.

Also pending: complete a ratio change, then resize only the parent; the ratio remains responsive.
Interrupt with a caller-provided fixed height and a simultaneous parent-width change; old cleanup
cannot remove that height or restore the obsolete ratio destination.

Target acceptance; not executed: ratio changes on a stable width; rapid ratio reversals; simultaneous responsive resize; late/cached image load; caller overlays and clipping; SSR reservation; full/reduced/none and zero clock during a ratio change.

Also pending: invalid/non-finite ratios, fixed caller height, media without object-fit, focusable overlays and a hidden initial host; the design preserves native outcomes instead of manufacturing geometry or newly clipping content.
