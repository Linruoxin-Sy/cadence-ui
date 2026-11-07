# Alert motion contract

Status: target design; implementation and verification pending.

Alert makes a new message noticeable without delaying its announcement or shaking the whole surface. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["alert#Alert"],
    "text": ["alert#AlertTitle", "alert#AlertDescription"],
    "value": ["alert#AlertTitle", "alert#AlertDescription"],
    "surface": ["alert#Alert"],
    "icon": ["alert#Alert"],
    "foreground": ["alert#Alert", "alert#AlertTitle", "alert#AlertDescription"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                    | References                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Appearance      | default: alert owns one entrance; inherited when a parent notification/region owner consumes the same cause.                          | default: `alert.root.enter`, `alert.root.exit`   |
| Size            | default: alert owns title/description/action-driven block size; a parent may consume outer sibling reflow.                            | default: `alert.root.resize`                     |
| Surface colour  | default: alert background/border on variant/context updates; a caller-authored icon surface remains composed content.                                        | default: `alert.surface.colour`                  |
| Text colour     | default: root/title/description and currentColor icon foreground; composed action controls retain their own state owners.             | default: `alert.foreground.colour`                     |
| Changed text    | default: plain AlertTitle/AlertDescription strings; root-level arbitrary children and rich message content retain composed ownership.                         | default: `alert.text.replace`; composed: `@text` |
| Changed numbers | default: supported direct numeric Title/Description children are quantities using their existing displayed output; identifier/error-code strings remain text, and rich quantities are composed. | default: `alert.value.roll`; composed: `@value`  |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                       | full                                                                                                 | reduced                                                  | none       | Binding → preset → recipe/form                                                                                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Message insertion/removal / alert and retained parent | Surface opacity entrance/exit; role=alert and committed message are immediate.                       | Short opacity.                                           | Immediate. | `alert.root.enter` → `presence.surface` → `enter.pop/opacity`; `alert.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                               |
| Message/action content changes / alert                | Changed-only text, stagger:none, or quantity reels; measured height adjusts in the same transaction. | Short changed-text opacity; quantity/geometry immediate. | Immediate. | `alert.text.replace` → `text.replace` → `text.change/changed-runs`; `alert.value.roll` → `number.compact` → `number.roll/reels`; `alert.root.resize` → `geometry.content` → `geometry.resize/measured` |
| Variant/context change / root and foreground owners   | Scoped colour transition.                                                                            | Short colour.                                            | Immediate. | `alert.surface.colour` → `state.color` → `state.color/surface`; `alert.foreground.colour` → `state.color` → `state.color/foreground`                                                                         |
| Explicit keyed icon replacement / existing icon child | Bounded opacity crossfade; no automatic SVG path morph.                                              | Short opacity.                                           | Immediate. | `alert.icon.replace` → `data.update` → `data.transition/opacity`                                                                                                                                       |

The foreground binding coordinates the root and explicit title/description overrides; inherited title/currentColor icon paint follows that root once, without a second glyph controller. The text/value bindings address Title and Description only. An arbitrary direct root child is not discovered by scanning the alert grid.

## Interruption and lifecycle

New messages replace pending targets, never wait for an earlier exit, and do not reannounce unchanged content through visual duplicates. Alert has no built-in close state: caller removal needs a surviving presence owner for exit. Reappearance retargets retained opacity/height. Live reduction cancels geometry/reels; none or zero clock also cancels message fades, colours and icon effects. Removed actions cannot retain tab stops.

The current root remains the only live `role=alert` region. Retained icon/text/surface visuals are hidden from accessibility and copy semantics; do not remount the live region to obtain a new entrance. Parent close/removal cancels local effects, and stale icon completion cannot restore an outdated variant or message. A focusable action disappearing follows caller/native focus behavior immediately rather than remaining operable until fade completion.

## Geometry and performance

Measure the committed grid content once per content transaction. Icon-column and AlertAction changes share the root size owner; do not add an imaginary AlertIcon export. Lay out message text at destination width before host-height interpolation, then clamp to the containing region; preserve action focus rings. Rich descriptions keep their original nodes and are not recursively tokenized. No request, dismissal timing or validation is added.

Keep the incoming direct SVG and existing grid/selector contract intact. A retained outgoing icon, if safe, is an inert overlay outside natural grid measurement; it cannot create a second icon column or require a public wrapper. Otherwise replace it immediately. Retain the title's existing line clamp; the size tween cannot temporarily hide more of the final visible message/action. If that would occur, or an action/editor focus target would drift, commit the affected axis immediately. One grid measurement and bounded known-slot text/icon work suffice; long/rich descriptions fall back to immediate affected content without duplicate announcements.

## Acceptance scenarios

Target acceptance; not executed: default/destructive changes; icon added/removed; concurrent title/description/action changes; error-code versus count content; repeated message updates without duplicate announcements; caller removal; all modes and zero clock during resize.

Also pending: update root foreground with an inheriting currentColor icon and an independently coloured description; each property has one owner and arbitrary root children keep their structure.

Also pending: an icon swaps while an AlertAction is focused and its description expands, then the alert closes; preserve one grid column/name/announcement and no clipped action or stale icon overlay.
