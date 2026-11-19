# Pagination motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under [ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Pagination makes the caller's current-page change visible while keeping every numbered link a stable destination. It does not implement paging, fetching or URL state. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names. Previous/Next use the actual pagination-link part with an internal text span, not separate data-slots.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["pagination#PaginationContent"],
    "active": ["pagination#PaginationContent"],
    "link": ["pagination#PaginationLink"],
    "item": ["pagination#PaginationItem", "pagination#PaginationEllipsis"],
    "label": ["pagination#PaginationLink", "pagination#PaginationPrevious", "pagination#PaginationNext"]
  },
  "regions": {
    "content": ["pagination-content"],
    "active": ["pagination-active-indicator"],
    "link": ["pagination-link"],
    "item": ["pagination-item", "pagination-ellipsis"],
    "label": ["pagination-link-text"]
  },
  "axes": { "content": ["height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                           | References                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Appearance      | default: pagination-content owns independent insertion and later visible-range membership changes; inherited under a parent entrance.                        | default: `pagination.content.enter`, `pagination.item.enter`, `pagination.item.exit` |
| Size            | default: content owns explicitly changed range/label geometry; individual link hit boxes retain their constraints; responsive hiding is immediate.           | default: `pagination.content.resize`                                                 |
| Surface colour  | default: PaginationLink active/hover/background/border targets; a single active indicator may own the active fill exclusively within one scope.              | default: `pagination.link.colour`, `pagination.active.colour`                        |
| Text colour     | default: the link owns one surface/foreground controller; Previous/Next labels inherit that foreground and the ellipsis inherits its context.                | default: `pagination.link.colour`                                                    |
| Changed text    | default: plain textual link labels and the Previous/Next text props; rich link children use composition.                                                     | default: `pagination.label.replace`; composed: `@label`                              |
| Changed numbers | not applicable to page labels: each number identifies a destination and keeps that identity; a separate current/total quantity summary requires composition. | not-applicable: `@content`; composed: `@content`                                     |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                            | full                                                                                                                                                                                                                                               | reduced                                                                                  | none                        | Binding → preset → recipe/form                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent insertion / pagination-content                                 | One opacity entrance.                                                                                                                                                                                                                              | Short opacity.                                                                           | Immediate.                  | `pagination.content.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                 |
| isActive changes / active visual within content                            | Move a single active visual between known mounted links only on a readable path; otherwise place it immediately or use the declared local colour fallback.                                                                                         | Final active geometry immediately, short colour.                                         | Immediate.                  | `pagination.active.move` → `layout.selection` → `layout.shared/selection`; `pagination.link.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                     |
| Active decoration theme/semantic paint / persistent marker                 | Verified background/border colour on the active decoration only; link active fill remains suppressed. Geometry keeps its separate selection owner.                                                                                                 | Short colour on the independent decoration; final geometry immediately.                  | Final paint immediately.    | `pagination.active.colour` → `state.color` → `state.color/surface`                                                                                                                                                                                                                         |
| Visible range changes / stable links and content                           | Fade changed links/ellipsis; reflow retained destinations and bounded content size.                                                                                                                                                                | Geometry immediate; short opacity.                                                       | Immediate.                  | `pagination.item.enter` → `presence.inline` → `data.transition/opacity`; `pagination.item.exit` → `presence.exit` → `exit.fade/opacity`; `pagination.item.move` → `layout.compact` → `layout.move/position`; `pagination.content.resize` → `geometry.compact` → `geometry.resize/measured` |
| Previous/Next or textual label changes / label                             | Changed-only replacement, stagger:none.                                                                                                                                                                                                            | Short changed-text opacity only.                                                         | Final label immediately.    | `pagination.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                   |
| Label/size variant changes visible link boxes / content layout coordinator | Resolve final constrained link boxes and animate owned content geometry once; no label helper width spring.                                                                                                                                        | Final geometry immediately.                                                              | Final geometry immediately. | `pagination.content.resize` → `geometry.compact` → `geometry.resize/measured`; `pagination.item.move` → `layout.compact` → `layout.move/position`                                                                                                                                          |
| Hover/focus/theme or local active fallback / link foreground and surface   | Verified hover/theme/local-active colours follow the preset. DOM focus within a link or its own invalid state cancels that link owner's colour clock and settles its entire declared paint immediately; the native outline also remains immediate. | Focus/invalid-gated link paint is immediate; other verified colour feedback stays short. | Final colours immediately.  | `pagination.link.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                                                                                |

## Interruption and lifecycle

Two pagination controls for the same dataset remain separate visual scopes even when their hrefs
and active page match. A top-of-page marker cannot fly to the bottom-of-page control or borrow its
retained link rectangle. They may consume the same caller state, but each content owner resolves its
own bounded layout and marker lifetime; unmounting one does not remove the other's registrations.

Latest isActive and href values commit immediately, including rapid navigation; no animation waits for a request. A missing or multiply active set uses each link's local state rather than inventing a unique selection. Exiting links lose obsolete interaction immediately and require retained parent lifecycle. Live reduced cancels indicator/layout work; none or zero clock cancels all visual work. Returning to full does not replay the current page selection.

The shared active decoration owns active fill/border through `active.colour` exclusively while enabled; the link's local active fill is suppressed for that same cause, while focus and foreground retain their own property owners. If the target leaves the mounted range, becomes ambiguous or changes destination identity, cancel the shared flight and obsolete marker colour work before enabling local state. Navigation, modified clicks and URL changes remain native. Root removal releases measurement and active-indicator registrations.

The `link.colour` binding names one CSS colour controller on the PaginationLink anchor, owning surface and foreground properties as disjoint property owners inside that clock. Previous/Next labels inherit that foreground; their anchors carry the caller palette and start no second colour tween. The separate `active.colour` owner runs only on the active decoration, mutually exclusive with the link's local active fill/border for that cause.

## Geometry and performance

If the caller makes the visible range scrollable, measure links and active decoration in that same
content coordinate space. A common ancestor scroll preserves a valid local path; native focus scroll
does not create a page selection. A relative scroll/sticky/transform correction that invalidates the
mapping settles content/marker geometry together or uses the existing local-colour fallback. Never
reset scroll, navigate again or measure projected links every frame. Retained links and marker paint
must not enlarge the live range's scroll extent or supply stale anchor/snap targets.

The active decoration moves behind destination labels only when the
[rendered-colour constraint](../../animation-system.md#35-colour-feedback) remains valid over both
track and decoration. Include immediately settled focused link paint and independently changing
marker colours in that decision. If the path cannot stay readable, place the decoration immediately
or use the already declared local active-colour fallback, with mutually exclusive fill ownership.
Do not fade unchanged page labels, clone links or postpone `isActive`/navigation to hide an unsafe
frame. Reduced/none already use immediate marker geometry; any remaining colour feedback remains
subject to the same rendered-paint check.

Measure mounted visible destinations once per range/selection revision. The active decoration never owns link dimensions or focus outlines. Numeric destination labels do not roll into another destination. Previous/Next labels preserve the existing responsive visibility and single-line link layout; an explicit copy change measures final label width without repeatedly wrapping. Passive breakpoint changes are immediate. Large page counts still render only the caller's visible range, not hidden measurement targets.

One final layout snapshot coordinates range reflow, text-driven dimensions and indicator destination; do not aim the indicator at an independently moving/interpolated rectangle. If a focused/captured link would drift or final-visible copy would be newly clipped, commit affected geometry immediately. Bound measuring/decoration to the visible range; over the shared list budget or without stable destination keys, use local colours and immediate layout. No additional controls, inferred page count or wrapping elements that violate ul/li/anchor semantics are introduced.

First active-marker placement and restoration after an absent/ambiguous active target are immediate. Reordering or resizing links without a semantic active-page change does not start a selection journey: the single marker writer follows the content transaction's current item/size projection so it stays attached throughout reflow. It must not jump to a final rectangle while that active link is still visually elsewhere. During a simultaneous actual selection and range change, move only when both endpoints are valid in one coordinate scope and the same writer can combine selection with range projection exactly once. Otherwise settle the affected content/marker geometry together or use the local active-colour fallback, rather than run independently timed springs. No per-frame measurement of projected links is introduced.

## Acceptance scenarios

Executed in `tests/components/pagination.test.tsx` with explicit native layout fixtures, in full, reduced
and none: committed range insertion and later membership changes; a retain-and-remove destination; label
replacement on the link and on both Previous/Next text props; a single active-page change inside a stable
range with an independently owned decoration; active-target absence and an ambiguous pair; colour, focus
and theme paint on the link, label and decoration owners; zero-clock mode separation; two content scopes
with identical destinations and different active pages; and the native boundaries for numbers.

A caller-painted link (`className`/`style` colour, background, shadow or filter) keeps its rendered
palette: the content refuses the shared decoration for that scope and the link carries its own active
fill. A nested ellipsis follows its item instead of writing a second transform; only a direct child
projects. Navigation, modified clicks and URL changes stay native.

Deferred under ADR-023: a real browser matrix (first paint, per-frame cancellation, actual rendered colour
sampling, scrollable caller range), a production build and performance governance. `record.host` / action
evidence is Unit-level; no browser or real-device performance claim is made here.
