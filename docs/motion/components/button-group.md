# Button Group motion contract

Status: target design; implementation and verification pending.

ButtonGroup keeps joined controls visually connected when its membership changes. It does not introduce selection state or turn the group into ToggleGroup. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["button-group#ButtonGroup"],
    "segment": ["button-group#ButtonGroup"],
    "text": ["button-group#ButtonGroupText"],
    "separator": ["separator#Separator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                               | References                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Appearance      | default: button-group for independent insertion and new segments; inherited for a parent-owned entrance.                                                                                                                                         | default: `button-group.root.enter`, `button-group.segment.enter`, `button-group.segment.exit` |
| Size            | default: group owns membership-driven size on its orientation axis and intrinsic ButtonGroupText revisions. Child controls own their content dimensions; one committed destination coordinates the group without tracking animated child bounds. | default: `button-group.root.resize`                                                           |
| Surface colour  | default: ButtonGroupText surface; inherited: ButtonGroupSeparator uses Separator's rule-colour owner. Composed Button/Input children retain their own state owners.                                                                              | default: `button-group.text.colour`; inherited: `button-group.separator.colour`               |
| Text colour     | default: ButtonGroupText foreground; composed controls own their foreground changes.                                                                                                                                                             | default: `button-group.text.colour`                                                           |
| Changed text    | default: direct plain text in ButtonGroupText; composed for arbitrary child controls, whose own contracts still apply.                                                                                                                           | default: `button-group.text.replace`; composed: `@text`                                       |
| Changed numbers | default: direct quantity values in ButtonGroupText; composed for quantities inside controls; key or option identifiers are not counters.                                                                                                         | default: `button-group.text.roll`; composed: `@text`                                          |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                           | full                                                                                                                         | reduced                                           | none                        | Binding → preset → recipe/form                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group insertion / button-group                                            | One opacity entrance including its initial segments.                                                                         | Short fade.                                       | Immediate.                  | `button-group.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                                |
| Segment inserted/removed / group and retained segments                    | Fade the changed segment; reflow stable siblings on the orientation axis.                                                    | Fade only; layout commits immediately.            | Immediate.                  | `button-group.segment.enter` → `presence.inline` → `data.transition/opacity`; `button-group.segment.exit` → `presence.exit` → `exit.fade/opacity`; `button-group.segment.move` → `layout.compact` → `layout.move/position`; `button-group.root.resize` → `geometry.compact` → `geometry.resize/measured` |
| Text or numeric revision / ButtonGroupText                                | Changed-only text replacement with stagger:none or quantity reels.                                                           | Short changed-text opacity; quantities immediate. | Immediate content.          | `button-group.text.replace` → `text.replace` → `text.change/changed-runs`; `button-group.text.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                             |
| ButtonGroupText or child destination changes / group geometry coordinator | Consume final segment boxes once; resize the owned group axis and move retained segments without a second child-size writer. | Final geometry immediately.                       | Final geometry immediately. | `button-group.root.resize` → `geometry.compact` → `geometry.resize/measured`; `button-group.segment.move` → `layout.compact` → `layout.move/position`                                                                                                                                                    |
| Surface/foreground state / text and inherited Separator rule              | Scoped colour transition, with Separator executing its inherited binding once.                                               | Short colour transition.                          | Immediate.                  | `button-group.text.colour` → `state.color` → `state.color/surface-foreground`; `button-group.separator.colour` → `state.color` → `state.color/surface` (inherited Separator)                                                                                                                             |

## Interruption and lifecycle

Stable child identity survives reorder and rapid membership changes. Reinserted segments resume from their current geometry, not a stale exit. A child removed by the caller needs retained parent lifecycle for an exit. Live reduced settles group/segment geometry before paint while permitted segment and changed-run opacity and eligible colour reconcile under their reduced contracts. None or zero recipe clock settles one-shot work to the effective mode's current target. Focus removal follows application/native semantics without motion delays.

Each child uses its actually resolved provider/mode and clock, including explicit nested overrides subject to the OS ceiling; the group does not force its mode across that boundary. Actual parent closure/removal still invalidates subordinate lifecycle work. Positive clock edits follow the shared capture-or-retime policy, and returning to full never replays a consumed membership change.

Child inputs keep native nodes, value, selection and IME state. When a structural revision affects a focused editor's box or a captured pointer target, commit the affected geometry immediately and discard the superseded movement; blur/release does not replay it. Removing a segment cancels its measurement/press registration before an outgoing decorative copy can complete.

## Geometry and performance

Measure the group and changed segment after commitment. Animate only the affected axis; orientation changes settle to a measured final layout rather than rotating controls. Preserve each child's existing single-line/truncation policy; any multiline member lays out at destination width before group-height interpolation. Responsive reflow remains immediate. Group geometry never writes child press transforms, and joined borders/corner masks update with the committed membership. No blanket scaling or per-child entrance cascade.

For one revision, each control publishes its final intrinsic box; the group calculates its destination from those boxes and either owns the outer axis or leaves it natural. It never springs after a child's interpolated size. Sibling displacement uses a visual owner separate from each child's press/anchor transform. Count changed and measured/projected retained segments, distinct outgoing visuals and any participating group shell against the [automatic collection bound](../presets.md#52-shared-work-limits) before member measurement. A single whole-group entrance counts once rather than once per descendant. If identities, safe layers or that working set are unavailable, commit affected collection presence/layout immediately. A smaller intermediate shell cannot add clipping to a final-visible label, editor or focus ring.

ButtonGroupSeparator binds the inherited Separator rule owner; the group wrapper does not create a second background/opacity writer. The same parent-entry cause is consumed once across the composed part.

## Acceptance scenarios

Target acceptance; not executed: insert and remove a middle button; horizontal and vertical groups; input/button mixtures; ButtonGroupText quantity changes; reorder while a child is pressed; orientation changes; no fabricated selection marker; all modes and zero clock during membership changes.

Also pending: a child label and ButtonGroupText change in the same revision, plus membership changes while an input is focused/composing; verify one final destination, stable native selection and no delayed motion after blur.

Also pending: downgrade during simultaneous segment reflow, safe segment/text opacity and colour; geometry becomes immediate while permitted paint follows reduced mode. Repeat with an explicit nested child mode, then none/zero and parent removal, preserving the actual context, current semantic target and lifetime boundary.
