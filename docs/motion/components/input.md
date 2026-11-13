# Input motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

Input uses its chrome to explain focus, invalid and disabled state while leaving editing entirely native. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["input"],
    "control": ["input"]
  },
  "axes": { "root": ["width", "height"] },
  "parts": {
    "root": ["input#Input"],
    "control": ["input#Input"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                             | References                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Appearance      | default: input for independent dynamic insertion of a later-mounted field; inherited when Field or another parent owns the same entrance, and never a fade over an already-usable native control.                                              | default: `input.root.enter`                         |
| Size            | default for one explicit component-owned border box while the editor is unfocused and outside native selection/gesture work; inherited for parent width, file internals and passive layout, where a focused content box is never interpolated. | default: `input.root.resize`; inherited: `@control` |
| Surface colour  | default: input background, border and the scoped focus/invalid shadow respond to native state and authored attributes, with an unverified palette settling at its target.                                                                      | default: `input.root.colour`                        |
| Text colour     | default: foreground and placeholder colour as authored state changes; the caret, selection and accessible state remain native and are never a visual surrogate.                                                                                | default: `input.root.colour`                        |
| Changed text    | not applicable to the editable value or a placeholder replacement: the browser owns editing, composition and selection, and composed external labels/help follow their own contracts.                                                          | not-applicable: `@root`                             |
| Changed numbers | not applicable to native input values, including number and read-only values; an external display quantity requires composition with its own numeric owner.                                                                                    | not-applicable: `@root`                             |

## Choreography and modes

| Trigger / owner                                                | full                                                                                                                                          | reduced                                                         | none                    | Binding → preset → recipe/form                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| Independent insertion / input                                  | Opacity entrance with an immediately usable control; focus, typing or a missing presenting parent keeps native paint.                         | Short opacity only.                                             | Immediate.              | `input.root.enter` → `presence.inline` → `data.transition/opacity`                         |
| Focus, invalid, disabled or theme change / input chrome        | DOM focus-within or invalid state makes all declared chrome/foreground paint immediate; other eligible colour/shadow changes transition.      | Same immediate owner priority; otherwise short colour feedback. | Immediate final chrome. | `input.root.colour` → `state.color` → `state.color/surface-foreground`                     |
| Explicit owned size change / input                             | Bounded box interpolation only while unfocused and outside native selection/gesture interaction; otherwise commit final geometry immediately. | Immediate size.                                                 | Immediate size.         | `input.root.resize` → `geometry.compact` → `geometry.resize/measured`                      |
| Typing, autofill, composition or value update / native control | Native update, no visual text surrogate.                                                                                                      | Same native update.                                             | Same native update.     | `input.control.edit` → `engine.native` → `native/input` (native Input editing (no recipe)) |

## Interruption and lifecycle

Focus/blur and invalid changes retarget directly; there is no shake, queued warning or validation logic. Entering composition or direct editing cancels any conflicting size work. Parent removal owns any exit and must not postpone native focus cleanup. Live reduction finishes geometry; none or a zero clock also cancels colour/opacity and removes delays. No copied value is left in a transition layer.

Focus acquisition itself cancels size interpolation before paint, even before the first keystroke: the adapter reports focus, typing, selection and pointer work as a reason that resolves the native border box instead of an interpolable destination. Programmatic value changes, autofill or selection while focused remain native. Blur does not replay skipped size work; only a later eligible explicit revision can start it. Preserve scrollLeft, selection direction, form association and native validity when cancelling or unmounting, and never hold the control in a retained exit that delays focus cleanup.

## Geometry and performance

Do not measure text keystroke by keystroke or mirror passwords. Parent-driven width, percentage or intrinsic axes, file control internals, autofill and browser zoom follow native layout immediately. Only a caller-authored absolute box is eligible: the destination is read once from the committed border box outside the interpolated origin, clamped to the available parent box, and released to the caller's declaration when it settles. A caller transition or animation on the same axis wins over this owner.

The native control remains the only editor node and no wrapper is introduced, so the measured host is the input itself; one bounded border-box owner replaces any per-keystroke measurement. Keep the caret, selection, native scroll extent and focus outline outside any animation clipping, and never create a text reflow surrogate. InputGroup uses its own frame and control contract rather than duplicating this chrome.

## Acceptance scenarios

Target acceptance; not executed in a browser: keyboard focus, invalid/disabled changes; IME composition; autofill and password/file inputs; numeric and read-only values; explicit size mutation versus passive resize; controlled rapid value changes; all modes and zero clock during focus feedback.

The executed suite covers insertion, resize and colour actions in full/reduced/none with a zero clock, the shared colour policy on the real part, and the native edit/text/number boundaries. Also pending browser verification: focus an input halfway through an eligible resize without typing, then select text, change an addon/parent size and blur; geometry settles before paint, selection/scroll stay native and no deferred resize starts on blur. Focus or invalid state during an active colour transition must also settle every declared input paint property immediately while selection stays native.
