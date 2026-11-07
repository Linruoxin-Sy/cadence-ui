# Hover Card motion contract

Status: target design; implementation and verification pending.

A preview arrives as a coherent surface anchored to its trigger. Its richer contents can change size without replaying every avatar, line or action. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `hover-card-content` owns surface presence; arbitrary initial child content inherits it. |
| Size | Default: content shell owns intentional natural width/height changes within the positioner's available space. |
| Surface colour | Default: content owns background/border tokens; nested components retain their own surface owners. |
| Text colour | Default: the content popup's foreground token transitions and inherits to plain content; the logical root is not a new painted surface and explicitly styled children retain ownership. |
| Changed text | Default only for a primitive content string; rich preview children are composed with their own display owners. Hover Card has no title/description part to invent. |
| Changed numbers | Composed: explicit counts/statistics inside the preview may roll. No automatic number extraction from arbitrary content. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Base UI preview open / content | Opacity and `distance.xs` approach from the resolved anchor side. | Short opacity only. | Final surface immediately. | `hover-card.content.enter` → `presence.popup` → `popup.anchored` |
| Preview close / content | Opacity exit only; all children leave as one surface. | Short opacity only. | Closed target immediately. | `hover-card.content.exit` → `presence.exit` → `exit.fade` |
| Intentional preview content change / shell | Clamp and animate measured natural dimensions; no bounce. | Final geometry immediately. | Final geometry immediately. | `hover-card.content.resize` → `geometry.compact` → `geometry.resize` |
| Primitive content replacement / text owner | Changed-run replacement with `stagger: none`. Rich previews defer to their composed text owners. | Changed-run opacity only. | Final text immediately. | `hover-card.text.change` → `text.replace` → target `text.change` |
| Supplied tokens / content | Scoped background/border/foreground colour transition. | Short colour feedback. | Final colours immediately. | `hover-card.surface.colour` → `state.color` → target `state.color` |
| Anchor/collision change / positioner | Correct native placement immediately and cancel obsolete approach direction. | Same placement. | Same placement. | `hover-card.position.place` → `engine.native` → Base UI PreviewCard positioning (no new recipe) |
| Explicit composed quantity / its child owner | Roll changed places under that child's numeric contract; do not infer quantities from names, codes or rich content. | Final number immediately. | Final number immediately. | `hover-card.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Preserve Preview Card open/close delay, trigger/popup traversal and focus semantics. Animation does not introduce another hover timer or force focus into the preview.
- Return before close completion reverses the existing surface. Updating a preview never remounts it merely to replay presence.
- Closing cancels local geometry/text/numeric work. Anchor removal follows Base UI teardown; no retained interactive preview after semantic closure.
- Live reduced cancels approach and resizing; none/zero clock cancels presentation clocks and completes the current Base UI exit protocol with no added timer hold. Unmount disconnects measurement and composed-owner registrations. Existing trigger/popup pointer and focus operation stays available in every mode.
- Async preview content received while closed updates the next view without reopening or starting hidden size work. Reopen and collision/anchor changes invalidate stale exit/direction/size completions; a caller-controlled open value remains authoritative.

## Geometry and performance

- Base UI positioner owns placement; content visual layer owns approach/opacity; a single shell owner owns measured dimensions. Collision flips and passive asset/font/viewport changes are immediate.
- One content observer per open preview. Image dimensions should be reserved by the content owner; do not chase every image decoding frame with the shell.
- Text lays out at final target width before natural-height measurement. Animate the shell around that destination layout, not repeated intermediate text wrapping.
- Bound decoration to one panel and changed visible text/readouts under common budgets. Focusable descendants and portalled children stay outside decorative clipping.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

- Pending: move between trigger and preview while open/close transitions are active; existing interaction delays and focus behavior remain intact.
- Pending: replace a plain hint and update a rich preview with an image/count; only explicit owners animate and layout remains bounded.
- Pending: collision flips, anchor removal, all modes, live downgrade and zero-clock closure leave no orphan or stale measurement.
- Pending: a required preview label grows while a nested child resizes or an action has focus; the panel preserves immediate readability and one geometry owner, including async content after close.
