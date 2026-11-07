# Kbd motion contract

Status: target design; implementation and verification pending.

Kbd updates a shortcut hint while preserving the identity of keys that remain in the chord. It is a display component, not a global keyboard listener. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: kbd or kbd-group for independent insertion; inherited inside a parent-owned hint entrance. |
| Size | default: each kbd owns changed label width and kbd-group owns membership reflow, with distinct property owners. |
| Surface colour | default: kbd surface and border; inherited contextual targets, such as Tooltip colour, are transitioned by their declared owner. |
| Text colour | default: kbd foreground unless a parent owns a shared inherited colour transition. |
| Changed text | default: direct key labels use changed-only replacement; composed for rich keycap content. |
| Changed numbers | not applicable to shortcut key labels: numeric keys identify keys, not quantities; unrelated quantity content requires explicit composition. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding / preset |
| --- | --- | --- | --- | --- |
| Hint insertion / group or standalone key | One short opacity entrance. | Opacity only. | Immediate. | kbd.root.enter → presence.inline |
| Key label changes / kbd | Replace changed graphemes with stagger:none; fit the new intrinsic width. | Short changed-text opacity; width immediate. | Immediate. | kbd.key.replace → text.replace; kbd.key.resize → geometry.compact |
| Chord membership changes / kbd-group | New keys fade; removed keys fade with retained lifecycle; surviving keys reflow and the owned group axis uses their final boxes. | Layout immediate, short opacity. | Immediate. | kbd.key.enter → presence.inline; kbd.key.exit → presence.exit; kbd.group.move → layout.compact; kbd.group.resize → geometry.compact |
| Context colours change / declared key or parent owner | Scoped colour transition. | Short colour transition. | Immediate. | kbd.key.colour → state.color |

## Interruption and lifecycle

Platform or shortcut revisions replace the pending target immediately. Stable keys are not remounted when another modifier changes. No visual pressed state is inferred from document keyboard events. Parent closure consumes child exits; standalone removal needs a retained parent. Live reduction stops geometry and leaves permitted changed-text opacity; none or zero recipe clock cancels every one-shot replacement, colour and presence writer before paint. Unmount releases group registration and measurements, and stale exit completion cannot remove a restored key.

## Geometry and performance

Measure only changed keycaps and the chord after commitment. Keep keycap content single-line at its resolved final width; any parent hint wrapping commits before its own host-height animation. Keep keycap baselines and focusable parent hit areas unchanged. A tooltip owns its popup positioning while Kbd owns only its bounded internal geometry. Do not roll the digit in a shortcut or apply a stagger to an unchanged chord.

The chord consumes each key's committed destination once; it does not observe a key's animated width as a new layout target. A tooltip consuming the same size revision uses that destination or delegates the cause, never a second spring following the chord. If a growing key label cannot remain readable under existing overflow, place its width immediately. Limit decoration to changed keys and their visible retained neighbours under the shared budget; oversized/rich key labels use safe immediate text instead of scanning arbitrary descendants.

## Acceptance scenarios

Target acceptance; not executed: modifier glyph/platform changes; add/remove one chord key; numeric shortcut labels; narrow hint wrapping; tooltip open/close; rapid revisions; no unsolicited key tracking; all modes and zero clock mid-change.

Also pending: two key labels grow inside a changing Tooltip, then set zero clock without changing the shortcut; verify one destination, no clipped key name and no residual opacity transition.
