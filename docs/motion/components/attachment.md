# Attachment motion contract

Status: functionally migrated; numerical performance governance and real-device measurement remain deferred under ADR-023.

Attachment communicates its supplied idle/uploading/processing/error/done state while keeping filename, preview and independent actions stable. It does not upload, retry or delete files itself. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["attachment"],
    "part": ["attachment-actions", "attachment-media"],
    "media": ["attachment-media"],
    "surface": ["attachment", "attachment-media"],
    "text": ["attachment-title", "attachment-description"],
    "title": ["attachment-title"],
    "value": ["attachment-number"],
    "label": ["attachment-text"],
    "action": ["attachment-action"],
    "action-button": ["button"],
    "action-exit": ["button"],
    "action-paint": ["button"],
    "action-box": ["button"],
    "action-label": ["button-text"],
    "action-quantity": ["button-number"]
  },
  "axes": { "root": ["width", "height"], "action-box": ["width", "height"] },
  "parts": {
    "root": ["attachment#Attachment"],
    "part": ["attachment#AttachmentActions", "attachment#AttachmentMedia"],
    "media": ["attachment#AttachmentMedia"],
    "surface": ["attachment#Attachment", "attachment#AttachmentMedia"],
    "text": ["attachment#AttachmentTitle", "attachment#AttachmentDescription"],
    "title": ["attachment#AttachmentTitle"],
    "value": ["attachment#AttachmentDescription"],
    "label": ["attachment#AttachmentTitle", "attachment#AttachmentDescription"],
    "action": ["attachment#AttachmentAction"],
    "action-button": ["button#Button"],
    "action-exit": ["button#Button"],
    "action-paint": ["button#Button"],
    "action-box": ["button#Button"],
    "action-label": ["button#Button"],
    "action-quantity": ["button#Button"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                                                                | References                                                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | default: attachment owns insertion and later media/action changes; attachment-group keeps native membership and the browser owns tile placement under its snap scroller; inherited: a parent entrance and Button's own action lifecycle keep their owners.                        | default: `attachment.root.enter`, `attachment.root.exit`, `attachment.part.enter`, `attachment.part.exit`; inherited: `attachment.action-button.enter`, `attachment.action-exit.exit` |
| Size            | default: attachment owns its own content/orientation/explicit-size box while the axis the caller fixes stays native; native horizontal scrolling and snap remain direct, so no group writer eases tile positions; inherited: AttachmentAction keeps Button's committed label box. | default: `attachment.root.resize`; inherited: `attachment.action-box.resize`                                                                                                          |
| Surface colour  | default: attachment and attachment-media state/background/border targets; inherited: AttachmentAction keeps Button's scoped surface and foreground.                                                                                                                               | default: `attachment.surface.colour`; inherited: `attachment.action-paint.colour`, `@action`                                                                                          |
| Text colour     | default: root and media foreground together with explicit title/description targets on state/theme changes; an inheriting title/content paint follows the root once; inherited: actions retain Button's foreground owner.                                                         | default: `attachment.surface.colour`, `attachment.text.colour`; inherited: `attachment.action-paint.colour`                                                                           |
| Changed text    | default: plain filename and description strings use changed-only replacement; composed rich metadata keeps its own owner; filename identity is never interpreted as a number; inherited: AttachmentAction keeps Button's label owner.                                             | default: `attachment.label.replace`; inherited: `attachment.action-label.replace`                                                                                                     |
| Changed numbers | default: direct numeric quantities in descriptive display content; formatted rich metadata/progress keeps its own composition; names, extensions and IDs remain textual; inherited: AttachmentAction keeps Button's quantity owner.                                               | default: `attachment.value.roll`; inherited: `attachment.action-quantity.roll`                                                                                                        |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                                      | full                                                                                                                                            | reduced                                          | none                     | Binding → preset → recipe/form                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add/remove attachment / root                                                         | Fade the changed file tile on its retained host; the group's own members keep native scroll/snap placement.                                     | Short opacity.                                   | Immediate.               | `attachment.root.enter` → `presence.inline` → `data.transition/opacity`; `attachment.root.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                                            |
| Later media/action insertion, removal or preview replacement / retained local region | Fade only the changed visual; current action semantics and preview identity commit immediately. Initial parts inherit tile entry.               | Short opacity.                                   | Final parts immediately. | `attachment.part.enter` → `presence.inline` → `data.transition/opacity`; `attachment.part.exit` → `presence.exit` → `exit.fade/opacity`; `attachment.media.replace` → `presence.inline` → `data.transition/opacity`                                                                                                                |
| Supplied state changes / root/media/description                                      | Scoped colours and preview opacity transition to the actual state.                                                                              | Short colour/opacity.                            | Immediate.               | `attachment.surface.colour` → `state.color` → `state.color/surface-foreground`; `attachment.text.colour` → `state.color` → `state.color/foreground`; `attachment.media.update` → `presence.inline` → `data.transition/opacity`                                                                                                     |
| Visible uploading/processing / title opacity                                         | Local pulse only; cancel it and restore resting title opacity before a title replacement, then resume only for the current still-busy revision. | Static title; no loop.                           | Static title; no loop.   | `attachment.title.busy` → `status.loop` → `data.transition/continuous`                                                                                                                                                                                                                                                             |
| Filename/metadata or structural revision / display and tile                          | Changed-only text with stagger:none or quantity reels; retarget owned tile dimensions.                                                          | Short text opacity; quantity/geometry immediate. | Immediate.               | `attachment.label.replace` → `text.replace` → `text.change/changed-runs`; `attachment.value.roll` → `number.compact` → `number.roll/reels`; `attachment.root.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                             |
| Action lifecycle / inherited Button                                                  | Button fades its own action host in, and keeps one exit when its region ends; Attachment installs no second writer on that node.                | Short opacity.                                   | Immediate.               | `attachment.action-button.enter` → `presence.inline` → `data.transition/opacity`; `attachment.action-exit.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                            |
| Action surface and label revision / inherited Button                                 | Button keeps its scoped paint, changed label runs, quantity reels and committed label box; Attachment action region only fades around it.       | Short colour/text; box immediate.                | Immediate.               | `attachment.action-paint.colour` → `state.color` → `state.color/surface-foreground`; `attachment.action-label.replace` → `text.replace` → `text.change/changed-runs`; `attachment.action-quantity.roll` → `number.compact` → `number.roll/reels`; `attachment.action-box.resize` → `geometry.compact` → `geometry.resize/measured` |

`label` binds only filename/description text replacement: the public title keeps its host and the private title text span owns the changed runs. `text` coordinates the root foreground and the explicit Title/Description overrides, never an inferred media-text renderer; root and media foreground belong to the `surface` binding, which writes surface and foreground paint together through one controller per host. The overlay trigger supplies no press scale: its hit geometry is the whole tile and a caller-renderable overlay has no safe internal decorative layer, so the documented fallback (omit scale) applies. AttachmentAction delegates its colour/text/quantity and press behaviour to [Button](button.md) at the same existing owner; it is not an additional controller.

## Interruption and lifecycle

State changes cancel obsolete busy visuals immediately: error/done never waits for a pulse cycle. Old media completions cannot replace a new file identity. Rapid metadata updates retarget instead of queueing. Group removal retains only a noninteractive visual, and actions remain independent from the overlay trigger. Live reduced/none stops busy loops; zero recipe clock settles one-shot effects while continuous theme clocks retain their separate policy. Unmount cancels loop, media callbacks and measurement; reopening never resurrects an obsolete file.

Stable group keys and the composed preview's own source identity define a file; Attachment does not infer identity from its filename or add an upload/decode API. A preview integration must invalidate its stale load callbacks when that identity changes. Local part retention is decorative only; unavailable retention means immediate removal. Lost capture, pointer cancellation, blur or action/trigger removal clears native press state. Parent closure or hiding stops loops and cancels local visual work; returning displays current state without a queued replay.

One title opacity owner arbitrates activity and text replacement. Entering a replacement restores the stationary title so unchanged characters do not inherit a dim pulse; only changed runs animate. A completion can resume the theme pulse only when its identity/revision, visibility, mode and busy state still match. Media state opacity owns the AttachmentMedia host envelope. The supplied preview replacement shares that one host envelope instead of launching a second opacity writer; part entrance/exit is another phase of it, with exit taking precedence and completion restoring the latest state/caller opacity. If the supplied media cannot be described by a bounded identity, it is swapped immediately rather than cloned.

## Geometry and performance

Media replacement never clones or remounts an arbitrary video, embedded preview, canvas or custom media subtree to crossfade it; the host envelope carries the change and the supplied artwork commits immediately. Likewise, an outgoing tile/action visual cannot duplicate ids, native form participation or caller ref/effect registrations. These are eligibility checks before the collection budget, not an upload, media-loading or playback API.

For a deliberate orientation/size change, lay out metadata at the destination width first, then animate the tile's owned box; do not animate font size or continuously rewrap a truncated filename. Preview reservation stays stable. The group measures nothing: only the changed tile reads its own committed box, and native horizontal scroll/snap is never eased by a second engine. Keep action focus rings and overlay hit geometry outside any temporary content clipping. A title pulse has one local opacity owner and no travelling shimmer. Full-mode zero timeScale snaps a held native press state and releases instantly; reduced/none omit any added scale without changing native held state or persistent application state.

The group consumes native tile destinations only, so its scrolling never writes a transform over the tile or the trigger host. While native scrolling/snap is active, affected tile geometry commits immediately instead of interpolating under that interaction. If an intermediate tile box adds clipping to the final visible filename/action, settle that axis immediately. Async media decode without an intentional content revision is passive layout, not a new tile-growth cause. Use one measurement per changed visible tile and bounded title/description/preview work; oversized groups skip per-tile measurement and offscreen decoration. Numeric filename strings and already formatted metadata remain text unless explicitly composed as a quantity.

## Acceptance scenarios

Executed in the component suite on one live instance per mode: insertion, later media/action insertion and exit, a supplied preview replacement, a supplied state change on the tile and preview, filename and description diffs with retained substrings, a direct display quantity, the busy title loop and its cancellation, the owned tile box on both axes, and the inherited Button action host. The same suite exercises rapid state reversal, removal and reopen, unmount cleanup, keyboard focus on a named action and on the overlay trigger, and the shared three-mode contract with a zero recipe clock.

Also required and deferred: real-device ≥55 fps and page/CLS measurement under ADR-023, dual-theme narrow/wide screenshots in a real browser, and a preview whose supplied media is a live video or canvas subtree, where immediate replacement is the eligible fallback rather than an animation. Uploading, decoding and playback remain outside the component; no measurement, exit or handoff path may mount a second preview instance, restart playback or duplicate a form/id registration, and no obsolete pulse may restart after error/done.
