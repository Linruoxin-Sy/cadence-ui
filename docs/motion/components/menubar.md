# Menubar motion contract

Status: target design; implementation and verification pending.

The bar gives immediate navigation feedback, while each open menu remains attached to its own trigger. Moving between menus changes surfaces at their anchors instead of dragging one panel horizontally. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["menubar#Menubar"],
    "content": [
      "menubar#MenubarContent",
      "dropdown-menu#DropdownMenuContent",
      "menubar#MenubarSubContent",
      "dropdown-menu#DropdownMenuSubContent"
    ],
    "sub-content": ["menubar#MenubarSubContent", "dropdown-menu#DropdownMenuSubContent"],
    "trigger": ["menubar#MenubarTrigger"],
    "item": [
      "menubar#MenubarItem",
      "menubar#MenubarCheckboxItem",
      "menubar#MenubarRadioItem",
      "menubar#MenubarSubTrigger",
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger"
    ],
    "indicator": [
      "menubar#MenubarCheckboxItem",
      "menubar#MenubarRadioItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem"
    ],
    "triggers": ["menubar#Menubar", "menubar#MenubarTrigger"],
    "label": ["menubar#MenubarTrigger"],
    "surface": ["menubar#Menubar"],
    "position": ["menubar#MenubarContent", "menubar#MenubarSubContent"],
    "quantity": ["menubar#MenubarItem", "menubar#MenubarLabel"],
    "menu-surface": [
      "menubar#MenubarContent",
      "menubar#MenubarSubContent",
      "menubar#MenubarLabel",
      "menubar#MenubarShortcut",
      "menubar#MenubarSeparator",
      "dropdown-menu#DropdownMenuContent",
      "dropdown-menu#DropdownMenuSubContent",
      "dropdown-menu#DropdownMenuLabel",
      "dropdown-menu#DropdownMenuShortcut",
      "dropdown-menu#DropdownMenuSeparator"
    ],
    "menu-label": [
      "menubar#MenubarItem",
      "menubar#MenubarCheckboxItem",
      "menubar#MenubarRadioItem",
      "menubar#MenubarSubTrigger",
      "menubar#MenubarLabel",
      "menubar#MenubarShortcut",
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger",
      "dropdown-menu#DropdownMenuLabel",
      "dropdown-menu#DropdownMenuShortcut"
    ]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                        | References                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `menubar` owns an independent bar entrance; `menubar-content`/`menubar-sub-content` inherit the Dropdown Menu popup implementation once per open surface.                                                           | default: `menubar.root.enter`; inherited: `menubar.content.enter`, `menubar.sub-content.enter`, `menubar.content.exit`, `menubar.sub-content.exit` |
| Size            | Default: bar owns label-driven strip reflow while no popup is open; with an open branch, anchor-affecting bar layout settles immediately. Each menu shell owns natural dimensions through its inherited Dropdown Menu owner. | default: `menubar.root.resize`; inherited: `menubar.content.resize`                                                                                |
| Surface colour  | Default: root/trigger surfaces own bar/open/pointer-highlight tokens; menu item surfaces inherit the Dropdown Menu contract.                                                                                                 | default: `menubar.trigger.colour`, `menubar.surface.colour`; inherited: `menubar.item.colour`, `menubar.menu-surface.colour`                       |
| Text colour     | Default: trigger foreground follows open/disabled state; menu labels/items/shortcuts inherit their Dropdown Menu text owners.                                                                                                | default: `menubar.trigger.colour`, `menubar.surface.colour`; inherited: `menubar.item.colour`, `menubar.menu-surface.colour`                       |
| Changed text    | Default for primitive trigger labels; plain menu labels inherit selective replacement. Rich children use composed owners.                                                                                                    | default: `menubar.label.change`; inherited: `menubar.menu-label.change`; composed: `@label`, `@menu-label`                                         |
| Changed numbers | Composed: explicitly formatted quantities may roll. Menu names, shortcuts and radio values are identities.                                                                                                                   | composed: `menubar.quantity.change`                                                                                                                |

## Choreography and modes

| Trigger / owner                                           | Full                                                                                                                                                                                            | Reduced                                              | None                            | Binding → preset → recipe/form                                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent bar insertion / root                          | One opacity entrance; triggers are ready together.                                                                                                                                              | Short opacity.                                       | Final bar immediately.          | `menubar.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                          |
| Open menu/submenu / inherited popup writer                | Anchor-relative opacity with `distance.xs` approach at that trigger; no horizontal panel flight. Entry is subject to the actual-focus gate below.                                               | Short opacity only. Entry obeys the same focus gate. | Final open surface immediately. | `menubar.content.enter` → `presence.menu` → `popup.anchored/presence`; `menubar.sub-content.enter` → `presence.menu` → `popup.anchored/presence`              |
| Close old menu/branch / inherited popup writer            | Opacity exit only; new menu follows its own semantic open transaction.                                                                                                                          | Short opacity.                                       | Closed target immediately.      | `menubar.content.exit` → `presence.exit` → `exit.fade/opacity`; `menubar.sub-content.exit` → `presence.exit` → `exit.fade/opacity`                            |
| Pointer/open state / trigger and menu items               | Scoped surface/foreground colour feedback; keyboard focus/highlight becomes immediate.                                                                                                          | Short colour feedback; keyboard immediate.           | Final state immediately.        | `menubar.trigger.colour` → `state.color` → `state.color/surface-foreground`; `menubar.item.colour` → `state.color` → `state.color/surface-foreground`         |
| Checkbox/radio change / inherited item indicators         | Local marker feedback, exactly once through the Dropdown Menu owner.                                                                                                                            | Opacity only.                                        | Final markers immediately.      | `menubar.indicator.select` → `state.indicator` → `state.morph/indicator`                                                                                      |
| Trigger label/set change / bar layout owner               | Bounded reflow while all menus are closed. With an open branch, commit anchor-affecting strip layout immediately so no projected trigger drifts away from its popup. Preserve trigger identity. | Final geometry immediately.                          | Final geometry immediately.     | `menubar.root.resize` → `geometry.compact` → `geometry.resize/measured`; `menubar.triggers.reflow` → `layout.compact` → `layout.move/position`                |
| Menu content change / inherited shell owner               | Measured clamped dimensions at the actual current anchor.                                                                                                                                       | Final geometry immediately.                          | Final geometry immediately.     | `menubar.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                    |
| Plain display label / respective text owner               | Changed-run replacement, `stagger: none`.                                                                                                                                                       | Changed-run opacity only.                            | Final text immediately.         | `menubar.label.change` → `text.replace` → `text.change/changed-runs`; `menubar.menu-label.change` → `text.replace` → `text.change/changed-runs`               |
| Root/popup/label token change / respective surface owners | Scoped surface/border/foreground colour, inherited exactly once for menu parts.                                                                                                                 | Short colour.                                        | Final colours immediately.      | `menubar.surface.colour` → `state.color` → `state.color/surface-foreground`; `menubar.menu-surface.colour` → `state.color` → `state.color/surface-foreground` |
| Anchor/collision change / inherited positioner            | Correct placement immediately with native trigger geometry; no independent anchor-coordinate tween.                                                                                             | Same placement.                                      | Same placement.                 | `menubar.position.place` → `engine.native` → `native/base-ui-menu` (Base UI Menu positioning (no new recipe))                                                 |
| Explicit composed quantity / child owner                  | Roll changed places; command names/shortcuts remain text.                                                                                                                                       | Final number immediately.                            | Final number immediately.       | `menubar.quantity.change` → `number.compact` → `number.roll/reels`                                                                                            |

Inherited `item.colour` and `menu-surface.colour` keep Dropdown Menu's disjoint region map:
all item variants/sub-triggers belong to the item controller; popup shells, labels, shortcuts and
separator rules belong to the surface controller. Menubar's local `surface.colour` only owns the
bar root and `trigger.colour` only owns top-level triggers. An inherited binding is executed once
by its dependency, including inherited submenu text; renamed data-slots do not create new writers.
The shared `content.resize` anchor set covers both root and sub-content. Presence remains split:
`content.enter`/`content.exit` apply only to the root surface, and the `sub-content` bindings only to
their own submenu surface; the broader measurement anchor does not add a second submenu entrance.

## Interruption and lifecycle

Inherited popup entry also inherits Dropdown Menu's actual-focus gate: a list/item focused during opening must already be visible and stationary, so a default top-level menu may skip its entry envelope. Pointer-opened submenus can animate while focus stays outside them. Menubar does not delay traversal or override initial focus to keep an inherited animation running.

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
- Pending: Open a menu while traversing triggers and then hover a submenu; inherited focus gating and both root/submenu resize anchors resolve through the same dependency once.
