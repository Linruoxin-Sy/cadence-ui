# Textarea motion contract

Status: target design; implementation and verification pending.

Textarea preserves the immediacy of typing and native resizing, while giving deliberate non-editing geometry changes a controlled transition. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: textarea for independent insertion; inherited when an enclosing field enters. |
| Size | default for explicit rows/owned-dimension revisions while unfocused and outside selection or resize interaction; native field-sizing growth, value-driven reflow and pointer resizing are immediate; parent dimensions are inherited. |
| Surface colour | default: textarea background, border and scoped focus/invalid shadow. |
| Text colour | default: foreground and placeholder colour on state changes, without affecting native selection or caret. |
| Changed text | not applicable to editable value/placeholder: native editing, IME and selection retain ownership; composed helper text is a separate display. |
| Changed numbers | not applicable to numeric characters in the editable value; a composed counter owns its numeric presentation. |

## Choreography and modes

| Trigger / owner | full | reduced | none | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Independent insertion / textarea | Opacity entrance. | Short opacity. | Immediate. | `textarea.root.enter` → `presence.inline` → one-shot opacity `data.transition` |
| Focus/invalid/disabled state / chrome | Scoped colour and shadow feedback; native focus remains immediately evident. | Short colour feedback. | Immediate final chrome. | `textarea.root.colour` → `state.color` → target `state.color` |
| Explicit rows/owned-dimension revision while unfocused / textarea | Measure the native final block destination and interpolate only when native field-sizing/resize ownership can be preserved. Focused or value-driven geometry is immediate. | Immediate height. | Immediate height. | `textarea.root.resize` → `geometry.content` → `geometry.resize` |
| Typing, composition, pointer resizing / native textarea | Direct native value and geometry; no easing behind the pointer or caret. | Same. | Same. | `textarea.control.edit` → `engine.native` → native Textarea editing/resizing (no recipe) |

## Interruption and lifecycle

Editing, selection movement or manual resize takes precedence over an in-flight height animation and commits the live native target. Repeated non-editing programmatic revisions retarget instead of accumulating growth animations. Removal disposes observation without delaying focus cleanup. Live reduced cancels geometry; none or a zero clock also cancels chrome/entry and any delayed work. Native scroll position is never reset for an animation.

Focus acquisition cancels any height interpolation before paint, even while the caret is idle. Keep the content box, scroll extent, selection direction and native scroll position stable through focus, IME and pointer selection. Blur or resize release never replays discarded geometry; only a new eligible explicit revision can animate. Controlled value updates and browser field-sizing remain immediate whether or not the editor is focused.

## Geometry and performance

Use the actual field-sizing/content box; no default duplicate hidden editor or per-character measurement. Animate block size only when the component owns it, with min/max height and overflow respected. Active typing, dense external streaming into the editor, passive width wrapping and user resizing stay immediate. An attached Field error or InputGroup addon has a separate owner, coordinated at the parent.

For an eligible explicit revision, resolve the native final block size at the final width in a committed layout read phase, then let one presentation-height owner interpolate to that destination. Never read its interpolated height back as intrinsic content size or add a per-keystroke scrollHeight loop. If browser field-sizing, caller sizing or native DOM/ref constraints prevent a reliable natural destination, settle immediately. Do not introduce a second editor or clip the final visible text/focus outline to manufacture a resize effect. Limit work to one box per eligible revision; passive changes cancel rather than retrigger the tween.

## Acceptance scenarios

Target acceptance; not executed: IME and multiline selection; field-sizing growth; manual resize; rows/programmatic non-editing updates; max-height scrolling; external updates during typing; invalid feedback; full/reduced/none and zero clock mid-resize.

Also pending: focus an unfocused rows transition before typing; select multiline text, scroll it and update its controlled value; verify native geometry/scroll stability and no deferred replay after blur. Cover browsers with and without field-sizing support.
