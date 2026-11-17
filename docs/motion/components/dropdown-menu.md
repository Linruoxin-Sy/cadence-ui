# Dropdown Menu motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

The menu presents available actions together. Local highlighting, selection marks and the popup shells respond
quickly, while submenus remain attached to their own row anchors. One anchored presence, one measured shell and
scoped colour owners extend Base UI's menu engine instead of adding a second transform engine. This contract
inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not
recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["dropdown-menu#DropdownMenuContent"],
    "item": [
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger"
    ],
    "surface": ["dropdown-menu#DropdownMenuContent"],
    "foreground": ["dropdown-menu#DropdownMenuLabel", "dropdown-menu#DropdownMenuShortcut"],
    "separator": ["dropdown-menu#DropdownMenuSeparator"],
    "label": [
      "dropdown-menu#DropdownMenuItem",
      "dropdown-menu#DropdownMenuCheckboxItem",
      "dropdown-menu#DropdownMenuRadioItem",
      "dropdown-menu#DropdownMenuSubTrigger",
      "dropdown-menu#DropdownMenuLabel",
      "dropdown-menu#DropdownMenuShortcut"
    ],
    "indicator": ["dropdown-menu#DropdownMenuCheckboxItem", "dropdown-menu#DropdownMenuRadioItem"],
    "position": ["dropdown-menu#DropdownMenuContent"],
    "quantity": ["dropdown-menu#DropdownMenuItem", "dropdown-menu#DropdownMenuLabel"],
    "rich": ["dropdown-menu#DropdownMenuItem", "dropdown-menu#DropdownMenuLabel"]
  },
  "regions": {
    "content": ["dropdown-menu-content"],
    "item": [
      "dropdown-menu-item",
      "dropdown-menu-checkbox-item",
      "dropdown-menu-radio-item",
      "dropdown-menu-sub-trigger"
    ],
    "surface": ["dropdown-menu-content"],
    "foreground": ["dropdown-menu-label", "dropdown-menu-shortcut"],
    "separator": ["dropdown-menu-separator"],
    "label": [
      "dropdown-menu-item-text",
      "dropdown-menu-checkbox-item-text",
      "dropdown-menu-radio-item-text",
      "dropdown-menu-sub-trigger-text",
      "dropdown-menu-label-text",
      "dropdown-menu-shortcut-text"
    ],
    "indicator": ["dropdown-menu-checkbox-item-mark", "dropdown-menu-radio-item-mark"],
    "position": ["dropdown-menu-content"],
    "quantity": ["dropdown-menu-item", "dropdown-menu-label"],
    "rich": ["dropdown-menu-item", "dropdown-menu-label"]
  },
  "axes": { "content": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                        | References                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `dropdown-menu-content` owns one anchored presence on its own visual layer. `DropdownMenuSubContent` renders the same exported surface, so each submenu branch gets its own controller instance and slot from that one implementation rather than a second writer. Rows inherit the shell entrance. | default: `dropdown-menu.content.enter`, `dropdown-menu.content.exit`                                    |
| Size            | Default: the popup shell owns intentional natural width/height changes within the available space; the positioner owns placement.                                                                                                                                                                            | default: `dropdown-menu.content.resize`                                                                 |
| Surface colour  | Default: content owns its popup background, border and scoped shadow; Item, CheckboxItem, RadioItem and SubTrigger own pointer-highlight, checked, disabled and destructive surfaces; Separator owns its rule.                                                                                               | default: `dropdown-menu.item.colour`, `dropdown-menu.surface.colour`, `dropdown-menu.separator.colour`  |
| Text colour     | Default: the four row parts own their own foreground, while Label and Shortcut own theirs. Keyboard focus indication is immediate.                                                                                                                                                                           | default: `dropdown-menu.item.colour`, `dropdown-menu.surface.colour`, `dropdown-menu.foreground.colour` |
| Changed text    | Default for a plain owned item, group-label or shortcut string: changed graphemes only. Rich item and label content keeps its explicit composed owners instead of being split.                                                                                                                               | default: `dropdown-menu.label.change`; composed: `@rich`                                                |
| Changed numbers | Composed: an explicit `AnimatedNumber` child may roll its count under its own contract; command names, shortcuts and radio values remain identities rather than inferred numbers.                                                                                                                            | composed: `@quantity`                                                                                   |

`item.colour` is the sole surface/foreground controller on Item, CheckboxItem, RadioItem and SubTrigger, merging
pointer, checked, disabled, destructive and theme targets. Keyboard highlight is immediate. `surface.colour` owns
the distinct popup shell, and `foreground.colour` owns Label and Shortcut; `separator.colour` owns the rule. None of
them writes the other's properties or regions. Actual DOM focus/focus-within or a region's own invalid state cancels
that region's colour clock and settles all its declared paint immediately; an independent region keeps its own
clock. Highlighted or active-descendant state alone is not DOM focus, and a caller palette this surface cannot verify
settles immediately.

Each label binding includes checkbox, radio and sub-trigger children; the generated check/radio marker and chevron
glyphs remain separate from that text slot. The menu's side approach is selected by this contract, with an
opacity-only fallback for an invalidated placement or an interaction that requires an immediately stationary target.

## Choreography and modes

| Trigger / owner                                                                          | Full                                                                                                                                                                   | Reduced                                                      | None                        | Binding → preset → recipe/form                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu/submenu opens / its content                                                         | Opacity with `distance.xs` along the resolved side; all items are ready together. Entry is subject to the actual-focus gate below.                                     | Short opacity only. Entry obeys the same focus gate.         | Open target immediately.    | `dropdown-menu.content.enter` → `presence.menu` → `popup.anchored/presence`                                                                                                                                                               |
| Menu/submenu closes / its content                                                        | Opacity exit only, with no inherited entrance delay.                                                                                                                   | Short opacity.                                               | Closed target immediately.  | `dropdown-menu.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                      |
| Pointer highlight / active item                                                          | Scoped background/foreground transition local to the item; no travelling row plate. Colour eligibility and immediate-owner priority follow the rule above.             | Short colour feedback. Colour obeys the same owner priority. | Final colours immediately.  | `dropdown-menu.item.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                            |
| Supplied tokens/disabled/destructive state / popup, label, shortcut and separator owners | Scoped surface/border/foreground colour; one owner per property and immediate focus visibility. Colour eligibility and immediate-owner priority follow the rule above. | Short colour. Colour obeys the same owner priority.          | Final colours immediately.  | `dropdown-menu.surface.colour` → `state.color` → `state.color/surface-foreground`; `dropdown-menu.foreground.colour` → `state.color` → `state.color/foreground`; `dropdown-menu.separator.colour` → `state.color` → `state.color/surface` |
| Keyboard navigation / Base UI item focus                                                 | Focus and highlight place immediately; no lag behind arrow/typeahead input.                                                                                            | Immediate.                                                   | Immediate.                  | `dropdown-menu.item.focus` → `engine.native` → `native/base-ui-menu` (Base UI Menu focus/typeahead (no new recipe))                                                                                                                       |
| Checkbox/radio change / corresponding item indicator                                     | Local opacity and `scale.in` marker change; each checkbox remains independent and radio change is one coordinated old/new transaction.                                 | Opacity only.                                                | Final marks immediately.    | `dropdown-menu.indicator.select` → `state.indicator` → `state.morph/indicator`                                                                                                                                                            |
| Menu structure/label width changes / content shell                                       | Clamped measured width/height; active item and scroll remain stable.                                                                                                   | Final geometry immediately.                                  | Final geometry immediately. | `dropdown-menu.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                                          |
| Plain displayed label/shortcut / text owner                                              | Retain unchanged graphemes; `stagger: none`.                                                                                                                           | Changed-run opacity only.                                    | Final text immediately.     | `dropdown-menu.label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                |
| Anchor/collision change / positioner                                                     | Correct the open branch's placement immediately; cancel an obsolete approach direction.                                                                                | Same placement.                                              | Same placement.             | `dropdown-menu.position.place` → `engine.native` → `native/base-ui-menu` (Base UI Menu positioning (no new recipe))                                                                                                                       |

Both the root menu and every submenu use the same `DropdownMenuContent` export and the same
`content.enter`/`content.exit`/`content.resize` actions: each mounted branch is its own controller instance with its
own committed slot, so no second implementation or duplicate binding is introduced. Composed quantities are not an
action of this component; an explicit child display owns them (`@quantity`).

## Interruption and lifecycle

Top-level Base UI Menu opening normally focuses the menu/list or an item. If the actual target would remain inside a
faded/displaced entrance, settle that branch's envelope before presenting focus; default opening may therefore omit
its approach/fade. Pointer-opened submenus can retain entry while focus remains in the parent, until focus or
activation actually reaches the submenu. Do not postpone native focus or alter submenu intent delays to force motion.

- Base UI owns open state, roving focus, typeahead, close-on-click, submenu intent and the actual unmount protocol.
  Actions execute immediately; checkbox/radio persistence follows existing props rather than an animation policy.
- New highlight/selection replaces the previous target. A submenu opens from its current anchor; switching rows does
  not move an old popup through the menu.
- Closing a branch cancels its text/size/indicator work; root closure invalidates obsolete nested decoration
  callbacks, not the current Base UI exit protocol. A surviving closing branch still completes its required native
  cleanup; a retired completion cannot reopen a branch, restore stale focus or affect a newer owner. Reopening
  reverses only the current boundary, without resurrecting stale descendants.
- Live reduced cancels travel/size/scale; none and zero clock cancel authored clocks and finish the current branch
  through Base UI's actual exit-completion protocol. Native keyboard/pointer/scroll operation is retained, not
  cancelled with presentation. Unmount unregisters anchors, observations and controllers.
- Async availability/label changes received while closed update the next menu without replaying hidden work.
  Controlled checked/open state changes only when accepted; new open revisions invalidate stale callbacks. An
  exiting submenu cannot restore old focus or selection over a reopened parent.

## Geometry and performance

- One measurement per open popup shell. Lay text at the final target width before measuring height and animate only
  that shell; passive viewport/font reflow and collision flips are immediate.
- Positioner coordinates never share a writer with visual approach. Submenu width and parent width remain distinct
  owners; neither observes the other's interpolated box.
- Only open visible branches animate, with no per-row entrance or observer. Each naturally measured popup shell is
  one geometry visual; its static item count does not become a collection-animation count.
- Clip decorative/content size lanes only; keep focus rings, submenu portals, scroll affordances and disabled-item
  hit rules intact.
- Observe natural menu content separately from its size host, clamping valid non-negative dimensions and never
  narrowing the shell below its own natural box. A growing menu must immediately expose its focused/active item
  through existing legal scrolling; otherwise settle the affected size axis. Same-cause nested geometry contributes
  a destination, not per-frame ancestor retargeting.

## Acceptance scenarios

Executed in `tests/components/dropdown-menu.test.tsx`: the anchored entrance and exit, the measured shell revision,
changed plain item/label/shortcut strings, the per-row surface-foreground palette, the popup surface and the
label/shortcut foreground and separator rule owners, the checkbox/radio indicator revision, and the native Base UI
focus/typeahead and positioning boundaries plus the composed quantity and rich-content boundaries. Each action runs
in full, reduced and none, and every composed/native region is verified as a static boundary that holds no live
writer while the menu and its items are mounted.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in a real
browser, pointer traversal versus keyboard/typeahead navigation, checkbox/radio updates and close-on-click,
open nested branches while labels and item availability change, close/reopen mid-resize, collision flips, large menus,
partial shortcut updates, open by pointer and keyboard then a pointer-hover submenu, close the root while a submenu is
already exiting, SSR/no-JS/hydration probes, keyboard focus and return focus, light/dark and narrow/wide screenshots.
jsdom has no layout engine and no pointer geometry, so the shell measurement and the anchor-side approach are proven
here by their committed revision, source and property policy rather than by rendered geometry.

Delegation gaps are recorded rather than hidden: Base UI owns mounting, placement, roving focus, typeahead, submenu
intent and the native unmount protocol; the measured owner animates only a known content revision while the menu is
open; composed quantity and rich item content keep their own owners; no performance, CLS, interaction-cost or
real-device FPS measurement was taken (ADR-023 defers performance governance).
