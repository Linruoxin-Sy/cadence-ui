# Navigation Menu motion contract

Status: target design; implementation and verification pending.

Navigation Menu uses a shared popup surface that changes to accommodate the active item. Its content moves a small distance toward the newly selected navigation direction while the anchor and focus semantics remain stable. The actual composition includes Root/List/Item/Trigger/Content/Link/Indicator and Base UI Portal, Positioner, Popup and Viewport parts.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Bindings do not add public parts or props.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "popup": ["navigation-menu#NavigationMenuPositioner"],
    "viewport": ["navigation-menu#NavigationMenuContent", "navigation-menu#NavigationMenuPositioner"],
    "content": ["navigation-menu#NavigationMenuContent"],
    "indicator": ["navigation-menu#NavigationMenuTrigger"],
    "item": ["navigation-menu#NavigationMenuTrigger", "navigation-menu#NavigationMenuLink"],
    "label": [
      "navigation-menu#NavigationMenuTrigger",
      "navigation-menu#NavigationMenuLink",
      "navigation-menu#NavigationMenuContent"
    ],
    "value": ["navigation-menu#NavigationMenuContent"],
    "surface": [
      "navigation-menu#NavigationMenuPositioner",
      "navigation-menu#NavigationMenuContent",
      "navigation-menu#NavigationMenuIndicator"
    ]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                     | References                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Appearance      | Default: the popup owns initial open/final close; content switches inside it without replaying the whole popup.                                                                             | default: `navigation-menu.popup.enter`, `navigation-menu.popup.exit`, `navigation-menu.content.change` |
| Size            | Default: one shared popup/viewport geometry owner follows Base UI's known destination width and height. Positioner coordinates remain the positioning engine's responsibility.              | default: `navigation-menu.viewport.resize`                                                             |
| Surface colour  | Default: trigger/link state surfaces and the actual Positioner-hosted popup, content and optional indicator-arrow surface; no root/provider paint is invented.                              | default: `navigation-menu.item.colour`, `navigation-menu.surface.colour`                               |
| Text colour     | Default: trigger/link states; descendant content inherits unless its own component owns another state.                                                                                      | default: `navigation-menu.item.colour`, `navigation-menu.surface.colour`                               |
| Changed text    | Default for direct plain trigger/link/content strings; rich menu content remains composed. An opening/switching content surface consumes same-cause initial text entry.                     | default: `navigation-menu.label.replace`; composed: `@label`                                           |
| Changed numbers | Default for a supported direct quantity in an owned display part; composed for nested badge/count owners. Numeric-looking navigation labels, item values and route identifiers remain text. | default: `navigation-menu.value.change`; composed: `@value`                                            |

## Choreography and modes

| Trigger and owner                                                 | Full                                                                                                                                                                     | Reduced                                    | None                                | Binding → preset → recipe                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First open/final close; popup paint                               | Opacity and `distance.xs` approach from the resolved side on entry; opacity-only exit. Positioner stays authoritative; no additional scale.                              | Short opacity only.                        | Immediate visibility.               | `navigation-menu.popup.enter` → `presence.menu` → `popup.anchored/presence`; `navigation-menu.popup.exit` → `presence.exit` → `exit.fade/opacity`               |
| Active item changes; shared viewport                              | Clamped width and height follow the latest destination, without bounce.                                                                                                  | Destination dimensions immediately.        | Destination dimensions immediately. | `navigation-menu.viewport.resize` → `geometry.panel` → `geometry.resize/measured`                                                                               |
| Active item changes; content paint                                | Opacity with `distance.xs` travel based on actual item order and writing direction. Unknown or simultaneously reordered direction uses opacity only.                     | Short opacity only.                        | Active content immediately.         | `navigation-menu.content.change` → `content.switch` → `data.transition/directional-content`                                                                     |
| Open state; existing trigger chevron                              | The Trigger chevron turns by `rotation.halfTurn` between closed/open; no opacity or scale effect. Popup geometry and the separate NavigationMenuIndicator remain native. | Final orientation immediately; no fade.    | Final state immediately.            | `navigation-menu.indicator.change` → `state.indicator` → `state.morph/indicator`                                                                                |
| Trigger/link state; owned plain label changes                     | Scoped colour; changed label graphemes only, with no stagger.                                                                                                            | Short colour and changed-run opacity only. | Both immediately.                   | `navigation-menu.item.colour` → `state.color` → `state.color/surface-foreground`; `navigation-menu.label.replace` → `text.replace` → `text.change/changed-runs` |
| Direct displayed quantity changes                                 | Roll changed places only; share any content-size cause with the viewport host.                                                                                           | Final quantity/size immediately.           | Final quantity/size immediately.    | `navigation-menu.value.change` → `number.compact` → `number.roll/reels`                                                                                         |
| Popup/content/indicator token changes / respective painted region | Scoped popup background/border, content foreground and indicator-arrow paint.                                                                                            | Short colour.                              | Final paint immediately.            | `navigation-menu.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                             |

`popup` anchors to NavigationMenuPositioner because that export renders the internal Popup/Viewport;
NavigationMenuContent supplies the active content, not a second popup. `indicator.change` owns only
the chevron inside NavigationMenuTrigger. The separately exported NavigationMenuIndicator retains
its Base UI Icon semantics and native placement; only its existing arrow paint joins surface colour.
Trigger/link colours and popup/content colours use disjoint regions; inherited foreground is not
interpolated again on each child.

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

- Pending: change popup/arrow theme paint and Trigger open state independently; verify the chevron rotates, the native Indicator does not become a shared marker, and only Positioner-hosted popup paint enters.
