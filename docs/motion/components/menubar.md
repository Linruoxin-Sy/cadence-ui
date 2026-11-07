# Menubar motion contract

Status: target design; implementation and verification pending.

The bar gives immediate navigation feedback, while each open menu remains attached to its own trigger. Moving between menus changes surfaces at their anchors instead of dragging one panel horizontally. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `menubar` owns an independent bar entrance; `menubar-content`/`menubar-sub-content` inherit the Dropdown Menu popup implementation once per open surface. |
| Size | Default: bar owns label-driven strip reflow while no popup is open; with an open branch, anchor-affecting bar layout settles immediately. Each menu shell owns natural dimensions through its inherited Dropdown Menu owner. |
| Surface colour | Default: root/trigger surfaces own bar/open/pointer-highlight tokens; menu item surfaces inherit the Dropdown Menu contract. |
| Text colour | Default: trigger foreground follows open/disabled state; menu labels/items/shortcuts inherit their Dropdown Menu text owners. |
| Changed text | Default for primitive trigger labels; plain menu labels inherit selective replacement. Rich children use composed owners. |
| Changed numbers | Composed: explicitly formatted quantities may roll. Menu names, shortcuts and radio values are identities. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Independent bar insertion / root | One opacity entrance; triggers are ready together. | Short opacity. | Final bar immediately. | `menubar.root.enter` → `presence.inline` → one-shot `data.transition` |
| Open menu/submenu / inherited popup writer | Anchor-relative opacity with optional `distance.xs` approach at that trigger; no horizontal panel flight. | Short opacity only. | Final open surface immediately. | `menubar.content.enter` → `presence.menu` → `popup.anchored`; `menubar.sub-content.enter` → `presence.menu` → `popup.anchored` |
| Close old menu/branch / inherited popup writer | Opacity exit only; new menu follows its own semantic open transaction. | Short opacity. | Closed target immediately. | `menubar.content.exit` → `presence.exit` → `exit.fade`; `menubar.sub-content.exit` → `presence.exit` → `exit.fade` |
| Pointer/open state / trigger and menu items | Scoped surface/foreground colour feedback; keyboard focus/highlight becomes immediate. | Short colour feedback; keyboard immediate. | Final state immediately. | `menubar.trigger.colour` → `state.color` → target `state.color`; `menubar.item.colour` → `state.color` → target `state.color` |
| Checkbox/radio change / inherited item indicators | Local marker feedback, exactly once through the Dropdown Menu owner. | Opacity only. | Final markers immediately. | `menubar.indicator.select` → `state.indicator` → `state.morph` |
| Trigger label/set change / bar layout owner | Bounded reflow while all menus are closed. With an open branch, commit anchor-affecting strip layout immediately so no projected trigger drifts away from its popup. Preserve trigger identity. | Final geometry immediately. | Final geometry immediately. | `menubar.root.resize` → `geometry.compact` → `geometry.resize`; `menubar.triggers.reflow` → `layout.compact` → `layout.move` |
| Menu content change / inherited shell owner | Measured clamped dimensions at the actual current anchor. | Final geometry immediately. | Final geometry immediately. | `menubar.content.resize` → `geometry.compact` → `geometry.resize` |
| Plain display label / respective text owner | Changed-run replacement, `stagger: none`. | Changed-run opacity only. | Final text immediately. | `menubar.label.change` → `text.replace` → target `text.change` |
| Root/popup/label token change / respective surface owners | Scoped surface/border/foreground colour, inherited exactly once for menu parts. | Short colour. | Final colours immediately. | `menubar.surface.colour` → `state.color` → target `state.color` |
| Anchor/collision change / inherited positioner | Correct placement immediately with native trigger geometry; no independent anchor-coordinate tween. | Same placement. | Same placement. | `menubar.position.place` → `engine.native` → Base UI Menu positioning (no new recipe) |
| Explicit composed quantity / child owner | Roll changed places; command names/shortcuts remain text. | Final number immediately. | Final number immediately. | `menubar.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Base UI owns bar traversal, pointer history, trigger activation, orientation, RTL, roving focus and submenu intent. Animation must not simplify those rules into automatic open-on-focus.
- Switching menus invalidates old position/exit completions. The new trigger receives semantic focus/open feedback immediately; the old panel cannot steal focus when its fade finishes.
- Close cancels text/geometry work in that branch. Reopening reverses only that boundary, with current labels and selection; removal unregisters the trigger and descendants.
- Live reduced cancels travel/layout/scale; none/zero clock clears authored clocks and completes current exits through the native Base UI protocol. Inherited Dropdown Menu adapters perform cancellation once, not again in a Menubar wrapper. Native traversal, actions, focus and scrolling remain available in every mode.
- Async labels/availability received while closed update the next view without replaying hidden work. Actual controlled open/selection state remains authoritative; reopening invalidates obsolete branch completion callbacks.

## Geometry and performance

- Reuse existing Dropdown Menu property writers and Base UI positioners; local bindings select intent/parameters without creating duplicate DOM, animations or observers.
- Bar text lays out at its final available width; one layout snapshot owns trigger reflow. Each popup lays text at final target width before measuring its height; passive font/viewport changes are immediate.
- Bound work to the active top-level branch and visible submenus. No per-trigger perpetual observer, panel flight between anchors or row stagger.
- Keep bar focus outlines, popup portals and inherited menu scrolling outside decorative clips; moving a trigger's label must not animate its anchor coordinates independently.
- Measure a natural strip/content region separately from each sizing host and clamp dimensions to valid non-negative bounds. If an intermediate shell would newly crop a required label or focused/active item, use existing legal overflow/scrolling or settle that axis immediately. A nested menu or composed child contributes its committed destination without a second ancestor size spring.

## Acceptance scenarios

- Pending: rapid pointer switching and keyboard traversal in both orientations/RTL preserve Base UI activation history and current focus.
- Pending: update a trigger/menu label while switching branches; only current anchor geometry is used and no duplicate inherited effect executes.
- Pending: nested checkbox/radio menus, all modes, live downgrade, zero clock and root removal cancel branch resources once.
- Pending: change a trigger's width while its popup is open, then update async content after close; anchor placement stays attached, no bar FLIP competes with the positioner and required labels remain readable.
