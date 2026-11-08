# Input OTP motion contract

Status: target design; implementation and verification pending.

Only slots whose code characters actually change receive a local replacement cue. Typing, paste, selection and completion remain native and immediate. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["input-otp#InputOTP", "input-otp#InputOTPGroup"],
    "slot": ["input-otp#InputOTPSlot"],
    "input": ["input-otp#InputOTP"],
    "separator": ["input-otp#InputOTPSeparator"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                         | References                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Appearance      | Default: the input container/group owns one entrance; `input-otp-slot` and separators inherit it.                                                                                                                                                                                                                                             | default: `input-otp.root.enter`                           |
| Size            | Inherited: slots have fixed boxes and caller-owned grouping. Changing code length changes semantic structure immediately; no per-slot size spring.                                                                                                                                                                                            | inherited: `@root`, `@slot`                               |
| Surface colour  | Default: each slot owns active, invalid and disabled border/background and fixed-geometry shadow-colour feedback; focus-ring geometry remains immediate.                                                                                                                                                                                      | default: `input-otp.slot.colour`                          |
| Text colour     | Default: each displayed character inherits its slot foreground; eligible active/disabled colours use scoped transitions, while a slot with invalid state or actual DOM focus-within uses immediate paint. The decorative separator inherits surrounding foreground through its existing currentColor glyph, with no slot-state interpolation. | default: `input-otp.slot.colour`; inherited: `@separator` |
| Changed text    | Default: the presentation inside each changed `input-otp-slot` replaces that character only; unchanged slots and focus-only moves do not replay. The real input remains native.                                                                                                                                                               | default: `input-otp.slot.change`                          |
| Changed numbers | Not applicable: OTP digits are an identifier, not an integer. No rolling, carry, inferred direction or count-up.                                                                                                                                                                                                                              | not-applicable: `@root`                                   |

## Choreography and modes

| Trigger / owner                                 | Full                                                                                                                                                                                                        | Reduced                                                         | None                         | Binding → preset → recipe/form                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Independent insertion / container               | One opacity entrance with existing code already rendered.                                                                                                                                                   | Short opacity.                                                  | Final state immediately.     | `input-otp.root.enter` → `presence.inline` → `data.transition/opacity`                                             |
| Accepted edit/paste / changed slot presentation | Changed character fades out/in in its fixed box; `stagger: none`, including multi-slot paste.                                                                                                               | Short opacity only where safe.                                  | Final character immediately. | `input-otp.slot.change` → `text.replace` → `text.change/changed-runs`                                              |
| Active/invalid/disabled / slot                  | A slot with invalid state or actual DOM focus-within settles all declared paint immediately; other eligible active/disabled colours transition. Ring width/offset and the focus indicator remain immediate. | Same immediate owner priority; otherwise short colour feedback. | Final colours immediately.   | `input-otp.slot.colour` → `state.color` → `state.color/surface-foreground`                                         |
| Caret/selection / native input and active slot  | Immediate caret and selection; no authored blinking loop.                                                                                                                                                   | Same immediate behavior.                                        | Same immediate behavior.     | `input-otp.input.edit` → `engine.native` → `native/input-otp` (input-otp's native input/selection (no new recipe)) |

## Interruption and lifecycle

- `onChange` and `onComplete` fire on accepted input, never after visual completion. IME, paste transformation, read-only and selection behavior remain owned by `input-otp`.
- A new character retargets the same slot; backspace cancels the outgoing replacement and clears the semantic code immediately. Pasting commits every changed slot in the same transaction.
- Moving focus or caret does not animate characters. The mirrored active-slot state is not itself DOM focus-within on the slot; it does not globally disable eligible slot colour feedback. Invalid state on that colour owner still forces all its declared paint immediate. Parent close/removal cancels presentation without changing the code or emitting a completion event.
- During active IME composition, autofill bursts or a native text-selection replacement that cannot keep the visual mirror synchronized safely, show the affected slots immediately. Only a committed safe character revision may start replacement; neither controlled rejection nor caret movement creates a new code revision.
- Live reduced removes any spatial extension; none/zero clock commits all latest characters with no residual delays. Unmount clears slot writers and registrations.

## Geometry and performance

- No character measurement is needed for fixed slots. Keep one presentation writer per changed slot; the native input is never split, replaced or scaled.
- Slot count, grouping and caller size changes use final native layout immediately, with no negative box interpolation. Reduced/none/zero clock keep input, caret, selection, paste and completion operation available; presentation cancellation never cancels the accepted edit.
- Limit simultaneous decoration to visible configured slots and the shared text budget; excessive code lengths use immediate replacement rather than a long stagger.
- Clip only each decorative glyph lane. Preserve the input's hit region, focus outline, screen-reader value and copy/paste text without duplicate accessible characters.

## Acceptance scenarios

- Pending: type, replace one middle character, backspace and paste a full code; unchanged slots remain still and completion timing is unchanged.
- Pending: verify native selection, read-only, transformed paste and composition input without rolling numeric codes.
- Pending: verify initial value hydration, parent-owned entrance, all modes, zero clock, close during paste feedback and cleanup.
- Pending: change controlled code or maxLength during composition/paste, then downgrade motion while editing; no duplicated character, stale mirror or extra completion callback is introduced. Distinguish an active-slot change from actual DOM focus on the paint owner; marking a slot invalid cancels its whole colour transition, not only its ring.
