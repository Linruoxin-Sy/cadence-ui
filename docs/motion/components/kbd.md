# Kbd motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

Kbd updates a shortcut hint while preserving the identity of keys that remain in the chord. It is a display component, not a global keyboard listener. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["kbd#KbdGroup"],
    "key": ["kbd#Kbd"],
    "group": ["kbd#KbdGroup"],
    "items": ["kbd#Kbd"],
    "quantity": ["kbd#Kbd"],
    "label": ["kbd#Kbd"]
  },
  "regions": {
    "root": ["kbd", "kbd-group"],
    "key": ["kbd"],
    "group": ["kbd-group"],
    "items": ["kbd"],
    "label": ["kbd-text"],
    "quantity": ["kbd"]
  },
  "axes": { "key": ["width"], "group": ["width"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                           | References                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Appearance      | default: kbd or kbd-group for independent insertion; inherited inside a parent-owned hint entrance.                                          | default: `kbd.root.enter`, `kbd.key.enter`, `kbd.key.exit` |
| Size            | default: each kbd owns changed label width and kbd-group owns membership reflow, with distinct property owners.                              | default: `kbd.key.resize`, `kbd.group.resize`              |
| Surface colour  | default: kbd surface and border; inherited contextual targets, such as Tooltip colour, are transitioned by their declared owner.             | default: `kbd.key.colour`                                  |
| Text colour     | default: kbd foreground unless a parent owns a shared inherited colour transition.                                                           | default: `kbd.key.colour`                                  |
| Changed text    | default: direct key labels use changed-only replacement; composed for rich keycap content.                                                   | default: `kbd.label.replace`; composed: `@key`             |
| Changed numbers | not applicable to shortcut key labels: numeric keys identify keys, not quantities; unrelated quantity content requires explicit composition. | not-applicable: `@root`, `@quantity`; composed: `@key`     |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                       | full                                                                                                                             | reduced                                      | none       | Binding → preset → recipe/form                                                                                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hint insertion / group or standalone key              | One short opacity entrance.                                                                                                      | Opacity only.                                | Immediate. | `kbd.root.enter` → `presence.inline` → `data.transition/opacity`; `kbd.key.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                           |
| Key label changes / kbd                               | Replace changed graphemes with stagger:none; fit the new intrinsic width.                                                        | Short changed-text opacity; width immediate. | Immediate. | `kbd.label.replace` → `text.replace` → `text.change/changed-runs`; `kbd.key.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                       |
| Chord membership changes / kbd-group                  | New keys fade; removed keys fade with retained lifecycle; surviving keys reflow and the owned group axis uses their final boxes. | Layout immediate, short opacity.             | Immediate. | `kbd.key.enter` → `presence.inline` → `data.transition/opacity`; `kbd.key.exit` → `presence.exit` → `exit.fade/opacity`; `kbd.items.move` → `layout.compact` → `layout.move/position`; `kbd.group.resize` → `geometry.compact` → `geometry.resize/measured` |
| Context colours change / declared key or parent owner | Scoped colour transition.                                                                                                        | Short colour transition.                     | Immediate. | `kbd.key.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                                                         |

## Interruption and lifecycle

Platform or shortcut revisions replace the pending target immediately. Stable keys are not remounted when another modifier changes. No visual pressed state is inferred from document keyboard events. Parent closure consumes child exits; standalone removal needs a retained parent. Live reduction stops geometry and leaves permitted changed-text opacity; none or zero recipe clock cancels every one-shot replacement, colour and presence writer before paint. Unmount releases group registration and measurements, and stale exit completion cannot remove a restored key.

## Geometry and performance

Measure only changed keycaps and the chord after commitment. Keep keycap content single-line at its resolved final width; any parent hint wrapping commits before its own host-height animation. Keep keycap baselines and focusable parent hit areas unchanged. A tooltip owns its popup positioning while Kbd owns only its bounded internal geometry. Do not roll the digit in a shortcut or apply a stagger to an unchanged chord.

The chord consumes each key's committed destination once; it does not observe a key's animated width as a new layout target. A Tooltip consumes final strip allocation immediately for its native popup box, while safe internal key widths and reflow continue. The group delegates that outer same-cause sizing instead of letting the popup chase spring frames. If a growing key label cannot remain readable under existing overflow, place its width immediately. New-key/final-label boxes that overlap a surviving origin settle that position field immediately. A group in a focusable control reserves final allocation before internal projection; a standalone key delegates its width immediately so the native hit area is not animated by a child. Retained removal freezes the current projected key box, including a mid-reflow removal. The finite visual preflight counts the group shell, final-allocation strip, current keys and retained exits before member boxes are read; overflow settles text/presence/geometry without a backlog. Limit decoration to changed keys and their visible retained neighbours under the shared budget; oversized/rich key labels use safe immediate text instead of scanning arbitrary descendants.

## Acceptance scenarios

Regression scenarios: modifier glyph/platform changes; add/remove one chord key; numeric shortcut labels; narrow hint wrapping; tooltip open/close; rapid revisions; no unsolicited key tracking; all modes and zero clock mid-change.

Two key labels grow inside a changing Tooltip, then set zero clock without changing the shortcut; verify one destination, no clipped key name and no residual opacity transition.

The sibling projection binding anchors the physical Kbd host (`kbd.items.move`); the group owns the revision, not a second transform on its shell. The internal strip keeps final destination allocation while the shell changes width. Caller keys identify chord members.
