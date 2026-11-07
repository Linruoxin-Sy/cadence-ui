# Navigation Menu motion contract

Status: target design; implementation and verification pending.

Navigation Menu uses a shared popup surface that changes to accommodate the active item. Its content moves a small distance toward the newly selected navigation direction while the anchor and focus semantics remain stable. The actual composition includes Root/List/Item/Trigger/Content/Link/Indicator and Base UI Portal, Positioner, Popup and Viewport parts.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Bindings do not add public parts or props.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default: the popup owns initial open/final close; content switches inside it without replaying the whole popup. |
| Size | Default: one shared popup/viewport geometry owner follows Base UI's known destination width and height. Positioner coordinates remain the positioning engine's responsibility. |
| Surface colour | Default: trigger/link hover, active and disabled surfaces; popup surface inherits its semantic theme colour. |
| Text colour | Default: trigger/link states; descendant content inherits unless its own component owns another state. |
| Changed text | Default for direct plain trigger/link/content strings; rich menu content remains composed. An opening/switching content surface consumes same-cause initial text entry. |
| Changed numbers | Default for a supported direct quantity in an owned display part; composed for nested badge/count owners. Numeric-looking navigation labels, item values and route identifiers remain text. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| First open/final close; popup paint | Anchored surface entry/exit using the actual transform origin; positioner stays authoritative. | Short opacity only. | Immediate visibility. | `navigation-menu.popup.enter` → `presence.menu` → `popup.anchored`; `navigation-menu.popup.exit` → `presence.exit` → `exit.fade` |
| Active item changes; shared viewport | Clamped width and height follow the latest destination, without bounce. | Destination dimensions immediately. | Destination dimensions immediately. | `navigation-menu.viewport.resize` → `geometry.panel` → `geometry.resize` |
| Active item changes; content paint | Opacity with `distance.xs` travel based on actual item order and writing direction. Unknown or simultaneously reordered direction uses opacity only. | Short opacity only. | Active content immediately. | `navigation-menu.content.change` → `content.switch` → local transform/opacity form of `data.transition` |
| Open state; existing trigger chevron | Local open/closed orientation change, separate from popup geometry and any primitive-positioned indicator. | Final orientation with optional short opacity. | Final state immediately. | `navigation-menu.indicator.change` → `state.indicator` → `state.morph` |
| Trigger/link state; owned plain label changes | Scoped colour; changed label graphemes only, with no stagger. | Short colour and changed-run opacity only. | Both immediately. | `navigation-menu.item.colour` → `state.color` → planned `state.color`; `navigation-menu.label.replace` → `text.replace` → planned `text.change` |
| Direct displayed quantity changes | Roll changed places only; share any content-size cause with the viewport host. | Final quantity/size immediately. | Final quantity/size immediately. | `navigation-menu.value.change` → `number.compact` → `number.roll` |

## Interruption and lifecycle

- Pointer movement across triggers retargets the shared surface; it does not queue panel exits. A close/reopen interrupts from the current surface state with the latest active content.
- Base UI continues to own hover intent, dismiss timing, focus guards, portal lifecycle and keyboard navigation. No animation timer delays selection, navigation or focus restoration.
- First opening runs popup presence only; switching an already open item runs content.switch only. Do not multiply popup and content opacity/transform effects for the same cause. NavigationMenuIndicator keeps its actual Base UI Icon role/placement; it is not a fabricated moving selection marker.
- Outgoing content is visual-only if safely retained by the primitive; it cannot remain an active menu. Closing the root cancels content switches before releasing retained visuals.
- Unmount, live reduced/none and zero clock cancel every geometry/content writer; anchored placement resolves immediately. Returning to full does not reopen or replay the menu.

## Geometry and performance

Resolve target dimensions from the actual viewport and constrain them to available width/height. Select one shell for each axis; do not animate both popup and viewport toward the same size independently. Anchor collision/viewport changes use Base UI's immediate positioning, not a second position tween. Clip the content transition inside the surface without clipping focus rings, pointer corridors or nested portals. Measure only the active/destination content and retain at most the immediately outgoing visual; no whole-menu layout scan per pointer event.

The natural destination content lays out at its final constrained width before measuring height. A separate shared surface host animates width/height around that content; text does not continuously wrap as the surface changes. Content-switch travel belongs to a visual layer inside that host, never the Positioner or the same transform used for popup entry. When the primitive supplies destination dimensions, consume those measurements rather than observing the interpolated popup box. Supplied custom content that cannot preserve this separation takes immediate native geometry. Destination content exceeding available height uses the actual viewport's scrolling; no hidden copy of the whole menu is measured.

## Acceptance scenarios

- Pending: move rapidly between differently sized items, reverse direction, leave and reopen during resize; only the latest panel remains interactive.
- Pending: test keyboard focus, nested links, RTL, custom render and viewport collision near each edge.
- Pending: verify one size owner and stable anchors during nested content changes and passive viewport resize.
- Pending: verify SSR, all modes, live downgrade, zero clock and unmount with no orphaned portal or retained focus target.
- Pending: open the first item, switch an already open item, reorder/remove the active item, and update direct text/quantities. Confirm distinct presence/switch causes, no duplicated transform owner, and immediate native scroll/focus for a tall destination.
