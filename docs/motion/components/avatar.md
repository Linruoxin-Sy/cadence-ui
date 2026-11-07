# Avatar motion contract

Status: target design; implementation and verification pending.

Avatar keeps a stable identity placeholder while the image becomes available, and lets group membership change without shuffling unchanged people. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: avatar, later avatar-image and avatar-badge changes; avatar-group coordinates its own initial membership entrance; inherited under a larger parent entrance. |
| Size | default: avatar owns explicit size changes and avatar-group owns membership geometry; fixed image/fallback content never changes the root size. |
| Surface colour | default: avatar-fallback, avatar-badge and avatar-group-count surfaces/borders when their authored state changes. |
| Text colour | default: fallback, badge and group-count foreground; image pixels are not recoloured by the motion system. |
| Changed text | default: plain fallback initials, badge copy and group-count labels retain unchanged graphemes; rich fallback/badge/count content is composed. |
| Changed numbers | default: direct numeric quantities in AvatarGroupCount or an explicitly displayed AvatarBadge quantity. Fallback initials/numeric identities and formatted strings remain text; mixed affix/rich counters use explicit composition. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Avatar/group or independent badge insertion | One coherent opacity entrance; badge may enter later under its own cause. | Short opacity. | Immediate. | `avatar.root.enter` → `presence.inline` → one-shot opacity `data.transition`; `avatar.badge.enter` → `presence.inline` → one-shot opacity `data.transition` |
| Decoded image replaces fallback / image and fallback | Crossfade after the real image is ready, retaining a visible fallback until then. | Short opacity. | Final available image/fallback immediately. | `avatar.image.replace` → `data.update` → local opacity `data.transition` |
| Explicit size or group membership / avatar and group | Resize the owned box; reflow retained avatars, fading added/removed identities. Group consumes the final member boxes once. | Geometry immediate; short opacity. | Immediate. | `avatar.root.resize` → `geometry.compact` → `geometry.resize`; `avatar.group.resize` → `geometry.compact` → `geometry.resize`; `avatar.group.move` → `layout.compact` → `layout.move`; `avatar.member.enter` → `presence.inline` → one-shot opacity `data.transition`; `avatar.member.exit` → `presence.exit` → `exit.fade` |
| Fallback/badge/group-count revision / display parts | Changed-only text with stagger:none or explicit quantity reels. | Short changed-text opacity; final quantities immediately. | Immediate. | `avatar.text.replace` → `text.replace` → target `text.change`; `avatar.count.roll` → `number.compact` → revised `number.roll`; `avatar.badge.roll` → `number.compact` → revised `number.roll` |
| Authored display colour changes / relevant parts | Scoped surface/foreground transition. | Short colour. | Immediate. | `avatar.surface.colour` → `state.color` → target `state.color`; `avatar.text.colour` → `state.color` → target `state.color` |

## Interruption and lifecycle

An image request completing for an old identity cannot replace the current avatar. Cached/initially ready images do not flash a fallback. Failure keeps a valid fallback visible. Reordering retains entity identity; remove/reinsert reverses only a surviving retained visual. Live reduced finishes size/reels/group movement; none or zero clock also resolves crossfades/colours. Cleanup removes observation and obsolete image transition callbacks.

Preserve Base UI's image/fallback availability and caller-supplied timing rather than forcing a fallback on every request. An image source revision invalidates older load/decode/error completions even when the Avatar node is reused. Retain only a decorative outgoing image under the existing availability owner; its alt/name cannot duplicate the current image. If that owner cannot safely retain a ready layer, swap immediately. Parent close cancels image/text work and later decode completion cannot restart it.

## Geometry and performance

Image and fallback share the reserved root box. Keep initials and compact count content in their resolved single-line boxes; their text replacement never drives wrapping or image size. Measure only explicit size or group membership changes, not image decode dimensions. Group overlap and badges keep existing clipping/stacking semantics; do not crop the corner badge with a newly introduced wrapper. Limit active image transitions to changed visible avatars and never replay unchanged initials.

The group consumes each member's final size destination rather than observing a size tween. A member's group displacement and image crossfade use distinct property owners; explicit root resizing does not scale initials. The count tile remains its reserved size, including existing group-size styling. If new count/fallback content cannot fit safely, retain caller truncation rules and show the final content immediately instead of clipping through a reel. `+3` as a string stays text; a mixed plus sign/quantity needs explicit numeric composition, not a new count prop. At most one outgoing/ready image pair per changed visible avatar is retained; exceed shared visible-work limits by swapping immediately, not holding requests or hiding identities.

## Acceptance scenarios

Target acceptance; not executed: slow, cached and failed images; identity swap before decode; badge changes; group reorder/removal with overflow count; count affixes; explicit size change; parent entrance; live modes and zero clock during image replacement.

Also pending: change src twice on one Avatar node, close its parent before the first decode, replace badge text/quantity, and resize/reorder a group simultaneously; only the latest image/name and one geometry transaction may survive. Verify `+3` string versus explicit numeric composition.
