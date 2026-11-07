# Code Block motion contract

Status: target design; implementation and verification pending.

Code Block keeps code readable while explaining folding, active-file changes and copy feedback. Its actual Header/Title/Tabs/Tab/Actions/CopyButton/Content/Panel/Line/Footer/ExpandButton parts remain intact. A code edit animates only changed graphemes or safe shaping runs; syntax colouring is presentation, not the identity of source text.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). The target preserves native `pre`/code selection, the current tab API, controlled expansion and exact copy semantics.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "surface": [
      "code-block#CodeBlock",
      "code-block#CodeBlockLine",
      "code-block#CodeBlockTab",
      "code-block#CodeBlockCopyButton",
      "code-block#CodeBlockExpandButton",
      "code-block#CodeBlockTitle"
    ],
    "viewport": ["code-block#CodeBlockContent", "code-block#CodeBlockPanel"],
    "indicator": ["code-block#CodeBlockTabs"],
    "icon": ["code-block#CodeBlockCopyButton", "code-block#CodeBlockExpandButton"],
    "actions": ["code-block#CodeBlockActions"],
    "text": [
      "code-block#CodeBlockTitle",
      "code-block#CodeBlockFooter",
      "code-block#CodeBlockTab",
      "code-block#CodeBlockExpandButton",
      "code-block#CodeBlockContent",
      "code-block#CodeBlockLine"
    ],
    "line": ["code-block#CodeBlockLine"],
    "value": ["code-block#CodeBlockFooter"],
    "control": ["code-block#CodeBlockCopyButton", "code-block#CodeBlockExpandButton", "code-block#CodeBlockTab"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                                          | References                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: independent dynamic block insertion and floating actions use local opacity; wholly new/deleted source lines may fade only under the identity rule below. A parent surface consumes same-cause block insertion, and that insertion consumes initial line entry.                                                                          | default: `code-block.surface.enter`, `code-block.actions.enter`, `code-block.actions.exit`, `code-block.line.enter`, `code-block.line.exit` |
| Size            | Default: each visible `code-block-viewport` owns measured clamped block-size for fold/expand and a known revision of its own content. The actual natural pre/code surface is measured separately. Switching between distinct persisted Panel hosts does not imply a shared height owner; that continuity requires explicit ancestor composition. | default: `code-block.viewport.resize`                                                                                                       |
| Surface colour  | Default: variant, highlighted/added/removed line and action/tab state surfaces; token syntax colours are not treated as newly inserted source.                                                                                                                                                                                                   | default: `code-block.surface.colour`                                                                                                        |
| Text colour     | Default for owned title/tab/control state foreground and explicit line-state changes; syntax-highlighter output keeps its own style ownership.                                                                                                                                                                                                   | default: `code-block.surface.colour`                                                                                                        |
| Changed text    | Default for owned plain title/tab/footer/expand-button labels and safe direct-string code source updates. Modified source retains unchanged graphemes/runs across line and token boundaries. Arbitrary rich token trees without safe source mapping update immediately; rich non-code labels use explicit composition.                           | default: `code-block.text.replace`; composed: `@text`                                                                                       |
| Changed numbers | Default for a supported direct quantity in a non-code display part such as Footer; composed for rich quantitative accessories. Not applicable to source numerals, line numbers, filenames, tab values or language/version labels, which are code/identity text rather than scalar counters.                                                      | default: `code-block.value.change`; composed: `@value`                                                                                      |

## Choreography and modes

| Trigger and owner                                  | Full                                                                                                                                                   | Reduced                                                                                             | None                            | Binding → preset → recipe                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent late insertion; block paint            | Opacity-only surface entry, with code already at its current source and no line cascade.                                                               | Short opacity.                                                                                      | Visible immediately.            | `code-block.surface.enter` → `presence.surface` → `enter.pop/opacity`                                                                                                                                            |
| Fold/expand or known active content size; viewport | One clamped block-size transition between actual folded/full destinations.                                                                             | Final size immediately.                                                                             | Final size immediately.         | `code-block.viewport.resize` → `geometry.content` → `geometry.resize/measured`                                                                                                                                   |
| Active tab changes; tab-indicator                  | Persistent local selection marker moves to the active tab.                                                                                             | Destination immediately.                                                                            | Destination immediately.        | `code-block.indicator.select` → `layout.selection` → `layout.shared/selection`                                                                                                                                   |
| Copy result/expanded state; existing button icons  | Copy icon uses opacity and `scale.in`; expand chevron turns by `rotation.halfTurn` without fading. Button identity and label semantics stay stable.    | Copy icon uses short opacity; expand chevron orientation is immediate.                              | Final state immediately.        | `code-block.icon.change` → `state.indicator` → `state.morph/indicator`                                                                                                                                           |
| Existing hover/focus action visibility             | Opacity entry/exit; focus makes controls usable immediately.                                                                                           | Short opacity.                                                                                      | Immediate visibility.           | `code-block.actions.enter` → `presence.inline` → `data.transition/opacity`; `code-block.actions.exit` → `presence.exit` → `exit.fade/opacity`                                                                    |
| Safe source/owned label replacement                | Animate changed graphemes/runs only, no stagger; a whole line may fade only when none of its units are retained elsewhere in the same source revision. | Short opacity on changed units only; unsafe/high-frequency/selection-conflicting updates immediate. | Final source/label immediately. | `code-block.text.replace` → `text.replace` → `text.change/changed-runs`; `code-block.line.enter` → `presence.inline` → `data.transition/opacity`; `code-block.line.exit` → `presence.exit` → `exit.fade/opacity` |
| Direct non-code display quantity changes           | Changed places roll without interpreting code or line-number text.                                                                                     | Final quantity immediately.                                                                         | Final quantity immediately.     | `code-block.value.change` → `number.compact` → `number.roll/reels`                                                                                                                                               |
| Copy/expand button press                           | Inherit Button feedback on its visual layer, separately from icon state and viewport geometry.                                                         | No scale; short colour.                                                                             | Immediate.                      | `code-block.control.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                           |
| Variant/highlight/tab/action state colours         | Scoped surface/foreground/border colour; focus ring immediate.                                                                                         | Short colour.                                                                                       | Final colours immediately.      | `code-block.surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                   |

## Interruption and lifecycle

- Rapid fold reverses from current viewport size. Rapid tab selection moves the same marker to the latest active panel without remounting unrelated panels or replaying the whole code block. Persisted panels retain their own source/scroll state; do not diff two different files merely because the active tab changed. First marker placement or a restored selection without a valid previous tab is immediate.
- Diff the direct source string, not highlighted span keys/classes or line indices. A one-character change cannot fade its entire retained line. A newline insertion/deletion may split or join lines while most glyphs survive: retain those glyphs across the old/new line boundary, and use whole-line entry/exit only for units with no retained identity in the revision. If bounded diff cannot establish safe identity, commit the affected source immediately rather than treating unmatched lines as entirely new.
- Syntax grammar loading, language changes, theme/token recolouring and asynchronous highlighter results are presentation revisions, not source edits. Tag their result with the current source/language revision, discard stale results and preserve source identities across token boundaries where mapping is safe. Unsupported token/shaping mappings use immediate final paint with no whole-source crossfade.
- Preserve one current accessible and selectable source tree; outgoing fragments are aria-hidden, nonselectable, noninteractive and excluded from intrinsic sizing. CodeBlockCopyButton continues to copy its explicit value or values[current tab] contract, never innerText from animated/highlighted DOM; a missing tab mapping does not copy another tab. During native selection that intersects changed code, suppress replacement visuals for that scope without rewriting Selection ranges; unchanged nodes and caller editors remain intact.
- Copy success/error timing remains existing semantic feedback, not an animation timer. Close/unmount cancels active source/geometry/indicator writers and measurement; live reduced/none or zero clock settles before paint. Reopening does not replay previous copy or code changes.

## Geometry and performance

Measure natural `code-block-content`/code layout separately from the clipped viewport. Folded height respects actual line-height/padding and `maxLines`, with SSR reservation and no-JS readability preserved. Lay code out at destination inline-size before animating only the viewport block-size; do not continuously rewrap or scale glyphs. A distinct newly active Panel viewport takes its final measured size rather than animating from a hidden zero measurement or another panel's old height. A surviving composed ancestor may own a cross-panel height transaction, in which case the child viewports do not animate that same cause. Width, scrollbar positions, passive font/viewport changes and native horizontal scroll resolve immediately. Clip code paint only, preserving action focus outlines and functional scrolling.

For a large source, inspect only the bounded affected visible lines/runs needed for the current revision, with at most the shared collection bound of visible changed lines participating. The shared diff-work and aggregate changed-glyph/reel limits apply once to the whole block revision, not once per line or token. Avoid re-tokenizing solely for animation, per-glyph layout reads, hidden full-document clones and work on every persisted inactive panel. Newline/duplicate-line ambiguity that exceeds those limits uses immediate source updates. Nested parent geometry adopts the committed destination rather than chasing every height frame.

## Acceptance scenarios

- Pending: edit one character, insert/delete a line, change syntax-token boundaries and supply unsafe rich token content; unchanged source remains still and fallbacks stay exact.
- Pending: fold/reverse, switch differently sized tabs rapidly, change maxLines and close the parent mid-motion; viewport/indicator end at the latest semantic target.
- Pending: copy during source replacement, select text across changed lines, use line numbers/wrap/highlights and keyboard-focus actions; copied and accessible source contain no stale fragments.
- Pending: verify SSR folding/no-JS readability, all modes, high-frequency updates, live downgrade, zero clock and unmount without retained measurement or visual layers.
- Pending: split/join a line, insert above repeated identical lines, resolve an old highlighter promise after a newer source/language change, and switch tabs mid-copy. Retained glyphs never receive whole-line fades; copy follows the explicit current value map and grammar/theme changes do not masquerade as source edits.
- Pending: select across a changing line, exceed aggregate diff bounds, update an inactive persisted panel, and activate a differently sized panel without a shared host. Source/selection stays exact, work stays bounded, and no hidden zero height or synthetic cross-file diff becomes visible.
