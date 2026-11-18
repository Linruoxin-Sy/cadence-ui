# Menubar motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The bar gives immediate navigation feedback while each open menu stays attached to its own trigger. Menubar is a
composition: it owns the bar entrance, the bar/trigger paint and a trigger's plain label display, and it mounts
`dropdown-menu` for every menu surface, row, selection mark, menu text slot and Base UI positioner. An inherited
binding is executed exactly once by that dependency — renaming a slot to `menubar-*` does not create a second
writer. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are
design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["menubar#Menubar"],
    "trigger": ["menubar#MenubarTrigger"],
    "trigger-label": ["menubar#MenubarTrigger"],
    "content": ["dropdown-menu#DropdownMenuContent"],
    "surface": ["dropdown-menu#DropdownMenuContent"],
    "foreground": ["dropdown-menu#DropdownMenuLabel", "dropdown-menu#DropdownMenuShortcut"],
    "separator": ["dropdown-menu#DropdownMenuSeparator"],
    "item": [
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger"
    ],
    "indicator": ["dropdown-menu#DropdownMenuCheckboxItem", "dropdown-menu#DropdownMenuRadioItem"],
    "label": [
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger",
      "dropdown-menu#DropdownMenuLabel",
      "dropdown-menu#DropdownMenuShortcut"
    ],
    "quantity": ["menubar#MenubarItem", "menubar#MenubarLabel"]
  },
  "regions": {
    "root": ["menubar"],
    "trigger": ["menubar-trigger"],
    "trigger-label": ["menubar-trigger-text"],
    "content": ["menubar-content"],
    "surface": ["menubar-content"],
    "foreground": ["menubar-label", "menubar-shortcut"],
    "separator": ["menubar-separator"],
    "item": ["menubar-item", "menubar-checkbox-item", "menubar-radio-item", "menubar-sub-trigger"],
    "indicator": ["dropdown-menu-checkbox-item-mark", "dropdown-menu-radio-item-mark"],
    "label": [
      "dropdown-menu-item-text",
      "dropdown-menu-checkbox-item-text",
      "dropdown-menu-radio-item-text",
      "dropdown-menu-sub-trigger-text",
      "dropdown-menu-label-text",
      "dropdown-menu-shortcut-text"
    ],
    "quantity": ["menubar-item", "menubar-label"]
  },
  "axes": { "content": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                         | References                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: the retained bar owns one independent insertion entrance and its own opacity exit, with no travel and no replay on a re-render. Each open menu surface keeps the Dropdown Menu popup implementation once per mounted branch.                                                                                         | default: `menubar.root.enter`, `menubar.root.exit`; inherited: `menubar.content.enter`, `menubar.content.exit`                                    |
| Size            | Default: the strip keeps native flex layout — the bar's height is fixed and its width is caller-owned — so a trigger label revision reflows the bar immediately instead of tweening a measured strip that could crop a required label. Each menu shell owns its natural dimensions through its inherited Dropdown Menu owner. | inherited: `menubar.content.resize`                                                                                                               |
| Surface colour  | Default: the bar root owns its background, border and foreground; each top-level trigger owns its own background and foreground. Menu rows, shell, labels, shortcuts and separator rules inherit the Dropdown Menu contract.                                                                                                  | default: `menubar.root.colour`, `menubar.trigger.colour`; inherited: `menubar.surface.colour`, `menubar.item.colour`, `menubar.separator.colour`  |
| Text colour     | Default: the bar foreground and the trigger foreground follow their own state, and an actual DOM focus or an unverified caller palette settles them immediately. Menu labels, items and shortcuts inherit their Dropdown Menu text owners.                                                                                    | default: `menubar.root.colour`, `menubar.trigger.colour`; inherited: `menubar.surface.colour`, `menubar.item.colour`, `menubar.foreground.colour` |
| Changed text    | Default for a plain top-level trigger label. Menu item, checkbox, radio, submenu, group-label and shortcut strings inherit the Dropdown Menu display slots; rich trigger content keeps its composed owners.                                                                                                                   | default: `menubar.trigger-label.change`; inherited: `menubar.label.change`; composed: `@quantity`                                                 |
| Changed numbers | Composed: an explicit `AnimatedNumber` child may roll its count under its own contract; trigger names, menu names and shortcut strings are identities, and Menubar supplies no numeric display slot.                                                                                                                          | composed: `@quantity`                                                                                                                             |

`root.colour` is the bar's only paint owner; `trigger.colour` is the only paint owner on a top-level trigger. The
inherited menu owners keep Dropdown Menu's disjoint region map: rows and sub-triggers belong to the item
controller, the popup shell to the surface controller, Label/Shortcut to the foreground controller and the
separator rule to its own. Colour eligibility is per actual bar, trigger or inherited menu region: DOM
focus/focus-within or that region's own invalid state cancels its colour clock and settles all its declared paint
immediately, while independently owned regions may still interpolate a verified readable palette. Hover, open
state, selection or active-descendant highlight alone is not DOM focus. Immediate keyboard highlight remains the
explicit bar navigation policy, not a replacement for the actual focus state.

## Choreography and modes

| Trigger / owner                                    | Full                                                                                                                                                         | Reduced                                                                          | None                            | Binding → preset → recipe/form                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Independent bar insertion / root                   | One opacity entrance on the bar only; triggers are ready together and the resting bar keeps its caller paint.                                                | Short opacity.                                                                   | Final bar immediately.          | `menubar.root.enter` → `presence.inline` → `data.transition/opacity`         |
| Bar removal / root                                 | Opacity exit only, completed through the enclosing presence; no inherited entrance delay.                                                                    | Short opacity.                                                                   | Closed target immediately.      | `menubar.root.exit` → `presence.exit` → `exit.fade/opacity`                  |
| Open menu / inherited popup writer                 | Anchor-relative opacity with `distance.xs` approach at that trigger; no panel flight between anchors. Entry is subject to the actual-focus gate below.       | Short opacity only. Entry obeys the same focus gate.                             | Final open surface immediately. | `menubar.content.enter` → `presence.menu` → `popup.anchored/presence`        |
| Close old menu/branch / inherited popup writer     | Opacity exit only; the next menu follows its own semantic open transaction.                                                                                  | Short opacity.                                                                   | Closed target immediately.      | `menubar.content.exit` → `presence.exit` → `exit.fade/opacity`               |
| Bar paint / root                                   | Scoped bar background, foreground and border colour; DOM focus or an unverified caller palette settles the whole family immediately.                         | Short colour feedback. Colour obeys the same owner priority.                     | Final colours immediately.      | `menubar.root.colour` → `state.color` → `state.color/surface-foreground`     |
| Pointer/open state / trigger                       | Scoped trigger background and foreground; keyboard focus/highlight becomes immediate. Colour eligibility and immediate-owner priority follow the rule above. | Short colour feedback; keyboard immediate. Colour obeys the same owner priority. | Final state immediately.        | `menubar.trigger.colour` → `state.color` → `state.color/surface-foreground`  |
| Trigger label revision / trigger label             | Changed-run replacement, `stagger: none`; the strip reflows natively and trigger identity is preserved.                                                      | Changed-run opacity only.                                                        | Final text immediately.         | `menubar.trigger-label.change` → `text.replace` → `text.change/changed-runs` |
| Menu rows and variants / inherited item owners     | Scoped surface/foreground feedback local to the row; no travelling row plate.                                                                                | Short colour feedback. Colour obeys the same owner priority.                     | Final colours immediately.      | `menubar.item.colour` → `state.color` → `state.color/surface-foreground`     |
| Menu shell paint / inherited surface owner         | Scoped popup background, foreground, borders and shadow, inherited exactly once per mounted branch.                                                          | Short colour. Colour obeys the same owner priority.                              | Final colours immediately.      | `menubar.surface.colour` → `state.color` → `state.color/surface-foreground`  |
| Label/shortcut foreground / inherited owner        | Scoped foreground paint only; the shell keeps its own surface family.                                                                                        | Short colour.                                                                    | Final colours immediately.      | `menubar.foreground.colour` → `state.color` → `state.color/foreground`       |
| Separator rule / inherited owner                   | Scoped rule paint only.                                                                                                                                      | Short colour.                                                                    | Final colours immediately.      | `menubar.separator.colour` → `state.color` → `state.color/surface`           |
| Checkbox/radio change / inherited indicators       | Local marker feedback, exactly once through the Dropdown Menu owner.                                                                                         | Opacity only.                                                                    | Final markers immediately.      | `menubar.indicator.select` → `state.indicator` → `state.morph/indicator`     |
| Menu shell structure/label width / inherited owner | Measured clamped width and height at the actual current anchor.                                                                                              | Final geometry immediately.                                                      | Final geometry immediately.     | `menubar.content.resize` → `geometry.compact` → `geometry.resize/measured`   |
| Menu label/shortcut text / inherited text owners   | Changed-run replacement, `stagger: none`.                                                                                                                    | Changed-run opacity only.                                                        | Final text immediately.         | `menubar.label.change` → `text.replace` → `text.change/changed-runs`         |

The bar strip and its trigger positions are native flex layout, not an animated owner: Menubar adds no measured
strip, no panel flight between anchors and no sibling FLIP, because a trigger's width tween could crop a required
label and a transformed trigger would move its own popup anchor. Base UI's menu positioner places every open
surface; that native `engine.native` action belongs to the Dropdown Menu contract, which declares and verifies it,
and Menubar adds no second placement writer. An inherited binding is executed once by its dependency, including
inherited submenu text; renamed data-slots do not create new writers. The shared `content.resize` anchor set covers
both the root menu and its submenus, and presence stays split: `content.enter`/`content.exit` apply per mounted
branch, and each branch owns its own registered slot.

## Interruption and lifecycle

Inherited popup entry also inherits Dropdown Menu's actual-focus gate: a list/item focused during opening must
already be visible and stationary, so a default top-level menu may skip its entry envelope. Pointer-opened submenus
can animate while focus stays outside them. Menubar does not delay traversal or override initial focus to keep an
inherited animation running, and it never plays its own entrance over an already-presented bar.

- Base UI owns bar traversal, pointer history, trigger activation, orientation, RTL, roving focus and submenu
  intent. Animation must not simplify those rules into automatic open-on-focus.
- Switching menus invalidates old position/exit completions. The new trigger receives semantic focus/open feedback
  immediately; the old panel cannot steal focus when its fade finishes, and the bar entrance never replays.
- Close cancels text/geometry work in that branch. Reopening reverses only that boundary, with current labels and
  selection; removal unregisters the trigger and descendants and disposes the bar entrance.
- Live reduced cancels travel/size/scale; none/zero clock clears authored clocks and completes current exits
  through the native Base UI protocol. Inherited Dropdown Menu adapters perform cancellation once, not again in a
  Menubar wrapper. Native traversal, actions, focus and scrolling remain available in every mode.
- Async labels/availability in a closed popup establish its current baseline without replaying hidden work. The
  still-visible bar and top-level triggers retain independent label and colour revisions; closing a branch or
  completing its exit does not cancel those owners. Hiding/removing the enclosing bar cancels the entrance and its
  paint clocks. Actual controlled open/selection state remains authoritative; reopening invalidates obsolete branch
  completion callbacks.

## Geometry and performance

- Reuse Dropdown Menu's property writers and Base UI positioners; local bindings select intent/parameters without
  creating duplicate DOM, animations or observers.
- The bar strip lays out natively at its final available width; one label revision reflows the triggers immediately.
  Each popup lays text at final target width before measuring its height; passive font/viewport changes are
  immediate.
- Bound work to the active top-level branch and visible submenus. No per-trigger perpetual observer, panel flight
  between anchors or row stagger.
- Keep bar focus outlines, popup portals and inherited menu scrolling outside decorative clips; moving a trigger's
  label must not animate its anchor coordinates independently, and no intermediate shell may crop a required label
  or focused/active item.
- Measure a natural strip/content region separately from each sizing host and clamp dimensions to valid
  non-negative bounds. A nested menu or composed child contributes its committed destination without a second
  ancestor size spring.

## Acceptance scenarios

Executed in `tests/components/menubar.test.tsx`: the independent bar insertion and its reduced/none resolutions, the
bar and trigger paint families, the plain trigger label changed runs, the inherited anchored entrance and exit, the
measured shell revision, the per-row surface-foreground palette, the popup surface, foreground and separator
owners, the checkbox/radio indicator revision and the six inherited menu text slots. Each action runs in full,
reduced and none, and the composed quantity display is verified as a static boundary with no live writer while the
bar and its menus are mounted.

Still pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, rapid pointer switching and keyboard traversal in both orientations/RTL with Base UI's activation history,
open one menu then hover a submenu, update trigger and menu labels while switching branches, change a trigger's
width while its popup is open and then update async content after close, collision flips, SSR/no-JS/hydration
probes, keyboard focus and return focus, and light/dark × narrow/wide screenshots. jsdom has no layout engine, no
composed CSS and no pointer geometry, so the anchored approach, the measured shell and the native strip reflow are
proven by their committed revisions, source and property policy rather than by rendered frames.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, placement, roving focus, typeahead, submenu
intent and the native unmount protocol; Dropdown Menu owns every menu-surface, row, indicator and menu-text action;
the bar strip is native layout; composed numeric and rich content keep their own owners; and no performance, CLS,
interaction-cost or real-device FPS measurement was taken (ADR-023 defers performance governance).
