# Alert Dialog motion contract

Status: target design; implementation and verification pending.

The consequential message becomes readable quickly and remains visually steady. Motion reinforces the surface and changing explanation without delaying a decision or inventing a warning shake. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "content": ["alert-dialog#AlertDialogContent"],
    "overlay": ["alert-dialog#AlertDialogOverlay"],
    "title": ["alert-dialog#AlertDialogTitle"],
    "description": ["alert-dialog#AlertDialogDescription"],
    "surface": [
      "alert-dialog#AlertDialogContent",
      "alert-dialog#AlertDialogMedia",
      "alert-dialog#AlertDialogTitle",
      "alert-dialog#AlertDialogDescription"
    ],
    "quantity": ["alert-dialog#AlertDialogTitle", "alert-dialog#AlertDialogDescription"],
    "body": ["alert-dialog#AlertDialogContent"],
    "actions": ["alert-dialog#AlertDialogAction", "alert-dialog#AlertDialogCancel", "button#Button"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                    | References                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `alert-dialog-content` and overlay own coordinated opacity presence; media, title, description and actions inherit it.                                                                                                                                                                                                          | default: `alert-dialog.content.enter`, `alert-dialog.overlay.enter`, `alert-dialog.content.exit`, `alert-dialog.overlay.exit`; inherited: `@actions`; composed: `@actions` |
| Size            | Default: content shell owns natural message changes and explicit `size` changes within existing constraints. Button-backed actions retain their inherited geometry owner.                                                                                                                                                                | default: `alert-dialog.content.resize`; inherited: `@actions`; composed: `@actions`                                                                                        |
| Surface colour  | Default: content/media own supplied surface tokens; action/cancel Buttons keep their button state contracts.                                                                                                                                                                                                                             | default: `alert-dialog.surface.colour`; inherited: `@actions`; composed: `@actions`                                                                                        |
| Text colour     | Default: title/description own foreground token transitions. Urgency is supplied by the caller, not inferred from message text. Button-backed action foreground follows its inherited owner.                                                                                                                                             | default: `alert-dialog.surface.colour`; inherited: `@actions`; composed: `@actions`                                                                                        |
| Changed text    | Default for primitive title/description: preserve unchanged graphemes and replace changed runs. Rich content uses explicit composed owners. Action labels follow their actual Button/caller owner.                                                                                                                                       | default: `alert-dialog.title.change`, `alert-dialog.description.change`; inherited: `@actions`; composed: `@title`, `@description`, `@body`, `@actions`                    |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. Action quantities follow Button's existing applicability rules. | default: `alert-dialog.quantity.change`; inherited: `@actions`; composed: `@title`, `@description`, `@body`, `@actions`                                                    |

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                           | Reduced                                                                        | None                                                    | Binding → preset → recipe/form                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open / content and overlay                                     | Coordinated opacity entrance; no travel, bounce or decorative action stagger. Entry is subject to the actual-focus gate below.                                                 | Short opacity. Entry obeys the same focus gate.                                | Open target immediately.                                | `alert-dialog.content.enter` → `presence.surface` → `enter.pop/opacity`; `alert-dialog.overlay.enter` → `presence.surface` → `enter.pop/opacity`           |
| Close / content and overlay                                    | Opacity exit together; message remains stationary.                                                                                                                             | Short opacity.                                                                 | Closed target immediately.                              | `alert-dialog.content.exit` → `presence.exit` → `exit.fade/opacity`; `alert-dialog.overlay.exit` → `presence.exit` → `exit.fade/opacity`                   |
| Message/explicit size change / content shell                   | Clamped measured width/height, with final typography and no bounce.                                                                                                            | Final geometry immediately.                                                    | Final geometry immediately.                             | `alert-dialog.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                              |
| Plain explanation/name update / text owner                     | Changed-run replacement, `stagger: none`; semantic text is already final.                                                                                                      | Short changed-run opacity.                                                     | Final text immediately.                                 | `alert-dialog.title.change` → `text.replace` → `text.change/changed-runs`; `alert-dialog.description.change` → `text.replace` → `text.change/changed-runs` |
| Supplied visual state / surface/text owners                    | Scoped colour transition. Colour eligibility and immediate-owner priority follow the rule below.                                                                               | Short colour feedback. Colour obeys the same owner priority.                   | Target colours immediately.                             | `alert-dialog.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                           |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                              | Final number immediately.                                                      | Final number immediately.                               | `alert-dialog.quantity.change` → `number.compact` → `number.roll/reels`                                                                                    |
| Press/release / inherited Button feedback layer                | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable. Native activation and existing close semantics remain immediate; no second executor. | No scale; colour follows the same Button owner and its focus/invalid priority. | Native activation/close immediately, without animation. | `alert-dialog.actions.press` → `feedback.press` → `feedback.press/scale` (inherited Button owner)                                                          |

`surface.colour` addresses separate content, media and title/description regions. Actual DOM focus/focus-within or a region's own invalid state cancels its colour clock and settles all its declared paint immediately; independent regions retain their clocks. Other colour interpolation requires a verified readable palette. Action/Cancel keep the same immediate-paint rule through their inherited Button owner.

`actions` identifies the actual AlertDialogAction/AlertDialogCancel composition with [Button](button.md). Button owns its action paint, eligible geometry, press and direct label/quantity updates once; `surface.colour` and title/description controllers do not write those regions. Initial actions inherit panel presence; a later independent action insertion/removal uses Button's surviving presence owner without delaying an action or alert closure. Same-cause panel/action geometry delegates to one host or consumes a shared committed destination, never a child's interpolated size. Cancel's caller `render` may replace Button; that branch is composed at `@actions` and uses the actual caller owner. Action's Button `render` retains Button's safe-layer fallback. Focus/invalid paint and all modes follow the inherited owner; no extra action executor or closing policy is introduced.

## Interruption and lifecycle

Preserve the native initial-focus decision for the alert and its actions. If it lands in the entering panel, settle the panel's opacity before presenting that focus; the independent backdrop may continue its fade. This is a normal safe outcome of default opening, not permission to defer autofocus or a destructive/cancel action until animation completes.

- Preserve Alert Dialog's dismissal and focus rules. Action/cancel callbacks, disabled state and initial focus never wait for animation; no minimum reading timer or auto-action is introduced.
- New messages replace the pending text transaction. Closing cancels resize/replacement; reopening during exit reverses the same panel without replaying action buttons.
- A removed action or changed message is semantically current immediately. Decorative outgoing text cannot remain an accessible alert or focus target.
- Live reduced commits geometry; none and zero clock cancel authored clocks and finish the current presence boundary through Base UI's actual completion protocol, without releasing modality/focus early. Unmount releases observers and decorative text resources. Native action/cancel operation remains immediate in every mode.
- Async message/action changes received while closed establish the next view without starting an entrance. A reopened revision invalidates old exit callbacks; no obsolete callback can close the new alert or restore focus to its prior trigger.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich Title/Description children and formatting callbacks retain their composed owners; the separately anchored body boundary delegates to its actual child display components rather than running the title controller over body content. Screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- One content measurement and shell writer; `size` variants keep their existing constraints. Reading-plane geometry uses clamped, non-bouncing transitions.
- Reflow text at the final destination width before measuring the target height, then animate only the shell. Passive font/viewport changes settle immediately; no intermediate-width rewrapping.
- Content overflow remains readable/scrollable, with actions and focus outlines reachable. Media dimensions belong to the media/layout owner, not an independent panel spring.
- One panel, one backdrop and bounded title/description transactions per alert. No looping urgency effect or per-action entrance.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

A focused native editor also takes priority when geometry would move its caret/content box or change its scroll position, even if no text would be clipped. Settle the affected decorative size axis; unrelated paint may continue. A child size change that leaves the editor's geometry and scroll stable can retain its existing single owner.

## Acceptance scenarios

- Pending: change a destructive explanation and action availability during open/close without delaying focus, action or cancel behavior.
- Pending: test both size variants, long localized messages, zoom and small viewport while preserving readable actions.
- Pending: rapidly reverse presence, then exercise all modes, live downgrade, zero clock and removal during text/size changes.
- Pending: grow a required explanation or focus an action during a constrained resize, and deliver async content after close; readability, one size owner and native completion/focus rules remain intact.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
- Pending: Open with native initial focus on an action while content is fading; settle the content gate without delaying the action or cancelling the independent backdrop.
- Pending: Press default Button-backed Action/Cancel and supported caller render replacements, including a render without a safe feedback layer. Switch to reduced/none or zero clock mid-press, then cancel/close. Only the actual owner runs, held/released targets follow Button modes, and neither activation nor closure is delayed; Action still does not close unless its existing caller behavior does so.
