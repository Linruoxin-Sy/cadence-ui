# Context Menu motion contract

Status: target design; implementation and verification pending.

A context menu belongs to the current invocation location. A new right-click or keyboard invocation creates the new anchored presentation immediately, without flying the previous menu across the screen. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `context-menu-content` owns invocation-relative presence; `context-menu-sub-content` owns its row-anchored presence. Rows inherit their panel entrance. |
| Size | Default: each content shell owns intentional menu width/height changes; Base UI owns pointer/focused-element origin and collision placement. |
| Surface colour | Default: popup, item and sub-trigger surfaces own background/border/highlight state. Trigger content is caller-owned. |
| Text colour | Default: owned item/label/shortcut foreground transitions follow destructive, disabled and pointer-highlight state. |
| Changed text | Default for plain item/label/shortcut strings; retain unchanged graphemes. Rich labels are composed without rewriting caller markup. |
| Changed numbers | Composed: explicit quantities can roll; action keys, shortcuts and numeric-looking labels are not parsed as counters. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Invocation / root content | Place at native origin immediately, then opacity entrance with optional `distance.xs` side approach. | Short opacity only. | Open target immediately. | `context-menu.content.enter` → `presence.menu` → `popup.anchored` |
| Submenu open / sub-content | Local anchor-relative opacity/side approach; parent stays fixed. | Short opacity only. | Open target immediately. | `context-menu.sub-content.enter` → `presence.menu` → `popup.anchored` |
| Branch close / corresponding content | Opacity exit only, no stagger. | Short opacity. | Closed target immediately. | `context-menu.content.exit` → `presence.exit` → `exit.fade`; `context-menu.sub-content.exit` → `presence.exit` → `exit.fade` |
| New invocation or collision / Base UI positioner | Cancel old approach and place at the new valid origin; no cross-screen interpolation. | Immediate. | Immediate. | `context-menu.position.place` → `engine.native` → Base UI ContextMenu positioning (no new recipe) |
| Pointer state / item | Scoped surface/foreground transition; keyboard highlight is immediate. | Short colour feedback; keyboard immediate. | Final state immediately. | `context-menu.item.colour` → `state.color` → target `state.color` |
| Supplied tokens/disabled/destructive state / popup, label, shortcut and item owners | Scoped surface/border/foreground colour with one writer per property. | Short colour. | Final colours immediately. | `context-menu.surface.colour` → `state.color` → target `state.color` |
| Checkbox/radio change / item indicator | Local opacity/`scale.in` marker feedback with immediate semantic checked state. | Opacity only. | Final marks immediately. | `context-menu.indicator.select` → `state.indicator` → `state.morph` |
| Structure/text change / shell and text owners | Measured clamped size; changed plain text runs use `stagger: none`. | Geometry immediate; changed-run opacity only. | Final geometry/text immediately. | `context-menu.content.resize` → `geometry.compact` → `geometry.resize`; `context-menu.label.change` → `text.replace` → target `text.change` |
| Explicit composed quantity / child owner | Roll changed places without parsing action identities or shortcuts as numbers. | Final number immediately. | Final number immediately. | `context-menu.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Keep pointer invocation, keyboard Context Menu/Shift+F10, focus, Tab/Escape and close behavior exactly under Base UI. Opening animation never delays action availability.
- Reinvoking elsewhere invalidates old origin captures and exit completions. Reopening at the same location may reverse current opacity, but never preserve stale item semantics.
- Closing cancels text/resize/selection work in that branch. Root removal invalidates submenu owners before their callbacks can restore a panel.
- Live reduced cancels approach, scale and size; none/zero clock settles authored presentation and completes the current branch through Base UI's actual native exit protocol. Native invocation, keyboard navigation, actions and scrolling remain available. Unmount releases observations and origin references.
- Async content received while closed establishes the next menu without starting hidden animation. A controlled state request is not a committed selection/open revision; new accepted invocation/selection targets invalidate all obsolete completion callbacks.

## Geometry and performance

- Native positioner owns pointer/focused-element coordinates. One measured shell per open branch owns natural dimensions, with destination-width text layout before height measurement.
- Passive viewport/font changes and collision correction are immediate. A menu near an edge may shrink to available space and scroll without a geometry overshoot.
- Bound work to visible open branches; no trigger-descendant scanning, per-item observers or row-entry stagger. Submenu portals and focus outlines stay outside decorative clipping.
- The natural content region is separate from each size host; clamp to valid non-negative dimensions. Preserve existing legal scroll/overflow so required labels and focused/active items remain readable immediately, or settle that axis rather than adding temporary truncation. Parent branches consume nested committed dimensions without chasing intermediate child geometry.

## Acceptance scenarios

- Pending: right-click widely separated points during entry/exit, then use keyboard invocation; the menu appears only at the current valid origin.
- Pending: nested selection, label updates, disabled/removing items, edge collisions and branch closure preserve native action/focus behavior.
- Pending: all modes, live downgrade, zero clock and unmount during a reinvocation leave no stale origin or submenu.
- Pending: update a long action label near an edge while focus moves to it, then deliver async data after dismissal and reinvoke elsewhere; immediate readability and current native lifecycle ownership win over old geometry callbacks.
