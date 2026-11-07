# Table of Contents motion contract

Status: target design; implementation and verification pending.

Toc separates reading feedback from navigation. The persistent rail indicator follows the active heading; only an explicit link activation may animate the document's real scroll position. The existing `Toc` API owns items, the label string, optional controlled active id and scroll offset, with `toc-track`, `toc-rail`, `toc-indicator` and link slots.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). These bindings do not create another scrolling API.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default for a later inserted Toc surface when no parent owns the same entrance; the initial navigation is already visible. Passive heading activation does not replay it. |
| Size | Default for a known entries/title update that changes the owned list's block-size; otherwise native layout. Indicator extent belongs to selection geometry, not a second list resize. |
| Surface colour | Default only where a link defines a state surface; rail/indicator use their existing semantic colours. No new item backgrounds are required. |
| Text colour | Default: active/hover links transition foreground; focus indication remains immediate. |
| Changed text | Default: owned string entry titles and the title label preserve unchanged graphemes. Entry identity is its id, not its text or array position. |
| Changed numbers | Not applicable to heading numbers/ids, which are text and navigation identity. A caller-added numeric badge is a composed capability, not inferred from titles. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| Active heading changes; persistent indicator | Move/clamp its endpoints in track-local coordinates to the active link; first placement or reappearance after no valid active link is immediate. | Destination immediately. | Destination immediately. | `toc.indicator.select` → `layout.selection` → `layout.shared` |
| Explicit unmodified link activation; native scroll host | Navigate to the measured, clamped destination with one scroll writer. | Destination immediately. | Destination immediately. | `toc.document.navigate` → `scroll.navigate` → `scroll.navigate` |
| Later independent insertion; Toc surface | Short opacity entry; no scroll effect. | Short opacity. | Visible immediately. | `toc.surface.enter` → `presence.inline` → one-shot `data.transition` |
| Known entries/label update; list shell | Compact clamped block-size continuity; cancel an active scroll flight if this reflow invalidates its measured destination. | Final size immediately. | Final size immediately. | `toc.list.resize` → `geometry.compact` → `geometry.resize` |
| Link state or owned title changes | Scoped colour and changed text runs without stagger. | Short colour and changed-run opacity. | All immediately. | `toc.link.colour` → `state.color` → planned `state.color`; `toc.title.replace` → `text.replace` → planned `text.change` |

## Interruption and lifecycle

- Passive scrolling only selects the indicator; it must never invoke document navigation. Controlled `activeId` keeps its existing authority over tracking.
- A new explicit navigation cancels the previous scroll writer and measures a fresh destination. Wheel, touch, pointer or scrolling/navigation-key input immediately restores direct user control. Cancellation stops at the current scroll position: it never calls completion, snaps to the abandoned destination, or focuses the old heading. Modified/targeted/download links and caller-cancelled clicks keep native behaviour.
- Preserve history/hash, query state, scroll padding/margin and heading focus semantics. Final focus uses preventScroll and preserves/restores a caller's tabindex. A removed/replaced target, invalid scroll host, external history/hash change, parent close or unmount cancels the flight and temporary focus bookkeeping; it must not add another history entry or completion focus. An already committed activation hash follows the existing navigation policy and is not rolled back by animation.
- Only a still-active, uncancelled flight with the same connected target and valid measured geometry may finish immediately on live reduced/none or zero clock. Direct-input/target-removal cancellation wins over a same-frame mode change. Positive clock changes retime the active flight from its current offset. Returning to full cannot resume a cancelled journey or replay entry.

## Geometry and performance

Read destination geometry once per explicit activation and clamp to the real scroll host's range, preserving its other scroll axis. Do not animate article transforms, pair native smooth scrolling with another clock, or read every heading on each animation frame. Indicator measurements are local to the track and active link; cached entry bounds refresh on relevant layout/content changes, not on every scroll tick. Passive font/layout changes update indicator geometry directly and cancel a navigation flight whose destination became stale; they never settle to the abandoned coordinate. Bound the animated set to one indicator and one scroll flight. Long entry lists retain native accessible links without per-frame all-heading measurement or mandatory list animation.

For known list-size changes, lay natural entries out at destination inline-size and measure that region separately from the changing block-size host. Only surrounding layout follows the shell; link text does not continuously rewrap. Preserve rail/link focus outlines outside any temporary content clipping.

## Acceptance scenarios

- Pending: scroll manually across headings and verify that only the rail/foreground change; controlled active id does not start scrolling.
- Pending: navigate twice rapidly, interrupt with every direct input path, and use history/hash navigation; no delayed writer steals control.
- Pending: change a title, remove an active entry/target and resize the host mid-navigation; geometry, final focus and text identity remain correct.
- Pending: verify SSR, all modes, zero clock, live downgrade and unmount with no scroll or observer work left behind.
- Pending: interrupt a flight and change mode in the same frame; remove/recreate a heading with the same id; resize a nested scroll host; preserve horizontal offset and caller tabindex. No cancelled completion may snap, focus, restore stale state or create extra history.
