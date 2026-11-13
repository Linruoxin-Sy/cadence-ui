# Avatar motion contract

Status: functionally migrated; numerical performance governance remains deferred under ADR-023.

Avatar keeps a stable identity placeholder while the image becomes available, and lets group membership change without replaying unchanged people. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["avatar#Avatar"],
    "badge": ["avatar#AvatarBadge"],
    "image": ["avatar#AvatarImage"],
    "group": ["avatar#AvatarGroup"],
    "member": ["avatar#AvatarGroupCount"],
    "text": ["avatar#AvatarFallback", "avatar#AvatarBadge", "avatar#AvatarGroupCount"],
    "count": ["avatar#AvatarGroupCount"],
    "palette": ["avatar#AvatarFallback", "avatar#AvatarBadge", "avatar#AvatarGroupCount"]
  },
  "regions": {
    "root": ["avatar"],
    "badge": ["avatar-badge"],
    "image": ["avatar-image"],
    "group": ["avatar-group"],
    "member": ["avatar-group-count"],
    "text": ["avatar-fallback", "avatar-badge-text", "avatar-group-count-text"],
    "count": ["avatar-group-count-number"],
    "palette": ["avatar-fallback", "avatar-badge", "avatar-group-count"]
  },
  "axes": { "root": ["width", "height"], "group": ["width", "height"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                 | References                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: avatar for independent insertion and retained removal, the current image paint, an independent badge, the group envelope and later count tiles; inherited under a larger parent entrance. | default: `avatar.root.enter`, `avatar.root.exit`, `avatar.image.replace`, `avatar.badge.enter`, `avatar.badge.exit`, `avatar.group.enter`, `avatar.member.enter`, `avatar.member.exit` |
| Size            | default: avatar owns an explicit size change and AvatarGroup owns the membership-driven extent; image decoding, overlap spacing and parent constraints stay native.                                | default: `avatar.root.resize`, `avatar.group.resize`                                                                                                                                   |
| Surface colour  | default: the painted fallback, badge and count surfaces together with their foreground; the transparent root and inherited text keep their native owners.                                          | default: `avatar.palette.colour`                                                                                                                                                       |
| Text colour     | default: the same fallback, badge and count foreground owner; image pixels are never recoloured by the motion system.                                                                              | default: `avatar.palette.colour`                                                                                                                                                       |
| Changed text    | default: plain fallback initials, badge copy and count labels; rich or caller-composed content keeps its own owner.                                                                                | default: `avatar.text.replace`                                                                                                                                                         |
| Changed numbers | default: a direct numeric count value in the count tile; initials, identity numbers and formatted strings such as `+3` stay text.                                                                  | default: `avatar.count.roll`                                                                                                                                                           |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                       | full                                                                                                                             | reduced                     | none                               | Binding → preset → recipe/form                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Avatar insertion or removal / avatar                                  | One opacity entrance on the inserted avatar; removal fades the retained host without cloning its children.                       | Short opacity.              | Immediate.                         | `avatar.root.enter` → `presence.inline` → `data.transition/opacity`; `avatar.root.exit` → `presence.exit` → `exit.fade/opacity`     |
| Current image source revision / image layer                           | Fade the newly current image paint in on its own host; Base UI availability and the fallback swap stay native and never wait.    | Short opacity.              | Final available image immediately. | `avatar.image.replace` → `data.update` → `data.transition/opacity`                                                                  |
| Badge inserted or removed / badge                                     | One opacity entrance and retained exit for the badge alone; the avatar, fallback and text do not replay.                         | Short opacity.              | Immediate.                         | `avatar.badge.enter` → `presence.inline` → `data.transition/opacity`; `avatar.badge.exit` → `presence.exit` → `exit.fade/opacity`   |
| Independently inserted AvatarGroup / group                            | One group opacity entrance; initial avatars and the count tile consume that cause without their own entrances.                   | Short opacity only.         | Final group immediately.           | `avatar.group.enter` → `presence.inline` → `data.transition/opacity`                                                                |
| Count tile inserted or removed / member                               | A later count tile fades on its retained host; removal fades it while the surviving group keeps its members.                     | Short opacity.              | Immediate.                         | `avatar.member.enter` → `presence.inline` → `data.transition/opacity`; `avatar.member.exit` → `presence.exit` → `exit.fade/opacity` |
| Explicit size change / avatar                                         | Interpolate the measured width and height of the one avatar whose size changed; the caller's box constraints stay authoritative. | Final box immediately.      | Immediate.                         | `avatar.root.resize` → `geometry.compact` → `geometry.resize/measured`                                                              |
| Group membership change / group                                       | Interpolate the group's measured extent once, after members have committed their final boxes; no member size writer is added.    | Final extent immediately.   | Immediate.                         | `avatar.group.resize` → `geometry.compact` → `geometry.resize/measured`                                                             |
| Fallback initials, badge copy or count label revision / display parts | Changed-only text replacement on the same display span with stagger:none; unchanged graphemes keep their identity.               | Short changed-text opacity. | Final text immediately.            | `avatar.text.replace` → `text.replace` → `text.change/changed-runs`                                                                 |
| Direct quantity in the count tile / count display                     | Stable place-value reels for a plain numeric count; a formatted `+3` string stays text and is never re-read as a number.         | Final quantity immediately. | Immediate.                         | `avatar.count.roll` → `number.compact` → `number.roll/reels`                                                                        |
| Authored palette change / fallback, badge and count                   | Scoped surface and foreground transition through one owner per painted host.                                                     | Short colour.               | Immediate.                         | `avatar.palette.colour` → `state.color` → `state.color/surface-foreground`                                                          |

## Interruption and lifecycle

A changed image source retargets the current image host and invalidates older load/decode/error completions; a superseded request cannot replace the identity that is now current. Cached or initially ready images never flash a manufactured fallback, and a failed image keeps Base UI's valid fallback visible. Equal source URLs in other avatars do not share that controller or image-layer lifetime.

Rapid membership updates keep retained avatars and the count tile as the same nodes; a later insertion fades on its own host while the group's measured extent follows once. Reordering does not replay fallback text, reduce images, or restart a group entrance. Live reduced settles size and group extent immediately and keeps permitted short opacity and colour; none and a zero recipe clock cancel every one-shot opacity, text, number and colour writer before paint. Parent close cancels image, text and geometry work, and a later decode completion cannot restart it. Unmount cancels observation and disposes the scoped controllers; a re-entering avatar consumes no new entrance and retargets its current opacity from the displayed value.

## Geometry and performance

Only an explicit `size` change or a group membership change measures the owned box. Image decode dimensions, passive parent resizing, caller CSS and the overlap spacing remain native and write no geometry: the avatar is a fixed reserved box, and its fallback/image layers share that box instead of driving it. Initials and count content stay in their resolved single-line boxes; text replacement never drives wrapping or image size, and there is no extra size spring for the count tile.

The measured adapter resolves both physical axes from the committed native border box, so box-sizing, padding, borders and caller min/max results are inherited rather than recomputed. A caller transition on either axis, an unknown or zero frame, a non-finite size and an over-budget tree settle that axis immediately. AvatarGroup measures its own shell once after members have committed, and never observes a child's interpolated size.

Image and fallback availability belongs to Base UI. Do not duplicate ids, names, caller load/ref/effect registration, or issue another image request solely to create outgoing paint: only the current image layer is faded, and the fallback is swapped natively. The group keeps its existing overlap and clipping semantics; a badge is not cropped by a newly introduced wrapper. Work stays bounded by the changed visible avatars and the shared collection bound, and an unavailable identity or unsafe layer settles immediately instead of being hidden behind a completion latch.

## Acceptance scenarios

Required: insertion and removal of an avatar, badge, group and later count tile; a changed image source on a stable avatar; image error with a visible fallback; explicit `sm`/`default`/`lg` size changes; group membership changes with the retained count tile; fallback initials and badge copy revisions with retained graphemes; a formatted `+3` string versus a direct numeric count; authored palette changes; full/reduced/none and a zero clock during every action.

Also required: swap an image source twice before the first decode completes and close the parent before it resolves — only the latest identity survives and no fallback is manufactured. Reorder a group while an image and a palette transition are in flight; retained avatars must not replay their text or entrance, and one committed group extent must follow the final member boxes. An unavailable, hidden or over-budget group commits the affected presence and geometry immediately instead of delaying a request or hiding a current identity.
