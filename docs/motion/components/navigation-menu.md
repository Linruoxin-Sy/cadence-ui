# Navigation Menu motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

Navigation Menu is one positioned surface that changes to accommodate the active item. The popup enters once,
the shared shell follows the destination Base UI measured, and only the entering content travels a short distance
toward the item the reader moved to. Anchors, focus, hover intent and unmount stay the primitive's. This contract
inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not
recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "popup": ["navigation-menu#NavigationMenuPositioner"],
    "viewport": ["navigation-menu#NavigationMenuPositioner"],
    "content": ["navigation-menu#NavigationMenuPositioner"],
    "indicator": ["navigation-menu#NavigationMenuTrigger"],
    "item": ["navigation-menu#NavigationMenuTrigger"],
    "link": ["navigation-menu#NavigationMenuLink"],
    "label": [
      "navigation-menu#NavigationMenuTrigger",
      "navigation-menu#NavigationMenuLink",
      "navigation-menu#NavigationMenuContent"
    ],
    "value": ["navigation-menu#NavigationMenuContent"],
    "surface": ["navigation-menu#NavigationMenuPositioner"]
  },
  "regions": {
    "popup": ["navigation-menu-popup"],
    "viewport": ["navigation-menu-popup"],
    "content": ["navigation-menu-viewport"],
    "indicator": ["navigation-menu-trigger-chevron"],
    "item": ["navigation-menu-trigger"],
    "link": ["navigation-menu-link"],
    "label": ["navigation-menu-trigger-text", "navigation-menu-link-text", "navigation-menu-content-text"],
    "value": ["navigation-menu-content-number"],
    "surface": ["navigation-menu-popup"]
  },
  "axes": { "viewport": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                  | References                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: the Positioner-hosted popup owns the initial open and the final close on its own visual layer; content that switches inside it never replays the whole popup, and Base UI keeps mounting, placement, focus and unmount completion.                                            | default: `navigation-menu.popup.enter`, `navigation-menu.popup.exit`                                    |
| Size            | Default: one shell owns width and height around the committed active content, consuming the destination Base UI supplies; the positioner keeps its coordinates, collision results and available space immediate.                                                                       | default: `navigation-menu.viewport.resize`                                                              |
| Surface colour  | Default: the trigger and the link own disjoint state surfaces and the popup owns its background, border, shadow and foreground; no root or provider paint is invented and the native Indicator keeps its placement without a second marker.                                            | default: `navigation-menu.item.colour`, `navigation-menu.link.colour`, `navigation-menu.surface.colour` |
| Text colour     | Default: the trigger's own label colour and the popup's foreground; content and links inherit, so an inherited foreground is never interpolated a second time on each child.                                                                                                           | default: `navigation-menu.item.colour`, `navigation-menu.surface.colour`                                |
| Changed text    | Default for a direct plain trigger, link or content string: only changed graphemes are replaced. Rich menu content, links written as JSX and `render` callbacks keep their own structure and are composed, not recursively rewritten.                                                  | default: `navigation-menu.label.replace`                                                                |
| Changed numbers | Default for a supported direct numeric child of the active content: the owned display slot rolls changed places only. Numeric-looking navigation labels, item values and route identifiers stay text, and nested badge/count owners inside rich content keep their own display owners. | default: `navigation-menu.value.change`                                                                 |

`surface.colour` addresses the popup's painted region and `item.colour`/`link.colour` address the trigger and link
surfaces: one physical writer each, never a combined writer that paints a region it does not own. **Colour
eligibility** is per actual trigger, link or popup paint region. DOM focus/focus-within or that region's own invalid
state cancels its colour clock and settles all its declared paint immediately; other regions keep their own clock,
and interpolation only runs on a palette the component can verify. This rule does not cancel the distinct chevron,
changed-text, content-switch or geometry actions.

The separately exported `NavigationMenuIndicator` keeps its Base UI Icon semantics and native placement. Cadence
does not turn it into a moving selection marker, and the shipped arrow carries no paint token of its own, so it adds
no colour writer.

## Choreography and modes

| Trigger / owner                                   | Full                                                                                                                                                                                              | Reduced                                              | None                                | Binding → preset → recipe/form                                                                                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First open / final close; Positioner-hosted popup | Opacity and a `distance.xs` approach from the resolved side on entry, opacity-only exit; the positioner stays authoritative and no extra scale is added. Entry obeys the actual-focus gate below. | Short opacity only; entry obeys the same focus gate. | Immediate visibility.               | `navigation-menu.popup.enter` → `presence.menu` → `popup.anchored/presence`; `navigation-menu.popup.exit` → `presence.exit` → `exit.fade/opacity`                                                                                      |
| Active item changes / shared shell                | Clamped width and height follow the latest destination without bounce; a destination the primitive has not supplied stays native.                                                                 | Destination dimensions immediately.                  | Destination dimensions immediately. | `navigation-menu.viewport.resize` → `geometry.panel` → `geometry.resize/measured`                                                                                                                                                      |
| Active item changes / shared viewport layer       | Opacity plus `distance.xs` travel along the actual item order and writing direction; an unknown, simultaneously reordered or space-constrained direction uses opacity only.                       | Short opacity only.                                  | Active content immediately.         | `navigation-menu.content.change` → `content.switch` → `data.transition/directional-content`                                                                                                                                            |
| Open state / existing trigger chevron             | The chevron turns by `rotation.halfTurn` between closed and open; no opacity and no scale effect.                                                                                                 | Final orientation immediately; no fade.              | Final orientation immediately.      | `navigation-menu.indicator.change` → `state.indicator` → `state.morph/indicator`                                                                                                                                                       |
| Trigger/link state and owned plain labels         | Scoped surface colour on the trigger and the link, plus the trigger's own label colour, and changed graphemes only with `stagger: none`.                                                          | Short colour and changed-run opacity only.           | Both immediately.                   | `navigation-menu.item.colour` → `state.color` → `state.color/surface-foreground`; `navigation-menu.link.colour` → `state.color` → `state.color/surface`; `navigation-menu.label.replace` → `text.replace` → `text.change/changed-runs` |
| Direct displayed quantity in the active content   | Roll changed places only; the same slot never also runs text replacement on its formatted digits.                                                                                                 | Final quantity immediately.                          | Final quantity immediately.         | `navigation-menu.value.change` → `number.compact` → `number.roll/reels`                                                                                                                                                                |
| Popup token changes / the popup's painted region  | Scoped background, border, shadow and foreground paint. Colour eligibility and immediate-owner priority follow the rule above.                                                                    | Short colour. Colour obeys the same priority.        | Final paint immediately.            | `navigation-menu.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                    |

`popup`, `viewport` and `content` all anchor to `NavigationMenuPositioner` because that export renders the internal
Popup/Viewport pair: `NavigationMenuContent` supplies the active item's content, not a second popup. The shared inner
Viewport is the one switch-paint layer — Base UI portals the active content into it — so a switch never installs one
writer per item. One shell owns the same-cause size:
the popup animates its width/height and the positioner takes the destination immediately, so the two are never
tweened independently. Content travel is a second visual transform inside the viewport, never the same transform as
the popup entrance and never a rewritten positioner coordinate.

## Interruption and lifecycle

Pointer opening can keep focus on a trigger outside the popup and retain the designed surface entry. When keyboard
focus or activation reaches a link or control inside entering or switching content, only the affecting popup/content
envelope settles before that target is presented. Base UI's actual focus and intent policy is kept: Cadence never
forces focus outside merely to play motion.

- Pointer movement across triggers retargets the shared surface; it does not queue panel exits. A close/reopen interrupts from the current surface state with the latest active content.
- Base UI continues to own hover intent, dismiss timing, focus guards, portal lifecycle and keyboard navigation. No animation timer delays selection, navigation or focus restoration.
- First opening runs popup presence only; switching an already open item runs `content.switch` only. Popup and content opacity/transform are never multiplied for one cause.
- Cadence retains no outgoing content visual: an inactive `keepMounted` panel stays Base UI's own hidden, inert node and receives no Cadence switch paint, so an obsolete menu can never remain actionable. Closing the root cancels content switches before the portal leaves.
- Live reduced cancels travel and size and resolves the permitted opacity under the new mode; none or a zero clock reaches the destination paint and geometry immediately. Returning to full does not reopen or replay the menu.
- Unmount cancels presence, geometry, content and colour writers, releases observers, and lets Base UI complete its closing protocol without retaining focus or an orphaned portal.

Dispatch a direct plain trigger, link or content string to the text owner and a supported direct numeric content
child to the numeric owner; changing renderer type establishes an immediate baseline. Rich children and `render`
callbacks keep their composed owners. Screen-reader-only content updates immediately.

## Geometry and performance

- Separate Base UI's positioner coordinates from the popup's visual transform and measured shell size. Never animate `sideOffset`/`alignOffset`, and never interpolate across a collision flip.
- One natural-content observer and one shell writer for width and height; the inner Viewport stays the primitive's measured child and keeps its existing overflow policy.
- The destination is the currently committed active content, including a real loading/error fallback. A later resolution under the same active host is a content revision, not another item switch; a resolution after that item closed cannot size the current menu.
- The destination is consumed from the dimensions the primitive supplies rather than from this writer's interpolated box. A supplied destination that cannot preserve the separation settles that axis natively.
- Lay the destination content at its final constrained width before height is measured; text never rewraps through intermediate widths. Passive viewport, font or scrollbar reflow settles immediately instead of animating.
- Clip the content transition inside the surface without clipping focus rings, pointer corridors or nested portals; travel is only painted where the surface actually has room around the active content, otherwise the switch is opacity only. Measure only the active content and never a hidden copy of the whole menu.
- A focused native editor takes priority when geometry would move its caret or content box; the affected axis settles while unrelated paint may continue.

## Acceptance scenarios

- Switch among items whose destination sizes differ while the viewport resizes; only the latest destination is
  applied, with no repeated content entrance, stale size or measurement loop.
- Move rapidly between differently sized items, reverse direction, and leave and reopen during a size revision;
  only the latest panel remains interactive and no queued exit delays the newest surface.
- Open with pointer while focus stays on a trigger, then keyboard-enter a link during entry; the surface entry may
  continue, but the envelope that affects the focused link settles immediately.
- Verify the first open runs presence only, an already open switch runs the content cause only, and removing or
  reordering the active item leaves exactly one size owner and one content writer.
- Verify SSR and hydration render readable content without replaying hidden updates, and that all three modes, a live
  downgrade, a zero clock and unmount leave no orphaned portal, retained focus target or running writer.
- Change only a direct trigger string, then a direct content quantity, then a numeric-looking label; confirm
  exact accessible/copyable text, changed-run identity and no inferred numeric origin.
- Change the popup palette and the trigger open state independently; the chevron turns, the native Indicator stays a
  static arrow, and only the Positioner-hosted popup paint enters.
- Verify keyboard traversal, nested links, RTL travel direction, custom `render` and collision near each edge keep
  native placement, focus and link activation intact in every mode.
