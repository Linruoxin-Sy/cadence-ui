# Field motion contract

Status: target design; implementation and verification pending.

Field makes helper and error changes readable while preserving the control's location and immediate validation semantics supplied by the caller. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["field#Field"],
    "message": ["field#FieldDescription", "field#FieldError"],
    "content": ["field#FieldContent", "field#Field", "field#FieldSet"],
    "group": ["field#FieldGroup"],
    "text": ["field#FieldLabel", "field#FieldTitle", "field#FieldLegend", "field#FieldDescription", "field#FieldError", "field#FieldSeparator"],
    "value": ["field#FieldLabel", "field#FieldTitle", "field#FieldLegend", "field#FieldDescription", "field#FieldError", "field#FieldSeparator"],
    "structure": ["field#FieldSet", "field#FieldGroup"],
    "surface": ["field#FieldLabel", "field#FieldSeparator"],
    "separator": ["separator#Separator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                            | References                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Appearance      | default: field for independent insertion and later description/error rows; inherited for FieldGroup/FieldSet entrance coordination.                                           | default: `field.root.enter`, `field.message.enter`, `field.message.exit`, `field.structure.enter` |
| Size            | default: field-content/field shell owns helper/error-driven block size; FieldGroup owns sibling position; native control geometry remains with the control.                   | default: `field.content.resize`                                                                   |
| Surface colour  | Default: authored FieldLabel surface and FieldSeparator caption backing; inherited: the actual Separator child owns its rule colour. Composed controls keep their own chrome. | default: `field.surface.colour`; inherited: `field.separator.colour`                              |
| Text colour     | default: legend, label/title, description, separator caption and error foregrounds respond to supplied invalid/disabled context.                                                                 | default: `field.text.colour`                                                                      |
| Changed text    | default: plain legend, label/title, description, separator caption and error messages; composed rich descendants preserve their structure.                                    | default: `field.text.replace`; composed: `@text`                                                  |
| Changed numbers | default: direct quantity displays in those textual parts; composed rich counters; numeric field names/error identifiers remain text.                                          | default: `field.value.roll`; composed: `@value`                                                   |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                                             | full                                                                                                                                             | reduced                                              | none                                 | Binding → preset → recipe/form                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field insertion / Field (enclosing structure entry is a separate owner)                                                  | One opacity entrance.                                                                                                                            | Short opacity.                                       | Immediate.                           | `field.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                            |
| Description/error appears or disappears / content and row                                   | Open the measured block space while the changed row fades; retained siblings reflow.                                                             | Geometry immediate; short opacity.                   | Immediate.                           | `field.message.enter` → `presence.inline` → `data.transition/opacity`; `field.message.exit` → `presence.exit` → `exit.fade/opacity`; `field.content.resize` → `geometry.content` → `geometry.resize/measured`; `field.group.move` → `layout.compact` → `layout.move/position` |
| Text/quantity revision / actual display part                                                | Changed-only text with stagger:none or quantity rolling; share the size transaction.                                                             | Short changed-text opacity; quantity/size immediate. | Immediate.                           | `field.text.replace` → `text.replace` → `text.change/changed-runs`; `field.value.roll` → `number.compact` → `number.roll/reels`                                                                                                                                               |
| Standalone field-set/group or legend/label/separator-caption revision / owning display host | One independent opacity entrance for the structure; known text changes consume one measured destination without a second Label/Separator writer. | Short opacity/text feedback; geometry immediate.     | Final structure/content immediately. | `field.structure.enter` → `presence.inline` → `data.transition/opacity`; `field.content.resize` → `geometry.content` → `geometry.resize/measured`; `field.text.replace` → `text.replace` → `text.change/changed-runs`                                                         |
| Invalid/disabled/context change / relevant display surfaces                                 | Scoped colour transition.                                                                                                                        | Short colour feedback.                               | Immediate.                           | `field.surface.colour` → `state.color` → `state.color/surface`; `field.text.colour` → `state.color` → `state.color/foreground`                                                                                                                                                |
| FieldSeparator rule colour / inherited Separator                                            | Rule background colour through Separator once; caption backing belongs to field.surface.colour.                                                  | Inherited short colour.                              | Final colour immediately.            | `field.separator.colour` → `state.color` → `state.color/surface`                                                                                                                                                                                                              |

FieldSeparator's rule is the actual composed Separator; its caption backing is a distinct painted
span under FieldSeparator. The rule's inherited colour binding never runs on the caption, and Field
never writes a second rule background. Standalone FieldSet/FieldGroup entrance anchors identify those
actual exports; FieldContent is the message/geometry region, not an alias for FieldGroup.

## Interruption and lifecycle

New errors replace pending errors immediately; do not serialize announcements behind animation. FieldError's role and live semantic content remain current, with visual duplicates excluded from accessibility. Repeated error removal/reappearance retargets the same geometry owner. FieldLabel and FieldTitle both use the actual field-label slot and retain their distinct semantics. Parent unmount cancels all observers; live reduction finishes geometry/reels, and none or zero clock finishes every remaining effect.

Keep `errors` deduplication and children precedence unchanged. A single plain message has one text-diff owner; in the internally generated multi-error list, exact retained messages keep identity while added/removed messages use local row presence. The API supplies no stable error IDs, so never pair unrelated messages by array index or invent validation identity. A returning message cannot be removed by an obsolete exit callback; only the current semantic error region is announced.

Run FieldError's existing children/error resolution before choosing a renderer: its falsy children may defer to the errors array or return null. A numeric zero must not become a visible error merely because a numeric helper wrapper is truthy. FieldSeparator likewise retains its existing caption conditional: zero/empty/false children do not acquire a new caption or presence owner. Only an actually rendered plain display is eligible for the text/number binding; this preserves existing behavior rather than introducing validation.

## Geometry and performance

Measure the changed message block after commitment and clamp it to the owning content area. Lay out labels/descriptions/errors at final available width before host-height interpolation, avoiding continuous word reflow during the height change. A FieldGroup may consume outer reflow without writing the same field height. Native inputs are never diffed or scaled. Responsive orientation changes and passive wrapping commit directly; explicit owned structure changes may reflow. Long error lists use bounded changed-row work, with no repeated animation of unchanged messages.

Choose one host for each changed cause: FieldContent owns its message block, or the enclosing Field/FieldSet consumes that destination; they do not each animate the same height. Group sibling movement uses committed final field boxes, never animated child measurements. If a helper/label revision would move or resize the focused editor, or an intermediate host would hide required copy or its focus outline, commit the affected geometry immediately. Existing Label and Separator compositions inherit the field transaction and do not add an entrance or foreground writer for that cause. Use one changed-block measurement, retain only visible changed error rows, and apply affected text/list geometry immediately when shared work budgets are exceeded.

## Acceptance scenarios

Target acceptance; not executed: helper plus error together; rapid errors-array changes; plain and rich descriptions; vertical/horizontal/responsive fields; label/control association; row removal with focused control; all modes and zero clock without duplicate announcements.

Also pending: compare FieldError children={0}, empty string and false with/without errors, and FieldSeparator children={0}; animation integration must preserve the current branch/output exactly.

Also pending: duplicate/error-list reorder and single-to-list changes, a returning message during exit, standalone FieldSet legend updates, and helper growth around an idle focused input; preserve deduplication, one announcement and native editor stability.
