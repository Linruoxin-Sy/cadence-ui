# Item motion contract

Status: target design; implementation and verification pending.

Item treats a row's media, copy and actions as one identity, while allowing later changes to each region to remain local. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["item#Item"],
    "group": ["item#ItemGroup"],
    "part": ["item#ItemActions", "item#ItemMedia", "item#ItemHeader", "item#ItemFooter"],
    "media": ["item#ItemMedia"],
    "text": ["item#ItemTitle", "item#ItemDescription", "item#ItemContent", "item#ItemHeader", "item#ItemFooter"],
    "value": ["item#ItemTitle", "item#ItemDescription", "item#ItemContent", "item#ItemHeader", "item#ItemFooter"],
    "surface": ["item#Item", "item#ItemMedia"],
    "foreground": ["item#Item", "item#ItemTitle", "item#ItemDescription"],
    "separator": ["item#ItemSeparator", "separator#Separator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                        | References                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Appearance      | default: item for insertion and separately changed media/actions; ItemGroup coordinates group insertion; inherited for a larger parent entrance.                                          | default: `item.root.enter`, `item.root.exit`, `item.group.enter`, `item.part.enter`, `item.part.exit`; inherited: `@separator` |
| Size            | default: item owns content/header/footer-driven block size; item-group owns retained item positions; externally constrained axes remain inherited.                                        | default: `item.root.resize`                                                                                                    |
| Surface colour  | default: item variant/background/border and ItemMedia surface; interaction colours apply only to actual interactive render targets. ItemSeparator delegates its rule colour to Separator. | default: `item.surface.colour`; inherited: `item.separator.colour`                                                             |
| Text colour     | default: title, description and inherited row foreground; composed independent actions own their states.                                                                                  | default: `item.foreground.colour`                                                                                              |
| Changed text    | default: plain ItemTitle and ItemDescription, plus directly owned plain content/header/footer text; composed rich content.                                                                | default: `item.text.replace`; composed: `@text`                                                                                |
| Changed numbers | default: direct quantity values in known display parts; numeric identifiers remain text; composed rich metrics/actions keep their own owner.                                              | default: `item.value.roll`; composed: `@value`                                                                                 |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                                    | full                                                                                                                       | reduced                                           | none                       | Binding → preset → recipe/form                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Item insertion/removal / item and group                                            | Fade changed item; move retained siblings without remounting.                                                              | Positions immediate, short opacity.               | Immediate.                 | `item.root.enter` → `presence.inline` → `data.transition/opacity`; `item.root.exit` → `presence.exit` → `exit.fade/opacity`; `item.group.move` → `layout.compact` → `layout.move/position` |
| Header/footer/content or explicit size change / item                               | Resolve final spacing/typography and interpolate measured block size; independently inserted media/actions fade within it. | Size immediate, short opacity.                    | Immediate.                 | `item.root.resize` → `geometry.content` → `geometry.resize/measured`; `item.part.enter` → `presence.inline` → `data.transition/opacity`                                                    |
| Existing media/action region removed or explicitly replaced / retained local owner | Fade only the changed noninteractive visual while current actions and semantic content commit immediately.                 | Short opacity.                                    | Final content immediately. | `item.part.exit` → `presence.exit` → `exit.fade/opacity`; `item.media.replace` → `data.update` → `data.transition/opacity`                                                                 |
| Display text/quantity revision / known display part                                | Changed-only text, stagger:none, or quantity reels.                                                                        | Short changed-text opacity; quantities immediate. | Immediate.                 | `item.text.replace` → `text.replace` → `text.change/changed-runs`; `item.value.roll` → `number.compact` → `number.roll/reels`                                                              |
| Variant or actual interactive state / row/media/text owners                        | Scoped colour transition.                                                                                                  | Short colour.                                     | Immediate.                 | `item.surface.colour` → `state.color` → `state.color/surface`; `item.foreground.colour` → `state.color` → `state.color/foreground`                                                         |
| Independently inserted ItemGroup / group                                           | One group opacity envelope; initial rows/separators consume that cause and later row insertion retains its own cause.      | Short opacity only.                               | Final group immediately.   | `item.group.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                         |
| ItemSeparator rule colour / inherited Separator owner                              | Transition its rule background once through Separator; Item does not add another rule writer.                              | Inherited short colour.                           | Final colour immediately.  | `item.separator.colour` → `state.color` → `state.color/surface` (inherited Separator)                                                                                                      |

The `foreground` binding owns the row foreground and explicit Title/Description overrides; inheriting Content/Header/Footer/Media paint follows that row once. The `text` binding addresses known display parts only, never arbitrary Item root children. ItemSeparator inherits [Separator](separator.md), preserving its exact preset/forms without a wrapper controller.

## Interruption and lifecycle

Rapid record updates keep the same Item identity and retarget its dimensions. Reordering does not replay titles/media. Closing/removing a row requires retained parent lifecycle for its exit and immediately removes obsolete actions from keyboard access. Live reduced cancels layout, geometry and reels; none or a zero clock also cancels fades/colour. ItemGroup remains its existing group structure, not a fabricated list or selection model.

Source/key changes invalidate any caller-composed media transition and late completion; Item does not infer record identity from title text or retain arbitrary media DOM with its handlers. Parent close cancels local part/text/size work. If no surviving local region owns a removed part, removal is immediate rather than introducing an implicit child registry.

## Geometry and performance

Outgoing row/part paint follows the shared
[paint-only retention rule](../../animation-system.md#33-presence-and-composition). Do not clone the
Item's rich child tree, link/action ids, native form controls or media solely for exit or measurement.
If safe bounded paint is unavailable, remove that visual immediately while preserving eligible
retained-row reflow; no duplicate ref/effect registration or altered caller mount policy is allowed.

Measure the changed row after commitment; ItemGroup may animate sibling positions but never also writes row height. Lay out title/description at destination width before row-height interpolation, retaining the description's line clamp; responsive truncation is immediate. Do not animate image intrinsic sizing into row layout. Plain Item has no automatic hover lift/press scale; a rendered link preserves native navigation and focus. Rich interactive descendants are not split into animated text.

ItemGroup uses committed final row boxes, not their interpolated heights. A nested content-size owner delegates that cause or supplies a final destination once. Keep a focused descendant/editor or captured action target stable; affected row/sibling geometry commits immediately, and blur does not replay skipped movement. If a smaller intermediate row adds clipping to final-visible text/actions under existing overflow, settle that axis immediately. Bound work to changed visible rows and known text slots; oversized groups skip blanket measurement/reflow and preserve native scrolling. ItemSeparator inherits Separator without a duplicate group entrance.

## Acceptance scenarios

Also pending: remove/reinsert a row with an id-linked action, named input and rich media child while
the group reflows. The single live row retains native form/ref/resource behavior; no hidden measurement
mount or outgoing interactive copy is created. Unsafe outgoing paint falls back independently from
the surviving rows' eligible movement.

Target acceptance; not executed: item insertion/reorder; plain div and anchor render; title changes with retained substrings; media/action replacement; header/footer expansion; clamped descriptions; focus during removal; all modes and zero clock with rapid record updates.

Also pending: replace media/actions while reordering, update a row containing a focused input, and remove a local region without a retained owner; no stale media, duplicate action or parent-following-child spring is allowed.
