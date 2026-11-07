# Pagination motion contract

Status: target design; implementation and verification pending.

Pagination makes the caller's current-page change visible while keeping every numbered link a stable destination. It does not implement paging, fetching or URL state. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names. Previous/Next use the actual pagination-link part with an internal text span, not separate data-slots.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "content": ["pagination#PaginationContent"],
    "active": ["pagination#PaginationLink"],
    "link": ["pagination#PaginationLink"],
    "item": ["pagination#PaginationItem", "pagination#PaginationEllipsis"],
    "label": ["pagination#PaginationLink", "pagination#PaginationPrevious", "pagination#PaginationNext"],
    "text": [
      "pagination#PaginationLink",
      "pagination#PaginationPrevious",
      "pagination#PaginationNext",
      "pagination#PaginationEllipsis"
    ]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                           | References                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Appearance      | default: pagination-content owns independent insertion and later visible-range membership changes; inherited under a parent entrance.                        | default: `pagination.content.enter`, `pagination.item.enter`, `pagination.item.exit` |
| Size            | default: content owns explicitly changed range/label geometry; individual link hit boxes retain their constraints; responsive hiding is immediate.           | default: `pagination.content.resize`                                                 |
| Surface colour  | default: PaginationLink active/hover/background/border targets; a single active indicator may own the active fill exclusively within one scope.              | default: `pagination.link.colour`                                                    |
| Text colour     | default: link and Previous/Next label foreground; ellipsis inherits its context colour.                                                                      | default: `pagination.text.colour`                                                    |
| Changed text    | default: plain textual link labels and the Previous/Next text props; rich link children use composition.                                                     | default: `pagination.label.replace`; composed: `@label`                              |
| Changed numbers | not applicable to page labels: each number identifies a destination and keeps that identity; a separate current/total quantity summary requires composition. | not-applicable: `@content`; composed: `@content`                                     |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                            | full                                                                                                        | reduced                                          | none                        | Binding → preset → recipe/form                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent insertion / pagination-content                                 | One opacity entrance.                                                                                       | Short opacity.                                   | Immediate.                  | `pagination.content.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                 |
| isActive changes / active visual within content                            | Move a single persistent active visual between known mounted links; otherwise use local colour feedback.    | Final active geometry immediately, short colour. | Immediate.                  | `pagination.active.move` → `layout.selection` → `layout.shared/selection`; `pagination.link.colour` → `state.color` → `state.color/surface`                                                                                                                                                |
| Visible range changes / stable links and content                           | Fade changed links/ellipsis; reflow retained destinations and bounded content size.                         | Geometry immediate; short opacity.               | Immediate.                  | `pagination.item.enter` → `presence.inline` → `data.transition/opacity`; `pagination.item.exit` → `presence.exit` → `exit.fade/opacity`; `pagination.item.move` → `layout.compact` → `layout.move/position`; `pagination.content.resize` → `geometry.compact` → `geometry.resize/measured` |
| Previous/Next or textual label changes / label                             | Changed-only replacement, stagger:none.                                                                     | Short changed-text opacity only.                 | Final label immediately.    | `pagination.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                   |
| Label/size variant changes visible link boxes / content layout coordinator | Resolve final constrained link boxes and animate owned content geometry once; no label helper width spring. | Final geometry immediately.                      | Final geometry immediately. | `pagination.content.resize` → `geometry.compact` → `geometry.resize/measured`; `pagination.item.move` → `layout.compact` → `layout.move/position`                                                                                                                                          |
| Hover/focus/theme or local active fallback / link foreground and surface   | Scoped colour feedback; the focus outline is immediately recognisable.                                      | Short colour feedback.                           | Final colours immediately.  | `pagination.link.colour` → `state.color` → `state.color/surface`; `pagination.text.colour` → `state.color` → `state.color/foreground`                                                                                                                                                      |

## Interruption and lifecycle

Latest isActive and href values commit immediately, including rapid navigation; no animation waits for a request. A missing or multiply active set uses each link's local state rather than inventing a unique selection. Exiting links lose obsolete interaction immediately and require retained parent lifecycle. Live reduced cancels indicator/layout work; none or zero clock cancels all visual work. Returning to full does not replay the current page selection.

The shared active decoration owns active fill/border exclusively while enabled; the link's local active fill is suppressed for that same cause, while focus and foreground retain their own property owners. If the target leaves the mounted range, becomes ambiguous or changes destination identity, cancel the shared flight before enabling local state. Navigation, modified clicks and URL changes remain native. Root removal releases measurement and active-indicator registrations.

## Geometry and performance

Measure mounted visible destinations once per range/selection revision. The active decoration never owns link dimensions or focus outlines. Numeric destination labels do not roll into another destination. Previous/Next labels preserve the existing responsive visibility and single-line link layout; an explicit copy change measures final label width without repeatedly wrapping. Passive breakpoint changes are immediate. Large page counts still render only the caller's visible range, not hidden measurement targets.

One final layout snapshot coordinates range reflow, text-driven dimensions and indicator destination; do not aim the indicator at an independently moving/interpolated rectangle. If a focused/captured link would drift or final-visible copy would be newly clipped, commit affected geometry immediately. Bound measuring/decoration to the visible range; over the shared list budget or without stable destination keys, use local colours and immediate layout. No additional controls, inferred page count or wrapping elements that violate ul/li/anchor semantics are introduced.

First active-marker placement and restoration after an absent/ambiguous active target are immediate. Reordering or resizing links without a semantic active-page change rebases the marker to final layout; it does not invent a selection journey. During a simultaneous actual selection and range change, move only when both source and destination are valid in the same coordinate scope; otherwise use the local active-colour fallback.

## Acceptance scenarios

Target acceptance; not executed: active page changes inside a stable range; ellipsis/range replacement; active target absent or multiple; keyboard anchor navigation; localized Previous/Next labels; breakpoint change; rapid updates, all modes and zero clock.

Also pending: resize localized Previous/Next text while the active target leaves the range, interrupt a shared-indicator flight with multiple active links, and modified-click a focused link; there is one active fill owner and immediate correct navigation.

Also pending: initialize or restore the active page after an empty/ambiguous range, and reflow labels without changing the page; no marker travels from an origin rectangle or treats passive layout as navigation.
