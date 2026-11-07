# Tooltip motion contract

Status: target design; implementation and verification pending.

A tooltip reveals a short hint promptly, preserving the provider's existing delay semantics and the trigger's accessible relationship. It should not become a second animated reading surface. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "content": ["tooltip#TooltipContent"],
    "text": ["tooltip#TooltipContent"],
    "surface": ["tooltip#TooltipContent"],
    "position": ["tooltip#TooltipContent"],
    "quantity": ["tooltip#TooltipContent"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                               | References                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Appearance      | Default: `tooltip-content` owns one short presence effect, including its arrow. Provider/trigger are structural and keep their own appearance owner.                                                                                                                | default: `tooltip.content.enter`, `tooltip.content.exit`  |
| Size            | Default: content shell owns changed hint width/height within its max width; placement remains with Base UI.                                                                                                                                                         | default: `tooltip.content.resize`                         |
| Surface colour  | Default: popup and arrow share one background/fill token transition, preventing an unmatched arrow.                                                                                                                                                                 | default: `tooltip.surface.colour`                         |
| Text colour     | Default: content foreground changes as one scoped token.                                                                                                                                                                                                            | default: `tooltip.surface.colour`                         |
| Changed text    | Default for a primitive hint string: changed runs only, with immediate accessible description. Rich children require explicit composed ownership.                                                                                                                   | default: `tooltip.text.change`; composed: `@text`         |
| Changed numbers | Default for a directly supplied supported numeric quantity in Content: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for rich hint quantities inside rich children/render functions. | default: `tooltip.quantity.change`; composed: `@quantity` |

## Choreography and modes

| Trigger / owner                                                                           | Full                                                                                              | Reduced                     | None                                                     | Binding → preset → recipe/form                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Base UI opens after its configured delay / content                                        | Short opacity entrance; no travel or per-character entrance.                                      | Short opacity.              | Open presentation immediately when semantic open occurs. | `tooltip.content.enter` → `presence.tooltip` → `popup.anchored/opacity-enter`                                       |
| Semantic close / content                                                                  | Same short opacity departure, using the ending phase of the tooltip's existing popup owner.       | Short opacity.              | Closed presentation immediately.                         | `tooltip.content.exit` → `presence.tooltip` → `popup.anchored/opacity-exit`                                         |
| Visible hint change / content shell                                                       | Bounded measured width/height transition; positioning correction remains immediate.               | Final geometry immediately. | Final geometry immediately.                              | `tooltip.content.resize` → `geometry.compact` → `geometry.resize/measured`                                          |
| Primitive hint update / text presentation                                                 | Stable-grapheme replacement with `stagger: none`; no replay of unchanged words.                   | Changed-run opacity only.   | Final hint immediately.                                  | `tooltip.text.change` → `text.replace` → `text.change/changed-runs`                                                 |
| Token change / popup, arrow, foreground                                                   | Coordinated scoped colour transition.                                                             | Short colour feedback.      | Final colours immediately.                               | `tooltip.surface.colour` → `state.color` → `state.color/surface-foreground`                                         |
| Anchor/collision change / positioner and arrow                                            | Correct native placement immediately; no arrow/coordinate tween or cross-trigger flight.          | Same placement.             | Same placement.                                          | `tooltip.position.place` → `engine.native` → `native/base-ui-tooltip` (Base UI Tooltip positioning (no new recipe)) |
| Direct numeric Content revision / owned slot, or explicit composed quantity / child owner | Roll changed places only; the same slot never also runs text replacement on its formatted digits. | Final number immediately.   | Final number immediately.                                | `tooltip.quantity.change` → `number.compact` → `number.roll/reels`                                                  |

## Interruption and lifecycle

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

- Pending: preserve configured provider delay, focus/pointer behavior and existing description linkage in every mode.
- Pending: update part of a visible hint near a collision boundary; unchanged text remains stable and arrow/placement remain attached.
- Pending: rapid open/close, live downgrade, zero clock, removed trigger and reduced-mode geometry cancellation leave no stale tooltip.
- Pending: replace a short hint with a long required description inside constrained placement; it is readable immediately without new truncation, and a composed numeric quantity follows its own child contract without turning shortcut digits into a counter.

- Pending: update a direct numeric Content value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
