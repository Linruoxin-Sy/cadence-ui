# Sheet motion contract

Status: target design; implementation and verification pending.

A sheet enters from its configured edge as one panel. Edge travel explains its placement; content changes use bounded geometry without adding a drag interaction. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `sheet-content` owns edge presence and `sheet-overlay` owns backdrop opacity; initial descendants inherit entrance. |
| Size | Default on content-driven axes: top/bottom sheets own natural height; left/right sheets retain full-height and width constraints. Explicit owned dimension changes may resize; passive viewport changes are immediate. |
| Surface colour | Default: content/overlay own supplied background/border tokens; child controls retain their contracts. |
| Text colour | Default: `sheet-title` and `sheet-description` own foreground changes. |
| Changed text | Default for primitive title/description: retain unchanged graphemes. Rich body content uses composed owners. |
| Changed numbers | Composed: explicit numeric body readouts own rolling; titles and arbitrary body children are not parsed for quantities. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Open / content | Translate by the panel's own extent from `side`, plus opacity; no spring bounce. | Short opacity only. | Open geometry immediately. | `sheet.content.enter` → `presence.sheet` → `popup.anchored` |
| Close / content | Reverse edge travel with the shorter sheet-exit clock. | Short opacity only. | Closed target immediately. | `sheet.content.exit` → `presence.sheet-exit` → ending phase of `popup.anchored` |
| Open/close / overlay | Coordinated opacity, independent of panel translation. | Short opacity. | Target opacity immediately. | `sheet.overlay.enter` → `presence.surface` → `enter.pop`; `sheet.overlay.exit` → `presence.exit` → `exit.fade` |
| Intentional content/owned size change / shell | Clamped measured natural axis; full-height side sheets keep their scrollable fixed-height layout. | Final geometry immediately. | Final geometry immediately. | `sheet.content.resize` → `geometry.panel` → `geometry.resize` |
| Primitive title/description / text owner | Changed-run replacement, `stagger: none`. | Changed-run opacity only. | Final text immediately. | `sheet.title.change` → `text.replace` → target `text.change`; `sheet.description.change` → `text.replace` → target `text.change` |
| Supplied tokens / relevant parts | Scoped colour transition. | Short colour feedback. | Final colours immediately. | `sheet.surface.colour` → `state.color` → target `state.color` |
| Explicit composed quantity / its child owner | Roll changed places under that child's numeric contract; do not infer quantities from names, codes or rich content. | Final number immediately. | Final number immediately. | `sheet.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Base UI Dialog retains modal, dismissal, focus trap and return-focus behavior. `side` selects placement; motion does not add swipe handles or drag gestures.
- Reopen reverses current edge travel. An explicit side change while open places the new edge immediately before future transitions, avoiding a fly-through across the viewport.
- Close cancels resize/text work and exits one stable surface. Semantic changes and button actions never wait for the sheet to settle.
- Live reduced cancels travel/resize; none and zero clock cancel authored clocks and complete the current boundary through Base UI's actual exit protocol, without a timer hold or premature focus/modality release. Unmount releases measurement and local presentation resources. Native inputs/scrolling stay available in every mode.
- Async content received while closed supplies the next semantic view without offscreen size work. Reopen invalidates the old exit completion; a side change cancels an obsolete edge trajectory rather than reusing it against a new placement.

## Geometry and performance

- Edge translation uses the sheet's own width/height, not a fixed distance token. Positioning, translation and measured content axes have separate owners/properties.
- Measure one natural content region for applicable axes; viewport constraints and internal scrolling take precedence. Never animate viewport height on keyboard/resize events.
- Reflow content once at the final bounded width before measuring its height; animate only the applicable shell axis. Do not couple text rewrapping to every edge-travel or resize frame.
- One panel and overlay per sheet, with bounded changed-text groups. Preserve focus outlines, close-button reachability and portalled descendants when clipping the size-changing interior.

- Observe a natural-content region distinct from the sizing host and clamp each rendered dimension to valid non-negative intrinsic/closed/available bounds. Nested content and the panel choose one owner for the same size cause; the panel never observes a child's interpolated box as a fresh target.
- A destination-layout size animation must not newly crop required text, an active descendant or a focused control. Use existing legal scroll/overflow to keep them immediately reachable; otherwise settle that axis before paint. Do not add temporary truncation or hide required content to make the shell animate.

## Acceptance scenarios

- Pending: all four sides, top/bottom content growth, side-sheet scrolling, narrow viewport and soft-keyboard resize remain bounded.
- Pending: close during resize, reopen mid-exit and change side while open without stale trajectories or focus loss.
- Pending: verify inherited child entrance, all modes, live downgrade, zero clock and unchanged non-draggable API behavior.
- Pending: grow content around a focused field inside a constrained sheet and a nested disclosure, including async updates after close; required content remains reachable without two size owners or stale native completion.
