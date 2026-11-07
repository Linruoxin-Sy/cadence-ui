# Input motion contract

Status: target design; implementation and verification pending.

Input uses its chrome to explain focus, invalid and disabled state while leaving editing entirely native. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: input for independent dynamic insertion; inherited when Field or another parent owns the same entrance. |
| Size | default for an explicit component-owned size change while unfocused and outside selection/gesture interaction; inherited for parent width/passive layout. A focused editor's content box and caret are never interpolated. |
| Surface colour | default: input background, border and scoped focus/invalid shadow respond to native state and authored attributes. |
| Text colour | default: foreground and placeholder colour as visual state changes; caret, selection and accessible state remain native. |
| Changed text | not applicable to editable value or placeholder replacement: the browser owns editing and selection; composed external labels/help follow their own contracts. |
| Changed numbers | not applicable to native input values, including number inputs and read-only values; external display quantities require composition. |

## Choreography and modes

| Trigger / owner | full | reduced | none | Binding / preset |
| --- | --- | --- | --- | --- |
| Independent insertion / input | Opacity entrance with an immediately usable control. | Short opacity only. | Immediate. | input.root.enter → presence.inline |
| Focus, invalid, disabled or theme change / input chrome | Scoped colour/shadow transition; focus indication is available on the first semantic frame. | Short colour feedback. | Immediate final chrome. | input.root.colour → state.color |
| Explicit owned size change / input | Bounded box interpolation only while unfocused and outside native selection/gesture interaction; otherwise commit final geometry immediately. | Immediate size. | Immediate size. | input.root.resize → geometry.compact |
| Typing, autofill, composition or value update / native control | Native update, no visual text surrogate. | Same native update. | Same native update. | input.control.edit → engine.native |

## Interruption and lifecycle

Focus/blur and invalid changes retarget directly; there is no shake, queued warning or validation logic. Entering composition or direct editing cancels any conflicting size work. Parent removal owns any exit and must not postpone native focus cleanup. Live reduction finishes geometry; none or a zero clock also cancels colour/opacity and removes delays. No copied value is left in a transition layer.

Focus acquisition itself cancels size interpolation before paint, even before the first keystroke. Programmatic value changes, autofill or selection while focused remain native. Blur does not replay skipped size work; only a later eligible explicit revision can start it. Preserve scrollLeft, selection direction, form association and native validity when cancelling or unmounting.

## Geometry and performance

Do not measure text keystroke by keystroke or mirror passwords. Parent-driven width, file control internals, autofill and browser zoom follow native layout immediately. Explicit local dimensions are measured only after commitment and clamped to the available box. InputGroup uses its own frame and control contract rather than duplicating this chrome.

The native control remains the only editor node. Obtain an explicit final border-box destination without reading an interpolated box as natural size; if a safe separate presentation-size owner cannot preserve the native DOM/ref and sizing contract, use immediate size. One optional box measurement is sufficient; file/browser-owned internals are never inspected. Keep the caret, selection, native scroll extent and focus outline outside animation clipping; no text reflow surrogate is created.

## Acceptance scenarios

Target acceptance; not executed: keyboard focus, invalid/disabled changes; IME composition; autofill and password/file inputs; numeric and read-only values; explicit size mutation versus passive resize; controlled rapid value changes; all modes and zero clock during focus feedback.

Also pending: focus an input halfway through an eligible resize without typing, then select text, change an addon/parent size and blur; geometry settles before paint, selection/scroll stay native and no deferred resize starts on blur.
