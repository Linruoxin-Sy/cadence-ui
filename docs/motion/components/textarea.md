# Textarea motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

Textarea preserves the immediacy of typing and native resizing, while giving deliberate non-editing geometry changes a controlled transition. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["textarea"],
    "control": ["textarea"]
  },
  "axes": { "root": ["height"] },
  "parts": {
    "root": ["textarea#Textarea"],
    "control": ["textarea#Textarea"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                                                              | References                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Appearance      | default: textarea for an independent insertion only; inherited when an enclosing field enters, and never a fade over an already-usable or hidden native control.                                                                                                                | default: `textarea.root.enter`                                      |
| Size            | default for one explicit block revision — a caller `rows` change or an authored px height — while the editor is unfocused and outside selection or resize interaction; native `field-sizing` growth, value-driven reflow, pointer resizing and parent dimensions are inherited. | default: `textarea.root.resize`; inherited: `textarea.control.edit` |
| Surface colour  | default: textarea background, border and scoped focus/invalid shadow, with an unverified palette settling at its target instead of an unreadable midpoint.                                                                                                                      | default: `textarea.root.colour`                                     |
| Text colour     | default: foreground and placeholder colour on authored state changes, without affecting native selection, caret or accessible state.                                                                                                                                            | default: `textarea.root.colour`                                     |
| Changed text    | not applicable to the editable value or its placeholder: native editing, composition and selection retain ownership, and a composed helper or counter is a separate display.                                                                                                    | not-applicable: `@root`                                             |
| Changed numbers | not applicable to numeric characters inside the editable value, including native `maxLength`; a composed counter owns its own numeric presentation.                                                                                                                             | not-applicable: `@root`                                             |

## Choreography and modes

| Trigger / owner                                                        | full                                                                                                                                                                                                                  | reduced                                                         | none                    | Binding → preset → recipe/form                                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Independent insertion / textarea                                       | Opacity entrance on the native control with an immediately usable editor; focus, an unusable host or a missing presenting parent keeps native paint.                                                                  | Short opacity.                                                  | Immediate.              | `textarea.root.enter` → `presence.inline` → `data.transition/opacity`                                        |
| Focus/invalid/disabled state / chrome                                  | DOM focus-within or invalid state makes all declared chrome/foreground paint immediate; other eligible colour/shadow changes transition.                                                                              | Same immediate owner priority; otherwise short colour feedback. | Immediate final chrome. | `textarea.root.colour` → `state.color` → `state.color/surface-foreground`                                    |
| Explicit `rows` or authored-height revision while unfocused / textarea | Measure the native final block destination at the final width once, then interpolate only when the destination still shows its text and no caller clock owns the axis. Focused or value-driven geometry is immediate. | Immediate height.                                               | Immediate height.       | `textarea.root.resize` → `geometry.content` → `geometry.resize/measured`                                     |
| Typing, composition, pointer resizing / native textarea                | Direct native value and geometry; no easing behind the pointer or caret and no text surrogate.                                                                                                                        | Same.                                                           | Same.                   | `textarea.control.edit` → `engine.native` → `native/textarea` (native Textarea editing/resizing (no recipe)) |

## Interruption and lifecycle

Editing, selection movement or manual resize takes precedence over an in-flight height animation and commits the live native target. Repeated non-editing programmatic revisions retarget instead of accumulating growth animations. Removal disposes observation without delaying focus cleanup. Live reduced cancels geometry; none or a zero clock also cancels chrome/entry and any delayed work. Native scroll position is never reset for an animation.

Focus acquisition cancels any height interpolation before paint, even while the caret is idle. Keep the content box, scroll extent, selection direction and native scroll position stable through focus, IME and pointer selection. Blur or resize release never replays discarded geometry; only a new eligible explicit revision can animate. Controlled value updates and browser field-sizing remain immediate whether or not the editor is focused.

## Geometry and performance

Use the actual field-sizing/content box; no default duplicate hidden editor and no per-character measurement. Only the block axis is interpolated, and only while the component owns it: an explicit `rows` or authored px height, with CSS min/max height and overflow respected. Active typing, dense external streaming into the editor, passive width wrapping and user resizing stay immediate. An attached Field error or InputGroup addon has a separate owner, coordinated at the parent.

For an eligible explicit revision, resolve the native final block size at the final width in a committed layout read phase, then let one presentation-height owner interpolate to that destination. Never read its interpolated height back as intrinsic content size and add no per-keystroke `scrollHeight` loop; the readable check reads the committed box once and settles immediately when the destination would clip its text. If browser field-sizing, caller sizing or native DOM constraints prevent a reliable natural destination, settle immediately. Do not introduce a second editor or clip the final visible text/focus outline to manufacture a resize effect. Limit work to one box per eligible revision; passive changes cancel rather than retrigger the tween.

After an eligible size transition, the released effect restores the current native `rows`/field-sizing and caller constraints, not the captured height from before the revision. If a user resize takes over, its current native height belongs to that interaction: cancelling the animation neither clears nor replaces it. The final native box and scroll position agree with the animation endpoint; otherwise the adapter uses immediate native geometry without installing a persistent pixel lock.

## Acceptance scenarios

Pending: finish an unfocused rows change, then edit, wrap at a new parent width and use the native resize handle. Also grab that handle during a height transition and deliver its old cleanup afterward. Field-sizing and the user's actual size remain authoritative with no stale restored height.

The executed suite covers a rows revision in full/reduced/none with a zero clock through the shared action and boundary contracts, the verified colour clock with focus/invalid/unverified-palette settlement, and native editing/selection/form/scroll ownership. Target acceptance remains unexecuted in a browser: IME and multiline selection, field-sizing growth, manual resize, rows and controlled non-editing updates, max-height scrolling, external updates during typing, invalid feedback, focus during an unfocused rows transition, and geometry/scroll stability across browsers with and without field-sizing.

While a background/foreground transition is active, focus or mark the textarea invalid and verify all declared paint settles immediately without changing its scroll position. Review light/dark and narrow/wide rendering; every mode still needs its own browser evidence.
