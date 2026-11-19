# Toast motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

A notification joins the stack, can update in place, and leaves under the manager's existing lifecycle.
Content feedback must not restart its dismissal timer or compete with swipe and stack geometry. This
contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design
references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["toast#Toast"],
    "stack": ["toast#ToastViewport"],
    "title": ["toast#ToastTitle"],
    "description": ["toast#ToastDescription"],
    "foreground": ["toast#ToastTitle", "toast#ToastDescription"],
    "surface": ["toast#Toast"],
    "quantity": ["toast#ToastTitle", "toast#ToastDescription"],
    "body": ["toast#ToastContent"],
    "icon": ["toast#Toaster"],
    "actions": ["button#Button"],
    "actions-surface": ["button#Button"],
    "actions-label": ["button#Button"],
    "actions-number": ["button#Button"]
  },
  "regions": {
    "root": ["toast"],
    "stack": ["toast-viewport"],
    "title": ["toast-title-text"],
    "description": ["toast-description-text"],
    "foreground": ["toast-title", "toast-description"],
    "surface": ["toast"],
    "quantity": ["toast-title-number", "toast-description-number"],
    "body": ["toast-content"],
    "icon": ["toast-icon"],
    "actions": ["button-feedback"],
    "actions-surface": ["toast-action"],
    "actions-label": ["button-text"],
    "actions-number": ["button-number"]
  }
}
```

`toast-title-text`, `toast-description-text`, `toast-title-number`, `toast-description-number` and
`toast-icon` are internal host markers of the shipped `Toaster` list; they add no export, prop or public
slot. The two display regions are the actual spans that carry a primitive title/description string or a
directly supplied supported numeric quantity. `toast-icon` is the private glyph host rendered by
`ToastList` inside the exported `Toaster`, so the icon anchors to `Toaster` without a new `ToastIcon`
export.

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                                              | References                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `toast` owns its own root presence through one envelope — opacity plus `scale.in` in full — in the stack position the manager already resolved. Title, description, content and icon inherit that entrance; a Button-backed action keeps its own returned entrance/exit instead of replaying the toast root's.                                                            | default: `toast.root.enter`, `toast.root.exit`; inherited: `toast.actions-surface.exit`                                |
| Size            | Inherited: Base UI's toast root measures the natural content height and applies the final `--toast-offset-y`/`--toast-index` placement and the visible stack extent in one owner transaction. No Cadence height spring, second transform or `bottom` tween is added, so a committed message is never taller than the shell that clips it.                                          | inherited: `toast.stack.place`                                                                                         |
| Surface colour  | Default: the root owns its supplied surface, border and scoped shadow tokens as one family. The built-in icon keeps its static semantic glyph paint and an unprovable caller palette settles immediately. An action keeps its own Button surface family.                                                                                                                           | default: `toast.surface.colour`; inherited: `toast.actions-surface.colour`                                             |
| Text colour     | Default: `toast-title` and `toast-description` each own one foreground family for their own region; type/icon feedback never recolours arbitrary caller content. Action foreground follows its inherited Button owner.                                                                                                                                                             | default: `toast.foreground.colour`; inherited: `toast.actions-surface.colour`                                          |
| Changed text    | Default for a primitive title/description string supplied to the shipped list: preserve unchanged graphemes and replace changed runs on the same toast ID, with `stagger: none`. Rich children are composed and keep their own identity; a manually composed Title/Description without children keeps Base UI's static text. An action label keeps Button's own changed-run owner. | default: `toast.title.change`, `toast.description.change`; composed: `@body`; inherited: `toast.actions-label.replace` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions; inherited inside a numeric action label.                                                                  | default: `toast.quantity.change`; inherited: `toast.actions-number.roll`                                               |

`surface.colour` addresses the root shell only; `foreground.colour` addresses title and description as
separate regions. Actual DOM focus/focus-within or a region's own invalid state cancels its colour clock
and settles that region's paint immediately, while an independent region keeps its own clock. Any colour
interpolation additionally requires a verified readable palette.

`actions` names `ToastAction`/`ToastClose`'s default [Button](button.md) renderers. Their paint,
eligible geometry, press and direct label/quantity updates inherit Button once, outside the
root/title/description colour and text regions. Initial controls inherit toast presence; later
independent membership uses Button's surviving presence owner and never extends the manager's lifetime or
dismissal. A caller `render` replacing Button is composed at `@actions` and delegates to its actual owner;
a retained Button follows its custom-render safe-layer fallback.

## Choreography and modes

| Trigger / owner                                                  | Full                                                                                                                               | Reduced                                                                        | None                                                    | Binding → preset → recipe/form                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Manager adds a toast / root adapter                              | Opacity and `scale.in` entrance in the actual stack position; no independent positional transform. Entry yields to real focus.     | Short opacity only. Entry obeys the same focus and swipe gates.                | Final visible target immediately.                       | `toast.root.enter` → `presence.surface` → `enter.pop/surface`                     |
| Manager dismisses / root adapter                                 | Opacity exit on the same host; native swipe displacement stays authoritative if a swipe released it.                               | Short opacity only.                                                            | Closed presentation immediately.                        | `toast.root.exit` → `presence.exit` → `exit.fade/opacity`                         |
| Swipe / Base UI root                                             | Native direct movement, progress and dismissal threshold without an extra interpolation clock.                                     | Same direct manipulation.                                                      | Same direct manipulation; no authored settling.         | `toast.root.swipe` → `engine.native` → `native/base-ui-toast`                     |
| Add/remove/content change / Base UI height and stack transaction | One committed natural-size and stack destination; the manager applies the final logical offsets itself and a swipe keeps priority. | Final geometry immediately.                                                    | Final geometry immediately.                             | `toast.stack.place` → `engine.native` → `native/base-ui-toast`                    |
| Same-ID title update / text owner                                | Changed-run replacement, `stagger: none`; no remount or entrance replay.                                                           | Changed-run opacity only.                                                      | Final text immediately.                                 | `toast.title.change` → `text.replace` → `text.change/changed-runs`                |
| Same-ID description update / text owner                          | Changed-run replacement on the description slot only; the title region is untouched.                                               | Changed-run opacity only.                                                      | Final text immediately.                                 | `toast.description.change` → `text.replace` → `text.change/changed-runs`          |
| Direct numeric Title/Description revision / owned display slot   | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                  | Final number immediately.                                                      | Final number immediately.                               | `toast.quantity.change` → `number.compact` → `number.roll/reels`                  |
| Supplied surface tokens / root                                   | Scoped background, border and shadow transition on the root. Colour eligibility follows the rule above.                            | Short colour feedback. Colour obeys the same owner priority.                   | Target colours immediately.                             | `toast.surface.colour` → `state.color` → `state.color/surface`                    |
| Supplied foreground tokens / title and description               | Scoped foreground transition per owned region; focus cancels only that region's clock.                                             | Short colour feedback.                                                         | Target colours immediately.                             | `toast.foreground.colour` → `state.color` → `state.color/foreground`              |
| Loading type / built-in icon in `Toaster`                        | Theme-clock spin only while the loading type is current and visible; the message semantics stay immediate.                         | Static loading glyph.                                                          | Static loading glyph.                                   | `toast.icon.activity` → `status.loop` → `data.transition/continuous`              |
| Composed action removal / inherited Button                       | Button keeps its own retained exit on its own host; the toast adds no second removal fade and never delays dismissal.              | Short opacity only.                                                            | Removed with the native frame.                          | `toast.actions-surface.exit` → `presence.exit` → `exit.fade/opacity`              |
| Composed action paint / inherited Button                         | Button's single surface and foreground family, with immediate focus/invalid priority.                                              | Same immediate priority, otherwise short colour.                               | Target colours immediately.                             | `toast.actions-surface.colour` → `state.color` → `state.color/surface-foreground` |
| Composed action label / inherited Button                         | Button replaces its own changed label runs once; the toast never reads the label.                                                  | Short changed-text opacity.                                                    | Final label immediately.                                | `toast.actions-label.replace` → `text.replace` → `text.change/changed-runs`       |
| Composed action quantity / inherited Button                      | Button reels its own numeric label once, retargeting its own box concurrently.                                                     | Final number immediately.                                                      | Final number immediately.                               | `toast.actions-number.roll` → `number.compact` → `number.roll/reels`              |
| Press/release / inherited Button feedback layer                  | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable.                                          | No scale; colour follows the same Button owner and its focus/invalid priority. | Native activation/close immediately, without animation. | `toast.actions.press` → `feedback.press` → `feedback.press/scale`                 |

The root presence deliberately selects the stationary surface form of `presence.surface` rather than
`popup.anchored/presence`: a toast has no anchor side, and its position belongs to the manager's stack
transaction, so travel would be an independent positional transform. `enter.pop/surface` is exactly the
opacity + `scale.in` envelope the contract needs.

One form per recipe is retained: `data.transition` already owns the loading clock's continuous form, so a
changed status glyph is replaced by React on that same host instead of installing a second `data.update`
form. That keeps the icon's semantic message immediate in every mode rather than delaying it for a local
fade.

## Interruption and lifecycle

Toast identity is qualified by its actual manager. Equal toast ids in independent providers/managers
cannot share stack measurements, display identities or dismissal completion. If the native API supports
more than one viewport for a manager, each actual visual keeps its own host lifetime, without
manufacturing duplicate toasts or adding another lifetime timer.

Adding a toast does not request focus. If native focus or pointer activation actually reaches an entering
toast/action, the root settles its decorative opacity/scale envelope before presenting the interaction; it
does not cancel unrelated stack entries merely because the viewport received focus. A swipe similarly
takes over after decorative entry has yielded, while retaining the native offset and capture.

- Base UI retains toast IDs, timers, pause/resume, limits, focus, swipe and dismissal. Animation never resets a duration or extends a minimum dwell time; same-ID updates preserve the manager's own semantics.
- Rapid updates replace the current text/number target. Dismissal cancels content work; a stale update cannot resurrect a dismissed ID. Reopen/add behaviour follows actual manager identity, not a motion-generated key.
- A direct swipe cancels any authored positional settling. Closing/unmounting releases the presence controller, the display transactions and the loading clock; actions never await exit completion.
- Live reduced/none stops the loading loop and disallowed movement. Zero recipe clock settles one-shot work only; the loading loop follows its separate theme clock and mode/visibility rules. During an active swipe, retain the instantaneous native offset/capture in every mode.
- A no-motion dismissal completes through Base UI's actual toast lifecycle, never an extra timer and never an early release of its native focus rules.
- A limited or ending toast is still mounted by the manager, but the display and icon owners settle instead of animating off-stack; the manager's `data-limited` policy and hit-testing stay native.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to
the numeric owner; changing renderer type establishes an immediate baseline. Rich Title/Description
children keep their composed owners, and the anchored body boundary delegates to its actual child display
components rather than running the title controller over body content. Screen-reader-only content updates
immediately. No new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

The manager's visible limit is configurable and does not replace the
[automatic collection bound](../presets.md#52-shared-work-limits). Before per-toast animation
measurement or outgoing copy, count participating visible toast presentations, projected retained
siblings and any participating stack host, including still-active earlier revisions. If the known set is
unavailable or over the bound, settle affected decorative work and discard obsolete decoration
immediately. Preserve every manager-owned toast, ordering, limit, timer and live swipe; never dismiss
messages, reduce the caller's limit or drop a queue entry to fit the budget.

- The native root owns swipe transform and stack offsets. Cadence writes neither, so there is no FLIP overlay, independent `bottom` tween or nested shell spring to reconcile.
- The root's surface paint and the display/icon owners are separate families; a text revision never rewrites paint and a colour revision never rewrites geometry.
- Height and stack presentation preserve native ordering, visibility/limited state and hit-testing policy at every rendered frame because the manager applies them itself, not merely as a shared target.
- Bound work to the manager's visible stack; limited/offscreen toasts receive no decoration or loop. One text transaction per changed title/description, no per-character observers.
- Preserve close/action focus rings, stack hit testing and portals. The swipe release family is the primitive's own token-backed channel, so a cancelled swipe glides back while a released dismissal keeps its direction; reduced and none remove that family entirely.
- A focused action is immediately visible. The contract adds no truncation or scroll policy, no temporary clipping of a newly committed message, and no extra measurement of the toast's natural height.

## Acceptance scenarios

Executed in `tests/components/toast.test.tsx`: the root entrance and exit, the managed stack's native
height/offset owner, changed title and description strings, changed direct quantities on both display
slots, the root surface colour owner, the title/description foreground owners, the loading clock, the
inherited Button press layer and the native swipe owner. Each runs in full, reduced and none, and the
stack/swipe/action parts are verified as native or inherited boundaries rather than local writers.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation
in a real browser, nested portals and independent managers with equal ids, SSR/no-JS/hydration probes,
keyboard focus and return focus, retention through Base UI's unmount protocol, rapid reversal and
reopen, swipe during an active stack batch, a focused action while the message grows, and light/dark ×
narrow/wide screenshot review. jsdom has no layout engine, so the real stack geometry, the palette
readability gate and Base UI's swipe threshold are proven here by their committed revision, source and
property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, timers, limits, focus, swipe and
dismissal; the manager owns natural height and stack offsets, so the Size capability is native rather
than a second Cadence geometry writer; ToastAction/ToastClose inherit Button's press, paint, label,
quantity and box owners instead of installing a second executor; and no performance, CLS,
interaction-cost or real-device FPS measurement was taken (ADR-023 defers performance governance).
