# Bubble motion contract

Status: target design; implementation and verification pending.

Bubble introduces a message once and then limits motion to the fragments, dimensions or reactions that actually change. Streaming is a content-update pattern, not a new public streaming prop. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Capability ownership

| Capability | Coverage and owner |
| --- | --- |
| Appearance | default: bubble owns message insertion; BubbleReactions owns its overlay insertion and later directly owned reaction visuals. Rich reaction controls inherit their own owners. BubbleGroup coordinates initial group entry; an enclosing owner consumes the same cause. |
| Size | default: bubble-content/bubble host owns low-frequency text, edit or attachment-driven geometry; bubble-reactions owns its independent overlay size; dense append updates may resolve height immediately under the condition below. |
| Surface colour | default: bubble-content variant and actual interactive-render background/border; bubble-reactions surface owns its own target. |
| Text colour | default: content and reaction foreground, preserving explicit rich descendant owners. |
| Changed text | default: direct plain BubbleContent strings and direct reaction display strings; appends animate only new safe fragments; composed rich Markdown, links and embedded children preserve structure. |
| Changed numbers | default: direct quantities in known reaction/display content; composed rich reaction counts; timestamps, IDs and quoted numeric text remain textual. |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner | full | reduced | none | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| New message / bubble | One opacity entrance; initial content does not also replay character entry. | Short opacity. | Visible immediately. | `bubble.root.enter` → `presence.inline` → one-shot opacity `data.transition` |
| Plain edit or append / BubbleContent display | Changed-only replacement with stagger:none; an append fades only its new safe fragment, never the existing prefix. | Short changed-fragment opacity, with bounded dense-update fallback to immediate. | Latest content immediately. | `bubble.text.replace` → `text.replace` → target `text.change` |
| Low-frequency content/attachment change / owned host | Measure final-width content and interpolate block size; intrinsic width changes are clamped. | Final geometry immediately. | Immediate. | `bubble.content.resize` → `geometry.content` → `geometry.resize` |
| Reaction overlay/owned membership/value changes / bubble-reactions | Fade the independently inserted overlay or later changed visuals, never both for the same cause; resize it and roll changed quantity places. | Short opacity; quantities/geometry immediate. | Immediate. | `bubble.reaction.enter` → `presence.inline` → one-shot opacity `data.transition`; `bubble.reaction.exit` → `presence.exit` → `exit.fade`; `bubble.reaction.resize` → `geometry.compact` → `geometry.resize`; `bubble.reaction.roll` → `number.compact` → revised `number.roll` |
| Direct plain reaction display revision / BubbleReactions text owner | Retain unchanged graphemes and replace changed runs with stagger:none; rich reaction controls retain their own display owner. | Short changed-text opacity. | Final text immediately. | `bubble.reaction.replace` → `text.replace` → target `text.change` |
| Reaction side/align changes / overlay placement owner | Commit final anchor constraints, then bounded visual displacement from the current safe position; existing placement translate and motion have one composed writer. | Final placement immediately. | Final placement immediately. | `bubble.reactions.place` → `layout.compact` → `layout.move` |
| Message align changes / owning message layout scope | Use one final message box for bounded position reflow when a stable scope exists; otherwise place immediately. No surface entrance replay. | Final placement immediately. | Final placement immediately. | `bubble.message.move` → `layout.compact` → `layout.move` |
| Variant or actual interactive state / content/reactions | Scoped colour transition; a plain div gains no press behaviour. | Short colour. | Immediate. | `bubble.surface.colour` → `state.color` → target `state.color`; `bubble.text.colour` → `state.color` → target `state.color` |

## Interruption and lifecycle

The newest committed content wins. If append revisions overlap an already active height transition, classify that run as dense streaming: commit height immediately, coalesce new fragment visuals and drop excess visual work rather than queueing it. This exception does not cover a later isolated edit, attachment replacement or settled message update; those reassess owned geometry normally. Parent removal controls retained exits and cancels obsolete completions. Live reduced cancels geometry/reels; none or zero clock cancels all one-shot effects. Bubble adds no autonomous loop or scrolling behaviour.

The append integration keeps only the latest pending fragment range; retained history never re-enters. A dense run ends when current presentation has settled with no newer append pending, or a non-append revision changes the cause; the next independent revision is assessed afresh without a timer or delayed data commit. Coalescing never exceeds the shared aggregate changed-text/reel budget across the message and its reactions: excess affected visuals update immediately rather than waiting to animate later.

Caller message keys/content revision boundaries define identity; a recycled node showing another message cancels old fragment/geometry work instead of morphing unrelated history. Parent hide/close cancels visual work and returning shows current content without replaying missed chunks. Active text selection, composition in rich descendants or a focused reaction control suppresses presentation that would disturb selection/copy/caret or move the active target. Current semantic/copyable text is never duplicated by retained fragments. Removed rich reaction actions are governed by their explicit owner, not an inferred reaction model.

## Geometry and performance

Lay out changed text at the destination available width before animating host height, keeping text unscaled and unchanged graphemes stable. Dense append, passive wrapping and viewport/font changes use immediate height. Preserve BubbleContent's existing clipping and wrapping; do not clip the separately positioned reaction overlay or focus outline. Image/attachment reservations prevent decode-driven jumps where the composed child supplies dimensions. Bound text diff to changed safe shaping runs and visible content; rich-renderer identity and the parent conversation's scroll anchoring remain external owners.

Choose BubbleContent or its message host as the size writer for a revision, never both. A nested Attachment or other size owner delegates the cause or supplies its final destination once. If the shell would additionally clip required retained message text, selected text, focused content or copy needed for the current action, apply that axis immediately; geometry is not permission to hide message history. Reaction overlay width/height consumes one final layout; side/align positioning cannot compete with its existing anchor translation or cause the bubble to chase overlay dimensions.

Long appends use the known append/revision boundary without rescanning the full history; without such a boundary, the shared bounded diff falls back to immediate affected content. There is one message-size measurement and one independent reaction-overlay measurement, no observer per token/reaction. Media readiness follows its composed owner's identity and passive-layout policy. If parent scroll anchoring or viewport constraints make a position transition unsafe, message/reaction placement is immediate; no hidden scroll correction or full-message opacity fallback is allowed.

## Acceptance scenarios

Target acceptance; not executed: new message without duplicate text entrance; plain edits retaining prefixes; dense append with newlines; isolated edit after streaming; attachment/media change; reaction count and placement changes; rich selectable content; align/variant changes; all modes and zero clock mid-update.

Also pending: coalesced appends exceed the aggregate text budget while reactions update, select/copy text during streaming, recycle a message node, then hide/restore its parent; final text is complete and singular with no queued replay. Change reaction side/align while its count and message width change; one placement writer reaches the latest safe destination.
