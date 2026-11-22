# Bubble motion contract

Status: functionally migrated; numerical performance governance and real-device measurement remain deferred under ADR-023.

Bubble introduces a message once and then limits motion to the fragments, dimensions or reactions that actually change. Streaming is a content-update pattern, not a new public streaming prop. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["bubble"],
    "message": ["bubble"],
    "group": ["bubble-group"],
    "content": ["bubble-content"],
    "text": ["bubble-text-runs"],
    "value": ["bubble-text-runs"],
    "surface": ["bubble-content", "bubble-reactions"],
    "foreground": ["bubble-text", "bubble-reactions-text"],
    "reaction": ["bubble-reactions"],
    "reactions": ["bubble-reactions"],
    "reaction-text": ["bubble-reactions-text-runs"]
  },
  "axes": { "content": ["height"], "reaction": ["width", "height"] },
  "parts": {
    "root": ["bubble#Bubble"],
    "message": ["bubble#Bubble"],
    "group": ["bubble#BubbleGroup"],
    "content": ["bubble#BubbleContent"],
    "text": ["bubble#BubbleContent"],
    "value": ["bubble#BubbleContent"],
    "surface": ["bubble#BubbleContent", "bubble#BubbleReactions"],
    "foreground": ["bubble#BubbleContent", "bubble#BubbleReactions"],
    "reaction": ["bubble#BubbleReactions"],
    "reactions": ["bubble#BubbleReactions"],
    "reaction-text": ["bubble#BubbleReactions"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                                                                  | References                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Appearance      | default: bubble owns message insertion on its own root; bubble-reactions owns its overlay insertion and later removal; bubble-group coordinates one envelope for the messages it initially contains and an enclosing owner consumes the same cause. | default: `bubble.root.enter`, `bubble.group.enter`, `bubble.reaction.enter`, `bubble.reaction.exit` |
| Size            | default: bubble-content owns its own block growth from text, edit or attachment-driven revisions; bubble-reactions owns its independent overlay box; a caller-fixed axis and a composed child size owner stay native.                               | default: `bubble.content.resize`, `bubble.reaction.resize`                                          |
| Surface colour  | default: the bubble-content variant surface and the reaction overlay surface own their own actual background/border paint; a caller-supplied palette commits immediately instead of passing through unreadable paint.                               | default: `bubble.surface.colour`                                                                    |
| Text colour     | default: the direct plain message display and the direct plain reaction display own their foreground; composed rich descendants keep their own paint owners.                                                                                        | default: `bubble.foreground.colour`                                                                 |
| Changed text    | default: direct plain message strings and direct plain reaction strings replace changed runs only; composed rich Markdown, links and embedded children preserve their structure and owner.                                                          | default: `bubble.text.replace`, `bubble.reaction-text.replace`                                      |
| Changed numbers | default: supported direct numbers in the message content and the reaction overlay are quantities in their existing display format; timestamps, identifiers and quoted numeric strings remain text and rich counts stay composed.                    | default: `bubble.value.roll`, `bubble.reaction-text.roll`                                           |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                 | full                                                                                                                                                              | reduced                                                                       | none                         | Binding → preset → recipe/form                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New message / message root                                      | One opacity entrance; initial content does not also replay character entry.                                                                                       | Short opacity.                                                                | Visible immediately.         | `bubble.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                       |
| Plain edit or append / message display span                     | Changed-only replacement with stagger:none; an append fades only its new safe fragment, never the existing prefix.                                                | Short changed-fragment opacity, with the bounded dense-update fallback below. | Latest content immediately.  | `bubble.text.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                       |
| Low-frequency content change / bubble-content host              | Measure final-width content and interpolate the owned block size; a caller-fixed width stays native.                                                              | Final geometry immediately.                                                   | Immediate.                   | `bubble.content.resize` → `geometry.content` → `geometry.resize/measured`                                                                                                                                                                                                                 |
| Reaction overlay insertion, removal, size or quantity / overlay | Fade the inserted overlay, resize its own box and roll the changed quantity place; the message root is not faded for the same cause.                              | Short overlay opacity; quantity and geometry immediate.                       | Immediate.                   | `bubble.reaction.enter` → `presence.inline` → `data.transition/opacity`; `bubble.reaction.exit` → `presence.exit` → `exit.fade/opacity`; `bubble.reaction.resize` → `geometry.compact` → `geometry.resize/measured`; `bubble.reaction-text.roll` → `number.compact` → `number.roll/reels` |
| Direct plain reaction display revision / retained reaction span | Retain unchanged graphemes and replace changed runs with stagger:none; rich reaction controls retain their own display owner.                                     | Short changed-text opacity.                                                   | Final text immediately.      | `bubble.reaction-text.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                              |
| Reaction side/align change / overlay placement owner            | Commit the final anchor constraints, then one bounded displacement from the current safe position; the resting placement translate is the only positional writer. | Final placement immediately.                                                  | Final placement immediately. | `bubble.reactions.place` → `layout.compact` → `layout.move/position`                                                                                                                                                                                                                      |
| Message align change / owning message layout scope              | Use one final message box for a bounded position reflow when the retained scope exists; the surface entrance never replays.                                       | Final placement immediately.                                                  | Final placement immediately. | `bubble.message.move` → `layout.compact` → `layout.move/position`                                                                                                                                                                                                                         |
| Variant or actual interactive state / content and overlay paint | Scoped colour transition on the declared surface and foreground properties.                                                                                       | Short colour.                                                                 | Immediate.                   | `bubble.surface.colour` → `state.color` → `state.color/surface`; `bubble.foreground.colour` → `state.color` → `state.color/foreground`                                                                                                                                                    |
| Independent bubble-group insertion / group                      | One opacity envelope for the initial messages; their duplicate root entrances are suppressed.                                                                     | Short opacity only.                                                           | Final group immediately.     | `bubble.group.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                      |
| Direct numeric message revision / message display span          | Roll changed numeric places in the existing display format; share the content host destination instead of a second width writer.                                  | Final number immediately.                                                     | Final number immediately.    | `bubble.value.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                                                                                              |

`text` addresses the direct plain message display only; `reaction-text` owns the direct plain reaction display, and `foreground` coordinates their distinct paint. Both display parts are private spans inside their owning public host, so the message keeps one copyable current string and the reaction keeps one. A direct number selects the quantity renderer on that same span, while a string remains text; switching renderer type establishes an immediate baseline rather than inventing a number source. Parent/group entry consumes the initial content and reaction appearance without suppressing later independent revisions.

## Interruption and lifecycle

Plain/numeric BubbleContent in an actual editable context is native editing, including inherited
editability. Apply the [shared editing boundary](../../animation-system.md#36-changed-text) before
fragment/reel integration: no splitting, decorative duplicate history or animation-owned editing
tree in any mode. Entering editing retires conflicting fragment/geometry work without overwriting
native selection or undo state; leaving editing establishes the current display baseline. Separate
noneditable reactions keep their own eligible owners, subject to a safe selection/DOM boundary.

The newest committed content wins. If append revisions overlap an already active height transition, classify that run as dense streaming: commit height immediately, coalesce new fragment visuals and drop excess visual work rather than queueing it. This exception does not cover a later isolated edit, attachment replacement or settled message update; those reassess owned geometry normally. Parent removal controls retained exits and cancels obsolete completions. Live reduced cancels geometry, reels and placement; none or zero clock cancels all one-shot effects. Bubble adds no autonomous loop or scrolling behaviour.

The append integration keeps only the latest pending fragment range; retained history never re-enters. A dense run ends when current presentation has settled with no newer append pending, or a non-append revision changes the cause; the next independent revision is assessed afresh without a timer or delayed data commit. Coalescing never exceeds the shared aggregate changed-text/reel budget across the message and its reactions: excess affected visuals update immediately rather than waiting to animate later.

Caller message keys/content revision boundaries define identity; a recycled node showing another message cancels old fragment and geometry work instead of morphing unrelated history. Parent hide/close cancels visual work and returning shows current content without replaying missed chunks. Active text selection, composition in rich descendants or a focused reaction control suppresses presentation that would disturb selection/copy/caret or move the active target. Current semantic/copyable text is never duplicated by retained fragments. Removed rich reaction actions are governed by their explicit owner, not an inferred reaction model.

One opacity owner arbitrates presence on each host; the changed-run and quantity writers own the display span's own paint and never fade unchanged graphemes. A retained reaction overlay keeps its insertion envelope and its display replacement as separate causes, so a quantity revision never restarts the overlay entrance.

## Geometry and performance

Appended current text legitimately changes conversation height; outgoing decoration and the reaction overlay must not add a second contribution to scroll overflow or anchoring. In a parent-owned follow/anchor composition, that owner consumes current semantic content and the one approved size transaction, never obsolete decorative bounds. Without a safe paint lane, replace the affected fragment immediately. Bubble does not disable native anchoring, restore an old offset or add an automatic scroll-to-end policy to conceal retirement of a visual copy.

Lay out changed text at the destination available width before animating the owned block height, keeping text unscaled and unchanged graphemes stable. Dense append, passive wrapping and viewport/font changes use immediate height. Preserve BubbleContent's existing clipping and wrapping; do not clip the separately positioned reaction overlay or its focus outline. Image/attachment reservations prevent decode-driven jumps where the composed child supplies dimensions. Bound text diff to changed safe shaping runs and visible content; rich-renderer identity and the parent conversation's scroll anchoring remain external owners.

Choose BubbleContent's block axis or the reaction overlay box as the size writer for a revision, never both, and never the bubble root. A nested Attachment or other size owner delegates the cause or supplies its final destination once. If the shell would additionally clip required retained message text, selected text, focused content or copy needed for the current action, apply that axis immediately; geometry is not permission to hide message history. Reaction overlay width and height consume one final layout; side/align positioning cannot compete with its anchor constraints or cause the bubble to chase overlay dimensions.

Long appends use the known append/revision boundary without rescanning the full history; without such a boundary, the shared bounded diff falls back to immediate affected content. There is one message-size measurement and one independent reaction-overlay measurement, no observer per token or reaction. Media readiness follows its composed owner's identity and passive-layout policy. If parent scroll anchoring or viewport constraints make a position transition unsafe, message and reaction placement are immediate; no hidden scroll correction or full-message opacity fallback is allowed.

## Acceptance scenarios

Executed in the component suite on one live instance per mode: message, group and reaction-overlay insertion, a retained overlay removal, a plain message append that keeps its prefix, a reaction display replacement, a direct numeric message value and a direct numeric reaction value, the owned content block size, the independent overlay box, both placement bindings on a side/align and an align revision, and both colour families on a variant change. The same suite covers keyboard focus on the interactive content and on a named reaction, live full-to-none mode and zero-clock cancellation on the same nodes, nested providers, an SSR/no-JS first paint and hydration without a duplicate entrance, and unmount cleanup.

Also required and deferred: the browser matrix (three modes × two OS preferences), light/dark and narrow/wide screenshots, a real-engine scroll-anchoring composition where appends, removal and reaction updates run during a parent follow policy, real-device ≥55 fps and page/CLS measurement under ADR-023. `geometry.resize/measured` and `layout.move/position` are proven here through their parameter form, revision and committed-target evidence; jsdom has no layout, so their rendered interpolation remains browser work.

Dense-append coalescing is not a bubble-local queue or timer: the shared bounded text diff and the single geometry transaction already drop excess visual work and retarget the newest committed revision, and bubble adds no second writer, so this component contributes no additional coalescing path to measure. A real streaming producer driving those revisions, the per-frame cost of an in-flight projection and the rendered clamp of an animated block size remain browser work.
