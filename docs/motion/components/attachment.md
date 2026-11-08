# Attachment motion contract

Status: target design; implementation and verification pending.

Attachment communicates its supplied idle/uploading/processing/error/done state while keeping filename, preview and independent actions stable. It does not upload, retry or delete files itself. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["attachment#Attachment"],
    "group": ["attachment#AttachmentGroup"],
    "part": ["attachment#AttachmentActions", "attachment#AttachmentAction", "attachment#AttachmentMedia"],
    "media": ["attachment#AttachmentMedia"],
    "surface": ["attachment#Attachment", "attachment#AttachmentMedia"],
    "text": [
      "attachment#Attachment",
      "attachment#AttachmentTitle",
      "attachment#AttachmentDescription",
      "attachment#AttachmentMedia"
    ],
    "title": ["attachment#AttachmentTitle"],
    "value": ["attachment#AttachmentDescription"],
    "trigger": ["attachment#AttachmentTrigger"],
    "label": ["attachment#AttachmentTitle", "attachment#AttachmentDescription"],
    "action": ["attachment#AttachmentAction", "button#Button"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                         | References                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Appearance      | default: attachment owns insertion and later media/action changes; attachment-group coordinates membership; inherited under a parent entrance.                                             | default: `attachment.root.enter`, `attachment.root.exit`, `attachment.part.enter`, `attachment.part.exit` |
| Size            | default: attachment owns content/orientation/explicit-size geometry, and group owns visible item positions; native horizontal scrolling remains direct.                                    | default: `attachment.root.resize`                                                                         |
| Surface colour  | default: attachment and attachment-media state/background/border targets; AttachmentAction inherits Button ownership.                                                                      | default: `attachment.surface.colour`; inherited: `@action`                                                |
| Text colour     | default: root foreground and explicit title/description/media targets on state/theme changes; inheriting title/content paint follows the root once, and actions retain their Button owner. | default: `attachment.text.colour`; inherited: `@action`                                                   |
| Changed text    | default: plain filename and description strings use changed-only replacement; composed rich metadata; filename identity is never interpreted as a number.                                  | default: `attachment.label.replace`; composed: `@label`; inherited: `@action`                             |
| Changed numbers | default: direct numeric quantities in descriptive display content; formatted rich metadata/progress uses composition; names, extensions and IDs remain textual.                            | default: `attachment.value.roll`; composed: `@value`; inherited: `@action`                                |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                                      | full                                                                                                                                                       | reduced                                          | none                                 | Binding → preset → recipe/form                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add/remove attachment / root and visible group                                       | Fade changed file tile; retained files reflow.                                                                                                             | Positions immediate; short opacity.              | Immediate.                           | `attachment.root.enter` → `presence.inline` → `data.transition/opacity`; `attachment.root.exit` → `presence.exit` → `exit.fade/opacity`; `attachment.group.move` → `layout.compact` → `layout.move/position`           |
| Later media/action insertion, removal or preview replacement / retained local region | Fade only the changed visual; current action semantics and preview identity commit immediately. Initial parts inherit tile entry.                          | Short opacity.                                   | Final parts immediately.             | `attachment.part.enter` → `presence.inline` → `data.transition/opacity`; `attachment.part.exit` → `presence.exit` → `exit.fade/opacity`; `attachment.media.replace` → `data.update` → `data.transition/opacity`        |
| Supplied state changes / root/media/description                                      | Scoped colours and preview opacity transition to the actual state.                                                                                         | Short colour/opacity.                            | Immediate.                           | `attachment.surface.colour` → `state.color` → `state.color/surface`; `attachment.text.colour` → `state.color` → `state.color/foreground`; `attachment.media.update` → `data.update` → `data.transition/opacity`        |
| Visible uploading/processing / title opacity                                         | Local pulse only; cancel it and restore resting title opacity before a title replacement, then resume only for the current still-busy revision.            | Static title; no loop.                           | Static title; no loop.               | `attachment.title.busy` → `status.loop` → `data.transition/continuous`                                                                                                                                                 |
| Filename/metadata or structural revision / display and tile                          | Changed-only text with stagger:none or quantity reels; retarget owned tile dimensions.                                                                     | Short text opacity; quantity/geometry immediate. | Immediate.                           | `attachment.label.replace` → `text.replace` → `text.change/changed-runs`; `attachment.value.roll` → `number.compact` → `number.roll/reels`; `attachment.root.resize` → `geometry.compact` → `geometry.resize/measured` |
| Trigger activation / internal feedback visual                                        | Press feedback on a safe internal tile visual, preserving the actual overlay trigger and sibling action hit targets; omit scale when no such layer exists. | No scale.                                        | No animation.                        | `attachment.trigger.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                                 |
| AttachmentAction activation / inherited Button feedback owner                        | Run the Button contract once on its supported feedback layer; no second Attachment press writer.                                                           | Inherited no-scale feedback.                     | Native activation without animation. | `attachment.action.press` → `feedback.press` → `feedback.press/scale` (inherited Button)                                                                                                                               |

`label` binds only filename/description text replacement. `text` coordinates the root foreground and explicit Title/Description/Media overrides, never an inferred media-text renderer. An inheriting Title or Content follows the root colour once; it does not start a second tween for the same inherited property. Root/Media surface and foreground bindings use one actual CSS colour controller per host, with disjoint declared paint. AttachmentAction delegates its colour/text/quantity behavior to [Button](button.md) at the same existing owner; the action press binding is an alias, not an additional controller.

## Interruption and lifecycle

State changes cancel obsolete busy visuals immediately: error/done never waits for a pulse cycle. Old media completions cannot replace a new file identity. Rapid metadata updates retarget instead of queueing. Group removal retains only a noninteractive visual, and actions remain independent from the overlay trigger. Live reduced/none stops busy loops; zero recipe clock settles one-shot effects while continuous theme clocks retain their separate policy. Unmount cancels loop, media callbacks and measurement; reopening never resurrects an obsolete file.

Stable group keys and the composed preview's own source identity define a file; Attachment does not infer identity from its filename or add an upload/decode API. A preview integration must invalidate its stale load callbacks when that identity changes. Local part retention is decorative only; unavailable retention means immediate removal. Lost capture, pointer cancellation, blur or action/trigger removal clears press feedback. Parent closure or hiding stops loops and cancels local visual work; returning displays current state without a queued replay.

One title opacity owner arbitrates activity and text replacement. Entering a replacement restores the stationary title so unchanged characters do not inherit a dim pulse; only changed runs animate. A completion can resume the theme pulse only when its identity/revision, visibility, mode and busy state still match. Media state opacity owns the AttachmentMedia host envelope. A safe preview replacement owns only an internal decorative preview layer; it never writes the host opacity. Part entrance/exit is another phase of that host envelope, with exit taking precedence and completion restoring the latest state/caller opacity. If the supplied media cannot expose a safe internal layer, swap it immediately rather than launch a second host-opacity writer.

## Geometry and performance

Media replacement retains only a safe visual supplied by its existing owner. It must not clone or
remount an arbitrary video, embedded preview, canvas or custom media subtree to crossfade it; use
immediate replacement when no bounded paint-only layer exists. Likewise, an outgoing tile/action
visual cannot duplicate ids, native form participation or caller ref/effect registrations. These are
eligibility checks before the collection budget, not an upload, media-loading or playback API.

For a deliberate orientation/size change, lay out metadata at the destination width first, then animate the tile's owned box; do not animate font size or continuously rewrap a truncated filename. Preview reservation stays stable. Only visible changed group members are measured; native horizontal scroll/snap is never eased by a second engine. Keep action focus rings and overlay hit geometry outside any temporary content clipping. A title pulse has one local opacity owner and no travelling shimmer. Full-mode zero timeScale snaps a held trigger/action feedback layer to its current press target and releases instantly; reduced/none omit scale without changing native held state or persistent application state.

The group consumes final tile destinations once; its layout displacement never writes the same transform as the internal trigger-press visual. While native scrolling/snap or a captured trigger/action interaction is active, commit affected group geometry immediately instead of interpolating under that interaction; do not replay it afterwards. If intermediate tile dimensions add clipping to the final visible filename/action, settle that axis immediately. Async media decode without an intentional content revision is passive layout, not a new tile-growth cause. Use one measurement per changed visible tile and bounded title/description/preview work; oversized groups skip blanket measurement and offscreen decoration. Numeric filename strings and already formatted metadata remain text unless explicitly composed as a quantity.

## Acceptance scenarios

Also pending: replace/remove an attachment containing an active media preview and a named action
control during group reflow. No second media instance, playback restart, ref/effect mount or form/id
registration is created for measurement or exit; unsafe outgoing paint is omitted without disabling
eligible sibling reflow or delaying the accepted file/preview state.

Target acceptance; not executed: uploading to processing/error/done; quick state reversals; filename diff and numeric metadata; horizontal/vertical layouts; preview decode race; overlay trigger versus action; group removal while scrolling; live modes and separate zero recipe/theme-loop clocks.

Also pending: rename during a busy pulse, complete/error before the replacement finishes, and replace preview/actions while scroll snapping or pressing; no obsolete pulse restart, duplicate action, competing opacity/transform writer or false filename count is permitted.

Also pending: change root theme foreground while Title/Content inherit it and Description/Media keep explicit colours, then focus the overlay trigger or an action. Inherited paint follows one root controller, independent paint retains its actual owner, and no duplicate colour tween or text replay appears.
