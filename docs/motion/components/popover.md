# Popover motion contract

Status: target design; implementation and verification pending.

The panel appears to belong to its anchor, then grows only when its owned content changes. Collision correction remains immediate and authoritative. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `popover-content` owns anchor-relative presence; header/title/description and initial children inherit it. |
| Size | Default: content shell owns natural width/height changes within positioning and viewport constraints. Base UI retains anchor placement. |
| Surface colour | Default: content owns background/border tokens; composed controls own their own state surfaces. |
| Text colour | Default: `popover-title`/`popover-description` own foreground changes; body children keep explicit owners. |
| Changed text | Default for primitive title/description: replace changed runs only. Rich content is composed, not recursively split. |
| Changed numbers | Default for a directly supplied supported numeric quantity in Title/Description: the owned display slot uses compact reels. Strings remain text; codes, dates and numeric identities are not parsed. Composed for body quantities inside rich children/render functions. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Open / content visual layer | Opacity and `distance.xs` approach along resolved side, using the anchor origin. | Short opacity only. | Final open surface immediately. | `popover.content.enter` → `presence.popup` → `popup.anchored` |
| Close / same visual layer | Opacity exit only, without moving the anchor. | Short opacity only. | Closed target immediately. | `popover.content.exit` → `presence.exit` → `exit.fade` |
| Intentional content change / shell | Measured, clamped natural width/height transition. | Final geometry immediately. | Final geometry immediately. | `popover.content.resize` → `geometry.compact` → `geometry.resize` |
| Collision flip/anchor movement / positioner | Placement corrects immediately; cancel obsolete approach direction. | Immediate. | Immediate. | `popover.position.place` → `engine.native` → Base UI Popover positioning (no new recipe) |
| Title/description change / text owner | Retain unchanged graphemes; `stagger: none`. | Changed-run opacity only. | Final text immediately. | `popover.title.change` → `text.replace` → target `text.change`; `popover.description.change` → `text.replace` → target `text.change` |
| Supplied tokens / surface/text parts | Scoped background/border/foreground transition. | Short colour feedback. | Final colours immediately. | `popover.surface.colour` → `state.color` → target `state.color` |
| Direct numeric Title/Description revision / owned slot, or explicit composed quantity / child owner | Roll changed places only; the same slot never also runs text replacement on its formatted digits. | Final number immediately. | Final number immediately. | `popover.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Base UI owns open state, positioning and focus. Typing/selection inside the popover is immediate; no child entrance delays readiness.
- Reopen reverses the existing boundary. During close, cancel local resize/text work and let only presence finish; new content is semantically current without a second entrance.
- If the anchor disappears, follow Base UI lifecycle rather than retaining a floating orphan. Repositioning during resize cancels obsolete geometry targets where they violate available space.
- Live reduced cancels spatial/size changes; none and zero clock settle placement, dimensions and content and complete the current exit through Base UI's actual protocol, without an animation timer hold or premature focus/modality release. Unmount releases observer and presence resources. Native input remains operable in every mode.
- Async content received while closed is current on the next open without replaying hidden updates. Collision flips, anchor removal or a new open revision invalidate obsolete direction/size/exit completions; caller `render`, refs and positioning defaults remain authoritative.

Dispatch a direct Title/Description string to the text owner and a supported direct numeric quantity to the numeric owner; changing renderer type establishes an immediate baseline. Rich children and formatting callbacks are composed, and screen-reader-only content updates immediately. Use one slot transaction under the popup's existing size owner and aggregate text/reel limits; no new counter prop, parser, countdown or inferred application state is added.

## Geometry and performance

- Separate Base UI positioner coordinates from panel visual transform and measured shell size. Never animate `sideOffset`/`alignOffset` or interpolate across a collision flip.
- One natural-content observer and shell writer. Clip only the size-changing interior; focus rings and descendant portals remain usable.
- Lay text at final target width, measure its natural height, then animate the shell around that final layout; no continuous rewrapping through intermediate widths. Passive font/viewport reflow settles immediately.
- One surface and bounded text transactions per open popover; nested controls inherit entrance and retain their own interaction owners.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

- Pending: resize content near each viewport edge while scrolling/moving the anchor; placement remains valid without diagonal fly-through.
- Pending: type into a composed input, close mid-update and reopen; focus/value stay native and only one panel is present.
- Pending: verify controlled/default open, all modes, live downgrade, zero clock and anchor removal cleanup.
- Pending: place a focused input and a separately resizing child in a small popover, then grow content and close/reopen with async data; no temporary label crop, double size spring or stale completion occurs.

- Pending: update a direct numeric Title/Description value, a numeric-looking string and rich quantity content separately; switch string/number types while open and close mid-roll. Verify one display owner, exact accessible/copyable output and no inferred numeric origin.
