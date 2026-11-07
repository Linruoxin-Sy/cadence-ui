# Input Group motion contract

Status: target design; implementation and verification pending.

InputGroup presents a single stable frame while addons, display text and actions change around a native editor. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names. InputGroupText currently has no dedicated data-slot, and InputGroupButton renders Button; these names identify actual parts rather than invented slots.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: input-group owns one insertion; later addon/action insertion has its own cause; inherited for an enclosing parent entrance. |
| Size | default: frame owns eligible addon/content-driven outer geometry; controls own native editing growth and direct resizing. Any revision affecting a focused editor's box/scroll extent is immediate; parent-constrained dimensions remain inherited. |
| Surface colour | default: input-group owns focus/invalid frame chrome; composed InputGroupButton retains Button feedback; controls do not duplicate frame chrome. |
| Text colour | default: InputGroupText/addon foreground and native control foreground; composed buttons retain their owner. |
| Changed text | default: direct display strings in InputGroupText and addons; composed rich display children; editable input/textarea values remain native. |
| Changed numbers | default: direct display quantities in InputGroupText/addons; composed rich counters; editable numbers and identifier-like affixes do not roll. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding / preset |
| --- | --- | --- | --- | --- |
| Group insertion / frame | One opacity entrance for frame and initial parts. | Short opacity. | Immediate. | input-group.root.enter → presence.inline |
| Addon/action membership change / frame | Fade changed addon; adjust bounded outer size and retained segment positions only when the editor is unfocused and no selection/resize gesture is active. Otherwise commit geometry immediately. | Size/position immediate, opacity only. | Immediate. | input-group.addon.enter → presence.inline; input-group.addon.exit → presence.exit; input-group.root.resize → geometry.compact; input-group.addon.move → layout.compact |
| Focus/invalid/state change / frame and display owners | Scoped colour/shadow transitions; focus is immediately visible. | Short colour. | Immediate. | input-group.root.colour → state.color; input-group.text.colour → state.color |
| Display content revision / InputGroupText or addon | Changed-only text with stagger:none; quantity reels share the frame's geometry transaction. | Short changed-text opacity; quantity/geometry immediate. | Immediate. | input-group.text.replace → text.replace; input-group.text.roll → number.compact |
| Editor changes / input-group-control | Native editing and direct geometry. | Same. | Same. | input-group.control.edit → engine.native |

## Interruption and lifecycle

Rapid addon changes keep the latest structure without replaying the editor. Clicking an addon preserves the existing native focus path. During composition, selection or pointer resize, frame geometry yields to editor stability. Removed actions retain no duplicate tab stop. Live mode changes cancel the corresponding frame/text owners; none or a zero clock also cancels colours, fades and delays. Parent removal consumes descendant exits.

The focus event itself cancels geometry that affects the native editor before paint; idle focus is not permission to animate its content box. Display text/colour may still update, but native value, caret and scroll extents remain immediate. Blur never replays suppressed addon motion. A button/addon that transfers focus uses the native target first, and removal releases its press/measurement registration before any decorative exit.

## Geometry and performance

Measure changed addons and the frame after commitment, on the axis implied by inline/block alignment. Inline adornments retain their existing line/truncation policy; multiline block addons lay out at destination width before frame-height interpolation. Never measure or animate the input value itself. Clamp available editor width; do not clip caret or focus rings. A Button press writes only its own transform, never the frame. Passive responsive layout and textarea typing growth remain immediate.

One frame transaction consumes final addon boxes; child Button dimensions are either delegated for that cause or supply their final destination once. Do not observe a child's interpolated width or let group displacement overwrite its press transform. If the final-visible affix, action or editor would be newly clipped by an intermediate frame, commit that axis immediately. Measure only changed visible addons in one pass; shared text/reel limits or unavailable identity yield immediate affected display/layout, never editor mirroring.

## Acceptance scenarios

Target acceptance; not executed: prefix/suffix and block addons; changing display count; editor IME while addon changes; invalid focus frame; InputGroupButton press; no invented Text slot; constrained width, rapid changes, all modes and zero clock.

Also pending: focus before typing during a suffix resize, update a quantity while selecting text, and remove a block action while a textarea is scrolled; native selection/scroll survive and blur does not start deferred movement.
