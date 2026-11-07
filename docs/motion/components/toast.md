# Toast motion contract

Status: target design; implementation and verification pending.

A notification joins the stack, can update in place, and leaves under the manager's existing lifecycle. Content feedback must not restart its dismissal timer or compete with swipe and stack geometry. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["toast#Toast"],
    "stack": ["toast#ToastViewport"],
    "title": ["toast#ToastTitle"],
    "description": ["toast#ToastDescription"],
    "icon": ["toast#Toaster"],
    "surface": ["toast#Toast", "toast#ToastTitle", "toast#ToastDescription", "toast#Toaster"],
    "quantity": ["toast#ToastTitle", "toast#ToastDescription"],
    "body": ["toast#ToastContent"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                    | References                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Appearance      | Default: `toast` owns presence through the Base UI adapter; `toast-content`, title, description and actions inherit entrance.                                                                                                                                            | default: `toast.root.enter`, `toast.root.exit`                                |
| Size            | Default through the native owner: toast natural height and stack offsets form one Base UI geometry transaction. A measured destination updates that owner's size/stack channels; never add a second transform or bottom writer.                                          | default: `toast.root.resize`                                                  |
| Surface colour  | Default: root owns supplied surface/border tokens; the built-in `toast-icon` rendered by Toaster owns semantic icon colour. Action/close buttons retain their button owners.                                                                                                                              | default: `toast.surface.colour`                                               |
| Text colour     | Default: `toast-title` and `toast-description` own foreground transitions; type/icon feedback does not recolour arbitrary caller content.                                                                                                                                | default: `toast.surface.colour`                                               |
| Changed text    | Default for primitive title/description: preserve unchanged graphemes and replace changed runs on the same toast ID. Rich children are composed.                                                                                                                         | default: `toast.title.change`, `toast.description.change`; composed: `@title`, `@description`, `@body` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. | default: `toast.quantity.change`; composed: `@title`, `@description`, `@body`                       |

## Choreography and modes

| Trigger / owner                                                                                     | Full                                                                                                                                     | Reduced                     | None                                            | Binding → preset → recipe/form                                                                                                                                        |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manager adds toast / root adapter                                                                   | Opacity and `scale.in` entrance in the actual stack position; no independent positional transform. Entry is subject to the actual-focus gate below. | Short opacity only. Entry obeys the same focus gate. | Final visible target immediately.               | `toast.root.enter` → `presence.popup` → `popup.anchored/presence`                                                                                                     |
| Manager dismisses / root adapter                                                                    | Opacity exit; native swipe displacement remains authoritative if present.                                                                | Short opacity only.         | Closed presentation immediately.                | `toast.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                             |
| Swipe / Base UI root                                                                                | Native direct movement, progress and dismissal threshold without an extra interpolation clock.                                           | Same direct manipulation.   | Same direct manipulation; no authored settling. | `toast.root.swipe` → `engine.native` → `native/base-ui-toast` (Base UI Toast swipe/stack owner (no new recipe))                                                       |
| Stack/content changes / Base UI geometry owner                                                      | One committed natural-size/stack destination coordinates clamped toast height and visible stack displacement; native swipe has priority. | Final geometry immediately. | Final geometry immediately.                     | `toast.root.resize` → `geometry.compact` → `geometry.resize/measured`; `toast.stack.reflow` → `layout.compact` → `layout.move/position` (native single-owner adapter) |
| Same-ID title/description update / text owners                                                      | Changed-run replacement, `stagger: none`; no remount or entrance replay.                                                                 | Changed-run opacity only.   | Final text immediately.                         | `toast.title.change` → `text.replace` → `text.change/changed-runs`; `toast.description.change` → `text.replace` → `text.change/changed-runs`                          |
| Type/icon changes / Toaster's built-in icon presentation                                                               | Replace only the changed decorative icon with local opacity; keep message semantics immediate.                                           | Short opacity.              | Final icon immediately.                         | `toast.icon.change` → `data.update` → `data.transition/opacity`                                                                                                       |
| Loading type / Toaster's built-in icon                                                                                 | Target default adds a theme-clock loading spin only while active and visible; the delivered baseline currently uses a static glyph.      | Static loading icon.        | Static loading icon.                            | `toast.icon.activity` → `status.loop` → `data.transition/continuous`                                                                                                  |
| Supplied tokens / root, icon and text                                                               | Scoped colour transition.                                                                                                                | Short colour feedback.      | Target colours immediately.                     | `toast.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                             |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                        | Final number immediately.   | Final number immediately.                       | `toast.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                      |

## Interruption and lifecycle

Adding a toast does not request focus. If native focus or pointer activation actually reaches an entering toast/action, settle that toast's decorative opacity/scale envelope before presenting the interaction; do not cancel unrelated stack entries merely because the viewport receives focus. A swipe similarly takes over after decorative entry has yielded, while retaining the native offset/capture.

- Base UI manager retains toast IDs, timers, pause/resume, limits, focus, swipe and dismissal. Animation never resets duration or extends a minimum dwell time; same-ID updates preserve the manager's own semantics.
- Rapid updates replace the current text/icon target. Dismissal cancels content work; a stale update cannot resurrect a dismissed ID. Reopen/add behavior follows actual manager identity, not a motion-generated key.
- Direct swipe cancels any authored positional settling. Closing/unmounting removes all outgoing decorative text and releases native registrations; actions never await exit completion.
- Live reduced/none stops the loading loop and disallowed movement. Zero recipe clock settles one-shot work only; the loading loop follows its separate theme clock and mode/visibility rules. During an active swipe, retain the instantaneous native offset/capture in every mode; cancel decorative stack/release interpolation, not required direct operation. Post-release authored settling is immediate under reduced/none or zero recipe clock through the native adapter.
- A no-motion dismissal completes through Base UI's actual toast lifecycle, never an extra timer or an early release of its native focus/registration rules. Async same-ID updates after dismissal cannot resurrect a toast; a genuinely new manager add uses its own current identity. Returning to full does not replay consumed entry.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich Title/Description children and formatting callbacks retain their composed owners; the separately anchored body boundary delegates to its actual child display components rather than running the title controller over body content. Screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

The private ToastIcon is rendered by ToastList inside the exported Toaster, so `icon` and its colour region anchor to Toaster. A manually composed Toast does not gain that icon or spin automatically; custom icon children retain their own explicit owner. These bindings add no new ToastIcon export.

## Geometry and performance

- The native root owns swipe transform and stack offsets. Any target stack animation must reconcile native measurements in that owner; no FLIP overlay, independent `bottom` tween or nested shell spring.
- Lay out changed text at final available width once, measure the natural target height, then let the native stack transaction consume it. Passive viewport/font changes settle immediately.
- Target protocol: reconcile visible IDs and measured final heights in one native stack revision. The native owner applies final logical offsets immediately, animates the height channel with `geometry.compact`, and composes bounded visual stack displacement with its swipe channel using `layout.compact`; never write a second root transform or animate `bottom` independently. Parent stack targets use committed destination heights, not children's per-frame sizes.
- While a toast is actively swiped, its geometry follows native input immediately and authored stack displacement on that toast is cancelled; the native owner reconciles remaining visible toasts from the latest committed sizes. Dismissal removes obsolete actionable content immediately according to Base UI's lifecycle and retargets surviving stack visuals without queued intermediate layouts.
- Height and stack presentation must preserve the native ordering, visibility/limited state and hit-testing policy at every rendered frame, not merely share a target. The same native transaction resolves compatible size/displacement channels; if that coordination is unavailable during concurrent updates, settle the affected geometry immediately rather than allowing accidental overlap or reading child animation frames back into a new target.
- Bound work to the manager's visible stack; limited/offscreen toasts receive no decoration or loop. One text transaction per changed title/description, no per-character observers.
- Clip only decorative text lanes and an internal resize viewport; preserve close/action focus rings, stack hit testing and portals. A cancellable native geometry integration is an implementation gate; native immediate geometry remains the migration fallback if that integration cannot be satisfied. No new public engine/hook is implied.

- Read natural content from a region distinct from the native size host; reject negative/invalid heights and resolve final valid stack geometry immediately if constraints cannot be reconciled. A same-cause parent/child update supplies one committed destination, not per-frame feedback.
- A smaller intermediate toast shell must not crop the newly committed message or action/close control. Preserve existing legal overflow or settle its height immediately; never introduce a truncation/scroll policy just to keep a height tween. Focused actions are immediately visible.

## Acceptance scenarios

- Pending: same-ID loading → success/error and text updates retain the manager's timer/pause semantics without remounting or repeated announcements.
- Pending: add/remove/update several visible toasts during swipe; stack, limits, actions and native dismissal remain consistent.
- Pending: reduced/none stops loading spin; zero recipe clock affects only one-shot work, while theme clock behavior is tested separately. Verify live downgrade and unmount cleanup.
- Pending: downgrade or set zero clock mid-swipe, continue direct movement and release; also grow a same-ID message while its action has focus. Native swipe, readable content, manager timing and immediate-close completion remain correct.
- Pending: combine message-height growth with add/remove/limit changes and native stack interaction; inspect intermediate frames for stable ordering/hit regions and prove the immediate-geometry fallback when native channels cannot be coordinated.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
- Pending: Compare Toaster's built-in loading icon with a manually composed Toast, and focus/swipe a toast during entry; only the actual icon owner loops and the affected entry yields without resetting timers or capture.
