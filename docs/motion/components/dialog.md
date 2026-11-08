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
    "quantity": ["dialog#DialogTitle", "dialog#DialogDescription"],
    "body": ["dialog#DialogContent"],
    "built-in-close": ["dialog#DialogContent", "dialog#DialogFooter", "button#Button"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                              | References                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `dialog-content` owns panel presence and `dialog-overlay` owns backdrop opacity. Header, footer and initial children inherit that entrance.                                                                                                                                                               | default: `dialog.content.enter`, `dialog.content.exit`, `dialog.overlay.enter`, `dialog.overlay.exit`; inherited: `@built-in-close`         |
| Size            | Default: content shell owns content-driven width/height within existing viewport/max-width constraints; its natural-content measurement is separate. Built-in close controls retain Button geometry.                                                                                                               | default: `dialog.content.resize`; inherited: `@built-in-close`                                                                              |
| Surface colour  | Default: content/overlay own their supplied background/border tokens; child buttons retain their own state owners. Built-in close controls retain Button paint.                                                                                                                                                    | default: `dialog.surface.colour`; inherited: `@built-in-close`                                                                              |
| Text colour     | Default: `dialog-title` and `dialog-description` own foreground changes; arbitrary body children inherit or retain component ownership. Built-in close controls retain Button foreground.                                                                                                                          | default: `dialog.surface.colour`; inherited: `@built-in-close`                                                                              |
| Changed text    | Default for primitive title/description content: changed runs only. Rich body/title children use composed ownership. Built-in close captions/icons are fixed.                                                                                                                                                      | default: `dialog.title.change`, `dialog.description.change`; composed: `@title`, `@description`, `@body`; not-applicable: `@built-in-close` |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. Built-in close controls have no quantity. | default: `dialog.quantity.change`; composed: `@title`, `@description`, `@body`; not-applicable: `@built-in-close`                           |

## Choreography and modes

| Trigger / owner                                                | Full                                                                                                                                                                           | Reduced                                                                        | None                                                    | Binding → preset → recipe/form                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Open / content                                                 | Opacity with `scale.in`; final centered placement is stable. Entry is subject to the actual-focus gate below.                                                                  | Short opacity only. Entry obeys the same focus gate.                           | Open target immediately.                                | `dialog.content.enter` → `presence.surface` → `enter.pop/surface`                                                                              |
| Close / content                                                | Opacity exit only; no delayed child exits.                                                                                                                                     | Short opacity only.                                                            | Closed target immediately.                              | `dialog.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                                  |
| Open/close / overlay                                           | Opacity follows the same open transaction, with its own property owner.                                                                                                        | Short opacity.                                                                 | Target opacity immediately.                             | `dialog.overlay.enter` → `presence.surface` → `enter.pop/opacity`; `dialog.overlay.exit` → `presence.exit` → `exit.fade/opacity`               |
| Intentional body/size change / content shell                   | Measure the final target and animate clamped width/height without bounce.                                                                                                      | Final geometry immediately.                                                    | Final geometry immediately.                             | `dialog.content.resize` → `geometry.panel` → `geometry.resize/measured`                                                                        |
| Plain title/description update / respective text owner         | Stable-grapheme replacement, `stagger: none`; initial text inherits panel entrance.                                                                                            | Changed-run opacity only.                                                      | Final text immediately.                                 | `dialog.title.change` → `text.replace` → `text.change/changed-runs`; `dialog.description.change` → `text.replace` → `text.change/changed-runs` |
| Supplied colour token change / relevant parts                  | Scoped surface/border/foreground transition. Colour eligibility and immediate-owner priority follow the rule below.                                                            | Short colour feedback. Colour obeys the same owner priority.                   | Final colours immediately.                              | `dialog.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                     |
| Direct numeric Title/Description revision / owned display slot | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                              | Final number immediately.                                                      | Final number immediately.                               | `dialog.quantity.change` → `number.compact` → `number.roll/reels`                                                                              |
| Press/release / inherited Button feedback layer                | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable. Native activation and existing close semantics remain immediate; no second executor. | No scale; colour follows the same Button owner and its focus/invalid priority. | Native activation/close immediately, without animation. | `dialog.built-in-close.press` → `feedback.press` → `feedback.press/scale` (inherited Button owner)                                             |

`surface.colour` addresses separate content, overlay and title/description regions. Actual DOM focus/focus-within or a region's own invalid state cancels its colour clock and settles all its declared paint immediately; independent backdrop/text regions retain their own clocks. Other colour interpolation requires a verified readable palette. This does not cancel disjoint presence, text or geometry owners.

`built-in-close` covers only the actual [Button](button.md) rendered by DialogContent's close affordance and DialogFooter's optional close action. Those controls inherit Button paint, fixed geometry and safe press feedback once; local surface/title/description controllers exclude them. Initial controls share panel presence; a later `showCloseButton` membership change uses the surviving Button presence owner, without delaying native close. Their fixed Close caption/accessibility text and glyph do not gain text replacement or numeric reels. Same-cause panel/control layout supplies one committed destination or delegates geometry, with no duplicate size writer. The exported bare DialogClose remains a pass-through composition: it acquires Button behavior only when its actual caller render uses Button.

## Interruption and lifecycle

Preserve Base UI's actual initial-focus timing and target. Its ordinary default focuses a tabbable child or the popup itself; if that target would still be faded or displaced by the content entrance, settle that content envelope before presenting focus. Consequently a default open can legitimately skip panel entry while the separately owned backdrop still fades. Never delay/disable autofocus to guarantee a scale animation. A caller's existing focus policy may leave the surface eligible for entry until a real focus/pointer activation reaches it.

- Base UI owns open state, modal behavior, focus trapping, dismissal and return focus. Semantic state and input never wait for panel, title or geometry completion.
- Rapid close/reopen reverses the same presence boundary from its current visual state. A content update during close commits semantic content but does not start a second entrance or resize.
- Closing cancels local text/numeric/geometry work; the exit owner alone retains visual presence until Base UI permits removal. No duplicate interactive or accessible subtree.
- Live reduced cancels scale/layout; none and zero clock complete the semantic target and cancel presentation delays/exit holds through Base UI's native exit protocol. Unmount removes measurements and all writers.
- Async content arriving while closed updates the next semantic view without starting geometry/presence. A new open revision invalidates all older completion callbacks; a zero-duration close still completes through Base UI's actual protocol before modality/return-focus ownership is released. Native controls inside the dialog remain operable in reduced/none.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich Title/Description children and formatting callbacks retain their composed owners; the separately anchored body boundary delegates to its actual child display components rather than running the title controller over body content. Screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- One natural-content observer and one shell writer own both measured axes. Centering/placement and panel decoration must use separated properties/layers so transforms do not compete.
- Lay text at the final destination width once, measure its natural height, then animate the shell around that layout. Do not continuously rewrap text through intermediate widths; passive font/viewport changes are immediate.
- Preserve Content's existing width/viewport constraints and any caller-provided overflow region; the default Content does not create a scrolling viewport. If readable geometry cannot fit the available bounds without adding a scroll policy or extra clipping, use immediate native layout. Do not clip focus rings, close controls or portalled descendants.
- At most one panel, one overlay and the bounded changed text set animate per dialog. Avoid per-child entrances and resize feedback from the animated shell.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

A focused native editor also takes priority when geometry would move its caret/content box or change its scroll position, even if no text would be clipped. Settle the affected decorative size axis; unrelated paint may continue. A child size change that leaves the editor's geometry and scroll stable can retain its existing single owner.

## Acceptance scenarios

- Pending: keep the same Content host while changing only its callback ref during entry/exit; external registration transfers without interrupting eligible presence. Separately replace the actual render host and reject writes from its retired owner. Exercise native retained mounting and prevent-unmount control: visual completion, hidden connected content and actual unmount retain their distinct native callback/focus semantics.
- Pending: preserve a caller-owned continuous CSS animation across mode/clock changes and a close/reopen that retains the same host. Actual native unmount may end that handle; reopening a new host gets a new handle. The caller loop neither becomes a Cadence exit hold nor gets blanket-cancelled to force completion.

- Pending: open from keyboard, change body height and close mid-resize; focus, Escape, modal variants and return focus retain Base UI behavior.
- Pending: rapidly reopen during exit, including changed title and lazy body content, with no duplicated panel/name or stale geometry.
- Pending: SSR-visible open state, small viewport/zoom, parent child entrance suppression, all modes, live downgrade and zero clock.
- Pending: grow a focused form/message inside a constrained dialog, including a nested disclosure and async content arriving after close; required text stays visible, no parent/child size chase occurs, and only the current close revision completes modality/focus restoration.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
- Pending: Exercise the existing initial-focus default and a supported caller focus override during entry; default autofocus may settle only the panel while backdrop opacity continues, and neither path delays focus.
- Pending: Press the built-in Content/Footer close Buttons and a caller-rendered DialogClose. Verify the real Button safe-layer owner or the actual caller owner executes once; switch to reduced/none or zero clock while held, then close. Preserve the correct held/released target, native activation/return focus and immediate native close without a stale press writer or added exit hold.
- Pending: grow long content beyond available height with default Content and with an explicitly composed scroll region. Preserve each existing layout/overflow policy; an infeasible readable size interval uses immediate native layout rather than adding a scrollbar, clipping text or changing the caller's scroll owner for animation.
