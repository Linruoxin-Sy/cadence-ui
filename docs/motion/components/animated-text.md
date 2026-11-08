# AnimatedText motion contract

The standalone string display owns changed-only opacity, using the shared native Text controller.
It has no entrance, colour, number, captured-origin or outer geometry owner. Inherit the
[shared contract](../README.md) and [presets](../presets.md). The migration marker stays legacy
until the global schema/evidence gate exists; this does not hide its explicitly shipped text form.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": { "text": ["animated-text#AnimatedText"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                           | References                            |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| Appearance      | No initial entrance: SSR and hydration show the final native text.           | not-applicable: `@text`               |
| Size            | Native inline layout; the enclosing composition owns any geometry effect.    | inherited: `@text`                    |
| Surface colour  | No surface or state palette is introduced by this string renderer.           | not-applicable: `@text`               |
| Text colour     | The caller's inherited foreground stays authoritative, with no colour tween. | inherited: `@text`                    |
| Changed text    | This renderer owns only changed paint; retained native text never replays.   | default: `animated-text.text.replace` |
| Changed numbers | Strings remain strings, with no numeric parsing or reel inference.           | not-applicable: `@text`               |

## Choreography and modes

| Trigger / owner                  | full                                                                                                                                                        | reduced                                           | none                                        | Binding → preset → recipe/form                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Committed string revision / text | Changed-only opacity, default grapheme rhythm; word mode groups changed grapheme paint by native word segmentation. Exact native fallback when proof fails. | Short changed-only opacity, no stagger or travel. | Exact final text with no duration or delay. | `animated-text.text.replace` → `text.replace` → `text.change/changed-runs` |

## Interruption and lifecycle

One native Text node carries the immediate current accessible, selectable and copyable value.
New commits cancel old paint and target the latest value. Equal rerenders do not replay. A key/remount
is the caller's existing entity boundary, never a public identity prop. Mode/clock downgrade, hidden
document, selection/find/copy, entering editing and physical removal retire decoration. Leaving
editing establishes a fresh baseline without replaying edits. Native refs, events and focus stay on
the span; arbitrary child traversal and rich-content rewriting are excluded by the string API.

## Geometry and performance

The shared proof keeps native whitespace, wrapping and typography. It accepts only proven ASCII
default typography at unit device scale, within viewport and clipping bounds. Other scripts,
font features, DPR/zoom, unknown layouts or missing Highlight/stylesheet APIs stay native immediate.
No new outer size owner or containing block is introduced. Diff caps remain 2048 graphemes, 4096
middle comparisons and 64 aggregate live changed graphemes. Raster work is limited to 262144 pixels
and a 4096-pixel axis. Standalone grapheme delays use stagger.char; word delays use stagger.word.
Final delays are capped at 120ms after timeScale, with at most 20 animated changed graphemes; excess
units are immediate. Word grouping changes only the clock of changed paint, never retained content
or semantic segmentation. Unsupported word segmentation also stays immediate. Built-in bindings
continue to select no stagger; no per-instance raw timing knobs are exposed.

## Acceptance scenarios

Exercise actual public source and payload-installed copies in all modes: Save→Saved, Send→Sent,
repeated letters and retained middle runs, word grouping, bounded stagger, interruption, zero clock,
live downgrade and unmount. Verify SSR/hydration/no-JS, one semantic Text, keyboard focus, clipboard,
selection/find, inherited editing and rich siblings. Prove unsupported scripts/features, DPR2 and
viewport/clipping fallbacks without describing them as animated. Measure complete production route
and installed dependency costs separately; fixed global budgets remain independently gated.
