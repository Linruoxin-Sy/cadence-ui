# Dialog motion contract

Status: target design; implementation and verification pending.

The modal surface arrives as one readable unit, then accommodates intentional content changes without moving focus or bouncing the reading plane. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "content": ["dialog#DialogContent"],
    "overlay": ["dialog#DialogOverlay"],
    "title": ["dialog#DialogTitle"],
    "description": ["dialog#DialogDescription"],
    "surface": ["dialog#DialogContent", "dialog#DialogOverlay", "dialog#DialogTitle", "dialog#DialogDescription"],
    "quantity": ["dialog#DialogTitle", "dialog#DialogDescription"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                    | References                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `dialog-content` owns panel presence and `dialog-overlay` owns backdrop opacity. Header, footer and initial children inherit that entrance.                                                                                                                     | default: `dialog.content.enter`, `dialog.content.exit`, `dialog.overlay.enter`, `dialog.overlay.exit` |
| Size            | Default: content shell owns content-driven width/height within existing viewport/max-width constraints; its natural-content measurement is separate.                                                                                                                     | default: `dialog.content.resize`                                                                      |
| Surface colour  | Default: content/overlay own their supplied background/border tokens; child buttons retain their own state owners.                                                                                                                                                       | default: `dialog.surface.colour`                                                                      |
| Text colour     | Default: `dialog-title` and `dialog-description` own foreground changes; arbitrary body children inherit or retain component ownership.                                                                                                                                  | default: `dialog.surface.colour`                                                                      |
| Changed text    | Default for primitive title/description content: changed runs only. Rich body/title children use composed ownership.                                                                                                                                                     | default: `dialog.title.change`, `dialog.description.change`; composed: `@title`                       |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. | default: `dialog.quantity.change`; composed: `@quantity`                                              |

## Choreography and modes

| Trigger / owner                                                                                     | Full                                                                                              | Reduced                     | None                        | Binding → preset → recipe/form                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Open / content                                                                                      | Opacity with `scale.in`; final centered placement is stable.                                      | Short opacity only.         | Open target immediately.    | `dialog.content.enter` → `presence.surface` → `enter.pop/surface`                                                                              |
| Close / content                                                                                     | Opacity exit only; no delayed child exits.                                                        | Short opacity only.         | Closed target immediately.  | `dialog.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                                  |
| Open/close / overlay                                                                                | Opacity follows the same open transaction, with its own property owner.                           | Short opacity.              | Target opacity immediately. | `dialog.overlay.enter` → `presence.surface` → `enter.pop/opacity`; `dialog.overlay.exit` → `presence.exit` → `exit.fade/opacity`               |
| Intentional body/size change / content shell                                                        | Measure the final target and animate clamped width/height without bounce.                         | Final geometry immediately. | Final geometry immediately. | `dialog.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                        |
| Plain title/description update / respective text owner                                              | Stable-grapheme replacement, `stagger: none`; initial text inherits panel entrance.               | Changed-run opacity only.   | Final text immediately.     | `dialog.title.change` → `text.replace` → `text.change/changed-runs`; `dialog.description.change` → `text.replace` → `text.change/changed-runs` |
| Supplied colour token change / relevant parts                                                       | Scoped surface/border/foreground transition.                                                      | Short colour feedback.      | Final colours immediately.  | `dialog.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                     |
| Direct numeric Title/Description revision / owned slot, or explicit composed quantity / child owner | Roll changed places only; the same slot never also runs text replacement on its formatted digits. | Final number immediately.   | Final number immediately.   | `dialog.quantity.change` → `number.compact` → `number.roll/reels`                                                                              |

## Interruption and lifecycle

- Base UI owns open state, modal behavior, focus trapping, dismissal and return focus. Semantic state and input never wait for panel, title or geometry completion.
- Rapid close/reopen reverses the same presence boundary from its current visual state. A content update during close commits semantic content but does not start a second entrance or resize.
- Closing cancels local text/numeric/geometry work; the exit owner alone retains visual presence until Base UI permits removal. No duplicate interactive or accessible subtree.
- Live reduced cancels scale/layout; none and zero clock complete the semantic target and cancel presentation delays/exit holds through Base UI's native exit protocol. Unmount removes measurements and all writers.
- Async content arriving while closed updates the next semantic view without starting geometry/presence. A new open revision invalidates all older completion callbacks; a zero-duration close still completes through Base UI's actual protocol before modality/return-focus ownership is released. Native controls inside the dialog remain operable in reduced/none.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich children and formatting callbacks are composed, and screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- One natural-content observer and one shell writer own both measured axes. Centering/placement and panel decoration must use separated properties/layers so transforms do not compete.
- Lay text at the final destination width once, measure its natural height, then animate the shell around that layout. Do not continuously rewrap text through intermediate widths; passive font/viewport changes are immediate.
- Clamp to the viewport; overflow scrolls inside the content region. Do not clip focus rings, close controls or portalled descendants.
- At most one panel, one overlay and the bounded changed text set animate per dialog. Avoid per-child entrances and resize feedback from the animated shell.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

- Pending: open from keyboard, change body height and close mid-resize; focus, Escape, modal variants and return focus retain Base UI behavior.
- Pending: rapidly reopen during exit, including changed title and lazy body content, with no duplicated panel/name or stale geometry.
- Pending: SSR-visible open state, small viewport/zoom, parent child entrance suppression, all modes, live downgrade and zero clock.
- Pending: grow a focused form/message inside a constrained dialog, including a nested disclosure and async content arriving after close; required text stays visible, no parent/child size chase occurs, and only the current close revision completes modality/focus restoration.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
