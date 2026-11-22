# Chart motion contract

Status: functionally migrated to v2. Unit action evidence and a real-browser matrix are recorded on the
issue; production-build budgets and real-device performance governance remain deferred under
[ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Chart animates the annotations it owns and never imitates data motion by scaling the container. The surface
is `ChartContainer`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` and
`ChartLegendContent`; configuration labels/icons and caller-supplied Recharts children retain their meaning
and identity.

Recharts remains the data-geometry writer. Cadence supplies one data clock, the effective mode ceiling and
unknown-work settlement to Recharts' own animation controller; it does not add a second series writer,
per-point observer, SVG clone or container-size tween.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This contract adds no chart
type, data model or public engine selector.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "series": ["chart#ChartContainer"],
    "surface": ["chart#ChartContainer"],
    "annotation": ["chart#ChartTooltipContent", "chart#ChartLegendContent"],
    "label": ["chart#ChartTooltipContent", "chart#ChartLegendContent"],
    "value": ["chart#ChartTooltipContent"],
    "interaction": ["chart#ChartContainer"]
  },
  "regions": {
    "series": ["chart"],
    "surface": ["chart"],
    "interaction": ["chart"],
    "annotation": ["chart-tooltip", "chart-legend"],
    "label": ["chart-tooltip-label", "chart-legend-label"],
    "value": ["chart-tooltip-value"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                             | References                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Appearance      | Default: a genuinely later inserted chart surface may enter once; initial series are already at their SSR/first-render data state. Tooltip and legend paint own one short local opacity entrance after the document baseline; first paint stays natural.                            | default: `chart.surface.enter`, `chart.annotation.enter` |
| Size            | Native: `ResponsiveContainer` owns responsive dimensions and Recharts owns data geometry. A known outer expansion is composed by its actual container, never simulated by scaling the SVG or a second chart height writer.                                                          | inherited: `@interaction`                                |
| Surface colour  | Inherited: data-series fill/stroke belongs to the actual Recharts/caller owner. The tooltip/legend surfaces have no component-owned semantic state colour, so no separate annotation colour writer is added.                                                                        | inherited: `@series`                                     |
| Text colour     | Not applicable: annotation foreground inherits the existing surface tokens and any caller renderer output; no component-owned text-colour state exists to transition.                                                                                                               | not-applicable: `@label`                                 |
| Changed text    | Not applicable as an animated change. Tooltip labels follow pointer/keyboard scrubbing and caller formatters; legend labels are config/data-derived. Animated per-entry observers are explicitly excluded, and Chinese names, dates, prefixes, arrays and identifiers stay literal. | not-applicable: `@label`                                 |
| Changed numbers | Not applicable: the only numeric annotation surface is the pointer/focus-driven tooltip value, which must always show the current payload immediately; caller formatters own grouping and precision, and arrays or numeric-looking identifiers are never reparsed as counters.      | not-applicable: `@value`                                 |

## Choreography and modes

| Trigger and owner                             | Full                                                                                                  | Reduced                          | None                             | Binding → preset → recipe                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| Data changes; actual Recharts series          | Recharts interpolates the committed data through its animation controller under Cadence's data clock. | Final data geometry immediately. | Final data geometry immediately. | `chart.series.update` → `engine.native` → `native/recharts`              |
| Independent later insertion; chart surface    | Surface opacity only, without duplicating same-cause series entry.                                    | Short opacity.                   | Visible immediately.             | `chart.surface.enter` → `presence.surface` → `enter.pop/opacity`         |
| Tooltip/legend visibility change; owned paint | Short local opacity; tooltip position follows pointer/focus immediately.                              | Short opacity.                   | Immediate visibility.            | `chart.annotation.enter` → `presence.inline` → `data.transition/opacity` |
| Pointer/focus scrub or responsive layout      | Native position, current value and chart dimensions update directly.                                  | Same direct operation.           | Same direct operation.           | `chart.interaction.direct` → `engine.native` → `native/recharts`         |

Annotation exit is not claimed: Recharts removes tooltip and legend content when it becomes inactive or
empty. Without a surviving owner that can retain a non-selectable, non-accessible visual, removal is
immediate and no exit recipe is installed.

## Interruption and lifecycle

- Retarget data through the existing Recharts controller, preserving series keys, stable nodes, supported
  engine data identity and caller interpolation callbacks. Do not queue datasets, assign identity from the
  current display order, or mount a second geometry animation. Initial data is final on first paint; a
  newly inserted chart surface consumes the same-cause series entrance, while a later data revision still
  belongs to the series owner.
- The controller's mode adapter cancels active engine interpolation on live reduced/none or a zero recipe
  clock and commits terminal values before paint. A return to full does not replay settled data; unmount
  releases the controller, its transaction registration and annotation writers.
- Tooltip pointer/focus changes show the latest payload immediately, even if the same value occurs at
  another data point. Because no discrete, unambiguous annotation revision survives the direct scrub owner,
  text and number presentation is not installed for annotation content; the chart never queues a reel or
  fades a label. Disappearing payloads are removed immediately.
- Caller custom shapes, formatters and unsupported geometry remain their documented responsibility. Default
  tooltip values retain their existing numeric formatting; custom formatter output is never reparsed or
  silently replaced by a different locale/precision policy.
- A stopped old controller or annotation completion cannot mutate the current payload after hide, removal
  or reappearance.

## Geometry and performance

Recharts owns Bar, Line, Area, Pie, Scatter, Radar, RadialBar and Funnel interpolation through the existing
supported controller path. Initial dimensions, custom interpolators and `isAnimationActive=false` opt-outs
are preserved; per-series `animationDuration`/`animationBegin`/`animationEasing` do not bypass Cadence's
controller clock or mode ceiling. Responsive width/height changes are immediate native layout; no
container-size tween, per-point observer or second transform on an SVG group. Tooltip text uses
destination-width layout before local paint, not width springs while following a pointer.

Series colour remains with the actual Recharts/caller owner: a colour-only update that the series adapter
does not interpolate takes its native final fill/stroke immediately. Annotation paint is a separate
tooltip/legend DOM layer and never overlays series paint. `ChartTooltip` continues to disable positional
tweening; its content receives final coordinates before the optional opacity entrance.

Use the shared [Chart data interpolation limit](../presets.md#5-geometry-text-and-numerical-limits) across
all animated visible series, with one active interpolation per series. Line/area samples count even when
their dots are hidden; sparse visible marks do not exempt a dense path. Above the ceiling, commit the
affected geometry immediately without resampling or dropping data. Unknown/unbounded custom geometry
cannot claim this bounded default; use a safe immediate engine target or its explicitly caller-owned
adapter. This is a conservative design bound pending real-device verification, not a claimed measured
threshold. Do not observe each data point, animate an offscreen chart, or clone the complete SVG/dataset to
retain exits; responsive/visibility recovery starts from current data instead of replaying missed
revisions.

An adapter invocation with no verified series/work descriptor is unknown work, never a zero-sample
series. The shared controller settles that path before starting an interpolation loop, or leaves it with
its explicit caller owner without claiming Cadence's bounded default. The inventory comes from supported
registrations/data identities, not executing arbitrary React children or formatter functions to inspect
their return values. A known empty/disabled series may legitimately consume zero.

## Acceptance scenarios

- Verified in unit tests: render a caller wrapper containing an otherwise supported series, and invoke the
  engine controller without a verified work descriptor in full, reduced and none. Unknown work never starts
  a supposedly zero-cost Cadence loop; exact final data and ordinary React invocation semantics survive.
- Verified in unit tests: known empty/disabled series and known bounded siblings do not globally disable the
  fallback, and a retarget of the same stable series/sample does not count as a second retained copy.
- Verified in browser: update each supported series repeatedly and change the mode mid-interpolation; the
  latest terminal geometry survives and custom interpolators/keys stay intact (`tests/e2e/chart.spec.ts`).
- Verified in browser: keyboard scrub after a data revision keeps position and the current value, with no
  reel queue; the pointer follows immediately.
- Verified in browser: plain/rich formatters, legend changes, localized quantities, missing payloads and
  responsive resize; only owned content participates, and light/dark plus narrow/wide renders stay clean.
- Pending browser matrix: reorder payloads with duplicate series names, reuse a payload index for another
  datum, and resolve an obsolete controller after tooltip hide/reopen. Formatting stays unchanged and no old
  completion writes into the new payload.
- Verified in browser: SSR and no-JS examples, later chart insertion, all modes, live downgrade and the
  same-target cancellation; unmount releases only unit-verified engine work.
- Pending browser matrix: exceed the aggregate mark/sample bound with a dense path whose dots are hidden,
  then return to a small dataset; verify exact final data without queues. Exercise a same-payload data
  update versus pointer movement, formatter arrays, series opt-out and attempted duration/delay overrides;
  the controller/mode ceiling remains authoritative.
