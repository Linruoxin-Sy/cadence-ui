# Item motion contract

Status: functionally migrated; numerical performance governance remains deferred under ADR-023.

Item treats a row's media, copy and actions as one identity, while allowing later changes to each region to remain local. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["item"],
    "group": ["item-group"],
    "part": ["item-media", "item-actions"],
    "media": ["item-media"],
    "text": ["item-text"],
    "value": ["item-number"],
    "surface": ["item", "item-media"],
    "foreground": ["item-title", "item-description"],
    "separator": ["item-separator"]
  },
  "axes": { "root": ["height"] },
  "parts": {
    "root": ["item#Item"],
    "group": ["item#ItemGroup"],
    "part": ["item#ItemMedia", "item#ItemActions"],
    "media": ["item#ItemMedia"],
    "text": ["item#ItemTitle", "item#ItemDescription", "item#ItemContent", "item#ItemHeader", "item#ItemFooter"],
    "value": ["item#ItemTitle", "item#ItemDescription", "item#ItemContent", "item#ItemHeader", "item#ItemFooter"],
    "surface": ["item#Item", "item#ItemMedia"],
    "foreground": ["item#ItemTitle", "item#ItemDescription"],
    "separator": ["item#ItemSeparator"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                         | References                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: item owns its row entrance and exit, the separately inserted media/action regions and the ItemGroup envelope; inherited for the rendered rule, whose entrance stays Separator’s.  | default: `item.root.enter`, `item.root.exit`, `item.part.enter`, `item.part.exit`, `item.group.enter`, `item.separator.enter`, `item.separator.exit` |
| Size            | default: item owns the content/header/footer-driven block height of its own row; ItemGroup writes no row geometry and an externally constrained axis stays native.                         | default: `item.root.resize`                                                                                                                          |
| Surface colour  | default: item variant/background/border and ItemMedia surface-foreground; ItemSeparator delegates its rule colour to Separator. Composed interactive children keep their own state owners. | default: `item.surface.colour`, `item.separator.colour`                                                                                              |
| Text colour     | default: the row foreground together with explicit title and description overrides; composed controls own their own foreground states.                                                     | default: `item.surface.colour`, `item.foreground.colour`                                                                                             |
| Changed text    | default: plain ItemTitle, ItemDescription and directly owned plain content/header/footer text; arbitrary rich child content stays caller-owned.                                            | default: `item.text.replace`                                                                                                                         |
| Changed numbers | default: direct quantity values in those same known display parts; numeric identifiers remain text and composed metrics/actions keep their own owner.                                      | default: `item.value.roll`                                                                                                                           |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                            | full                                                                                                                     | reduced                                           | none                       | Binding → preset → recipe/form                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row insertion/removal / item                                               | One local opacity entrance on the inserted row; an exiting row fades on its retained host without cloning its children.  | Short opacity.                                    | Immediate.                 | `item.root.enter` → `presence.inline` → `data.transition/opacity`; `item.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                                    |
| Header/footer/content or explicit size change / item                       | Resolve final spacing/typography and interpolate the measured block height; retained siblings follow that committed box. | Size immediate, short opacity only.               | Immediate.                 | `item.root.resize` → `geometry.content` → `geometry.resize/measured`                                                                                                                                           |
| Independently inserted ItemGroup / group                                   | One group opacity envelope; later row insertion keeps its own cause instead of replaying the group.                      | Short opacity only.                               | Final group immediately.   | `item.group.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                             |
| Media or action region inserted/removed / retained local owner             | Fade only that region on its own host while the row's text and semantic content commit immediately.                      | Short opacity.                                    | Final content immediately. | `item.part.enter` → `presence.inline` → `data.transition/opacity`; `item.part.exit` → `presence.exit` → `exit.fade/opacity`                                                                                    |
| Supplied media visual replaced / ItemMedia                                 | Local opacity replacement for the new supplied visual; no outgoing artwork clone and no title replay.                    | Short opacity.                                    | Final visual immediately.  | `item.media.replace` → `presence.inline` → `data.transition/opacity`                                                                                                                                           |
| Display text/quantity revision / known display part                        | Changed-only text, stagger:none, or quantity reels on the same span.                                                     | Short changed-text opacity; quantities immediate. | Immediate.                 | `item.text.replace` → `text.replace` → `text.change/changed-runs`; `item.value.roll` → `number.compact` → `number.roll/reels`                                                                                  |
| Rendered rule insertion/removal / ItemSeparator                            | One rule opacity channel; its length follows the group's layout instead of an authored size writer.                      | Short opacity.                                    | Immediate.                 | `item.separator.enter` → `presence.inline` → `data.transition/opacity`; `item.separator.exit` → `presence.exit` → `exit.fade/opacity`                                                                          |
| Variant or actual interactive state / row, media, title, description, rule | Scoped colour transition through one owner per host.                                                                     | Short colour.                                     | Immediate.                 | `item.surface.colour` → `state.color` → `state.color/surface-foreground`; `item.foreground.colour` → `state.color` → `state.color/foreground`; `item.separator.colour` → `state.color` → `state.color/surface` |

The `foreground` binding owns explicit Title/Description overrides; the row's own inherited colour belongs to the `surface` binding, which writes the row surface and foreground together on one host. The `text`/`value` bindings address known display parts only, never arbitrary Item root children. ItemSeparator keeps its own rule owners on the same native Separator primitive, so a group never gains a second rule writer.

## Interruption and lifecycle

Rapid record updates keep the same Item identity and retarget its dimensions. Reordering does not replay titles or media. Closing/removing a row requires retained parent lifecycle for its exit and immediately removes obsolete actions from keyboard access. Live reduced cancels height interpolation and reels; none or a zero clock also cancels fades and colour. ItemGroup remains its existing group structure, not a fabricated list or selection model.

Source/key changes invalidate any caller-composed media transition and late completion; Item does not infer record identity from title text or retain arbitrary media DOM with its handlers. Parent close cancels local part/text/size work. If no surviving local region owns a removed part, removal is immediate rather than introducing an implicit child registry. A replacement mid-fade retargets the same opacity channel from its current value instead of stacking two writers.

## Geometry and performance

Outgoing row/part paint follows the shared
[paint-only retention rule](../../animation-system.md#33-presence-and-composition). Do not clone the
Item's rich child tree, link/action ids, native form controls or media solely for exit or measurement.
If safe bounded paint is unavailable, remove that visual immediately while preserving eligible
retained-row reflow; no duplicate ref/effect registration or altered caller mount policy is allowed.

Measure the changed row after commitment; ItemGroup writes no row geometry, so a retained sibling follows the row's own committed block size instead of a second writer. Lay out title/description at destination width before row-height interpolation, retaining the description's line clamp; responsive truncation is immediate. Do not animate image intrinsic sizing into row layout. Plain Item has no automatic hover lift/press scale; a rendered link preserves native navigation and focus. Rich interactive descendants are not split into animated text.

ItemGroup neither measures nor projects its rows. Keep a focused descendant/editor or captured action target stable; affected row/sibling geometry commits immediately, and blur does not replay skipped movement. If a smaller intermediate row adds clipping to final-visible text/actions under existing overflow, settle that axis immediately. Bound work to changed visible rows and known text slots; oversized groups skip blanket measurement/reflow and preserve native scrolling. ItemSeparator owns one rule-opacity channel and one scoped rule background on `item-separator`; its length follows the group's layout, so it introduces no measured size writer and no duplicate group entrance.

## Acceptance scenarios

Required: item insertion/reorder; plain div and anchor render; title changes with retained substrings; media/action replacement; header/footer expansion; clamped descriptions; direct display quantities; action focus during removal; all modes and zero clock with rapid record updates.

Also required: remove/reinsert a row with an id-linked action, named input and rich media child while
the group reflows. The single live row retains native form/ref/resource behaviour; no hidden measurement
mount or outgoing interactive copy is created. Unsafe outgoing paint falls back independently from
the surviving rows' eligible movement, and a replacement that arrives before the previous visual settles
must not leave stale media, a duplicate action or a parent-following-child spring.
