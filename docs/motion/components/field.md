# Field motion contract

Status: target design; implementation and verification pending.

Field makes helper and error changes readable while preserving the control's location and immediate validation semantics supplied by the caller. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: field for independent insertion and later description/error rows; inherited for FieldGroup/FieldSet entrance coordination. |
| Size | default: field-content/field shell owns helper/error-driven block size; FieldGroup owns sibling position; native control geometry remains with the control. |
| Surface colour | default: authored FieldLabel surface and FieldSeparator rule when applicable; composed controls retain their own border/background owners. |
| Text colour | default: legend, label/title, description and error foregrounds respond to supplied invalid/disabled context. |
| Changed text | default: plain legend, label/title, description, separator caption and error messages; composed rich descendants preserve their structure. |
| Changed numbers | default: direct quantity displays in those textual parts; composed rich counters; numeric field names/error identifiers remain text. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Field insertion / field or enclosing group | One opacity entrance. | Short opacity. | Immediate. | `field.root.enter` → `presence.inline` → one-shot opacity `data.transition` |
| Description/error appears or disappears / content and row | Open the measured block space while the changed row fades; retained siblings reflow. | Geometry immediate; short opacity. | Immediate. | `field.message.enter` → `presence.inline` → one-shot opacity `data.transition`; `field.message.exit` → `presence.exit` → `exit.fade`; `field.content.resize` → `geometry.content` → `geometry.resize`; `field.group.move` → `layout.compact` → `layout.move` |
| Text/quantity revision / actual display part | Changed-only text with stagger:none or quantity rolling; share the size transaction. | Short changed-text opacity; quantity/size immediate. | Immediate. | `field.text.replace` → `text.replace` → target `text.change`; `field.value.roll` → `number.compact` → revised `number.roll` |
| Standalone field-set/group or legend/label/separator-caption revision / owning display host | One independent opacity entrance for the structure; known text changes consume one measured destination without a second Label/Separator writer. | Short opacity/text feedback; geometry immediate. | Final structure/content immediately. | `field.structure.enter` → `presence.inline` → one-shot opacity `data.transition`; `field.content.resize` → `geometry.content` → `geometry.resize`; `field.text.replace` → `text.replace` → target `text.change` |
| Invalid/disabled/context change / relevant display surfaces | Scoped colour transition. | Short colour feedback. | Immediate. | `field.surface.colour` → `state.color` → target `state.color`; `field.text.colour` → `state.color` → target `state.color` |

## Interruption and lifecycle

New errors replace pending errors immediately; do not serialize announcements behind animation. FieldError's role and live semantic content remain current, with visual duplicates excluded from accessibility. Repeated error removal/reappearance retargets the same geometry owner. FieldLabel and FieldTitle both use the actual field-label slot and retain their distinct semantics. Parent unmount cancels all observers; live reduction finishes geometry/reels, and none or zero clock finishes every remaining effect.

Keep `errors` deduplication and children precedence unchanged. A single plain message has one text-diff owner; in the internally generated multi-error list, exact retained messages keep identity while added/removed messages use local row presence. The API supplies no stable error IDs, so never pair unrelated messages by array index or invent validation identity. A returning message cannot be removed by an obsolete exit callback; only the current semantic error region is announced.

## Geometry and performance

Measure the changed message block after commitment and clamp it to the owning content area. Lay out labels/descriptions/errors at final available width before host-height interpolation, avoiding continuous word reflow during the height change. A FieldGroup may consume outer reflow without writing the same field height. Native inputs are never diffed or scaled. Responsive orientation changes and passive wrapping commit directly; explicit owned structure changes may reflow. Long error lists use bounded changed-row work, with no repeated animation of unchanged messages.

Choose one host for each changed cause: FieldContent owns its message block, or the enclosing Field/FieldSet consumes that destination; they do not each animate the same height. Group sibling movement uses committed final field boxes, never animated child measurements. If a helper/label revision would move or resize the focused editor, or an intermediate host would hide required copy or its focus outline, commit the affected geometry immediately. Existing Label and Separator compositions inherit the field transaction and do not add an entrance or foreground writer for that cause. Use one changed-block measurement, retain only visible changed error rows, and apply affected text/list geometry immediately when shared work budgets are exceeded.

## Acceptance scenarios

Target acceptance; not executed: helper plus error together; rapid errors-array changes; plain and rich descriptions; vertical/horizontal/responsive fields; label/control association; row removal with focused control; all modes and zero clock without duplicate announcements.

Also pending: duplicate/error-list reorder and single-to-list changes, a returning message during exit, standalone FieldSet legend updates, and helper growth around an idle focused input; preserve deduplication, one announcement and native editor stability.
