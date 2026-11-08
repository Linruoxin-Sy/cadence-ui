# Sidebar motion contract

Status: target design; implementation and verification pending.

Sidebar preserves spatial orientation while changing how much navigation is exposed. Offcanvas mode moves the existing desktop container; icon mode changes the occupied width and reveals labels only when space is usable. Mobile delegates to its existing Sheet composition. Route changes do not replay the sidebar.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This covers the current provider, sidebar, trigger, rail, inset, group/menu/submenu and related parts; it adds no navigation or persistence API.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "container": ["sidebar#Sidebar"],
    "gap": ["sidebar#Sidebar"],
    "labels": ["sidebar#SidebarMenuButton", "sidebar#SidebarGroupLabel"],
    "mobile": ["sheet#SheetContent"],
    "item": [
      "sidebar#SidebarMenuButton",
      "sidebar#SidebarMenuAction",
      "sidebar#SidebarRail",
      "sidebar#SidebarGroupAction",
      "sidebar#SidebarMenuSubButton"
    ],
    "label": [
      "sidebar#SidebarMenuButton",
      "sidebar#SidebarGroupLabel",
      "sidebar#SidebarMenuSubButton",
      "sidebar#SidebarMenuBadge"
    ],
    "badge": ["sidebar#SidebarMenuBadge"],
    "surface": [
      "sidebar#Sidebar",
      "sidebar#SidebarInset",
      "sidebar#SidebarGroupLabel",
      "sidebar#SidebarMenuBadge",
      "sidebar#SidebarMenuSub"
    ],
    "action": ["sidebar#SidebarMenuAction"],
    "inherited": [
      "sidebar#SidebarTrigger",
      "sidebar#SidebarInput",
      "sidebar#SidebarSeparator",
      "sidebar#SidebarMenuSkeleton"
    ]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                          | References                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Appearance      | Default: desktop offcanvas visibility belongs to the container; mobile appearance is inherited from Sheet. Initial rendered navigation is visible in its semantic state.                                                                         | default: `sidebar.container.offcanvas`, `sidebar.labels.enter`, `sidebar.labels.exit`, `sidebar.action.enter`, `sidebar.action.exit`; inherited: `sidebar.mobile.enter`, `sidebar.mobile.exit`, `@inherited` |
| Size            | Default for an explicit desktop collapse/expand: one coordinator owns the sidebar container and layout-gap destination. `collapsible="none"` and passive responsive changes stay native/immediate.                                               | default: `sidebar.gap.resize`, `sidebar.container.resize`                                                                                                                                                    |
| Surface colour  | Default: menu/action/rail interaction paint and actual sidebar/inset/submenu surfaces. SidebarTrigger/Input/Separator/MenuSkeleton delegate to their installed Button/Input/Separator/Skeleton contracts; mobile surface paint belongs to Sheet. | default: `sidebar.item.colour`, `sidebar.surface.colour`; inherited: `@inherited`, `@mobile`                                                                                                                 |
| Text colour     | Default: menu/action state foreground, group labels and menu badges; inherited control and mobile foreground keep their own owner.                                                                                                               | default: `sidebar.item.colour`, `sidebar.surface.colour`; inherited: `@inherited`, `@mobile`                                                                                                                 |
| Changed text    | Default: plain group/menu labels and string MenuBadge children use changed-run replacement; numeric MenuBadge children choose reels instead. Header/Footer/Content/GroupContent rich trees are composed; SidebarInput stays native.              | default: `sidebar.label.replace`; composed: `@label`; inherited: `@inherited`                                                                                                                                |
| Changed numbers | Default for a plain numeric `SidebarMenuBadge`; formatted/rich badges require an explicit composed numeric owner. Digit-containing menu names are text.                                                                                          | default: `sidebar.badge.change`; composed: `@badge`                                                                                                                                                          |

## Choreography and modes

| Trigger and owner                                           | Full                                                                                                                                                       | Reduced                                                                                | None                            | Binding → preset → recipe                                                                                                                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop offcanvas open state; container and gap coordinator | Side-aware container translation is projected from the same clamped gap progress; one scalar/transaction preserves matching visible and occupied space.    | Final position/gap immediately.                                                        | Final position/gap immediately. | `sidebar.container.offcanvas` → `layout.sidebar` → `layout.move/size-linked`; `sidebar.gap.resize` → `geometry.compact` → `geometry.resize/measured`                                                             |
| Desktop icon collapse; occupied-width coordinator           | Clamped width transition to actual expanded/icon geometry.                                                                                                 | Final widths immediately.                                                              | Final widths immediately.       | `sidebar.container.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                     |
| Icon collapse/expand; existing group/menu label paint       | Fade before clipping on collapse; reveal once destination space is usable. This is geometry coordination, not a semantic delay.                            | Final layout with short opacity where useful.                                          | Final visibility immediately.   | `sidebar.labels.enter` → `presence.inline` → `data.transition/opacity`; `sidebar.labels.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |
| Mobile open/close; composed Sheet                           | Inherit Sheet entry/exit; no desktop animation runs as well.                                                                                               | Inherit Sheet opacity-only path.                                                       | Immediate Sheet target.         | `sidebar.mobile.enter` → `presence.sheet` → `popup.anchored/edge`; `sidebar.mobile.exit` → `presence.sheet-exit` → `popup.anchored/edge-exit`                                                                    |
| Menu/rail state; owned labels/counts                        | Eligible scoped colour under the actual-region gate below, changed label runs, and place-value rolling for numeric badges.                                 | Eligible short colour under the same gate and changed-run opacity; counts immediately. | All immediately.                | `sidebar.item.colour` → `state.color` → `state.color/surface-foreground`; `sidebar.label.replace` → `text.replace` → `text.change/changed-runs`; `sidebar.badge.change` → `number.compact` → `number.roll/reels` |
| Sidebar/inset/submenu and label/badge token changes         | Eligible scoped surface/border/foreground colour on the actual region under the gate below; inherited Input/Button/Separator/Skeleton paint executes once. | Eligible short colour under the same gate.                                             | Final paint immediately.        | `sidebar.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                      |
| Existing showOnHover action visibility / MenuAction paint   | Short opacity for pointer reveal/hide; focus/open state exposes action immediately. Collapse semantics remain authoritative.                               | Short pointer opacity; focus immediate.                                                | Final visibility immediately.   | `sidebar.action.enter` → `presence.inline` → `data.transition/opacity`; `sidebar.action.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |

`surface.colour` owns the sidebar shell/inset/submenu border and non-item group-label/badge paint;
`item.colour` owns menu/action/rail interaction regions, including the Rail's existing pseudo-element.
Their property regions do not overlap. A badge string is a display string, never parsed as a count;
a direct supported numeric badge uses `badge.change`. SidebarMenuSkeleton inherits Skeleton's loop,
mode and visibility policy; SidebarTrigger and SidebarInput keep native Button/Input contracts.
Header/Footer/Content/GroupContent are structural child hosts, not a recursively rewritten text model.
The labels binding covers the GroupLabel and MenuButton label regions only; MenuAction collapse/hover paint stays with its action owner rather than joining that envelope.
MenuAction's hover visibility and collapse visibility have one opacity owner: focus/open state settles
its usable presentation immediately, and collapse/teardown invalidates a pending hover completion.

Each actual shell/inset/submenu, item/action/rail and label/badge paint region follows the [shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership). DOM focus/focus-within or a region's own invalid state cancels its colour clock and settles all its declared paint, including the actual containing shell regions of a focused control. Disjoint regions remain eligible for verified colour feedback; a route's active state alone is not DOM focus. Inherited Input/Button owners apply the same priority without an extra sidebar writer.

## Interruption and lifecycle

- Rapid toggle reverses one current scalar driving container/gap geometry; two springs with matching nominal durations are not equivalent. Resolve direction and expanded/icon extents from the actual side/variant and width variables. Keep controlled/uncontrolled provider state, mobile state, keyboard shortcut and existing persistence semantics authoritative.
- A breakpoint change cancels desktop motion before activating mobile Sheet, or vice versa. Do not copy an in-flight desktop transform into mobile presentation.
- Collapsed labels/actions cannot leave invisible focus targets; preserve the primitive's actual keyboard and tooltip behaviour. Route selection updates active state without replaying presence.
- Unmount cancels local writers and releases inherited owners. Live reduced settles the coupled container/gap geometry and badge reels before paint, while eligible label/action opacity, changed-run opacity and colour reconcile under their reduced contracts; a semantically collapsed label is not revealed to preserve a fade. None or zero recipe clock settles one-shot presentation to the effective mode's current geometry and visibility. Mobile Sheet keeps its own native completion protocol, and Skeleton retains its separate theme-clock rules.
- Positive clock changes follow the shared capture-or-retime policy: retime the existing coupled size/translation scalar rather than splitting its owners, while short paint retains its captured clock. Returning to full does not replay a consumed collapse, label update or mobile entrance.

## Geometry and performance

The continuous page-inset reflow below remains subordinate to the shared focused-editor rule.
Before a known collapse transaction, check the actual owned Sidebar/Inset focus region: if the
coupled change would move an editor's caret/content box/scroll extent, clip its required content or
displace a captured native control, settle the affected container/gap/inset transaction together.
Settling only the gap while the container keeps travelling breaks their one-scalar contract. A
stationary toggle outside that affected geometry does not automatically suppress the transition.
Do not scan arbitrary application descendants, move focus or replay the suppressed toggle on blur;
an unsupported caller layout takes the existing immediate geometry fallback.
Focus or capture acquired during an active collapse applies the same gate before the next paint;
native editing/input does not wait for the coupled scalar to finish.

Use the existing sidebar width variables and side/variant rules, not text measurement or new width constants. One coordinator commits the gap and visible-container targets together: geometry.compact owns the width result and layout.sidebar projects the corresponding translation from that same scalar, with one writer per property. Neither uses the other's intermediate layout as a new target. Icon collapse uses the same transaction to map container/gap widths, including floating/inset padding and borders. A passive viewport, side, available-space or width-token change cancels obsolete projections and resolves current semantic geometry immediately; a subsequent deliberate toggle starts from that valid geometry. Desktop width change is an explicit shell resize, not observation of every menu row. Clip labels within their own region while keeping the rail, trigger focus rings and portals usable. Submenu and content owners do not cause the sidebar shell to chase their intermediate heights. Preserve scrolling and native input editing.

Navigation labels lay out at their destination inline-size before the separate shell/gap changes width; do not rewrap them on every frame. The page inset may continuously reflow with the changing occupied gap because it must reflect the actual available page width; do not scale its text or add a second inset spring. Mobile delegates natural-content measurement and reflow policy to Sheet.

## Acceptance scenarios

- Pending: collapse from an external control while a SidebarInput or known Inset editor remains
  focused, and toggle during a captured resize/control interaction. The dependent scalar settles
  without caret/scroll drift or mismatched gap/container geometry. Compare a stationary trigger
  with no affected editor: its eligible collapse still runs. Blur never replays a discarded toggle.
  Also acquire editor focus midway through an otherwise eligible collapse and verify cancellation
  of all dependent geometry without delaying that focus or clearing the native interaction.

- Pending: reverse offcanvas/icon transitions for both sides and all variants; inspect matching container and page gap geometry.
- Pending: resize across the mobile breakpoint during motion, reopen Sheet and navigate a route; no double entrance or stale transform remains.
- Pending: change a plain badge/label, use sidebar-input and keyboard navigation while collapsed, and verify accessibility/hit regions.
- Pending: verify all modes, zero clock, live downgrade, SSR initial state and unmount during desktop/mobile exit.
- Pending: change side, width tokens or available space during a toggle, including floating/inset variants. Inspect coupled gap/translation progress rather than only matching completion times; no old-direction write or temporary page overlap may survive.

- Pending: update string and numeric badges, showOnHover actions and inherited menu skeletons while collapsing or changing theme/mode; no duplicate colour/pulse, invisible focused action or stale hover completion survives.
- Pending: switch to reduced during collapse plus label/action/text feedback, and edit a positive clock mid-toggle. Coupled geometry stays coherent, permitted short paint remains eligible, collapsed content stays hidden and no owner restarts from an old target. None/zero settles one-shot work without breaking native Sheet completion or substituting the recipe clock for Skeleton's theme clock.
- Pending: focus a menu action or SidebarInput during shell/item theme feedback, then invalidate an actual owner. Its whole paint and the paint of actual focused-containing regions settle; an independent rail/badge may continue eligible colour, without treating route-active state as focus.
