# Alert Dialog motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The consequential message becomes readable quickly and remains visually steady. Motion reinforces the surface and
changing explanation without delaying a decision or inventing a warning shake. This contract inherits the
[common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or
public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["alert-dialog#AlertDialogContent"],
    "overlay": ["alert-dialog#AlertDialogOverlay"],
    "surface": ["alert-dialog#AlertDialogContent", "alert-dialog#AlertDialogMedia"],
    "foreground": ["alert-dialog#AlertDialogTitle", "alert-dialog#AlertDialogDescription"],
    "title": ["alert-dialog#AlertDialogTitle"],
    "description": ["alert-dialog#AlertDialogDescription"],
    "quantity": ["alert-dialog#AlertDialogTitle", "alert-dialog#AlertDialogDescription"],
    "body": ["alert-dialog#AlertDialogContent"],
    "actions": ["button#Button"],
    "actions-label": ["button#Button"],
    "actions-number": ["button#Button"],
    "actions-feedback": ["button#Button"]
  },
  "regions": {
    "content": ["alert-dialog-content"],
    "overlay": ["alert-dialog-overlay"],
    "surface": ["alert-dialog-content", "alert-dialog-media"],
    "foreground": ["alert-dialog-title", "alert-dialog-description"],
    "title": ["alert-dialog-title-text"],
    "description": ["alert-dialog-description-text"],
    "quantity": ["alert-dialog-title-number", "alert-dialog-description-number"],
    "body": ["alert-dialog-content"],
    "actions": ["alert-dialog-action"],
    "actions-label": ["button-text"],
    "actions-number": ["button-number"],
    "actions-feedback": ["button-feedback"]
  },
  "axes": { "content": ["height"], "actions": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                            | References                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `alert-dialog-content` owns the panel presence and `alert-dialog-overlay` owns the backdrop opacity, each as its own physical writer. Media, title and description inherit that entrance. A composed action keeps Button's own retained exit.                                           | default: `alert-dialog.content.enter`, `alert-dialog.content.exit`, `alert-dialog.overlay.enter`, `alert-dialog.overlay.exit`; inherited: `alert-dialog.actions.exit` |
| Size            | Default: the content shell owns a clamped measured block-size revision over its natural message within the existing `size`/viewport constraints. A composed action keeps Button's own measured box and explicit size variants.                                                                   | default: `alert-dialog.content.resize`; inherited: `alert-dialog.actions.resize`                                                                                      |
| Surface colour  | Default: content and media own their supplied background, border and scoped shadow tokens. Action and cancel are ordinary Buttons and keep their button state contracts instead of receiving a second writer.                                                                                    | default: `alert-dialog.surface.colour`; inherited: `alert-dialog.actions.colour`                                                                                      |
| Text colour     | Default: title and description own foreground token transitions. Urgency is supplied by the caller, not inferred from message text. A Button-backed action follows its inherited Button foreground owner.                                                                                        | default: `alert-dialog.foreground.colour`; inherited: `alert-dialog.actions.colour`                                                                                   |
| Changed text    | Default for a primitive title/description: preserve unchanged graphemes and replace changed runs. Rich children use the composed body boundary; an action label keeps Button's own changed-run owner.                                                                                            | default: `alert-dialog.title.change`, `alert-dialog.description.change`; composed: `@body`; inherited: `alert-dialog.actions-label.replace`                           |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children, inherited inside a numeric action label. | default: `alert-dialog.quantity.change`; composed: `@body`; inherited: `alert-dialog.actions-number.roll`                                                             |

`surface.colour` addresses the content shell and the optional media region separately; `foreground.colour`
addresses title and description. Actual DOM focus/focus-within or a region's own invalid state cancels its colour
clock and settles that region's declared paint immediately, while an independent region keeps its own clock. Any
colour interpolation additionally requires a verified readable palette. Action and cancel keep the same
immediate-paint rule through their inherited Button owner.

The `actions*` bindings name the actual `AlertDialogAction`/`AlertDialogCancel` composition with [Button](button.md):
the action renders Button directly and the cancel renders Base UI's Close through Button. Alert Dialog executes none
of those actions itself — `actions.exit` is the composed button's own retained removal, `actions.resize` its measured
box, `actions.colour` its single surface/foreground family, `actions-label`/`actions-number` its label and quantity
owners, and `actions-feedback` its press layer. Focus/invalid paint and every mode follow that owner; no extra action
executor, entrance or closing policy is introduced, and the alert never writes those regions.

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                           | Reduced                                                                        | None                                                    | Binding → preset → recipe/form                                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open / content and overlay                                     | Coordinated opacity entrance; no travel, bounce or decorative action stagger. Entry is subject to the actual-focus gate below.                                                 | Short opacity. Entry obeys the same focus gate.                                | Open target immediately.                                | `alert-dialog.content.enter` → `presence.surface` → `enter.pop/surface`; `alert-dialog.overlay.enter` → `presence.surface` → `enter.pop/opacity`                |
| Close / content and overlay                                    | Opacity exit together; the message remains stationary and no child runs its own exit.                                                                                          | Short opacity.                                                                 | Closed target immediately.                              | `alert-dialog.content.exit` → `presence.exit` → `exit.fade/opacity`; `alert-dialog.overlay.exit` → `presence.exit` → `exit.fade/opacity`                        |
| Message/explicit size change / content shell                   | Clamped measured block height, with final typography and no bounce; the width stays laid out at its destination.                                                               | Final geometry immediately.                                                    | Final geometry immediately.                             | `alert-dialog.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                                   |
| Plain explanation/name update / text owner                     | Changed-run replacement, `stagger: none`; semantic text is already final.                                                                                                      | Short changed-run opacity.                                                     | Final text immediately.                                 | `alert-dialog.title.change` → `text.replace` → `text.change/changed-runs`; `alert-dialog.description.change` → `text.replace` → `text.change/changed-runs`      |
| Supplied visual state / surface and foreground owners          | Scoped colour transition per owned region. Colour eligibility and immediate-owner priority follow the rule above.                                                              | Short colour feedback. Colour obeys the same owner priority.                   | Target colours immediately.                             | `alert-dialog.surface.colour` → `state.color` → `state.color/surface`; `alert-dialog.foreground.colour` → `state.color` → `state.color/foreground`              |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                              | Final number immediately.                                                      | Final number immediately.                               | `alert-dialog.quantity.change` → `number.compact` → `number.roll/reels`                                                                                         |
| Composed action removal / inherited Button                     | Button keeps its own retained exit on its own host; the alert adds no second removal fade and never delays the decision.                                                       | Short opacity only.                                                            | Removed with the native frame.                          | `alert-dialog.actions.exit` → `presence.exit` → `exit.fade/opacity`                                                                                             |
| Composed action box / inherited Button                         | Button interpolates its own owned width and height from one intrinsic measurement; the focused editor rule stays Button's.                                                     | Final box immediately.                                                         | Final box immediately.                                  | `alert-dialog.actions.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                 |
| Composed action paint / inherited Button                       | Button's single surface and foreground family, with immediate focus/invalid priority and its light/dark variant boundary.                                                      | Same immediate priority, otherwise short colour.                               | Target colours immediately.                             | `alert-dialog.actions.colour` → `state.color` → `state.color/surface-foreground`                                                                                |
| Composed action labels and quantities / inherited Button       | Button replaces its own changed label runs and reels its own numeric label once, retargeting its box concurrently.                                                             | Short changed-text opacity; quantity and box immediate.                        | Final text and number immediately.                      | `alert-dialog.actions-label.replace` → `text.replace` → `text.change/changed-runs`; `alert-dialog.actions-number.roll` → `number.compact` → `number.roll/reels` |
| Composed action press/release / inherited Button               | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable. Native activation and existing close semantics remain immediate; no second executor. | No scale; colour follows the same Button owner and its focus/invalid priority. | Native activation/close immediately, without animation. | `alert-dialog.actions-feedback.press` → `feedback.press` → `feedback.press/scale`                                                                               |

The content and overlay controllers are separate instances, so the opacity envelope and the optional panel scale
never share a writer and no two engines claim the same property. The panel's measured block-size owner, its scoped
surface paint and the title/description display owners are separate again, so a size revision never rewrites paint
and a text revision never rewrites geometry. The panel never consumes a child button's interpolated box, and the
composed buttons never receive a second paint, label, quantity, box or press writer from the alert.

## Interruption and lifecycle

Preserve Base UI's actual initial-focus decision for the alert and its actions. If that focus lands inside the
entering panel, the panel settles its opacity and scale envelope before presenting it while the independently owned
backdrop may finish its own fade. This is an ordinary outcome of default opening: never defer or disable autofocus,
a destructive action or a cancel to guarantee an entrance animation.

- Preserve Alert Dialog's dismissal and focus rules. Action/cancel callbacks, disabled state and initial focus never wait for animation; no minimum reading timer and no auto-action are introduced.
- New messages replace the pending text transaction. Closing cancels resize and replacement; reopening during exit reverses the same panel without replaying action buttons.
- A removed action or changed message is semantically current immediately. Decorative outgoing text can never remain an accessible alert name or a focus target.
- Live reduced commits geometry; none and a zero clock cancel the authored clocks and finish the current presence boundary through Base UI's own completion protocol, without releasing modality or focus early. Unmount releases the measurement, the presence controllers and the decorative text hosts.
- Async message/action changes received while closed establish the next view without starting an entrance. A reopened revision invalidates old exit callbacks, so no obsolete callback can close the new alert or restore focus to its prior trigger.
- The composed action and cancel keep Button's own cancellation rules: pointer cancellation, lost capture, blur and a disabled change release the press owner, and a caller `render` without a safe inner layer uses Button's colour-only fallback. Neither activation nor closure is delayed, and the action still does not close unless its caller's own behaviour does.

A direct Title/Description string goes to the text owner and a supported direct numeric quantity to the numeric
owner; changing the renderer type establishes an immediate baseline. Rich Title/Description children keep their
composed owners, and the separately anchored body boundary delegates to its actual child display components instead
of running the title controller over body content. Screen-reader-only content updates immediately. One slot
transaction runs under the panel's existing size owner; no new counter prop, parser, countdown or inferred
application state is added.

## Geometry and performance

One measured block-size owner registers on the content shell itself; it reads its natural height only after
releasing its own size overlay, so a child's interpolated box is never reused as a fresh target. The committed
content signature follows the nested title, description and body text that carries the message, so a longer
explanation is a real revision and an unrelated re-render is not. The destination is clamped to a non-negative
minimum and to at least the natural extent, so required text, the action row and focus rings are never newly
cropped and no scroll policy is invented. The inline size is not interpolated: the panel lays out at its
destination width once, and only the block axis is measured. Passive font, viewport or caller class changes settle
immediately instead of manufacturing a revision. `size` variants keep their existing `max-width` constraints, and
media dimensions stay the media/layout owner's rather than an independent panel spring.

At most one panel, one backdrop, one measured height owner and the bounded changed-text/quantity set animate per
alert; no per-child entrance, looping urgency effect or per-action entrance is added. A destination-layout size
animation must not newly crop required text, an active descendant or a focused control: existing legal
overflow/scroll keeps them reachable, and an axis that would clip settles before paint. If readable content and the
action row cannot fit the available bounds at all, the native layout result is used immediately rather than adding
a scroll container, truncating the explanation or changing the caller's focus policy. A focused native editor also
takes priority over a decorative size axis that would move its caret or scroll position.

## Acceptance scenarios

Executed in `tests/components/alert-dialog.test.tsx`: the panel and backdrop entrance and exit, the measured
content revision, changed title and description strings, changed direct quantities on both display slots, the
content/media surface colour owner, the title/description foreground owner and the inherited Button press layer.
Each runs in full, reduced and none with a zero clock, and the composed action and cancel parts are verified as
inherited boundaries rather than local writers. The live full→reduced→none downgrade is exercised on an open panel.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, nested alerts and portals, SSR/no-JS/hydration probes, keyboard focus and return focus, retention through
Base UI's unmount protocol, a focused native editor during a message resize, rapid reversal and reopen, async
content delivered after close, and light/dark × narrow/wide screenshot review. jsdom has no layout engine, so the
real block-size interpolation, the palette readability gate and Base UI's focus settlement are proven here by
their committed revision, source and property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, modality, focus, dismissal and the native
unmount protocol; the measured owner animates only the block axis and only a known content revision while the panel
is open; the composed action and cancel inherit Button's press, paint, label, quantity and box owners instead of
installing a second executor, so the press binding is proven on the action button's own feedback layer; and no
performance, CLS, interaction-cost or real-device FPS measurement was taken (ADR-023 defers performance
governance).
