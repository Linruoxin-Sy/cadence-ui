# Aspect Ratio motion contract

Status: target design; implementation and verification pending.

AspectRatio maintains reserved media space and smooths an intentional ratio change without distorting the media. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: aspect-ratio wrapper for independent insertion; inherited when the media/card parent owns the same entrance. |
| Size | default: wrapper owns ratio-prop-driven block geometry at the current inline size; inherited parent width and passive resizing resolve immediately. |
| Surface colour | default when an authored wrapper background/border changes; the default transparent wrapper otherwise has no colour transition to perform. |
| Text colour | inherited for descendant text; composed if the caller supplies an independent overlay foreground owner. |
| Changed text | composed: arbitrary children/media overlays are not a text slot owned by AspectRatio. |
| Changed numbers | not applicable to the ratio prop, which describes geometry; composed for an explicit displayed numeric overlay. |

## Choreography and modes

| Trigger / owner | full | reduced | none | Binding / preset |
| --- | --- | --- | --- | --- |
| Independent insertion / wrapper | Opacity entrance with final reserved space already present. | Short opacity. | Immediate. | aspect-ratio.root.enter → presence.surface |
| Ratio prop changes / wrapper | Measure available inline size and interpolate the resulting block size. | Final ratio geometry immediately. | Immediate. | aspect-ratio.root.resize → geometry.compact |
| Wrapper colour target changes / wrapper | Scoped surface transition if a surface exists. | Short colour. | Immediate. | aspect-ratio.root.colour → state.color |
| Parent resize or media decoding / native layout and media | Reserved geometry tracks parent directly; the child owns any image reveal. | Same. | Same. | aspect-ratio.layout.follow → engine.native |

## Interruption and lifecycle

Repeated ratio changes retarget from the displayed height. A simultaneous parent-width change recomputes the final ratio geometry and takes precedence over an obsolete measurement. Parent removal owns any retained exit; unmount cancels observation. Live reduction commits final geometry with permitted short opacity/colour; none or zero recipe clock cancels all one-shot geometry, presence and colour writers before paint. Image decode must never reset the ratio or restart the wrapper entrance.

## Geometry and performance

Animate only the owned block axis; inline size remains constrained by the parent. Do not scale the content bitmap or interpolate the ratio number as displayed text. Preserve caller overflow/object-fit choices and keep media reservation on the server. No continuous resize spring follows viewport dragging, and no observer feedback loop rewrites the measured inline axis.

Resolve one destination from the final available inline size and a supported finite positive ratio, subject to existing min/max and caller sizing rules; never tween CSS ratio and height simultaneously. Do not invent a fallback ratio for invalid input: preserve the existing native result and skip interpolation. Lay child media/overlays at their final reserved geometry. If intermediate host sizes would stretch caller media, crop final-visible text/controls beyond the existing policy, or disturb a focused descendant, commit height immediately. One inline measurement and one block writer suffice; hidden/unknown dimensions settle when valid without a zero-to-target reveal.

## Acceptance scenarios

Target acceptance; not executed: ratio changes on a stable width; rapid ratio reversals; simultaneous responsive resize; late/cached image load; caller overlays and clipping; SSR reservation; full/reduced/none and zero clock during a ratio change.

Also pending: invalid/non-finite ratios, fixed caller height, media without object-fit, focusable overlays and a hidden initial host; the design preserves native outcomes instead of manufacturing geometry or newly clipping content.
