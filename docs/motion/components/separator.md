# Separator motion contract

Status: target design; implementation and verification pending.

Separator quietly marks a structural boundary when that boundary is introduced or changes orientation. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "rule": ["separator#Separator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                            | References                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Appearance      | default: separator for independent dynamic insertion; inherited when its containing region enters as a unit.                  | default: `separator.rule.enter`, `separator.rule.exit`, `separator.rule.replace` |
| Size            | default for an explicit owned length change; inherited for parent-owned geometry; passive stretch follows layout immediately. | default: `separator.rule.resize`                                                 |
| Surface colour  | default: the separator rule's background colour, including theme/context changes.                                             | default: `separator.rule.colour`                                                 |
| Text colour     | not applicable: Separator has no default displayed text or currentColor icon.                                                 | not-applicable: `@rule`                                                          |
| Changed text    | not applicable: the rule has no text slot; a labelled divider is a separate composition such as FieldSeparator.               | not-applicable: `@rule`                                                          |
| Changed numbers | not applicable: the rule has no numeric content or value.                                                                     | not-applicable: `@rule`                                                          |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                           | full                                                                                                | reduced                                        | none       | Binding → preset → recipe/form                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Independent insertion/removal / separator | Rule opacity enters or exits within retained parent lifecycle.                                      | Short opacity only.                            | Immediate. | `separator.rule.enter` → `presence.inline` → `data.transition/opacity`; `separator.rule.exit` → `presence.exit` → `exit.fade/opacity` |
| Explicit length change / rule             | Interpolate the owned length toward the clamped target.                                             | Target size immediately.                       | Immediate. | `separator.rule.resize` → `geometry.compact` → `geometry.resize/measured`                                                             |
| Orientation changes / separator           | Commit the new orientation and briefly fade the replacement rule; do not rotate it through content. | Short fade or immediate if no retained visual. | Immediate. | `separator.rule.replace` → `presence.inline` → `data.transition/opacity`                                                              |
| Rule colour changes / separator           | Scoped background colour transition.                                                                | Short colour transition.                       | Immediate. | `separator.rule.colour` → `state.color` → `state.color/surface`                                                                       |

## Interruption and lifecycle

Repeated orientation changes keep only the newest rule. There is no hover/press state. Exiting and reinserted separators reverse from the current opacity when a surviving parent retains them. Unmount releases all measurements. Live reduced cancels explicit length interpolation; none or a zero clock also completes rule fades and colours. Decorative and semantic separator roles update immediately.

One rule-opacity owner arbitrates entrance, orientation replacement and exit; these never run separate opacity writers on the same node. An orientation revision cancels the previous axis measurement before establishing the new destination. Exit wins over replacement, and a stale replacement completion cannot restart a removed rule.

## Geometry and performance

Measure only explicit length mutations on the final orientation axis. Parent width changes and flex stretching do not produce a second animation. Keep line thickness stable; do not scale nearby text or cause per-frame layout reads. A decorative rule needs no focus management or hidden text duplicate.

Use one rule and at most one retained decorative outgoing rule; no per-frame measurement or offscreen observer is needed. If the explicit target cannot be distinguished from passive stretch, apply native layout immediately rather than guessing an authored length change. Remove temporary size constraints after settling so the rule still follows its parent.

## Acceptance scenarios

Target acceptance; not executed: insert/remove a rule between sections; parent resize; explicit length change; horizontal-to-vertical changes mid-transition; decorative and semantic roles; no fictitious text/number effects; all modes and zero clock.

Also pending: orientation replacement during entry, then removal/reinsertion before completion; exactly one opacity writer and the latest orientation survive.
