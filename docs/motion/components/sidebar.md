# Sidebar motion contract

Status: target design; implementation and verification pending.

Sidebar preserves spatial orientation while changing how much navigation is exposed. Offcanvas mode moves the existing desktop container; icon mode changes the occupied width and reveals labels only when space is usable. Mobile delegates to its existing Sheet composition. Route changes do not replay the sidebar.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This covers the current provider, sidebar, trigger, rail, inset, group/menu/submenu and related parts; it adds no navigation or persistence API.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default: desktop offcanvas visibility belongs to the container; mobile appearance is inherited from Sheet. Initial rendered navigation is visible in its semantic state. |
| Size | Default for an explicit desktop collapse/expand: one coordinator owns the sidebar container and layout-gap destination. `collapsible="none"` and passive responsive changes stay native/immediate. |
| Surface colour | Default: menu button/action, rail and group action state surfaces. Nested Button/Input/Sheet surfaces inherit their component contracts. |
| Text colour | Default: active/hover/disabled menu foreground; labels inherit group state without parallel colour transitions. |
| Changed text | Default for owned plain group/menu labels; caller rich labels and native sidebar-input edits remain untouched. |
| Changed numbers | Default for a plain numeric `SidebarMenuBadge`; formatted/rich badges require an explicit composed numeric owner. Digit-containing menu names are text. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| Desktop offcanvas open state; container and gap coordinator | Side-aware container translation is projected from the same clamped gap progress; one scalar/transaction preserves matching visible and occupied space. | Final position/gap immediately. | Final position/gap immediately. | `sidebar.container.offcanvas` → `layout.sidebar` → coordinated projection form of `layout.move`; `sidebar.gap.resize` → `geometry.compact` → `geometry.resize` |
| Desktop icon collapse; occupied-width coordinator | Clamped width transition to actual expanded/icon geometry. | Final widths immediately. | Final widths immediately. | `sidebar.container.resize` → `geometry.compact` → `geometry.resize` |
| Icon collapse/expand; existing labels/actions | Fade before clipping on collapse; reveal once destination space is usable. This is geometry coordination, not a semantic delay. | Final layout with short opacity where useful. | Final visibility immediately. | `sidebar.labels.enter` → `presence.inline` → one-shot `data.transition`; `sidebar.labels.exit` → `presence.exit` → `exit.fade` |
| Mobile open/close; composed Sheet | Inherit Sheet entry/exit; no desktop animation runs as well. | Inherit Sheet opacity-only path. | Immediate Sheet target. | `sidebar.mobile.enter` → `presence.sheet` → `popup.anchored`; `sidebar.mobile.exit` → `presence.sheet-exit` → ending phase of `popup.anchored` |
| Menu/rail state; owned labels/counts | Scoped colour, changed label runs, and place-value rolling for numeric badges. | Short colour and changed-run opacity; counts immediately. | All immediately. | `sidebar.item.colour` → `state.color` → planned `state.color`; `sidebar.label.replace` → `text.replace` → planned `text.change`; `sidebar.badge.change` → `number.compact` → `number.roll` |

## Interruption and lifecycle

- Rapid toggle reverses one current scalar driving container/gap geometry; two springs with matching nominal durations are not equivalent. Resolve direction and expanded/icon extents from the actual side/variant and width variables. Keep controlled/uncontrolled provider state, mobile state, keyboard shortcut and existing persistence semantics authoritative.
- A breakpoint change cancels desktop motion before activating mobile Sheet, or vice versa. Do not copy an in-flight desktop transform into mobile presentation.
- Collapsed labels/actions cannot leave invisible focus targets; preserve the primitive's actual keyboard and tooltip behaviour. Route selection updates active state without replaying presence.
- Unmount and live mode/zero-clock changes cancel container, gap and label writers together; final geometry is established before paint. Returning to full starts no transition until a new cause occurs.

## Geometry and performance

Use the existing sidebar width variables and side/variant rules, not text measurement or new width constants. One coordinator commits the gap and visible-container targets together: geometry.compact owns the width result and layout.sidebar projects the corresponding translation from that same scalar, with one writer per property. Neither uses the other's intermediate layout as a new target. Icon collapse uses the same transaction to map container/gap widths, including floating/inset padding and borders. A passive viewport, side, available-space or width-token change cancels obsolete projections and resolves current semantic geometry immediately; a subsequent deliberate toggle starts from that valid geometry. Desktop width change is an explicit shell resize, not observation of every menu row. Clip labels within their own region while keeping the rail, trigger focus rings and portals usable. Submenu and content owners do not cause the sidebar shell to chase their intermediate heights. Preserve scrolling and native input editing.

Navigation labels lay out at their destination inline-size before the separate shell/gap changes width; do not rewrap them on every frame. The page inset may continuously reflow with the changing occupied gap because it must reflect the actual available page width; do not scale its text or add a second inset spring. Mobile delegates natural-content measurement and reflow policy to Sheet.

## Acceptance scenarios

- Pending: reverse offcanvas/icon transitions for both sides and all variants; inspect matching container and page gap geometry.
- Pending: resize across the mobile breakpoint during motion, reopen Sheet and navigate a route; no double entrance or stale transform remains.
- Pending: change a plain badge/label, use sidebar-input and keyboard navigation while collapsed, and verify accessibility/hit regions.
- Pending: verify all modes, zero clock, live downgrade, SSR initial state and unmount during desktop/mobile exit.
- Pending: change side, width tokens or available space during a toggle, including floating/inset variants. Inspect coupled gap/translation progress rather than only matching completion times; no old-direction write or temporary page overlap may survive.
