# Table of Contents motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

Toc separates reading feedback from navigation. The persistent rail indicator follows the active heading; only an explicit link activation may animate the document's real scroll position. The existing `Toc` API owns items, the label string, optional controlled active id and scroll offset, with `toc-track`, `toc-rail`, `toc-indicator` and link slots.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). These bindings do not create another scrolling API.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "indicator": ["toc#Toc"],
    "surface": ["toc#Toc"],
    "list": ["toc#Toc"],
    "link": ["toc#Toc"],
    "title": ["toc#Toc"]
  },
  "regions": {
    "indicator": ["toc-indicator"],
    "surface": ["toc"],
    "list": ["toc-list"],
    "link": ["toc-link"],
    "title": ["toc-title", "toc-link-text"]
  },
  "axes": { "list": ["height"] }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                           | References                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Appearance      | Default for a later inserted Toc surface when no parent owns the same entrance; the initial navigation is already visible. Passive heading activation does not replay it.                         | default: `toc.surface.enter`                     |
| Size            | Default for a known entries/title update that changes the owned list's block-size; otherwise native layout. Indicator extent belongs to selection geometry, not a second list resize.             | default: `toc.list.resize`                       |
| Surface colour  | Default for the track's own rail/indicator paint, which is the only surface Toc owns. An ordinary link keeps its transparent surface; a caller-supplied link surface stays on the native cascade. | default: `toc.indicator.colour`                  |
| Text colour     | Default: eligible active/hover links transition their foreground; a focused/invalid link owner's whole declared paint is immediate.                                                               | default: `toc.link.colour`                       |
| Changed text    | Default: owned string entry titles and the title label preserve unchanged graphemes. Entry identity is its id, not its text or array position.                                                    | default: `toc.title.replace`                     |
| Changed numbers | Not applicable to heading numbers/ids, which are text and navigation identity. A caller-added numeric badge is a composed capability, not inferred from titles.                                   | not-applicable: `@indicator`; composed: `@title` |

## Choreography and modes

| Trigger and owner                                 | Full                                                                                                                                                | Reduced                            | None                       | Binding → preset → recipe                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Active heading changes; persistent indicator      | Move/clamp its endpoint box in track-local coordinates to the active link; first placement or reappearance after no valid active link is immediate. | Destination immediately.           | Destination immediately.   | `toc.indicator.select` → `layout.selection` → `layout.shared/selection`                                                         |
| Later independent insertion; Toc surface          | Short opacity entry; no scroll effect.                                                                                                              | Short opacity.                     | Visible immediately.       | `toc.surface.enter` → `presence.inline` → `data.transition/opacity`                                                             |
| Known entries/label update; list shell            | Compact clamped block-size continuity; cancel an active scroll flight if this reflow invalidates its measured destination.                          | Final size immediately.            | Final size immediately.    | `toc.list.resize` → `geometry.compact` → `geometry.resize/measured`                                                             |
| Link state or owned title changes                 | Eligible scoped colour under the actual-region gate below; changed text runs without stagger.                                                       | Eligible short colour and opacity. | All immediately.           | `toc.link.colour` → `state.color` → `state.color/foreground`; `toc.title.replace` → `text.replace` → `text.change/changed-runs` |
| Rail/indicator token changes; internal rail paint | Scoped rule/indicator colour, independent of the selected-endpoint geometry.                                                                        | Short colour.                      | Final colours immediately. | `toc.indicator.colour` → `state.color` → `state.color/surface`                                                                  |

The `indicator.colour` binding covers only the track's rail/indicator paint hosted by Toc; link
foreground belongs to `link.colour`. A colour/theme revision alone cannot start navigation or replay
indicator travel. Static rail paint does not become a per-link background sweep.

Each link and the separate rail/indicator paint region follow the [shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership). DOM focus/focus-within or an owner's own invalid state cancels its colour clock and settles all its declared paint. Reading-active/hover state is not DOM focus; a focused link does not gate the separate nonfocusable rail/indicator or unrelated links, which may retain verified colour feedback.

### Document navigation

Explicit unmodified link activation still owns document navigation through the installed
`scroll.navigate` recipe (`scroll.navigate/one-shot`, `duration.page` + `ease.inOut`): measure the
destination once, clamp it to the real scroll host's range, and write native offsets from one tween.
It is implemented on the same `toc#Toc` surface and verified in the browser suite
(`tests/e2e/toc.spec.ts`), but it is deliberately not declared as a source-bound target action: the
six-capability target schema has no scroll property form, so no `formProperties` entry, source-bound
property recogniser or runtime receipt can describe a native scroll offset. Claiming it here would
require inventing a property name; the action therefore stays a retained, documented installed
behaviour rather than a target-declared row.

## Interruption and lifecycle

- Passive scrolling only selects the indicator; it must never invoke document navigation. Controlled `activeId` keeps its existing authority over tracking.
- The Toc's decorative visibility and an activated document navigation have distinct owners. Merely moving the mounted Toc offscreen or hiding its visual surface settles its indicator/list/text decoration; it does not cancel a valid flight already owned by the connected target and measured scroll host. Actual parent closure or unmount still cancels the flight, as do document hiding, print and forced colours; restoring Toc visibility cannot replay or restart it.
- A new explicit navigation cancels the previous scroll writer and measures a fresh destination. Wheel, touch, pointer or scrolling/navigation-key input immediately restores direct user control. Cancellation stops at the current scroll position: it never calls completion, snaps to the abandoned destination, or focuses the old heading. Modified/targeted/download links and caller-cancelled clicks keep native behaviour.
- Preserve history/hash, query state, scroll padding/margin and heading focus semantics. Final focus uses preventScroll and preserves/restores a caller's tabindex. A removed/replaced target, invalid scroll host, external history/hash change, parent close or unmount cancels the flight and temporary focus bookkeeping; it must not add another history entry or completion focus. An already committed activation hash follows the existing navigation policy and is not rolled back by animation.
- Only a still-active, uncancelled flight with the same connected target and valid measured geometry may finish immediately on live reduced/none or zero clock. Direct-input/target-removal cancellation wins over a same-frame mode change. Positive clock changes retime the active flight from its current offset. Returning to full cannot resume a cancelled journey or replay entry.

## Geometry and performance

The rail and link endpoints share the Toc list's local content coordinates, including a caller's
overflowing navigation container. Scrolling that container must not be mistaken for a changed active
heading or a document-navigation request. If endpoints share its content plane, preserve the valid
local path; otherwise settle an invalid mapping with one batched refresh. Rail paint adds no scroll
extent or snap target. Keep this decoration invalidation separate from the connected destination/
scroll-host authority of an already active `document.navigate` flight.

Read destination geometry once per explicit activation and clamp to the real scroll host's range, preserving its other scroll axis. Do not animate article transforms, pair native smooth scrolling with another clock, or read every heading on each animation frame. Indicator measurements are local to the track and active link; cached entry bounds refresh on relevant layout/content changes, not on every scroll tick. Passive font/layout changes update indicator geometry directly and cancel a navigation flight whose destination became stale; they never settle to the abandoned coordinate. Bound the animated set to one indicator and one scroll flight. Long entry lists retain native accessible links without per-frame all-heading measurement or mandatory list animation.

The shipped adapter follows that rule as follows: one `createSelectionProjection` owns the indicator's
`transform`; it commits a one-pixel-wide endpoint box clamped to the measured rail, so the
interpolation stays a transform on a fixed box instead of a width/height tween. A passive selection
change reads the cached link box and never measures the document. The list shell owns
`geometry.resize/measured` on its own `height` once per committed entries/label revision, so reading
never resizes the shell and a wrapped label change is not a new reading-selection spring. Entries lay
out at their final natural size; only the outer host height follows the shell.

For known list-size changes, lay natural entries out at destination inline-size and measure that region separately from the changing block-size host. Only surrounding layout follows the shell; link text does not continuously rewrap. Preserve rail/link focus outlines outside any temporary content clipping.

## Acceptance scenarios

Executed in the component suite (`tests/components/toc.test.tsx`), for full, reduced and none through
bounded scenes with exactly one host per owned slot:

- A later-inserted navigation runs `toc.surface.enter` on its own surface only; an already-visible
  initial navigation does not replay it, and passive reading never restarts it.
- Changing the active entry runs `toc.indicator.select` on the same indicator controller: the
  committed box moves inside the rail, and a live reduced/none commit is immediate on the same host.
- A committed entries/label revision runs `toc.list.resize` on the list's own height, keeps every
  retained link node, and replaces only changed label graphemes (`toc.title.replace`).
- Each link runs its own `toc.link.colour` foreground clock and the rail runs its own
  `toc.indicator.colour` surface clock; an unprovable caller palette settles that owner immediately.
- A live mode downgrade keeps one `data-motion` on every owned host and starts no animation.
- The `Changed numbers/@indicator` and `Changed numbers/@title` rows are verified as native
  boundaries on the real parts.

Document navigation, direct-input cancellation, history/hash and focus completion are exercised in a
real engine by `tests/e2e/toc.spec.ts` and the three-mode browser matrix, not by structural Markdown.

Deferred under ADR-023: a production build, real-device frame rate and CLS, RTL and wrapped-path
screenshots and any performance acceptance. `geometry.resize/measured` and `layout.shared/selection`
are proven here through their parameter form, revision and committed-target evidence; jsdom has no
layout, so the test supplies explicit native endpoints and their real interpolation is browser work
that remains unmeasured.
