# Alert Dialog motion contract

Status: target design; implementation and verification pending.

The consequential message becomes readable quickly and remains visually steady. Motion reinforces the surface and changing explanation without delaying a decision or inventing a warning shake. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `alert-dialog-content` and overlay own coordinated opacity presence; media, title, description and actions inherit it. |
| Size | Default: content shell owns natural message changes and explicit `size` changes within existing constraints. |
| Surface colour | Default: content/media own supplied surface tokens; action/cancel Buttons keep their button state contracts. |
| Text colour | Default: title/description own foreground token transitions. Urgency is supplied by the caller, not inferred from message text. |
| Changed text | Default for primitive title/description: preserve unchanged graphemes and replace changed runs. Rich content uses explicit composed owners. |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Open / content and overlay | Coordinated opacity entrance; no travel, bounce or decorative action stagger. | Short opacity. | Open target immediately. | `alert-dialog.content.enter` → `presence.surface` → `enter.pop`; `alert-dialog.overlay.enter` → `presence.surface` → `enter.pop` |
| Close / content and overlay | Opacity exit together; message remains stationary. | Short opacity. | Closed target immediately. | `alert-dialog.content.exit` → `presence.exit` → `exit.fade`; `alert-dialog.overlay.exit` → `presence.exit` → `exit.fade` |
| Message/explicit size change / content shell | Clamped measured width/height, with final typography and no bounce. | Final geometry immediately. | Final geometry immediately. | `alert-dialog.content.resize` → `geometry.panel` → `geometry.resize` |
| Plain explanation/name update / text owner | Changed-run replacement, `stagger: none`; semantic text is already final. | Short changed-run opacity. | Final text immediately. | `alert-dialog.title.change` → `text.replace` → target `text.change`; `alert-dialog.description.change` → `text.replace` → target `text.change` |
| Supplied visual state / surface/text owners | Scoped colour transition. | Short colour feedback. | Target colours immediately. | `alert-dialog.surface.colour` → `state.color` → target `state.color` |
| Direct numeric Title/Description revision / owned slot, or explicit composed quantity / child owner | Roll changed places only; the same slot never also runs text replacement on its formatted digits. | Final number immediately. | Final number immediately. | `alert-dialog.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Preserve Alert Dialog's dismissal and focus rules. Action/cancel callbacks, disabled state and initial focus never wait for animation; no minimum reading timer or auto-action is introduced.
- New messages replace the pending text transaction. Closing cancels resize/replacement; reopening during exit reverses the same panel without replaying action buttons.
- A removed action or changed message is semantically current immediately. Decorative outgoing text cannot remain an accessible alert or focus target.
- Live reduced commits geometry; none and zero clock cancel authored clocks and finish the current presence boundary through Base UI's actual completion protocol, without releasing modality/focus early. Unmount releases observers and decorative text resources. Native action/cancel operation remains immediate in every mode.
- Async message/action changes received while closed establish the next view without starting an entrance. A reopened revision invalidates old exit callbacks; no obsolete callback can close the new alert or restore focus to its prior trigger.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich children and formatting callbacks are composed, and screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- One content measurement and shell writer; `size` variants keep their existing constraints. Reading-plane geometry uses clamped, non-bouncing transitions.
- Reflow text at the final destination width before measuring the target height, then animate only the shell. Passive font/viewport changes settle immediately; no intermediate-width rewrapping.
- Content overflow remains readable/scrollable, with actions and focus outlines reachable. Media dimensions belong to the media/layout owner, not an independent panel spring.
- One panel, one backdrop and bounded title/description transactions per alert. No looping urgency effect or per-action entrance.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

- Pending: change a destructive explanation and action availability during open/close without delaying focus, action or cancel behavior.
- Pending: test both size variants, long localized messages, zoom and small viewport while preserving readable actions.
- Pending: rapidly reverse presence, then exercise all modes, live downgrade, zero clock and removal during text/size changes.
- Pending: grow a required explanation or focus an action during a constrained resize, and deliver async content after close; readability, one size owner and native completion/focus rules remain intact.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
