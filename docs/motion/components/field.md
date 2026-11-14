# Field motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

Field makes a helper or error change readable without moving the control's location or delaying the
validation semantics the caller supplies. Inherit the [shared contract](../README.md) and
[preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "axes": { "content": ["height"], "separator": ["width", "height"] },
  "regions": {
    "root": ["field"],
    "message": ["field-description", "field-error"],
    "content": ["field-content"],
    "structure": ["field-set", "field-group"],
    "text": ["field-text"],
    "value": ["field-number"],
    "surface": ["field-label"],
    "foreground": ["field-label", "field-legend", "field-description", "field-error"],
    "rich": ["field-label", "field-legend", "field-description", "field-error", "field-separator"],
    "separator": ["separator"]
  },
  "parts": {
    "root": ["field#Field"],
    "message": ["field#FieldDescription", "field#FieldError"],
    "content": ["field#FieldContent"],
    "structure": ["field#FieldSet", "field#FieldGroup"],
    "text": [
      "field#FieldLabel",
      "field#FieldTitle",
      "field#FieldLegend",
      "field#FieldDescription",
      "field#FieldError",
      "field#FieldSeparator"
    ],
    "value": [
      "field#FieldLabel",
      "field#FieldTitle",
      "field#FieldLegend",
      "field#FieldDescription",
      "field#FieldError",
      "field#FieldSeparator"
    ],
    "surface": ["field#FieldLabel"],
    "foreground": ["field#FieldTitle", "field#FieldLegend", "field#FieldDescription", "field#FieldError"],
    "rich": [
      "field#FieldLabel",
      "field#FieldTitle",
      "field#FieldLegend",
      "field#FieldDescription",
      "field#FieldError",
      "field#FieldSeparator"
    ],
    "separator": ["separator#Separator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                           | References                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: field for independent insertion and a later description/error row; inherited for a field or set inserted into a presenting structure and for the composed rule.                                     | default: `field.root.enter`, `field.message.enter`, `field.message.exit`, `field.structure.enter`; inherited: `field.separator.enter` |
| Size            | default: FieldContent owns one measured helper/error block, and a FieldGroup or Field consumes that committed height as outer reflow instead of writing a second one; inherited for an explicit rule length. | default: `field.content.resize`; inherited: `field.separator.resize`                                                                  |
| Surface colour  | default: the authored FieldLabel surface, which is the choice-card backing a Field renders; inherited: the actual composed Separator child owns the rule colour.                                             | default: `field.surface.colour`; inherited: `field.separator.colour`                                                                  |
| Text colour     | default: FieldTitle, FieldLegend, FieldDescription and FieldError foregrounds, plus the FieldLabel foreground that shares its surface owner.                                                                 | default: `field.foreground.colour`, `field.surface.colour`                                                                            |
| Changed text    | default: plain FieldLabel, FieldTitle, FieldLegend, FieldDescription, FieldError and caption strings; composed rich descendants and the multi-error list keep their own structure and native rows.           | default: `field.text.replace`; composed: `@rich`                                                                                      |
| Changed numbers | default: a direct quantity display in those same parts; composed rich counters, and a numeric field name or error identifier supplied as text, stay text.                                                    | default: `field.value.roll`; composed: `@rich`                                                                                        |

## Choreography and modes

The presence.exit binding below selects the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                               | full                                                                                                                                              | reduced                                                           | none                                     | Binding → preset → recipe/form                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field insertion / Field (an enclosing structure entrance is a separate owner) | One opacity entrance.                                                                                                                             | Short opacity.                                                    | Immediate.                               | `field.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                    |
| Description/error appears or disappears / content block and the changed row   | Open the measured block space while the changed row fades; a retained row reverses from its current opacity and unchanged siblings reflow.        | Geometry immediate; short opacity for the row.                    | Immediate.                               | `field.message.enter` → `presence.inline` → `data.transition/opacity`; `field.message.exit` → `presence.exit` → `exit.fade/opacity`; `field.content.resize` → `geometry.content` → `geometry.resize/measured`                                                                         |
| Text/quantity revision / actual plain display part                            | Changed-only text with stagger:none, or changed place-value reels; the surrounding block shares the same content transaction.                     | Short changed-text opacity; geometry and quantity immediate.      | Immediate.                               | `field.text.replace` → `text.replace` → `text.change/changed-runs`; `field.value.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                       |
| Standalone set/group insertion / owning structure                             | One independent opacity entrance for the structure; a later text revision is a content change on the display host, never a replay of it.          | Short opacity/text feedback; geometry immediate.                  | Final structure and content immediately. | `field.structure.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                               |
| Invalid/disabled/context change / display surfaces                            | An owner with DOM focus-within or an invalid state settles all of its declared paint immediately; other eligible owners transition independently. | Same immediate owner priority; otherwise a short colour feedback. | Immediate.                               | `field.foreground.colour` → `state.color` → `state.color/foreground`; `field.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                       |
| FieldSeparator rule insertion, explicit length, removal or a colour revision  | The composed rule fades, interpolates its own explicit length and transitions its scoped background through Separator's owners, once.             | Short opacity/colour; length immediate.                           | Final rule immediately.                  | `field.separator.enter` → `presence.inline` → `data.transition/opacity`; `field.separator.resize` → `geometry.compact` → `geometry.resize/measured`; `field.separator.exit` → `presence.exit` → `exit.fade/opacity`; `field.separator.colour` → `state.color` → `state.color/surface` |

The `text` and `value` bindings own the plain display host inside each part; a rich child keeps its own
structure. FieldLabel is the field's own native label: it owns its surface, foreground and changed name
exactly once, because composing a dependency here would rewrite the label's own slot and leave two
foreground owners on one node for every state change. FieldTitle keeps the shared `field-label` slot with
its distinct semantics. FieldContent is the message and geometry region, not an alias for FieldGroup, and
a Field never adds a second height writer for the same cause. The caption is display-only: its muted
foreground and masking backing belong to the rule composition, and `ruleStyle` is the only authored route
to the composed rule's own length and paint.

## Interruption and lifecycle

New errors replace pending ones immediately; announcements are never serialised behind animation.
FieldError's role and live semantic content stay current, and an exiting duplicate is inert and hidden
from assistive technology. Repeated error removal and reappearance retarget the same geometry and
opacity owners, and a returning row cannot be removed by an obsolete exit callback. Parent unmount
cancels every observer; live reduction finishes geometry and reels at once, and none or a zero clock
also finishes opacity and colour.

`errors` deduplication and children precedence are unchanged. A single plain message has one text-diff
owner; the internally generated multi-error list keeps exact retained messages by their message text and
lets added or removed rows insert natively, because the API supplies no stable error IDs — array index is
never used to pair unrelated messages. FieldError resolves its children and errors array before choosing
a renderer, so falsy children still defer to the array or return nothing, and a numeric zero never becomes
a visible error. FieldSeparator keeps its caption conditional, so zero, an empty string or false never
acquires a caption, a colour owner or a presence owner.

## Geometry and performance

FieldContent measures the changed block after commitment and clamps it to the content area. Labels,
descriptions and errors are laid out at the final available width before the host height interpolates,
so text never rewraps along an interpolated width. A focused editor, a captured pointer or composition, a
caller height clock, an unreadable destination or a passive resize settles the block immediately; a
responsive orientation change and passive wrapping commit directly without inventing an authored change.

One host owns each changed cause: FieldContent owns its message block, and the enclosing Field, FieldSet
and FieldGroup only reflow. The composed rule interpolates only a definite authored length on its final
orientation axis; a percentage or stretch length keeps native layout. Native inputs, textareas and
buttons are never diffed or scaled. Long error lists keep bounded row work with no repeated animation of
unchanged messages, and unmount releases the geometry registration, the presence channel and every
observer.

## Acceptance scenarios

Required acceptance: helper plus error together; rapid errors-array changes; plain and rich descriptions;
vertical, horizontal and responsive fields; label/control association; row removal while the control is
focused; a retained keyed row that leaves and returns during its own exit; standalone FieldSet legend
updates; duplicate and reordered error lists; single-to-list changes; and all modes, including a zero
clock and a live reduction, without a duplicate announcement.

Also required: FieldError children `{0}`, `""` and `false` with and without an `errors` array must keep
the current branch and output exactly, and FieldSeparator children `{0}` must not acquire a caption. An
invalid display owner settles its entire declared paint immediately while an unrelated Separator owner
retains its eligible colour policy.
