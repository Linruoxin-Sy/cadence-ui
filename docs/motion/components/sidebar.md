# Sidebar motion contract

Status: target design; desktop offcanvas/icon size-linked projection, a safe completion-gated plain-label envelope, the two paint regions (`sidebar.item.colour`, `sidebar.surface.colour`), the plain `showOnHover` action channel (`sidebar.action.enter`, `sidebar.action.exit`), changed plain labels/string badges (`sidebar.label.replace`), plain numeric badge reels (`sidebar.badge.change`) and the mobile Sheet composition are implemented. Each is exercised on its real parts with the actual-region gate and three-mode tests (`tests/components/sidebar.test.tsx`). The desktop container/gap geometry is proven on both sides, on the icon rail, on every variant, on an in-flight reversal, on a live downgrade and across a breakpoint change (`tests/e2e/sidebar-s1-geometry.spec.ts`); the changed label, changed count and mobile Sheet matrix is recorded in `.cache/sidebar-s3/`. Migration remains legacy: `meta.motionMigration` is not set because the desktop geometry, label-envelope and mobile bindings still have no executed v2 action receipts, only the shipped legacy contract.

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
| Icon collapse/expand; existing group/menu label paint       | Fade only while the label lane is usable; settle paint if clipping overtakes it. Reveal on expansion once destination-visible content fits.                | Final layout with short opacity where useful.                                          | Final visibility immediately.   | `sidebar.labels.enter` → `presence.inline` → `data.transition/opacity`; `sidebar.labels.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |
| Mobile open/close; composed Sheet                           | Inherit Sheet entry/exit; no desktop animation runs as well.                                                                                               | Inherit Sheet opacity-only path.                                                       | Immediate Sheet target.         | `sidebar.mobile.enter` → `presence.sheet` → `popup.anchored/edge`; `sidebar.mobile.exit` → `presence.sheet-exit` → `popup.anchored/edge-exit`                                                                    |
| Menu/rail state; owned labels/counts                        | Eligible scoped colour under the actual-region gate below, changed label runs, and place-value rolling for numeric badges.                                 | Eligible short colour under the same gate and changed-run opacity; counts immediately. | All immediately.                | `sidebar.item.colour` → `state.color` → `state.color/surface-foreground`; `sidebar.label.replace` → `text.replace` → `text.change/changed-runs`; `sidebar.badge.change` → `number.compact` → `number.roll/reels` |
| Sidebar/inset/submenu and label/badge token changes         | Eligible scoped surface/border/foreground colour on the actual region under the gate below; inherited Input/Button/Separator/Skeleton paint executes once. | Eligible short colour under the same gate.                                             | Final paint immediately.        | `sidebar.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                      |
| Existing showOnHover action visibility / MenuAction paint   | Short opacity for pointer reveal/hide; focus/open state exposes action immediately. Collapse semantics remain authoritative.                               | Short pointer opacity; focus immediate.                                                | Final visibility immediately.   | `sidebar.action.enter` → `presence.inline` → `data.transition/opacity`; `sidebar.action.exit` → `presence.exit` → `exit.fade/opacity`                                                                            |

`surface.colour` owns the sidebar shell/inset/submenu border and non-item group-label/badge paint;
`item.colour` owns menu/action/rail interaction regions, including the Rail's existing line. Their
property regions do not overlap. The Rail draws that line as its own `data-sidebar="rail-line"`
element so the colour clock has one real owner instead of an unreachable pseudo-element. A badge
string is a display string, never parsed as a count; a direct supported numeric badge uses
`badge.change`. SidebarMenuSkeleton inherits Skeleton's loop, mode and visibility policy;
SidebarTrigger and SidebarInput keep native Button/Input contracts.
Header/Footer/Content/GroupContent are structural child hosts, not a recursively rewritten text model.
The labels binding covers the GroupLabel and MenuButton label regions only; MenuAction collapse/hover paint stays with its action owner rather than joining that envelope. Collapse visibility stays
CSS-authored (`group-data-[collapsible=icon]:hidden`) so the sidebar never owns a second opacity.
The lane itself is published once as a provider fact — desktop expanded, or the mobile Sheet open —
so a label settles its current value instead of re-reading geometry or starting work it cannot finish.
A MenuButton label that is a direct primitive or a final plain span keeps the caller's element and
ref; a caller-authored tree (links, refs, selection, extra siblings) is composed and keeps native
text. A plain numeric badge rolls changed places; a formatted badge string stays text and a
formatted/rich numeric badge needs an explicit composed owner.
MenuAction's hover visibility and collapse visibility have one opacity owner: focus/open state settles
its usable presentation immediately, and collapse/teardown invalidates a pending hover completion.

Each actual shell/inset/submenu, item/action/rail and label/badge paint region follows the
[shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership). DOM focus/focus-within
or a region's own invalid state cancels its colour clock and settles all its declared paint, including
the actual containing shell regions of a focused control. The regions are the part itself for the shell,
inset, submenu, item, action and rail, the group for a group label, and the row for a badge or an action,
so a focused row settles its own label/badge/action paint while an unrelated region stays eligible for
verified colour feedback; a route's active state alone is not DOM focus. The per-cause gate value is
also read at commit time, because the CSS owner's insertion fast path runs before its connection.
Inherited Input/Button owners apply the same priority without an extra sidebar writer.

## Interruption and lifecycle

- Rapid toggle reverses one current scalar driving container/gap geometry; two springs with matching nominal durations are not equivalent. Resolve direction and expanded/icon extents from the actual side/variant and width variables. Keep controlled/uncontrolled provider state, mobile state, keyboard shortcut and existing persistence semantics authoritative.
- A breakpoint change cancels desktop motion before activating mobile Sheet, or vice versa. Do not copy an in-flight desktop transform into mobile presentation.
- Collapsed labels/actions cannot leave invisible focus targets; preserve the primitive's actual keyboard and tooltip behaviour. Route selection updates active state without replaying presence.
- Unmount cancels local writers and releases inherited owners. Live reduced settles the coupled container/gap geometry and badge reels before paint, while eligible label/action opacity, changed-run opacity and colour reconcile under their reduced contracts; a semantically collapsed label is not revealed to preserve a fade. None or zero recipe clock settles one-shot presentation to the effective mode's current geometry and visibility. Mobile Sheet keeps its own native completion protocol, and Skeleton retains its separate theme-clock rules.
- Positive clock changes follow the shared capture-or-retime policy: retime the existing coupled size/translation scalar rather than splitting its owners, while short paint retains its captured clock. Returning to full does not replay a consumed collapse, label update or mobile entrance.

## Geometry and performance

Label visibility uses the coupled size owner's usable-space decision, not a comparison between the
exit/entry duration and `geometry.compact`. On collapse, start an eligible label fade concurrently
with the accepted size change; if the safe label lane disappears before that fade ends, finish its
paint immediately. Do not hold the gap open until a fade completes. Preserve the existing icon-only
accessible name and tooltip semantics without leaving a hidden interactive label. On expansion,
use the destination-visible label's known box and the same size projection to reveal it only when
that content fits under the current truncation policy; without a safe projection, wait for the size
owner's actual completion signal, not a timer or a guessed percentage. Focus/activation that needs
the expanded label settles the affecting geometry/paint immediately under the shared input rule.

While a label is semantically hidden, text/reel updates establish current content without starting
their own visual work. Reversal invalidates the old pending reveal/fade and reassesses usable space
from the current coupled geometry. Reduced/none or zero recipe clock establishes final layout first
and reconciles only paint still eligible in that mode; no stale completion can reveal a collapsed
label. There is one label-envelope owner, with no per-frame label measurements or new duration token.
The current adapter chooses the conservative completion gate: plain GroupLabel text uses an internal
display span within its temporary text-only clip; a MenuButton uses an icon, its existing final plain
span and overflow viewport. These real regions lay out at the destination width. Unsupported rich
or interactive label shapes use immediate native expansion; known composed submenus keep their
required content on immediate native geometry. Current collapse semantics remove the
safe label lane immediately, so label paint settles rather than prolonging a fade. Item/surface
colour, the plain `showOnHover` action channel, changed plain labels and string badges, place-value
rolling for plain numeric badges and the mobile Sheet composition are implemented. A composed or
formatted badge number keeps its caller's numeric owner; it is never parsed out of a formatted
string.

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

- Pending: independently slow the label fade and accelerate the size preset, then reverse collapse
  while labels change. The shell never waits for opacity; unusable label paint settles, the latest
  hidden text does not animate, and a retired reveal cannot expose collapsed content. Repeat with
  full-mode zero clock, live reduction and a focus action during expansion, preserving accessible
  names and the same coupled container/gap owner. The changed-label half is now exercised: a label
  update while the lane is hidden establishes content with no run and a later expansion reveals it
  (`tests/components/sidebar.test.tsx`, `.cache/sidebar-s3/`). Still open: slowing that fade against
  the size preset and the focus action during expansion.

- Pending: collapse from an external control while a SidebarInput or known Inset editor remains
  focused, and toggle during a captured resize/control interaction. The dependent scalar settles
  without caret/scroll drift or mismatched gap/container geometry. Compare a stationary trigger
  with no affected editor: its eligible collapse still runs. Blur never replays a discarded toggle.
  Also acquire editor focus midway through an otherwise eligible collapse and verify cancellation
  of all dependent geometry without delaying that focus or clearing the native interaction.

- Proven for the desktop container/gap pair: reverse offcanvas transitions on both sides and the icon
  transition on the left rail, inspect the three variants (sidebar/floating/inset) at
  `--sidebar-width: 12rem`, and inspect matching container and page gap geometry.
  `tests/e2e/sidebar-s1-geometry.spec.ts` records the paired projection frame by frame (reserved gap
  width and panel offset obey one value), the in-flight reversal through that shell's own trigger, the
  icon rail resized from the same scalar, a width-token change issued mid-collapse that lands on the
  new extent, a live downgrade to reduced/none mid-collapse, and a
  breakpoint change that retires the desktop projection before the Sheet mounts. Screenshots for the
  matrix (both sides × light/dark × narrow/wide × three modes) are written to `.cache/sidebar-s1/`.
- Pending: resize across the mobile breakpoint during motion, reopen Sheet and navigate a route; no double entrance or stale transform remains. The desktop half is proven above: the panel unmounts and no running animation survives into the Sheet. The mobile half is now recorded: opening and closing the Sheet from the trigger inherits its own edge entry/exit with no desktop animation alongside it, and a breakpoint change retires the desktop projection before the panel mounts (`.cache/sidebar-s3/mobile-*`). Still open: navigating a route while the Sheet is mid-exit.
- Proven: change a plain badge/label, use sidebar-input and keyboard navigation while collapsed, and verify accessibility/hit regions. `tests/components/sidebar.test.tsx` updates a plain GroupLabel, a MenuButton label, a string badge and a plain numeric badge in place and confirms the input keeps its native editing surface in full, reduced and none; `.cache/sidebar-s3/` holds the label and badge matrix across both OS preferences and light/dark.
- Pending: verify all modes, zero clock, live downgrade, SSR initial state and unmount during desktop/mobile exit. Live downgrade of the coupled geometry itself is proven above, and the changed label/count halves settle immediately under reduced and none. The SSR and mobile-exit halves remain open.
- Partly proven: change side, width tokens or available space during a toggle, including floating/inset variants. Both sides and the three variants resolve from the actual variables, and a `--sidebar-width` change issued mid-collapse retires the running projection, lands on the new extent without a stale transform, and is the extent a later toggle resolves (above). Still open: changing the available page space under a constrained shell, and proving no temporary page overlap survives it.

- Pending: update string and numeric badges, showOnHover actions and inherited menu skeletons while collapsing or changing theme/mode; no duplicate colour/pulse, invisible focused action or stale hover completion survives. The colour half is exercised for the real menu button, action, rail, group label and badge in all three modes by `tests/components/sidebar.test.tsx`, including a collapse that retires a pending pointer reveal; the changed label/count half is exercised there too, including a hidden lane that establishes content without work. Still open: a live theme switch during a badge update.
- Pending: switch to reduced during collapse plus label/action/text feedback, and edit a positive clock mid-toggle. Coupled geometry stays coherent, permitted short paint remains eligible, collapsed content stays hidden and no owner restarts from an old target. None/zero settles one-shot work without breaking native Sheet completion or substituting the recipe clock for Skeleton's theme clock.
- Partly proven: focus a menu action or SidebarInput during shell/item theme feedback, then invalidate an
  actual owner. Its whole paint and the paint of actual focused-containing regions settle; an independent
  rail/badge may continue eligible colour, without treating route-active state as focus. The gate is
  exercised on the real parts for focus, focus-within and an invalid SidebarInput in three modes; a live
  theme switch during that feedback and the browser matrix are recorded in `.cache/sidebar-s2/`.
