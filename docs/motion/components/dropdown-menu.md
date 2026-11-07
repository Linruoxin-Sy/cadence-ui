# Dropdown Menu motion contract

Status: target design; implementation and verification pending.

The menu presents available actions together. Local highlighting and selection marks respond quickly, while submenus remain attached to their own row anchors. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `dropdown-menu-content` and each `dropdown-menu-sub-content` own their distinct popup presence; rows inherit their surface entrance. |
| Size | Default: each popup shell owns intentional natural menu width/height changes within available space; the positioner owns placement. |
| Surface colour | Default: content, item and sub-trigger own popup, pointer-highlight, checked and disabled surface/border tokens. |
| Text colour | Default: item/label/shortcut/sub-trigger own foreground, destructive and disabled transitions. Keyboard focus indication is immediate. |
| Changed text | Default for plain owned item, group label and shortcut strings: changed runs only. Rich menu content keeps explicit composed owners. |
| Changed numbers | Composed: explicit counts can roll; command names, shortcuts and radio values remain identities rather than inferred numbers. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Menu/submenu opens / its content | Opacity with optional `distance.xs` along resolved side; all items are ready together. | Short opacity only. | Open target immediately. | `dropdown-menu.content.enter` → `presence.menu` → `popup.anchored`; `dropdown-menu.sub-content.enter` → `presence.menu` → `popup.anchored` |
| Menu/submenu closes / its content | Opacity exit only, with no inherited entrance delay. | Short opacity. | Closed target immediately. | `dropdown-menu.content.exit` → `presence.exit` → `exit.fade`; `dropdown-menu.sub-content.exit` → `presence.exit` → `exit.fade` |
| Pointer highlight / active item | Scoped background/foreground transition local to the item; no travelling row plate. | Short colour feedback. | Final colours immediately. | `dropdown-menu.item.colour` → `state.color` → target `state.color` |
| Supplied tokens/disabled/destructive state / popup, label, shortcut and item owners | Scoped surface/border/foreground colour; one owner per property and immediate focus visibility. | Short colour. | Final colours immediately. | `dropdown-menu.surface.colour` → `state.color` → target `state.color` |
| Keyboard navigation / Base UI item focus | Focus and highlight place immediately; no lag behind arrow/typeahead input. | Immediate. | Immediate. | `dropdown-menu.item.focus` → `engine.native` → Base UI Menu focus/typeahead (no new recipe) |
| Checkbox/radio change / corresponding item indicator | Local opacity and `scale.in` marker change; each checkbox remains independent and radio change is one coordinated old/new transaction. | Opacity only. | Final marks immediately. | `dropdown-menu.indicator.select` → `state.indicator` → `state.morph` |
| Menu structure/label width changes / content shell | Clamped measured width/height; active item and scroll remain stable. | Final geometry immediately. | Final geometry immediately. | `dropdown-menu.content.resize` → `geometry.compact` → `geometry.resize` |
| Plain displayed label/shortcut / text owner | Retain unchanged graphemes; `stagger: none`. | Changed-run opacity only. | Final text immediately. | `dropdown-menu.label.change` → `text.replace` → target `text.change` |
| Anchor/collision change / positioner | Correct each open branch's placement immediately; cancel obsolete approach direction. | Same placement. | Same placement. | `dropdown-menu.position.place` → `engine.native` → Base UI Menu positioning (no new recipe) |
| Explicit composed quantity / child owner | Roll changed places; never interpret shortcuts or radio values as quantities. | Final number immediately. | Final number immediately. | `dropdown-menu.quantity.change` → `number.compact` → revised `number.roll` |

## Interruption and lifecycle

- Base UI owns open state, roving focus, typeahead, close-on-click and submenu intent. Actions execute immediately; checkbox/radio persistence follows existing props rather than an animation policy.
- New highlight/selection replaces the previous target. A submenu opens from its current anchor; switching rows does not move an old popup through the menu.
- Closing a branch cancels its text/size/indicator work; root closure invalidates all nested exit callbacks. Reopening reverses only the current boundary, without resurrecting stale descendants.
- Live reduced cancels travel/size/scale; none and zero clock cancel authored clocks and finish the current branch through Base UI's actual exit-completion protocol. Native keyboard/pointer/scroll operation is retained, not cancelled with presentation. Unmount unregisters anchors and observations.
- Async availability/label changes received while closed update the next menu without replaying hidden work. Controlled checked/open state changes only when accepted; new open revisions invalidate stale callbacks. An exiting submenu cannot restore old focus or selection over a reopened parent.

## Geometry and performance

- One measurement per open popup shell. Lay text at the final target width before measuring height and animate only that shell; passive viewport/font reflow and collision flips are immediate.
- Positioner coordinates never share a writer with visual approach. Submenu width and parent width remain distinct owners; neither observes the other's interpolated box.
- Only open visible branches animate, with no per-row entrance or observer. Above the shared list budget, skip blanket measurement and keep native scrolling/visible-item work.
- Clip decorative/content size lanes only; keep focus rings, submenu portals, scroll affordances and disabled-item hit rules intact.
- Observe natural menu content separately from its size host, clamping valid non-negative dimensions. A growing menu must immediately expose its focused/active item through existing legal scrolling; otherwise settle the affected size axis. Do not temporarily truncate action labels or add an overflow policy merely to animate them. Same-cause nested geometry contributes a destination, not per-frame ancestor retargeting.

## Acceptance scenarios

- Pending: pointer traversal versus keyboard/typeahead navigation, checkbox/radio updates and close-on-click maintain immediate semantic behavior.
- Pending: open nested branches while labels and item availability change, then close/reopen root mid-resize without stale submenus.
- Pending: collision flips, large menus, partial shortcut updates, all modes, live downgrade and zero clock preserve placement/focus and cleanup.
- Pending: grow a required action label while keyboard focus enters it, reject a controlled checkbox change, and deliver async items after close; text stays readable and only current native exit/focus completions run.
