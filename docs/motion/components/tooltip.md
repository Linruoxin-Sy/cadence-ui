# Tooltip motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

A tooltip reveals a short hint promptly, preserving the provider's existing delay semantics and the trigger's accessible relationship. It should not become a second animated reading surface. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["tooltip#TooltipContent"],
    "text": ["tooltip#TooltipContent"],
    "surface": ["tooltip#TooltipContent"],
    "position": ["tooltip#TooltipContent"],
    "quantity": ["tooltip#TooltipContent"]
  },
  "regions": {
    "content": ["tooltip-content"],
    "surface": ["tooltip-content"],
    "position": ["tooltip-positioner"],
    "text": ["tooltip-text"],
    "quantity": ["tooltip-number"]
  },
  "axes": { "content": ["width", "height"] }
}
```

`tooltip-positioner` and the two display regions are internal host markers of `TooltipContent`; they add no
export, prop or public `data-slot`. Base UI's positioner is the placement owner, and the display regions are the
actual spans that carry a primitive hint string or a directly supplied numeric quantity.

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                               | References                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Appearance      | Default: `tooltip-content` owns one opacity-only presence effect, and the arrow is its child so it fades with the same surface. Provider/trigger are structural and keep their own appearance owner.                                                                | default: `tooltip.content.enter`, `tooltip.content.exit` |
| Size            | Default: content shell owns changed hint width/height within its max width; placement remains with Base UI.                                                                                                                                                         | default: `tooltip.content.resize`                        |
| Surface colour  | Default: the hint surface owns one scoped background transition, and the arrow inherits that surface paint instead of running a second writer, so no token change can leave it unmatched.                                                                           | default: `tooltip.surface.colour`                        |
| Text colour     | Default: content foreground changes as one scoped token.                                                                                                                                                                                                            | default: `tooltip.surface.colour`                        |
| Changed text    | Default for a primitive hint string: changed runs only, with immediate accessible description. Rich children keep their own identity inside the content region, which runs no text writer of its own.                                                               | default: `tooltip.text.change`; composed: `@content`     |
| Changed numbers | Default for a directly supplied supported numeric quantity in Content: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for rich hint quantities inside rich children/render functions. | default: `tooltip.quantity.change`; composed: `@content` |

## Choreography and modes

| Trigger / owner                                                                           | Full                                                                                              | Reduced                     | None                                                     | Binding → preset → recipe/form                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Base UI opens after its configured delay / content                                        | Short opacity entrance; no travel or per-character entrance.                                      | Short opacity.              | Open presentation immediately when semantic open occurs. | `tooltip.content.enter` → `presence.tooltip` → `popup.anchored/opacity-enter`                                       |
| Semantic close / content                                                                  | Same short opacity departure on the same channel; no second ending recipe is borrowed.            | Short opacity.              | Closed presentation immediately.                         | `tooltip.content.exit` → `presence.tooltip` → `popup.anchored/opacity-exit`                                         |
| Visible hint change / content shell                                                       | Bounded measured width/height transition; positioning correction remains immediate.               | Final geometry immediately. | Final geometry immediately.                              | `tooltip.content.resize` → `geometry.compact` → `geometry.resize/measured`                                          |
| Primitive hint update / text presentation                                                 | Stable-grapheme replacement with `stagger: none`; no replay of unchanged words.                   | Changed-run opacity only.   | Final hint immediately.                                  | `tooltip.text.change` → `text.replace` → `text.change/changed-runs`                                                 |
| Token change / hint surface and foreground                                                | Scoped colour transition on the hint surface; the arrow inherits that paint.                      | Short colour feedback.      | Final colours immediately.                               | `tooltip.surface.colour` → `state.color` → `state.color/surface-foreground`                                         |
| Anchor/collision change / positioner and arrow                                            | Correct native placement immediately; no arrow/coordinate tween or cross-trigger flight.          | Same placement.             | Same placement.                                          | `tooltip.position.place` → `engine.native` → `native/base-ui-tooltip` (Base UI Tooltip positioning (no new recipe)) |
| Direct numeric Content revision / owned slot, or explicit composed quantity / child owner | Roll changed places only; the same slot never also runs text replacement on its formatted digits. | Final number immediately.   | Final number immediately.                                | `tooltip.quantity.change` → `number.compact` → `number.roll/reels`                                                  |

## Interruption and lifecycle

Each Tooltip presence owner keeps its native lifecycle even when another tooltip uses the same
description and provider delay. Its exit cannot wait solely for `transitionend`: identical resolved
opacity, a safe-owner fallback or cancellation before the first frame may leave no owned transition.
The hint writes opacity through the platform animation API, so the primitive's own completion path
observes that animation and decides when the portal node leaves; Cadence never forces removal under a
retained native policy, and unrelated child events and an earlier open revision cannot complete the
current tooltip.

When an existing shared/caller composition reuses Content for a different trigger or hint entity,
retire the old text/reel transaction and establish the new exact display baseline in every mode.
Use the already known trigger/entity identity; matching text, a reused Content node or two numeric
values do not authorize cross-trigger replacement or rolling. A rename/value revision for the same
hint keeps its normal eligibility. Passive movement of that same anchor is a placement revision,
not a new hint identity. Do not add a trigger registry or remount the popup to enforce this rule.

Focusing the trigger is outside the tooltip's content envelope and does not cancel its short hint fade or introduce autofocus into the tooltip. Preserve its existing description relationship and noninteractive role. If browser find or another supported interaction requires the hint itself to be presented immediately, settle the relevant opacity envelope instead of postponing that interaction.

- Provider delay/open policy remains unchanged; it is interaction behavior, not an added animation delay. None/zero clock introduce no presentation delay after the semantic open/close event.
- Rapid trigger leave/re-enter reverses the same presentation when Base UI keeps it open. Switching target does not slide one tooltip through other controls.
- Close cancels text and resize work. The visible tooltip remains one accessible description; outgoing decorative characters are never separately announced.
- Live reduced removes geometry motion; none/zero clock cancel presentation writers and complete the current Base UI exit protocol without waiting for a presentation timer. Its configured intent delays remain unchanged. Unmount or trigger removal clears measurements and local work.
- Async hints arriving while closed do not animate offscreen or reopen the tooltip. Reopen/target changes invalidate obsolete exit completions. Native trigger focus/pointer behaviour and its current accessible description remain functional in reduced/none.

Dispatch a direct Content string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich children and formatting callbacks are composed, and screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- Base UI owns anchor placement and arrow location; content owns only its natural size and opacity. Collision flips and passive viewport/font changes settle immediately.
- One measurement for the entire hint, one changed-text transaction, and no per-letter observer or stagger. Long/rich hints fall back to safe static content under the shared text budget.
- Reflow the hint at its final constrained width once, measure the final height, then animate the host; do not repeatedly wrap a short hint during width interpolation.
- Keep text readable and arrow attached while the shell changes. Do not add interactive content behavior, timers or focus capture.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

Unit evidence covers these against real mounted parts in all three modes; the browser matrix, live
OS-preference switching in a real engine and the production build remain deferred under ADR-023.

- Close before the first animation frame, use a caller override that makes the owned opacity endpoints
  equal, and cancel during an exit. Native visibility/completion with no end event still ends the hint;
  an unrelated child event and an old exit completion cannot terminate a newer tooltip. Configured
  intent delay and the retained mount policy are unchanged, and no second tooltip's lifecycle is affected.
- Reuse an open Content node for two known trigger identities with equal, partially shared and numeric
  hints. The second hint starts at its exact baseline; old completions cannot restore the first hint.
  Then update the same hint and move its anchor separately: content retains ordinary changed-only
  eligibility and placement stays native, without ref churn being treated as identity.
- Preserve configured provider delay, focus/pointer behavior and the existing description linkage in every mode.
- Update part of a visible hint near a collision boundary; unchanged text stays stable and the arrow
  remains attached to the untouched placement.
- Rapid open/close, live downgrade, zero clock, removed trigger and reduced-mode geometry cancellation
  leave no stale tooltip.
- Replace a short hint with a long required description inside constrained placement; it is readable
  immediately without new truncation, and a composed numeric quantity follows its own child contract
  without turning shortcut digits into a counter.
- Update a direct numeric Content value, a numeric-looking string and rich quantity content separately;
  switch string/number types while open and close mid-roll. One display owner keeps the accessible and
  copyable output exact, with no inferred numeric origin.
