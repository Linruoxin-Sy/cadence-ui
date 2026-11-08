# Tabs motion contract

Status: target design; implementation and verification pending.

Tabs links a persistent selection marker to the newly active content. The marker communicates selection; a small directional panel transition explains navigation between neighbours. This covers `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` and the decorative `tabs-indicator`, in horizontal/vertical orientations and both list variants.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Binding names are local design references.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "indicator": ["tabs#TabsList"],
    "list": ["tabs#TabsList"],
    "items": ["tabs#TabsTrigger"],
    "panel": ["tabs#TabsContent"],
    "trigger": ["tabs#TabsTrigger"],
    "label": ["tabs#TabsTrigger", "tabs#TabsContent"],
    "value": ["tabs#TabsTrigger", "tabs#TabsContent"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                                                                                                                | References                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Appearance      | Default: the newly active panel may reveal its paint after an actual selection change. Initial active content is already visible; focus-only movement does not switch or animate panels.                                                                                                                                                                                                                               | default: `tabs.panel.change`                                                |
| Size            | Default where a mounted active panel owns a known intrinsic size change: its content shell uses clamped block-size continuity. Inherited when an enclosing layout coordinates that axis; composed for an explicitly authored shared panel viewport. Separate panel hosts do not imply cross-panel height continuity. The list owns known label/quantity-driven intrinsic strip geometry; constrained axes stay native. | default: `tabs.panel.resize`, `tabs.list.resize`                            |
| Surface colour  | Default: the TabsList track, trigger hover/active/disabled surfaces and the indicator's semantic surface. The moving indicator is not a duplicate background on the trigger.                                                                                                                                                                                                                                           | default: `tabs.trigger.colour`, `tabs.indicator.colour`, `tabs.list.colour` |
| Text colour     | Default: trigger selection/disabled foreground, inherited within the panel. A focused/invalid owner's entire declared paint is immediate.                                                                                                                                                                                                                                                                              | default: `tabs.trigger.colour`                                              |
| Changed text    | Default for direct plain trigger and active-panel strings; arbitrary rich panel children retain their text owners. Selecting an unchanged panel is presence, not a source-text revision.                                                                                                                                                                                                                               | default: `tabs.label.replace`; composed: `@label`                           |
| Changed numbers | Default for a supported direct quantity in a trigger or panel; composed numeric badges/statistics own their reels. A tab value, index or numeric identifier is not a counter.                                                                                                                                                                                                                                          | default: `tabs.value.change`; composed: `@value`                            |

## Choreography and modes

| Trigger and owner                                                | Full                                                                                                                                                                  | Reduced                                                   | None                               | Binding → preset → recipe                                                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Active value changes; indicator                                  | Move the same local marker on the list's actual axis when its path is readable; otherwise place it immediately. Its extent follows the selected trigger.              | Marker at destination immediately.                        | Marker at destination immediately. | `tabs.indicator.select` → `layout.selection` → `layout.shared/selection`                                                              |
| Active panel changes; panel paint                                | Opacity and `distance.xs` travel following actual activation direction/orientation; unknown/reordered destinations use opacity only. No replay for unrelated renders. | Short opacity, no travel.                                 | Final active panel immediately.    | `tabs.panel.change` → `content.switch` → `data.transition/directional-content`                                                        |
| Active content's known intrinsic size changes                    | One clamped shell follows the destination block-size, coordinated with panel paint.                                                                                   | Destination size immediately.                             | Destination size immediately.      | `tabs.panel.resize` → `geometry.compact` → `geometry.resize/measured`                                                                 |
| Known trigger label/quantity revision; list geometry coordinator | Consume final natural trigger layout once, resize the owned strip axis and reflow retained triggers; the marker uses the same committed snapshot.                     | Final geometry immediately.                               | Final geometry immediately.        | `tabs.list.resize` → `geometry.compact` → `geometry.resize/measured`; `tabs.items.reflow` → `layout.compact` → `layout.move/position` |
| Trigger states change                                            | Eligible scoped surface/foreground colour under the actual-region gate below.                                                                                         | Eligible short colour under the same gate.                | Final colours immediately.         | `tabs.trigger.colour` → `state.color` → `state.color/surface-foreground`                                                              |
| Plain trigger/active-panel text changes                          | Preserve unchanged graphemes; replace changed runs without stagger; panel entry consumes same-cause text entry.                                                       | Short opacity on changed runs only.                       | Final text immediately.            | `tabs.label.replace` → `text.replace` → `text.change/changed-runs`                                                                    |
| Direct display quantity changes                                  | Changed places roll while semantics update immediately.                                                                                                               | Final quantity immediately.                               | Final quantity immediately.        | `tabs.value.change` → `number.compact` → `number.roll/reels`                                                                          |
| Indicator theme/variant paint changes / persistent list marker   | Eligible scoped surface/border colour on its separate decorative region; no second trigger active fill.                                                               | Eligible short colour; marker geometry remains immediate. | Final paint immediately.           | `tabs.indicator.colour` → `state.color` → `state.color/surface`                                                                       |
| List variant/theme paint changes / TabsList track                | Eligible scoped track background/border colour under the actual-region gate below; shape and orientation changes use final native layout.                             | Eligible short colour under the same gate.                | Final paint immediately.           | `tabs.list.colour` → `state.color` → `state.color/surface`                                                                            |

The marker's surface/border paint belongs to `indicator.colour`, anchored to its actual TabsList
host. The distinct list track belongs to `list.colour`; it does not add a selected-item fill. Trigger foreground/hover/disabled paint belongs to `trigger.colour`; neither writes the other's
active fill. A list variant change commits its final shape/layout immediately and rebases the marker,
then permits only the documented colour feedback; radius/thickness are not `state.color` properties.

Apply the [shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership) per actual trigger, list track and decorative marker region. DOM focus/focus-within or that region's own invalid state cancels its colour clock and settles its whole declared paint. A focused trigger therefore gates its own and the containing track's paint; the separately painted nonfocusable marker can retain verified colour feedback. Active selection alone is not DOM focus, and the colour gate does not itself cancel the independent marker geometry.

## Interruption and lifecycle

The marker and panel transaction belong to this Tabs instance. Sibling or nested Tabs may repeat
the same values; they do not share layout identity, panel measurements or exit authority. A portal
does not transfer an inner Tabs marker into the outer list's scope. Replacing one root invalidates
only its registrations, while a retained root/ref handoff preserves its current eligible flight.

- Rapid selection retargets the same marker from its current geometry and uses the newest active panel. First placement and selection restored after an absent/removed active trigger place the marker immediately, never from an origin rectangle. Do not queue intermediate tabs or restart marker entry. Reorder/rename preserves trigger value identity rather than using index or label keys.
- Preserve the caller's mount/persistence policy, form values, focus management, activation mode and custom render. Animation must not remount a panel, force persistence or keep an outgoing interactive panel accessible.
- If the existing lifecycle provides no safe outgoing visual, the new panel enters alone. Closing an enclosing popup cancels subordinate panel motion rather than delaying the popup's exit.
- Unmount removes measurement/writers. Live reduced settles marker/shell geometry and panel travel before paint while permitted panel/changed-run opacity and eligible colour reconcile under their reduced contracts. None or zero clock settles one-shot presentation to the effective mode's current target. Positive clock edits follow each preset's capture-or-retime policy; returning to full does not replay the current selection.

## Geometry and performance

An activated panel that first commits a loading fallback is measured as that real fallback only.
When its content becomes ready, the same surviving panel/viewport may assess a new content-size
revision; it never borrows hidden content or the previous tab's measurement. A replaced panel host
starts at current native geometry. Suspense recovery alone does not replay selection, panel travel
or a marker origin; no number rolls from a loading label. Scrollbar/container constraints that change
the destination follow the shared immediate invalidation rule, including during panel height motion.

A scrolling TabsList keeps the marker in the same local content coordinate space as its triggers.
Do not subtract viewport rectangles and then apply the list's scroll offset again. Native focus-reveal
scrolling and page scrolling do not constitute a new active-value revision. A valid shared local path
may continue; a changed sticky/portal/transform mapping settles the affected list/marker projection
together at its current native destination. Preserve scroll position and use bounded owner-level
invalidation, not per-frame trigger reads. Marker and outgoing panel paint must not extend scrollable
overflow or introduce new snap targets; an unsafe decorative path uses immediate placement.

A natural Panel measurement must use its one real content tree or a supported destination supplied
by the existing owner. Do not mount inactive panels, render a second hidden form/editor, or clone
caller children to discover a target height. A safe outgoing display follows the
[paint-only retention contract](../../animation-system.md#33-presence-and-composition); unavailable
outgoing paint is omitted without changing keep-mounted semantics. Preserve any inactive original
panel's existing form/state behavior rather than altering it to make motion possible.

For a filled selected marker behind trigger text, `indicator.select` also follows the
[rendered-colour constraint](../../animation-system.md#35-colour-feedback). Verify label readability
over both track and moving fill, including immediately settled focused foreground and independently
timed marker colour. If that combination is unsafe or unknown, place the marker and affected known
paint immediately; unchanged labels do not fade or get duplicated to mask travel. An underline-only
marker with no label-background overlap retains its normal geometry eligibility. The fallback does
not cancel unrelated panel/text effects or change selection, focus or provider modes.

Measure active trigger bounds in list-local coordinates so ancestor transforms are not counted twice. Observe the list/active panel as needed, not every descendant. Passive/unknown list reflow settles marker geometry directly; a known trigger-content transaction follows the coordinated projection rule below. If a native layout or outer geometry owner already controls the active shell, do not add a second height animation. Constrain/clamp content height, avoid focus-ring clipping and preserve scroll positions within persisted panels.

When a panel owns size continuity, measure its natural content at destination inline-size and animate a separate bounded shell's block-size. The content does not rewrap every frame; surrounding layout follows that shell. This internal separation must preserve the actual Panel `render`, ref and caller mount policy. If activation replaces one independently sized Panel host with another, the new host starts at its final size; do not animate from zero or borrow an unrelated panel's stale measurement. Cross-panel height continuity requires a surviving explicitly composed viewport with one owner. A hidden/persisted panel is measured only after it becomes measurable; its unknown zero size is not a closing target. Panel travel and any nested layout transform use separate visual layers.

For a known trigger-label/quantity revision, the list geometry owner uses final untransformed trigger boxes and a separately sized strip host; individual display helpers do not add width springs. If a custom List render cannot preserve that separation, the list is externally constrained, or motion would shift a captured/focused trigger or hide its final label, commit that affected geometry immediately. Passive font/viewport/orientation changes also resolve directly. Marker placement and trigger reflow share list-local coordinates: neither samples the other's interpolated box or double-counts strip displacement. This list transaction is separate from the active panel's block-size owner.

When the active value is unchanged, derive the marker's current box from the list transaction's current reflow/size projection; do not start an independent layout.selection spring just because its final rectangle changed. The one marker writer follows that projection without per-frame DOM measurements. Only an actual active-value change starts the selection clock. If selection and list reflow happen together, the same writer combines the selection path with the list-local projection exactly once; it does not add displacement already included in either endpoint or retarget a spring from a measured moving rectangle each frame. If the adapter cannot maintain this relationship, the affected list and marker geometry settle together immediately. Sharing only a final snapshot or nominal start time is insufficient.

List-local coordinates include individual CSS translate/scale as well as a transform list. A marker
cannot count the same offset once in its measured endpoint and again in its animation channel. Where
the caller's composition cannot be converted safely, settle the affected list/marker transaction
without deleting caller transforms. Any temporary list/panel pixel dimensions return to their current
native layout policy when the size owner completes or yields.

## Acceptance scenarios

- Pending: activate an asynchronously resolving panel, switch away before resolution, then return;
  compare a surviving fallback host, a replaced host and preserved visible content. Only committed
  visible content participates, current labels/values start exactly, and no retired measurement can
  resize the active panel or replay selection. Cross a scrollbar/container breakpoint while content
  wraps and verify immediate native fallback without a repeated measurement/spring cycle.

- Pending: use sibling and nested Tabs with equal values under one provider. Change both, replace
  one root and deliver its old panel/marker completions. Each marker stays in its own list; native
  panel/focus policy and the other instance's in-flight work survive. Repeat with a none-mode inner
  scope without treating it as cancellation of an independent outer owner.

- Pending: select in an overflowing horizontal/RTL or vertical list while focus scrolls a trigger
  into view, then scroll a common ancestor and change a sticky/transform context. Check one local
  coordinate conversion, no fabricated selection replay and no extra scroll range from the marker
  or outgoing panel. Repeat under reduced/none and cancel mid-flight.

- Pending: switch between panels with named form controls, id-linked descriptions, an uncontrolled
  editor and a stateful child while height/content transitions are interrupted. Compare the original
  persistence policy: no extra form entries, duplicate ids, mount/ref effects, reset behavior or
  media instances may appear for measurement/exit. Unsafe retention falls back without remounting.

- Pending: move the filled marker under labels while theme/selected colours change and focus settles
  one trigger's foreground immediately; compare the underline variant and nested clocks. Intermediate
  text stays readable, or the affected placement/paint is immediate, with one marker/foreground owner
  and no replay of unchanged labels. Reduced/none keep final marker geometry and their own paint rules.

- Pending: combine a translated/scaled caller List with trigger reflow, then change that transform
  and the parent width while the marker moves. No stale coordinate conversion or temporary pixel lock
  survives; immediate fallback preserves selection, native focus and the caller's final transform.

- Pending: keyboard automatic and manual activation, rapid reverse selection, both orientations and list variants retain correct focus and marker position.
- Pending: switch panels containing forms and independently scrolling content under each caller mount policy; values and scroll positions remain consistent with that policy.
- Pending: change active content size or a trigger label during motion, including nested resizing parents; verify one owner per axis and stable unchanged text.
- Pending: verify all modes, live downgrade, zero clock, enclosing-popup close and initial SSR without panel replay.
- Pending: change a long trigger label/quantity while selecting, switch list variants and constrain the list width. Track/marker/trigger paint has separate owners; strip reflow and marker use one destination snapshot, with immediate geometry for a focused or unsafe custom-render target.
- Pending: keep the active value unchanged while an earlier trigger grows/reorders, then change selection during that reflow. Inspect intermediate marker attachment as well as final alignment; the marker uses the shared projection or the whole affected transaction settles immediately, with no second spring or doubled offset.
- Pending: remove/reorder the active trigger, clear then restore selection, and switch between separately mounted panels without a shared viewport; marker placement is immediate when no prior origin exists, and no panel grows from zero or loses persisted state.
- Pending: focus a trigger during simultaneous trigger/track/marker colour changes and invalidate an actual owner. The trigger and containing track settle all their declared paint; the independent marker may retain eligible colour without delaying focus or duplicating its geometry owner. A live reduction settles panel travel but retains permitted panel/changed-run opacity; none/zero leaves no presentation backlog.
