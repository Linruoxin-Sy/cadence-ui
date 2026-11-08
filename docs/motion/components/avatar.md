# Avatar motion contract

Status: target design; implementation and verification pending.

Avatar keeps a stable identity placeholder while the image becomes available, and lets group membership change without shuffling unchanged people. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["avatar#Avatar"],
    "badge": ["avatar#AvatarBadge"],
    "image": ["avatar#AvatarImage", "avatar#AvatarFallback"],
    "group": ["avatar#AvatarGroup"],
    "member": ["avatar#Avatar", "avatar#AvatarGroupCount"],
    "text": ["avatar#AvatarFallback", "avatar#AvatarBadge", "avatar#AvatarGroupCount"],
    "count": ["avatar#AvatarGroupCount"],
    "surface": ["avatar#Avatar", "avatar#AvatarBadge", "avatar#AvatarFallback", "avatar#AvatarGroupCount"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                  | References                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: avatar, later avatar-image and avatar-badge changes; avatar-group coordinates its own initial membership entrance; inherited under a larger parent entrance.                                                               | default: `avatar.root.enter`, `avatar.group.enter`, `avatar.badge.enter`, `avatar.image.replace`, `avatar.member.enter`, `avatar.member.exit` |
| Size            | default: avatar owns explicit size changes and avatar-group owns membership geometry; fixed image/fallback content never changes the root size.                                                                                     | default: `avatar.root.resize`, `avatar.group.resize`                                                                                          |
| Surface colour  | default: avatar-fallback, avatar-badge and avatar-group-count surfaces/borders when their authored state changes.                                                                                                                   | default: `avatar.surface.colour`                                                                                                              |
| Text colour     | default: fallback, badge and group-count foreground; image pixels are not recoloured by the motion system.                                                                                                                          | default: `avatar.text.colour`                                                                                                                 |
| Changed text    | default: plain fallback initials, badge copy and group-count labels retain unchanged graphemes; rich fallback/badge/count content is composed.                                                                                      | default: `avatar.text.replace`; composed: `@text`                                                                                             |
| Changed numbers | default: direct numeric quantities in AvatarGroupCount or an explicitly displayed AvatarBadge quantity. Fallback initials/numeric identities and formatted strings remain text; mixed affix/rich counters use explicit composition. | default: `avatar.count.roll`, `avatar.badge.roll`; composed: `@count`, `@badge`                                                               |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                      | full                                                                                                                                                                             | reduced                                                   | none                                        | Binding → preset → recipe/form                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar or independent badge insertion                | One coherent opacity entrance; badge may enter later under its own cause.                                                                                                        | Short opacity.                                            | Immediate.                                  | `avatar.root.enter` → `presence.inline` → `data.transition/opacity`; `avatar.badge.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                             |
| Decoded image replaces fallback / image and fallback | Crossfade the currently available fallback paint to the ready image through one coordinator; preserve Base UI availability/timing and never manufacture an unavailable fallback. | Short opacity.                                            | Final available image/fallback immediately. | `avatar.image.replace` → `data.update` → `data.transition/opacity`                                                                                                                                                                                                                                                                                    |
| Explicit size or group membership / avatar and group | Resize the owned box; reflow retained avatars, fading added/removed identities. Group consumes the final member boxes once.                                                      | Geometry immediate; short opacity.                        | Immediate.                                  | `avatar.root.resize` → `geometry.compact` → `geometry.resize/measured`; `avatar.group.resize` → `geometry.compact` → `geometry.resize/measured`; `avatar.group.move` → `layout.compact` → `layout.move/position`; `avatar.member.enter` → `presence.inline` → `data.transition/opacity`; `avatar.member.exit` → `presence.exit` → `exit.fade/opacity` |
| Fallback/badge/group-count revision / display parts  | Changed-only text with stagger:none or explicit quantity reels.                                                                                                                  | Short changed-text opacity; final quantities immediately. | Immediate.                                  | `avatar.text.replace` → `text.replace` → `text.change/changed-runs`; `avatar.count.roll` → `number.compact` → `number.roll/reels`; `avatar.badge.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                       |
| Authored display colour changes / relevant parts     | Scoped surface/foreground transition.                                                                                                                                            | Short colour.                                             | Immediate.                                  | `avatar.surface.colour` → `state.color` → `state.color/surface`; `avatar.text.colour` → `state.color` → `state.color/foreground`                                                                                                                                                                                                                      |
| Independently inserted AvatarGroup / group           | One group opacity entrance; initial avatars/count tile consume the same cause without member entrances.                                                                          | Short opacity only.                                       | Final group immediately.                    | `avatar.group.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                                                                                  |

The image replacement binding owns the paired Image/Fallback presentation; it is not an image-only fade with an unrelated fallback writer. When initial availability and insertion are the same cause already consumed by a group/avatar envelope, omit the duplicate image entrance. An independently completed image load is a later cause even if it overlaps that envelope in time: the paired Image/Fallback layers may crossfade while the parent continues, with separate node/property owners and a valid visible fallback. Only unavailable safe layering uses an immediate swap; elapsed overlap does not classify causality. Avatar and group geometry have separate anchors; the group consumes final member boxes rather than applying avatar.root.resize to itself. The count tile is a real group member for presence/reflow and follows the existing group-size styling without an extra size spring.

## Interruption and lifecycle

An image/fallback crossfade owns only the actual changing paint in this Avatar. If either visual is
unavailable, endpoints are already equal or the owned transition is cancelled before starting, its
coordinator takes the current available-image/fallback presentation without waiting for two end
events. It must not keep a ready image hidden behind a completion latch or restart the image load.
Equal source URLs in other avatars do not share that latch or image-layer lifetime.

An image request completing for an old identity cannot replace the current avatar. Cached/initially ready images do not flash a fallback. Failure keeps a valid fallback visible. Reordering retains entity identity; remove/reinsert reverses only a surviving retained visual. Live reduced finishes size/reels/group movement; none or zero clock also resolves crossfades/colours. Cleanup removes observation and obsolete image transition callbacks.

Preserve Base UI's image/fallback availability and caller-supplied timing rather than forcing a fallback on every request. An image source revision invalidates older load/decode/error completions even when the Avatar node is reused. Retain only a decorative outgoing image under the existing availability owner; its alt/name cannot duplicate the current image. If that owner cannot safely retain a ready layer, swap immediately. Parent close cancels image/text work and later decode completion cannot restart it.

## Geometry and performance

A retained Image/Fallback layer is decorative paint under the
[shared retention contract](../../animation-system.md#33-presence-and-composition), not a second
mount of caller fallback/image children. Do not duplicate ids, names or caller load/ref/effect
registration, or issue another image request solely to create outgoing paint. Reusing an already
available safe layer remains eligible; unsupported rich fallback/custom-render content swaps
immediately while Base UI's current image/fallback availability stays authoritative.

Image and fallback share the reserved root box. Keep initials and compact count content in their resolved single-line boxes; their text replacement never drives wrapping or image size. Measure only explicit size or group membership changes, not image decode dimensions. Group overlap and badges keep existing clipping/stacking semantics; do not crop the corner badge with a newly introduced wrapper. Limit active image transitions to changed visible avatars and never replay unchanged initials.

The group consumes each member's final size destination rather than observing a size tween. A member's group displacement and image crossfade use distinct property owners; explicit root resizing does not scale initials. The count tile remains its reserved size, including existing group-size styling. If new count/fallback content cannot fit safely, retain caller truncation rules and show the final content immediately instead of clipping through a reel. `+3` as a string stays text; a mixed plus sign/quantity needs explicit numeric composition, not a new count prop. At most one outgoing/ready image pair per changed visible avatar is retained; unavailable safe layering swaps immediately, without holding requests or hiding identities.

For automatic group presence/reflow and known-group image appearance, use the [collection bound](../presets.md#52-shared-work-limits) before member measurements or outgoing-image allocation. Count each participating avatar/count tile's current member/image presentation once even when it also reflows, plus every distinct retained outgoing image/fallback visual and any participating group shell. Include crossfades still active from earlier source/decode revisions. A whole-group envelope alone is one visual, not every descendant; independently active image layers still occupy their own live working set. An independent load/decode completion remains its own legitimate cause, even while another entrance/crossfade runs; elapsed overlap never licenses suppressing it as the parent's same cause.

The known AvatarGroup coordinator uses its registered member/source identities and active handles, not a DOM image scanner. If that live image set cannot fit or cannot be determined safely, swap the affected current available image/fallback immediately and release obsolete outgoing decoration. Never queue decode results, delay a request, change Base UI availability or hide a current identity to wait for capacity. Outside a known group, the local one-pair limit and component/page budgets remain mandatory; no unbounded retained-image queue is introduced. Text/reel work retains its independent limits.

## Acceptance scenarios

Also pending: use two avatars with the same image URL, one with no available fallback paint; cancel
or replace one before its crossfade starts and deliver old image/transition completions. Each shows
its current native availability without a missing-event wait, shared latch or synthetic reload.

Also pending: crossfade a loaded image with an id-linked or stateful custom fallback/render part.
Only the current original keeps its semantic relationships and callbacks; retention cannot add a
second child mount or request. When no safe outgoing layer exists, current availability swaps
immediately with no fabricated fallback, duplicate announcement or delayed image readiness.

Target acceptance; not executed: slow, cached and failed images; identity swap before decode; badge changes; group reorder/removal with overflow count; count affixes; explicit size change; parent entrance; live modes and zero clock during image replacement.

Also pending: change src twice on one Avatar node, close its parent before the first decode, replace badge text/quantity, and resize/reorder a group simultaneously; only the latest image/name and one geometry transaction may survive. Verify `+3` string versus explicit numeric composition.

Also pending: overlap several registered group members' source/decode revisions at and beyond the live collection bound while older image pairs and group reflow remain active. Independent availability causes stay eligible without being mistaken for the group's entry; count current member visuals, distinct outgoing layers and any participating shell once. Overflow shows each latest valid image/fallback immediately, releases obsolete outgoing paint and never delays a request, semantic availability or retained identity to await capacity.
