# Attachment motion contract

Status: target design; implementation and verification pending.

Attachment communicates its supplied idle/uploading/processing/error/done state while keeping filename, preview and independent actions stable. It does not upload, retry or delete files itself. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: attachment owns insertion and later media/action changes; attachment-group coordinates membership; inherited under a parent entrance. |
| Size | default: attachment owns content/orientation/explicit-size geometry, and group owns visible item positions; native horizontal scrolling remains direct. |
| Surface colour | default: attachment and attachment-media state/background/border targets; AttachmentAction inherits Button ownership. |
| Text colour | default: title/description/media foreground on supplied state changes; actions retain their Button owner. |
| Changed text | default: plain filename and description strings use changed-only replacement; composed rich metadata; filename identity is never interpreted as a number. |
| Changed numbers | default: direct numeric quantities in descriptive display content; formatted rich metadata/progress uses composition; names, extensions and IDs remain textual. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding / preset |
| --- | --- | --- | --- | --- |
| Add/remove attachment / root and visible group | Fade changed file tile; retained files reflow. | Positions immediate; short opacity. | Immediate. | attachment.root.enter → presence.inline; attachment.root.exit → presence.exit; attachment.group.move → layout.compact |
| Later media/action insertion, removal or preview replacement / retained local region | Fade only the changed visual; current action semantics and preview identity commit immediately. Initial parts inherit tile entry. | Short opacity. | Final parts immediately. | attachment.part.enter → presence.inline; attachment.part.exit → presence.exit; attachment.media.replace → data.update |
| Supplied state changes / root/media/description | Scoped colours and preview opacity transition to the actual state. | Short colour/opacity. | Immediate. | attachment.surface.colour → state.color; attachment.text.colour → state.color; attachment.media.update → data.update |
| Visible uploading/processing / title opacity | Local pulse only; cancel it and restore resting title opacity before a title replacement, then resume only for the current still-busy revision. | Static title; no loop. | Static title; no loop. | attachment.title.busy → status.loop |
| Filename/metadata or structural revision / display and tile | Changed-only text with stagger:none or quantity reels; retarget owned tile dimensions. | Short text opacity; quantity/geometry immediate. | Immediate. | attachment.text.replace → text.replace; attachment.value.roll → number.compact; attachment.root.resize → geometry.compact |
| Trigger activation / internal feedback visual | Press feedback on a visual layer, preserving overlay trigger and action hit targets; AttachmentAction inherits Button press. | No scale. | No animation. | attachment.trigger.press → feedback.press |

## Interruption and lifecycle

State changes cancel obsolete busy visuals immediately: error/done never waits for a pulse cycle. Old media completions cannot replace a new file identity. Rapid metadata updates retarget instead of queueing. Group removal retains only a noninteractive visual, and actions remain independent from the overlay trigger. Live reduced/none stops busy loops; zero recipe clock settles one-shot effects while continuous theme clocks retain their separate policy. Unmount cancels loop, media callbacks and measurement; reopening never resurrects an obsolete file.

Stable group keys and the composed preview's own source identity define a file; Attachment does not infer identity from its filename or add an upload/decode API. A preview integration must invalidate its stale load callbacks when that identity changes. Local part retention is decorative only; unavailable retention means immediate removal. Lost capture, pointer cancellation, blur or action/trigger removal clears press feedback. Parent closure or hiding stops loops and cancels local visual work; returning displays current state without a queued replay.

One title opacity owner arbitrates activity and text replacement. Entering a replacement restores the stationary title so unchanged characters do not inherit a dim pulse; only changed runs animate. A completion can resume the theme pulse only when its identity/revision, visibility, mode and busy state still match. Media state opacity and preview crossfade likewise use one owner or disjoint documented layers, never competing opacity transitions on `attachment-media`.

## Geometry and performance

For a deliberate orientation/size change, lay out metadata at the destination width first, then animate the tile's owned box; do not animate font size or continuously rewrap a truncated filename. Preview reservation stays stable. Only visible changed group members are measured; native horizontal scroll/snap is never eased by a second engine. Keep action focus rings and overlay hit geometry outside any temporary content clipping. A title pulse has one local opacity owner and no travelling shimmer.

The group consumes final tile destinations once; its layout displacement never writes the same transform as the internal trigger-press visual. While native scrolling/snap or a captured trigger/action interaction is active, commit affected group geometry immediately instead of interpolating under that interaction; do not replay it afterwards. If intermediate tile dimensions add clipping to the final visible filename/action, settle that axis immediately. Async media decode without an intentional content revision is passive layout, not a new tile-growth cause. Use one measurement per changed visible tile and bounded title/description/preview work; oversized groups skip blanket measurement and offscreen decoration. Numeric filename strings and already formatted metadata remain text unless explicitly composed as a quantity.

## Acceptance scenarios

Target acceptance; not executed: uploading to processing/error/done; quick state reversals; filename diff and numeric metadata; horizontal/vertical layouts; preview decode race; overlay trigger versus action; group removal while scrolling; live modes and separate zero recipe/theme-loop clocks.

Also pending: rename during a busy pulse, complete/error before the replacement finishes, and replace preview/actions while scroll snapping or pressing; no obsolete pulse restart, duplicate action, competing opacity/transform writer or false filename count is permitted.
