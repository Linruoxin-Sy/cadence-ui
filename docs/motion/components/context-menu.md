# Context Menu motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

A context menu belongs to the current invocation location. A new right-click or keyboard invocation creates the new
anchored presentation immediately, without flying the previous menu across the screen. One exported content surface
serves both the root menu and every submenu, so each open branch owns its own controller instance and its own
registered slot instead of a second implementation. Base UI keeps the pointer/long-press origin, placement, roving
focus, typeahead and unmount. This contract inherits the [common contract](../README.md) and
[presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["context-menu#ContextMenuContent"],
    "item": [
      "context-menu#ContextMenuItem",
      "context-menu#ContextMenuCheckboxItem",
      "context-menu#ContextMenuRadioItem",
      "context-menu#ContextMenuSubTrigger"
    ],
    "surface": ["context-menu#ContextMenuContent"],
    "foreground": ["context-menu#ContextMenuLabel", "context-menu#ContextMenuShortcut"],
    "separator": ["context-menu#ContextMenuSeparator"],
    "label": [
      "context-menu#ContextMenuItem",
      "context-menu#ContextMenuCheckboxItem",
      "context-menu#ContextMenuRadioItem",
      "context-menu#ContextMenuSubTrigger",
      "context-menu#ContextMenuLabel",
      "context-menu#ContextMenuShortcut"
    ],
    "indicator": ["context-menu#ContextMenuCheckboxItem", "context-menu#ContextMenuRadioItem"],
    "position": ["context-menu#ContextMenuContent"],
    "quantity": ["context-menu#ContextMenuItem", "context-menu#ContextMenuLabel"],
    "rich": ["context-menu#ContextMenuItem", "context-menu#ContextMenuLabel"]
  },
  "regions": {
    "content": ["context-menu-content"],
    "item": ["context-menu-item", "context-menu-checkbox-item", "context-menu-radio-item", "context-menu-sub-trigger"],
    "surface": ["context-menu-content"],
    "foreground": ["context-menu-label", "context-menu-shortcut"],
    "separator": ["context-menu-separator"],
    "label": [
      "context-menu-item-text",
      "context-menu-checkbox-item-text",
      "context-menu-radio-item-text",
      "context-menu-sub-trigger-text",
      "context-menu-label-text",
      "context-menu-shortcut-text"
    ],
    "indicator": ["context-menu-checkbox-item-mark", "context-menu-radio-item-mark"],
    "position": ["context-menu-content"],
    "quantity": ["context-menu-item", "context-menu-label"],
    "rich": ["context-menu-item", "context-menu-label"]
  },
  "axes": { "content": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                       | References                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `context-menu-content` owns one anchored presence per open branch on its own visual layer, at the invocation point for the root and at the row for a submenu. `ContextMenuSubContent` renders the same exported surface, so each branch gets its own controller instance and slot from that one implementation. Rows inherit their panel entrance. | default: `context-menu.content.enter`, `context-menu.content.exit`                                   |
| Size            | Default: each content shell owns intentional natural width/height changes; Base UI owns the pointer/focused-element origin and collision placement.                                                                                                                                                                                                         | default: `context-menu.content.resize`                                                               |
| Surface colour  | Default: the popup shell owns its background, border and scoped shadow; Item, CheckboxItem, RadioItem and SubTrigger own pointer-highlight, checked, disabled and destructive surfaces; Separator owns its rule.                                                                                                                                            | default: `context-menu.item.colour`, `context-menu.surface.colour`, `context-menu.separator.colour`  |
| Text colour     | Default: the four row parts own their own foreground, while Label and Shortcut own theirs. Keyboard highlight is immediate because it is a navigation state, not a paint request.                                                                                                                                                                           | default: `context-menu.item.colour`, `context-menu.surface.colour`, `context-menu.foreground.colour` |
| Changed text    | Default for a plain owned item, group-label or shortcut string: changed graphemes only. Rich item and label content keeps its explicit composed owners instead of being split.                                                                                                                                                                              | default: `context-menu.label.change`; composed: `@rich`                                              |
| Changed numbers | Composed: an explicit quantity child may roll its own count under its own contract; action keys, shortcuts and numeric-looking labels are identities rather than inferred counters.                                                                                                                                                                         | composed: `@quantity`                                                                                |

`item.colour` is the sole surface/foreground controller on Item, CheckboxItem, RadioItem and SubTrigger, merging
pointer, checked, disabled, destructive and theme targets. Keyboard highlight is immediate. `surface.colour` owns
the distinct popup shell, `foreground.colour` owns Label and Shortcut, and `separator.colour` owns the rule; none of
them writes the other's regions. Both root and submenu content use the same `content.resize` preset through their
own per-branch host.

Each label binding includes checkbox, radio and sub-trigger children; generated marker/chevron glyphs remain separate
from that text slot. The menu's side approach is selected by this contract, with an opacity-only fallback for an
invalidated placement or an interaction that requires an immediately stationary target.

Colour eligibility is per actual popup, item or display region. DOM focus/focus-within or that region's own invalid
state cancels its colour clock and settles its declared paint immediately; independently owned regions may still
interpolate a verified readable palette. Hover, selection or active-descendant highlight alone is not DOM focus. The
immediate keyboard highlight above is an explicit navigation policy, not evidence that every highlighted item owns
native focus. A caller palette this surface cannot verify settles immediately.

## Choreography and modes

| Trigger / owner                                                                          | Full                                                                                                                                                                       | Reduced                                                                          | None                             | Binding → preset → recipe/form                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invocation / root content                                                                | Place at the native origin immediately, then opacity entrance with `distance.xs` side approach. Entry is subject to the actual-focus gate below.                           | Short opacity only. Entry obeys the same focus gate.                             | Open target immediately.         | `context-menu.content.enter` → `presence.menu` → `popup.anchored/presence`                                                                                                                                                             |
| Submenu open / sub-content                                                               | The same exported surface mounts its own controller for the row-anchored branch: local opacity/side approach, parent stays fixed. Entry obeys the actual-focus gate below. | Short opacity only. Entry obeys the same focus gate.                             | Open target immediately.         | `context-menu.content.enter` → `presence.menu` → `popup.anchored/presence`                                                                                                                                                             |
| Branch close / corresponding content                                                     | Opacity exit only, no stagger.                                                                                                                                             | Short opacity.                                                                   | Closed target immediately.       | `context-menu.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                    |
| New invocation or collision / Base UI positioner                                         | Cancel old approach and place at the new valid origin; no cross-screen interpolation.                                                                                      | Immediate.                                                                       | Immediate.                       | `context-menu.position.place` → `engine.native` → `native/base-ui-context-menu` (Base UI Context Menu positioning (no new recipe))                                                                                                     |
| Pointer state / item                                                                     | Scoped surface/foreground transition; keyboard highlight is immediate. Colour eligibility and immediate-owner priority follow the rule above.                              | Short colour feedback; keyboard immediate. Colour obeys the same owner priority. | Final state immediately.         | `context-menu.item.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                          |
| Supplied tokens/disabled/destructive state / popup, label, shortcut and separator owners | Scoped surface/border/foreground colour with one writer per property. Colour eligibility and immediate-owner priority follow the rule above.                               | Short colour. Colour obeys the same owner priority.                              | Final colours immediately.       | `context-menu.surface.colour` → `state.color` → `state.color/surface-foreground`; `context-menu.foreground.colour` → `state.color` → `state.color/foreground`; `context-menu.separator.colour` → `state.color` → `state.color/surface` |
| Checkbox/radio change / item indicator                                                   | Local opacity/`scale.in` marker feedback with immediate semantic checked state.                                                                                            | Opacity only.                                                                    | Final marks immediately.         | `context-menu.indicator.select` → `state.indicator` → `state.morph/indicator`                                                                                                                                                          |
| Structure/text change / shell and text owners                                            | Measured clamped size; changed plain text runs use `stagger: none`.                                                                                                        | Geometry immediate; changed-run opacity only.                                    | Final geometry/text immediately. | `context-menu.content.resize` → `geometry.compact` → `geometry.resize/measured`; `context-menu.label.change` → `text.replace` → `text.change/changed-runs`                                                                             |

Both the root menu and every submenu use the same `ContextMenuContent` export and the same
`content.enter`/`content.exit`/`content.resize` actions: each mounted branch is its own controller instance with its
own committed slot, so the invocation-point panel and the row-anchored panel never share a measured box or a presence
envelope. Composed quantities are not an action of this component; an explicit child display owns them (`@quantity`).

## Interruption and lifecycle

Native context-menu invocation focuses its current menu/list or item according to Base UI. If that target lies in an
entering envelope, settle the branch before presenting focus; a default invocation can therefore use immediate panel
paint. A pointer-opened submenu whose focus remains outside may still enter. Do not change keyboard/pointer focus or
intent timing merely to guarantee the side approach.

- Keep pointer invocation, keyboard Context Menu/Shift+F10, focus, Tab/Escape and close behavior exactly under Base
  UI. Opening animation never delays action availability.
- Reinvoking elsewhere invalidates old origin captures and exit completions. Reopening at the same location may
  reverse current opacity, but never preserve stale item semantics.
- Closing cancels text/resize/selection work in that branch. Root removal invalidates submenu owners before their
  callbacks can restore a panel.
- Live reduced cancels approach, scale and size; none/zero clock settles authored presentation and completes the
  current branch through Base UI's actual native exit protocol. Native invocation, keyboard navigation, actions and
  scrolling remain available. Unmount releases observations and origin references.
- Async content received while closed establishes the next menu without starting hidden animation. A controlled
  state request is not a committed selection/open revision; new accepted invocation/selection targets invalidate all
  obsolete completion callbacks.

## Geometry and performance

- Native positioner owns pointer/focused-element coordinates. One measured shell per open branch owns natural
  dimensions, with destination-width text layout before height measurement.
- Passive viewport/font changes and collision correction are immediate. A menu near an edge may shrink to available
  space and scroll without a geometry overshoot.
- Bound work to visible open branches; no trigger-descendant scanning, per-item observers or row-entry stagger.
  Submenu portals and focus outlines stay outside decorative clipping.
- The natural content region is separate from each size host; clamp to valid non-negative dimensions. Preserve
  existing legal scroll/overflow so required labels and focused/active items remain readable immediately, or settle
  that axis rather than adding temporary truncation. Parent branches consume nested committed dimensions without
  chasing intermediate child geometry.

## Acceptance scenarios

Executed in `tests/components/context-menu.test.tsx`: the anchored entrance and exit on a retained host, the measured
shell revision, changed plain item/label/shortcut strings, the four row palettes, the popup surface, the
label/shortcut foreground and the separator rule, the checkbox/radio indicator revision, and the native Base UI
placement plus the composed rich-content and quantity boundaries. Each action runs in full, reduced and none, and
every composed/native region is verified as a static boundary that holds no live writer while the menu and its items
are mounted.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation, right-click
reinvocation at widely separated points during entry/exit, keyboard invocation and traversal, nested selection,
label updates near an edge, disabled or removed items, collision flips, branch closure while focus moves, async data
after dismissal, SSR/no-JS/hydration probes, light/dark and narrow/wide screenshots. jsdom has no layout engine and no
pointer geometry, so the shell measurement and the anchor-side approach are proven here by their committed revision,
source and property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns the native `contextmenu`/long-press invocation, mounting,
placement, roving focus, typeahead, submenu intent and the native unmount protocol; the measured owner animates only a
known content revision while the menu is open; composed quantity and rich item content keep their own owners; no
performance, CLS, interaction-cost or real-device FPS measurement was taken (ADR-023 defers performance governance).
