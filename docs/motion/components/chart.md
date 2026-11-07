# Chart motion contract

Status: target design; implementation and verification pending.

Chart animates changes to the represented data through Recharts, rather than scaling a container to imitate data motion. The current surface is `ChartContainer`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` and `ChartLegendContent`; configuration labels/icons and caller-supplied Recharts children retain their meaning and identity.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This contract adds no chart type, data model or public engine selector.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "series": ["chart#ChartContainer"],
    "surface": ["chart#ChartContainer"],
    "annotation": ["chart#ChartTooltipContent", "chart#ChartLegendContent"],
    "label": ["chart#ChartTooltipContent", "chart#ChartLegendContent"],
    "value": ["chart#ChartTooltipContent"],
    "interaction": ["chart#ChartContainer"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                                  | References                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Appearance      | Default: a genuinely later inserted chart surface may enter once; initial series are already at their SSR/first-render data state. Legend/tooltip paint has its own later interaction cause.                                                                                                                                             | default: `chart.surface.enter`, `chart.annotation.enter`, `chart.annotation.exit` |
| Size            | Inherited/native: ResponsiveContainer owns responsive dimensions and Recharts owns data geometry. A known outer expansion is composed by its actual container, never simulated by scaling the SVG or a second chart height writer.                                                                                                       | inherited: `chart.interaction.direct`                                             |
| Surface colour  | Default for owned legend/tooltip surfaces and semantic state colours. Data-series fill/stroke changes are delegated to the existing Recharts data owner when it already writes those properties.                                                                                                                                         | default: `chart.annotation.colour`                                                |
| Text colour     | Default for owned legend/tooltip label/value foreground; caller renderer output inherits or owns its explicit styles.                                                                                                                                                                                                                    | default: `chart.annotation.colour`                                                |
| Changed text    | Default for owned plain config labels and safe tooltip/legend strings. Arbitrary formatter React nodes are composed; pointer-scrub labels update immediately to avoid lag.                                                                                                                                                               | default: `chart.label.replace`; composed: `@label`                                |
| Changed numbers | Default for an owned finite numeric tooltip value on a discrete data revision with stable payload identity and a known formatter. Pointer/keyboard scrubbing uses immediate values; arrays, numeric-looking identifiers, axes, rich formatter output and arbitrary series text are engine/caller-owned rather than reparsed as counters. | default: `chart.value.change`; composed: `@value`                                 |

## Choreography and modes

| Trigger and owner                             | Full                                                                                               | Reduced                                               | None                             | Binding → preset → recipe                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Data changes; actual Recharts series          | Existing series interpolation reaches the latest data through the shared controller adapter.       | Final data geometry immediately.                      | Final data geometry immediately. | `chart.series.update` → `data.update` → `data.transition/recharts`                                                                        |
| Independent later insertion; chart surface    | Surface opacity only, without duplicating same-cause series entry.                                 | Short opacity.                                        | Visible immediately.             | `chart.surface.enter` → `presence.surface` → `enter.pop/opacity`                                                                          |
| Tooltip/legend visibility change; owned paint | Short local opacity; tooltip position follows pointer/focus immediately.                           | Short opacity.                                        | Immediate visibility.            | `chart.annotation.enter` → `presence.inline` → `data.transition/opacity`; `chart.annotation.exit` → `presence.exit` → `exit.fade/opacity` |
| Owned annotation state colour                 | Scoped surface/text colour; no overlay competing with a series fill/stroke writer.                 | Short colour.                                         | Final colours immediately.       | `chart.annotation.colour` → `state.color` → `state.color/surface-foreground`                                                              |
| Discrete owned text/value updates             | Changed text runs without stagger; changed numeric places roll when formatting and cadence permit. | Changed text opacity only; numeric value immediately. | Final content immediately.       | `chart.label.replace` → `text.replace` → `text.change/changed-runs`; `chart.value.change` → `number.compact` → `number.roll/reels`        |
| Pointer/focus scrub or responsive layout      | Native position, current value and chart dimensions update directly.                               | Same direct operation.                                | Same direct operation.           | `chart.interaction.direct` → `engine.native` → `native/recharts` (Recharts/ResponsiveContainer native operation)                          |

## Interruption and lifecycle

- Retarget data through the existing Recharts controller, preserving series keys, stable nodes, supported engine data identity and caller interpolation callbacks. Do not queue datasets, assign identity from the current display order, or mount a second geometry animation. Initial data is final on first paint; a newly inserted chart surface consumes the same-cause series entrance, while a later data revision still belongs to the series owner.
- The controller's mode adapter cancels active engine interpolation on live reduced/none or zero recipe clock and commits terminal values before paint. A return to full does not replay settled data; unmount releases the controller and annotation writers.
- Tooltip pointer/focus changes cancel stale label/value animation and show the latest payload immediately, even if the same value occurs at another data point. Only a discrete data revision for the same active payload, with no direct scrub owner, may use text/reels. Revisions arriving before an earlier annotation replacement settles commit the affected latest values immediately rather than accumulating work. Disappearing payloads close owned annotation paint only when a surviving owner can retain a nonselectable, nonaccessible visual; otherwise removal is immediate.
- Caller custom shapes, formatters and unsupported geometry remain their documented responsibility; unsafe text/number presentation falls back to the final content immediately rather than fading the entire label.

## Geometry and performance

Recharts owns Bar, Line, Area, Pie, Scatter, Radar, RadialBar and Funnel interpolation through the existing supported controller path. Preserve initial dimensions, custom interpolators and isAnimationActive=false opt-out; series animationDuration/animationBegin/animationEasing do not bypass Cadence's controller clock or mode ceiling. Responsive width/height changes are immediate native layout; no container-size tween, per-point observers or second transform on an SVG group. Tooltip text uses destination-width layout before local paint, not width springs while following a pointer.

Use the shared [Chart data interpolation limit](../presets.md#5-geometry-text-and-numerical-limits) across all animated visible series, with one active interpolation per series. Line/area samples count even when their dots are hidden; sparse visible marks do not exempt a dense path. Above the ceiling, commit the affected geometry immediately without resampling or dropping data. Unknown/unbounded custom geometry cannot claim this bounded default; use a safe immediate engine target or its explicitly caller-owned adapter. This is a conservative design bound pending real-device verification, not a claimed measured threshold. Annotation text/reel work shares the preset catalogue's aggregate changed-glyph/rolling-column budget for the whole data revision, not a fresh allowance per payload item. Do not observe each data point, animate an offscreen chart, or clone the complete SVG/dataset to retain exits; responsive/visibility recovery starts from current data instead of replaying missed revisions.

## Acceptance scenarios

- Pending: update each supported series repeatedly and change mode mid-interpolation; verify latest terminal geometry and preserved custom interpolators/keys.
- Pending: scrub tooltip with pointer and keyboard while data changes; position and values remain current without reel queues.
- Pending: test plain/rich formatters, legend changes, localized quantities, missing payloads and responsive resize; only owned content animates.
- Pending: verify SSR initial dimensions, later insertion, all modes, zero clock, live downgrade and unmount without retained engine work.
- Pending: exceed the aggregate mark/sample bound with a dense path whose dots are hidden, then return to a small dataset; verify exact final data without queues. Exercise a same-payload data update versus pointer movement, formatter arrays, series opt-out and attempted duration/delay overrides; the controller/mode ceiling remains authoritative.
