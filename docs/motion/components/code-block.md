# Code Block motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance
remain deferred under ADR-023.

Code Block keeps code readable while explaining folding, active-file changes and copy feedback. Its
actual Header/Title/Tabs/Tab/Actions/CopyButton/Content/Panel/Line/Footer/ExpandButton parts stay
intact. A highlighter revision is presentation, not a source edit: the shipped source string is
committed as one identity and never re-tokenised for motion.

Use the [shared contract](../README.md) and [preset definitions](../presets.md); bindings below are
internal design names, not public APIs or recipe IDs. The migration preserves native `pre`/code
selection, the current tab API, controlled expansion and exact copy semantics.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["code-block#CodeBlock"],
    "surface": ["code-block#CodeBlock"],
    "header": ["code-block#CodeBlockHeader"],
    "footer": ["code-block#CodeBlockFooter"],
    "tab": ["code-block#CodeBlockTab"],
    "indicator": ["code-block#CodeBlockTabs"],
    "actions": ["code-block#CodeBlockActions"],
    "viewport": ["code-block#CodeBlockContent"],
    "copy": ["code-block#CodeBlockCopyButton"],
    "expand": ["code-block#CodeBlockExpandButton"],
    "title": ["code-block#CodeBlockTitle"],
    "tab-label": ["code-block#CodeBlockTab"],
    "footer-label": ["code-block#CodeBlockFooter"],
    "expand-label": ["code-block#CodeBlockExpandButton"],
    "value": ["code-block#CodeBlockFooter"],
    "control": ["button#Button"],
    "control-surface": ["button#Button"],
    "control-enter": ["button#Button"],
    "control-exit": ["button#Button"],
    "control-resize": ["button#Button"],
    "control-label": ["button#Button"],
    "control-quantity": ["button#Button"]
  },
  "regions": {
    "root": ["code-block"],
    "surface": ["code-block"],
    "header": ["code-block-header"],
    "footer": ["code-block-footer"],
    "tab": ["code-block-tab"],
    "indicator": ["code-block-tab-indicator"],
    "actions": ["code-block-actions"],
    "viewport": ["code-block-viewport"],
    "copy": ["code-block-copy-icon"],
    "expand": ["code-block-expand-icon"],
    "title": ["code-block-title-text"],
    "tab-label": ["code-block-tab-label"],
    "footer-label": ["code-block-footer-text"],
    "expand-label": ["code-block-expand-text"],
    "value": ["code-block-footer-number"],
    "control": ["button-feedback"],
    "control-surface": ["code-block-copy-button"],
    "control-enter": ["code-block-copy-button"],
    "control-exit": ["code-block-copy-button"],
    "control-resize": ["code-block-copy-button"],
    "control-label": ["button-text"],
    "control-quantity": ["button-number"]
  },
  "axes": { "viewport": ["height"], "control-resize": ["width", "height"] }
}
```

`code-block-title-text`, `code-block-tab-label`, `code-block-footer-text`, `code-block-expand-text`,
`code-block-footer-number`, `code-block-copy-icon` and `code-block-expand-icon` are internal host
markers of shipped parts; they add no export, prop or public slot. `CodeBlockLine` is an exported
part but not a motion host: a line's own background tint is identity paint that arrives with the line
itself, so it holds no part, region or owner here.

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                                                                                              | References                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Appearance      | Default: `code-block` owns one root surface envelope, so an independent late insertion pops the composed source while a first paint or hydration commits it visible. The floating actions own one retained opacity channel of their own. A plain direct source stays one text node, so a source revision is one identity and owns no per-line entry; restoring/removing a retained Button action keeps Button's own entrance/exit. | default: `code-block.root.enter`, `code-block.actions.enter`, `code-block.actions.exit`; inherited: `code-block.control-enter.enter`, `code-block.control-exit.exit`                 |
| Size            | Default: the visible `code-block-viewport` owns measured clamped block-size for fold/expand against the semantic fold target, with SSR reservation and no-JS readability. The natural `code-block-content`/`pre` is measured separately and passive reflow commits immediately. A distinct Panel viewport takes its final size; copy/expand controls keep Button's own owned geometry.                                             | default: `code-block.viewport.resize`; inherited: `code-block.control-resize.resize`                                                                                                 |
| Surface colour  | Default: root, Header and Footer own scoped surface families — root border/foreground, Header bottom rule and Footer top rule. CopyButton/ExpandButton surface paint inherits Button's owner. A diff/highlight line tint, a `::before` line number and a `::after` diff marker are identity paint and commit immediately; syntax-token paint stays with the highlighter.                                                           | default: `code-block.surface.colour`, `code-block.header.colour`, `code-block.footer.colour`; inherited: `code-block.control-surface.colour`                                         |
| Text colour     | Default for root, Header/Footer and the native tab foreground: one family per region, with focus/invalid settling that owner immediately. CopyButton/ExpandButton foreground inherits Button; line-number counters and diff glyphs stay immediate.                                                                                                                                                                                 | default: `code-block.surface.colour`, `code-block.header.colour`, `code-block.footer.colour`, `code-block.tab.colour`; inherited: `code-block.control-surface.colour`                |
| Changed text    | Default for owned plain title, tab label, Footer text and the built-in or direct plain ExpandButton label: each region replaces changed graphemes in place on one retained host, `stagger: none`. Highlighted or line-numbered source is a highlighter/identity revision, so it commits as one exact source identity immediately; rich non-code labels and CopyButton display children keep their own composition.                 | default: `code-block.title.change`, `code-block.tab-label.change`, `code-block.footer-label.change`, `code-block.expand-label.change`; inherited: `code-block.control-label.replace` |
| Changed numbers | Default for a directly supplied quantity in the non-code Footer display region: compact reels on that slot only. Line numbers, filenames, tab values and language labels are identity text, not scalar counters, so they stay immediate; a numeric Button child inherits Button's reel.                                                                                                                                            | default: `code-block.value.change`; inherited: `code-block.control-quantity.roll`                                                                                                    |

`surface.colour` addresses the root shell; `header.colour` and `footer.colour` address their own
separator rule plus explicit foreground because each overrides the root's paint. `tab.colour` owns the
native tab button's foreground only, while `indicator` owns the marker's geometry — one writer per
property, never a second selected surface on the button.

A source line is identity paint and deliberately outside this contract. A diff or highlight tint
arrives with the line that carries it, and a file may hold tens of thousands of lines; a scope,
colour owner and mutation observer per line would make the file itself the cost. The named marker
glyphs (`+`/`−`, line-number counters) keep their generated identity and paint as well.

`control*` parts name `CodeBlockCopyButton`/`CodeBlockExpandButton`'s default [Button](button.md)
renderer. Its paint, press layer, presence, eligible geometry and direct label/quantity handling stay
Button's owners; the block adds no second writer over those parts. `control-surface`,
`control-enter`/`control-exit` and `control-resize` anchor on the copy button as the composed
representative — it is the same Button renderer the expand button uses, and the block never
specializes that export's internals. A caller `render` replacing Button is composed by its own owner
and is not scanned by this contract.

## Choreography and modes

| Trigger / owner                                   | full                                                                                                                               | reduced                                             | none                                         | Binding → preset → recipe/form                                                                                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent late insertion / root                 | Opacity entry on the composed source; first paint, hydration and an in-place rerender commit visible.                              | Short opacity only.                                 | Visible immediately.                         | `code-block.root.enter` → `presence.surface` → `enter.pop/opacity`                                                                                                                                                                           |
| Revealed floating actions / actions host          | Opacity entry through the retained channel; the row is always present in the header placement.                                     | Short opacity only.                                 | Visible immediately.                         | `code-block.actions.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                   |
| Unrevealed floating actions / actions host        | Opacity exit on the same retained host; keyboard focus still reveals it immediately.                                               | Short opacity only.                                 | Hidden immediately.                          | `code-block.actions.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                                            |
| Fold/expand or `maxLines` revision / viewport     | One clamped block-size transition from the current size to the committed fold destination; inline-size is final before travel.     | Final size immediately.                             | Final size immediately.                      | `code-block.viewport.resize` → `geometry.content` → `geometry.resize/measured`                                                                                                                                                               |
| Selection revision / tab-indicator                | The one persistent marker travels between the committed tab rectangles; label/width reflow rebases immediately.                    | Destination immediately.                            | Destination immediately.                     | `code-block.indicator.select` → `layout.selection` → `layout.shared/selection`                                                                                                                                                               |
| Copy state / copy glyph pair                      | Copy glyph fades out and shrinks while the tick settles in; both glyphs share one stacked cell so the button never resizes.        | Glyph swap uses short opacity only.                 | Final glyph immediately.                     | `code-block.copy.change` → `state.indicator` → `state.morph/indicator`                                                                                                                                                                       |
| Expanded state / expand chevron                   | Chevron rotates by `rotation.halfTurn` without fading or travelling.                                                               | Orientation is immediate.                           | Final orientation immediately.               | `code-block.expand.change` → `state.indicator` → `state.morph/indicator`                                                                                                                                                                     |
| Plain title replacement / title host              | Changed graphemes replace on the same retained span, `stagger: none`.                                                              | Changed-unit opacity only.                          | Final title immediately.                     | `code-block.title.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                      |
| Plain tab label replacement / tab label host      | Changed graphemes on the label layer only; the marker is rebased separately by `indicator.select`.                                 | Changed-unit opacity only.                          | Final label immediately.                     | `code-block.tab-label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                  |
| Plain Footer text replacement / footer text host  | Changed graphemes on the text slot only.                                                                                           | Changed-unit opacity only.                          | Final text immediately.                      | `code-block.footer-label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                                               |
| Expand label revision / expand label host         | Changed graphemes on the built-in or direct plain label only.                                                                      | Changed-unit opacity only.                          | Final label immediately.                     | `code-block.expand-label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                                               |
| Direct Footer quantity revision / number host     | Changed places reel on the quantity slot without reading code, line numbers or identifiers.                                        | Final quantity immediately.                         | Final quantity immediately.                  | `code-block.value.change` → `number.compact` → `number.roll/reels`                                                                                                                                                                           |
| Variant/theme paint / root, Header, Footer        | Scoped colour transition per owning region; focus/invalid inside that region settles its own paint immediately.                    | Short colour feedback with the same owner priority. | Target colours immediately.                  | `code-block.surface.colour` → `state.color` → `state.color/surface-foreground`; `code-block.header.colour` → `state.color` → `state.color/surface-foreground`; `code-block.footer.colour` → `state.color` → `state.color/surface-foreground` |
| Active tab foreground / native tab button         | Scoped foreground transition on the tab only; a focused tab settles immediately.                                                   | Short colour feedback.                              | Target colours immediately.                  | `code-block.tab.colour` → `state.color` → `state.color/foreground`                                                                                                                                                                           |
| Composed action press / inherited Button feedback | Inherit Button press on its safe visual layer; omit scale when that layer is unavailable (rich children render no feedback layer). | No scale; colour follows the same Button owner.     | Native activation immediately, no animation. | `code-block.control.press` → `feedback.press` → `feedback.press/scale`                                                                                                                                                                       |
| Composed action paint / inherited Button          | Button's single surface and foreground family with immediate focus/invalid priority.                                               | Same immediate priority, otherwise short colour.    | Target colours immediately.                  | `code-block.control-surface.colour` → `state.color` → `state.color/surface-foreground`                                                                                                                                                       |
| Composed action presence / inherited Button       | Button keeps its own returned entrance and retained exit on its own host; the block adds no second fade.                           | Short opacity only.                                 | Visible or removed immediately.              | `code-block.control-enter.enter` → `presence.inline` → `data.transition/opacity`; `code-block.control-exit.exit` → `presence.exit` → `exit.fade/opacity`                                                                                     |
| Composed action size / inherited Button           | Button interpolates its own bounded intrinsic dimensions; the block never follows interpolated button size.                        | Final dimensions immediately.                       | Final dimensions immediately.                | `code-block.control-resize.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                                         |
| Composed action label / inherited Button          | Button replaces its own changed label runs once; the block never reads the label.                                                  | Changed-unit opacity only.                          | Final label immediately.                     | `code-block.control-label.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                             |
| Composed action quantity / inherited Button       | Button reels its own numeric child once, retargeting its own box concurrently.                                                     | Final number immediately.                           | Final number immediately.                    | `code-block.control-quantity.roll` → `number.compact` → `number.roll/reels`                                                                                                                                                                  |

One form per recipe is retained per region: `presence.surface` is used for the block's own root only,
so a Button action's entrance cannot be claimed by a local surface envelope. `presence.exit` is used
by the floating actions and by the inherited Button exit, never as a popup ending phase.

The grouped `surface.colour`/`header.colour`/`footer.colour` rows are separate parts because each
host overrides the root's paint and would otherwise need a second controller on the same property.
A line tint is not one of them: see the identity-paint note above.

A source revision deliberately has no owned entrance or exit. The plain direct string stays upstream's
one text node, so a line has no independent host to retain: splitting it into per-line hosts would
replace the streaming source, duplicate the selectable tree and rescan the whole file on every chunk.
A revision therefore commits the exact new source immediately, and a highlighted or line-numbered
source keeps its own highlighter/counter identity.

## Interruption and lifecycle

Marker, source and copy-feedback identities are scoped to one CodeBlock instance. Two blocks may use
the same tab values and the same source string without sharing a marker, a highlighter result
authority or a clipboard-feedback completion; an immutable cache may be shared, an active visual
handle may not.

- Rapid fold reverses from the current viewport size; rapid tab selection moves the same marker to the
  latest committed tab; rapid copy/reveal commits retarget the live envelope. A committed replacement
  bumps the envelope revision so the newest state wins instead of replaying the previous one.
- The source is one identity: a changed string is committed exactly, a highlighter/theme/language
  revision is presentation-only, and a stale highlighter delivery cannot claim the newer source.
- No outgoing copy of the source is created, so the readable/selectable tree, intrinsic size, scroll
  extent and native selection are never duplicated or rewritten. During a native selection that
  intersects changed text, replacement visuals are suppressed for that scope rather than rewriting
  `Selection` ranges.
- Copy success/error timing stays the existing semantic feedback, not an animation clock, and it
  remains bound to the text captured by that activation. A result from an older tab or source cannot
  claim the currently shown source was copied.
- Closing or unmounting cancels the active root/action/geometry/marker writers and disposes
  measured geometry; reopening does not replay a previous copy or source revision. Live reduction
  settles viewport, marker and chevron immediately and removes copy-icon scale; permitted opacity and
  colour reconcile under their reduced contracts. `none` or a zero clock settles every one-shot target
  before paint.

## Geometry and performance

The marker lives in the tab strip's own content coordinates, independently of the code viewport's
horizontal scroll: scrolling code cannot move it, and native strip focus-reveal scrolling is not a
selection. A retained active value with changed labels, order or available width uses native final
strip layout and rebases `indicator.select` immediately; an actual selection change during that
revision may use the shared selection path only while both endpoints are valid in the same stable
coordinate space.

Natural content is measured separately from the clipped viewport. Folded height respects actual
`maxLines`, padding and the reserved pre-hydration cap, with SSR reservation and no-JS readability
preserved; width, scrollbar positions, passive font/viewport changes and native horizontal scroll
resolve immediately. Code is laid out at its destination inline size before only the block-size
travels, and glyphs are never rewrapped or scaled continuously. Clip code paint only, preserving
action focus outlines and functional scrolling.

For a large source, no per-line motion work is performed at all: a revision is one committed identity,
and no per-line host, copy or layout read is created for it. A revision that cannot be highlighted in
one delivery keeps the exact plain source instead of truncating the file or queuing later batches.

## Acceptance scenarios

- Two blocks with identical tab values and identical source switch and copy independently; a
  replacement in one block cannot move the other's marker or claim its clipboard result (`tests/components/code-block.test.tsx`).
- Root insertion and floating-action reveal/exit execute their own phase in
  `full`, `reduced` and `none` with the exact slot/site/preset from the plan; a `none` or zero-clock
  action settles rather than animating.
- Fold, tab selection and copy-state changes commit the latest semantic target: the viewport height
  keeps its clamped destination, one marker travels to the committed tab, and both copy glyphs share
  one stacked cell so the button keeps its size.
- Plain title/tab/Footer/expand labels keep their identity node across a revision and expose only
  changed-run opacity; highlighted or rich content commits exactly.
- Copy/expand actions keep Button's own paint, press, label, quantity and returned presence; the block
  adds no second writer over `button` internals, and a composed replacement is not scanned.
- Diff/highlight line tints are identity paint: they commit with the line that carries them, and a
  default line pays no observer; focus or `aria-invalid` inside an owning region settles that
  region's paint immediately.
- Browser-only obligations (3 modes × 2 OS preferences, live same-target mode/clock cancellation,
  SSR/no-JS/hydration, native selection and scroll, measured CLS/interaction cost and ≥55fps on a real
  device) remain open under ADR-023; the unit evidence does not certify them.
