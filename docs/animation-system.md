# Cadence Motion v2 design

Cadence Motion v2 gives every component the motion capabilities appropriate to its content and
interactions. Components report changes; shared policy coordinates them; recipes and tokens define
their presentation; CSS, Motion and existing engine adapters execute it. T0–T5 no longer grant or
deny animation capabilities. Source budgets remain unchanged during migration.

This is the accepted target design, replacing the tier-gated animation design. It is not a claim that
v2 has shipped. The [implementation plan](animation-system-plan.md) owns rollout dependencies and
acceptance. ADR-020 records the architectural change. Component source, registry metadata and
user-facing MDX continue to describe the same delivered behaviour until each implementation changes.

Every component has an [individual motion contract](motion/README.md). Global visual style provides
guidance; each component owns its particular choreography. Shared execution rules remain mandatory.
The [preset catalogue](motion/presets.md) centralises parameter assignments, including reviewed local
refinements of the default timings below. ADR-021 records the storage and authoring boundary.

The existing CSS token block in §2.3 and runtime recipe catalogue/type in §3/§5 are explicitly retained
compatibility contracts: current checks parse them. New target recipes, APIs and mode changes are
identified separately below; do not put them into a registry payload before they are implemented.

---

## 1. Principles and architecture

| #   | Principle                        | Meaning                                                                                      | Counter-example                                     |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| M1  | Motion explains causality        | Where an element came from, where it went, and why it changed must be legible                | Gratuitous bounce, spin, flicker                    |
| M2  | One coordinated change           | Related text, size, icon and colour changes share a cause and property owners                | Parent and child independently spring the same size |
| M3  | Duration follows hierarchy       | Small controls fast, panels medium, whole pages slow                                         | 600 ms button, 120 ms page                          |
| M4  | Interruptible and re-entrant     | Re-opening while a close animation runs reverses smoothly                                    | Hard cuts with CSS keyframes                        |
| M5  | Reduced means equivalent         | Preserve information and operation while removing decorative travel, blur, stagger and loops | State changes become invisible after reduction      |
| M6  | Individually authored components | Design each component's parts, triggers and choreography; use global style as guidance       | One generic effect copied across the catalogue      |

Semantic state, focus, direct manipulation and final geometry remain available. The complete mode
policy is in §6.

### 1.1 Four layers and three execution paths

| Layer                   | Owns                                                                                                                | Must not own                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Component signals       | Semantic state, change cause, stable identity, direction, content revision and selection of a reviewed part binding | Component-local raw durations, easing curves or physical constants |
| Policy and coordination | Mode, initial presentation, ownership, group rhythm, cancellation and retargeting                                   | Validation, request state or business success/failure              |
| Recipes and tokens      | Properties, visual targets, timing, reduction and interruption contracts                                            | Application state transitions                                      |
| Executors               | CSS transitions/loops, Motion measurement/physics, existing engine adapters                                         | Independent competing writers or altered native semantics          |

CSS owns colour and suitable simple state/presence transitions. Motion owns measured geometry,
continuous layout, numeric reels and applicable gesture settling. Base UI, Embla, Recharts and
native WAAPI integrations retain their actual lifecycle/geometry ownership. A CSS `linear()` spring
approximation is an easing curve, not a physics spring that inherits velocity when retargeted.
Components use the same recipe regardless of its executor; there is no public engine selector.

Signals distinguish `presence`, `content`, `value`, `state`, `layout`, `gesture`, `viewport` and
`environment` causes. A content revision identifies one committed change, not an arbitrary React
render. Geometry targets come from measurement, never render-time layout reads. This is an internal
coordination contract, not a new global application event bus.

### 1.2 Capability coverage

Every component/part records the applicable trigger, owner, default response and three-mode policy.
Coverage is **default** (owned here), **inherited** (coordinated by a parent), **composed** (explicit
caller composition), or **not applicable** with a reason. An inherited capability is not proof of
a local recipe implementation. The [internal reference schema](motion/README.md#21-internal-reference-schema)
checks target capability/action/part closure. It does not add public registry capability metadata or
prove installed behaviour; the existing recipe declarations remain the shipped contract.

| Capability              | Existing or target recipes                                | Required outcome                                                             |
| ----------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Presence                | reveal, enter.pop, exit.fade, exit.shrink, popup.anchored | A meaningful entrance/exit with a surviving lifecycle owner                  |
| Size                    | geometry.resize                                           | Content/expansion-driven size continuity with one geometry owner             |
| Position and identity   | layout.move, layout.shared, handoff                       | Stable items move or transfer without remounting their semantic owners       |
| Surface and text colour | state.color (target addition)                             | Explicit colour properties share token clocks and honour none                |
| Changed text            | text.change                                               | Unchanged text identity survives; only changed text gets replacement effects |
| Changed numbers         | number.roll                                               | Stable place-value columns roll in the semantic direction                    |
| Control feedback        | feedback.press, state.morph                               | Native input responds immediately with appropriate visual feedback           |
| Data and ongoing status | data.transition                                           | Existing engine targets and accessible status survive every mode             |

A Card entrance includes its title, description and controls; those parts do not each replay an
entrance. Later independent title or control changes still animate. Separator has no numeric value
to roll. Richness means complete relevant coverage, not identical effects on every DOM node.

### 1.3 Delivery boundary

AnimatedText is installable with the conservative changed-only native text form described in §3.6.
AnimatedNumber is installable with the conservative bounded reel form described in §3.7.
RevealGroup and Reveal remain planned.
`text.reveal`, `text.split` and `number.roll` being present in the resolver does not mean another component
implements them. Shared v2 primitives are the planned scope; their final registry items must follow
the Cadence-original origin and dependency rules. Do not infer the reference library's other 121
components are added to Cadence's scope.

Known migration differences are explicit: static structural components gain applicable capabilities;
colour feedback joins the mode contract; reduced continuous loops become static; text diff, reels
and grouped reveal are new shared implementations. Existing engine/native-event safeguards remain
requirements. An item is v2-complete only after its source, metadata, examples, docs and tests agree.

### 1.4 Individual choreography, shared execution contract

Each current UI/block id has one maintained design file in `docs/motion/components/<id>.md`, linked
from the [catalogue](motion/README.md#5-catalogue). Compound parts stay together in that file. Every
file identifies six-capability applicability and owners, each action in full/reduced/none, rapid
update/reversal/close handling, parameter bindings, geometry constraints and performance boundaries.
The shared documents do not replace that individual design with a family-level animation template.

Global visual guidance covers causality, rhythm, restraint, readability and spatial coherence.
Components choose their own meaningful actions and may select different reviewed presets. Global
requirements cover semantics and upstream compatibility, mode ceilings, SSR visibility, unchanged
text identity, one property writer, cancellation and performance. A component cannot make those
requirements optional in the name of visual customisation. Six applicable baseline capabilities
remain default integration after migration, not six opt-in switches for every consumer.

Design authority is split deliberately: this file owns the execution contract; individual files own
choreography; [presets](motion/presets.md) own parameter assignments; the rollout owns pending work.
Current source/registry/public MDX own delivered claims. Internal target bindings are not runtime
recipe identifiers or a new public settings API. If a local design needs a shared-contract exception,
revise this file explicitly first; do not hide it in an individual file or a timing preset.

---

## 2. Token system

### 2.1 One authored parameter source, three runtime modes

There is no runtime "intensity" multiplier. Durations, distances, easings and springs have one
authored source in `lib/motion.ts`. Mode (§6) and the supported timeScale clock resolve the active
presentation; the system preference can force reduction. Target consumer token/theme overrides
follow the shared preset policy, not a second component-local parameter source or intensity scale.

| Mode      | What changes                                  | Set by                                              |
| --------- | --------------------------------------------- | --------------------------------------------------- |
| `full`    | nothing: the authored timing                  | default                                             |
| `reduced` | transform/scale dropped, tween durations ×0.6 | `prefers-reduced-motion`, or the provider           |
| `none`    | every duration `0`, no transition at all      | `CadenceProvider mode="none"`, `data-motion="none"` |

`meta.intensity` (`subtle` / `medium` / `expressive`) is **documentation metadata**: it records how
loud a component's authored motion is, so a catalogue can group by it. No token reads it, and it is
not adjustable at runtime.

Catalogue intensity is the strongest authored behaviour available in the component (including
its documented composition), independent of the selected runtime mode, complexity and tier:

- `subtle`: static UI, local press/glyph feedback, opacity-only entry/progress/loading, or a
  small control indicator. Static T0 belongs here; this label does not promise animation.
- `medium`: a surface enters/exits, a panel/indicator moves or resizes, a collection slides,
  or chart geometry interpolates. Carousel and Chart's `data.transition` moves geometry;
  Calendar, Bubble, Skeleton, Spinner and Attachment's data feedback stays local.
- `expressive`: coordinated identity/ownership transfers across surfaces (`handoff`, currently
  Select). This is not a claim that every spring or every T3 component is expressive.

The classification above is the **current compatibility policy**, enforced by
`scripts/catalog-intensity.mjs` against recipe forms and explicit data-geometry owners. The v2 target
classifies the authored spatial extent, travel and coordination, not the mere presence of text or
geometry recipes. Migrate the classifier, metadata and catalogue explanations together; until then
keep registry/frontmatter equality and do not relabel components to imply an unimplemented effect.

The reduced tween multiplier is exported as `reducedDurationScale` from `lib/motion.ts`.
CSS popup adapters and `transitionFor()` read that same token rather than repeating the multiplier.

### 2.2 Base tokens

```ts
// registry/cadence/lib/motion.ts
export const duration = {
  instant: 0.1, // state changes, presses
  fast: 0.16, // small element exit
  base: 0.22, // default
  slow: 0.32, // panels, drawers
  page: 0.45, // full page / large blocks
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1], // enter: fast start, slow settle
  inOut: [0.65, 0, 0.35, 1], // movement within the screen
  in: [0.7, 0, 0.84, 0], // exit
} as const;

export const spring = {
  press: { type: "spring", visualDuration: 0.24, bounce: 0.12 },
  snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
  travel: { type: "spring", visualDuration: 0.3, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
  sizeCompact: { type: "spring", visualDuration: 0.28, bounce: 0 },
  sizePanel: { type: "spring", visualDuration: 0.36, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const rotation = { halfTurn: 180 } as const;
export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;
```

Springs are **authored** as `visualDuration + bounce`, but not every recipe hands that form to
Motion. `visualDuration` makes a spring _time-defined_: when an animation is interrupted, Motion
discards the inherited velocity, so the new target starts from rest. That is the right trade for a
press or a popup scale (the distance is tiny, and inherited velocity would oscillate), but it is the
wrong trade for a layout recipe that can be retargeted mid-flight. Those recipes declare
`continuity: "velocity"`, and `transitionFor()` restates the token as `stiffness`/`damping`/`mass`
after applying `timeScale`. The spring is then _physics-defined_ and Motion carries the current
velocity into the new target (`motion-dom`'s `spring.ts`, 13.5.1). The authored values do not change,
the 4× preview still scales correctly, and the conversion lives in `lib/motion.ts` rather than in a
component.

### 2.2.1 Zero recipe clock

`timeScale` accepts finite non-negative numbers. Zero is a valid clock, including
provider inheritance, an explicit nested override and a per-call override. Every
recipe resolves it to `{ duration: 0, delay: 0 }` before spring conversion; direct
`physicalSpring(0)` also returns a zero-duration transition. Passing a zero visual
duration to Motion's spring generator is insufficient: it can select default
physics, and dividing by zero produces invalid physics. Negative or non-finite
`timeScale` (on the provider or an active recipe) and direct `physicalSpring`
`visualDuration` inputs throw `RangeError`; `none` still ignores recipe options.

Zero timing preserves the effective mode and semantic target: a full-mode held
press still has its press scale, reached immediately. It does not set `reduced`
or `disabled`, and it does not stop continuous CSS `--animate-*` loops. Newly
started or retargeted recipe animations use the resolved clock. An existing
consumer must observe clock changes to cancel a same-target flight; the resolver
alone cannot guarantee that every writer does so. Shared finite owners capture a
positive action clock until completion; physics owners retime from current paint.
Their zero/mode downgrade cancels the current writer before paint. Other callers
and engine adapters still require their own adoption evidence.

### 2.3 CSS-side exposure

```css
/* Generated from registry/cadence/lib/motion.ts; pnpm motion:tokens. */
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}

@layer base {
  :root {
    --motion-source-version: 1;
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(
      --cadence-effective-instant,
      calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-fast: var(
      --cadence-effective-fast,
      calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-base: var(
      --cadence-effective-base,
      calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-slow: var(
      --cadence-effective-slow,
      calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-page: var(
      --cadence-effective-page,
      calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
  }

  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
  }

  [data-motion="full"] {
    --motion-duration-instant: var(
      --cadence-effective-instant,
      calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-fast: var(
      --cadence-effective-fast,
      calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-base: var(
      --cadence-effective-base,
      calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-slow: var(
      --cadence-effective-slow,
      calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-page: var(
      --cadence-effective-page,
      calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1)
    );
  }

  [data-motion="reduced"] {
    --motion-duration-instant: var(
      --cadence-effective-instant,
      calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-fast: var(
      --cadence-effective-fast,
      calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-base: var(
      --cadence-effective-base,
      calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-slow: var(
      --cadence-effective-slow,
      calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
    );
    --motion-duration-page: var(
      --cadence-effective-page,
      calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
    );
  }

  [data-motion="none"] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(
        --cadence-effective-instant,
        calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-fast: var(
        --cadence-effective-fast,
        calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-base: var(
        --cadence-effective-base,
        calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-slow: var(
        --cadence-effective-slow,
        calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-page: var(
        --cadence-effective-page,
        calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
    }

    [data-motion="full"] {
      --motion-duration-instant: var(
        --cadence-effective-instant,
        calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-fast: var(
        --cadence-effective-fast,
        calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-base: var(
        --cadence-effective-base,
        calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-slow: var(
        --cadence-effective-slow,
        calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
      --motion-duration-page: var(
        --cadence-effective-page,
        calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1)
      );
    }
  }
}
```

`--ease-*` generates the `ease-cadence-out` utility class. Durations stay CSS variables rather than
forced utilities, because Tailwind's `--duration-*` is not a theme namespace. A CSS-only popup reads
them through the shorthand arbitrary value:

```tsx
// dialog.tsx — CSS-only, so the token is the class
"transition-[opacity,scale] duration-(--motion-duration-base) ease-cadence-out";
```

That is the only pattern that keeps `data-motion="none"` honest without a JS branch: the attribute zeroes
the variables on the element itself, and the transition has nothing left to run.

The block above is derived from `lib/motion.ts` by `pnpm motion:tokens` and automatically before
registry builds. `app/globals.css`, the `cadence-theme` registry item and this fence are generated
outputs. The generator uses the installed TypeScript compiler, without Node-specific TS loading or
dependency patches. `registry:check` compares their parsed `scope → variable → value` maps against
the authored module, so even coordinated drift in all three outputs fails. Generation preserves
unrelated semantic theme values and is repeatable. The legacy duration names remain effective outputs; authored duration inputs, committed local/provider/portal capture and override precedence are defined in [the preset contract](motion/presets.md#21-authored-inputs-and-effective-compatibility-outputs). This parameter adapter does not establish active-writer cancellation or migrate component capabilities.

---

### 2.4 V2 timing defaults

These are target recipe assignments, not new token exports. Keep the base timings above; add new
names only with the corresponding resolver/CSS implementation and token-source checks.

Treat these assignments as the shared starting vocabulary, not a requirement that every component
use the same clock. The [preset catalogue](motion/presets.md#3-default-preset-catalogue) records the
reviewed compact/panel and purpose-specific assignments. A component selects them through its named
part bindings; it does not copy a literal into its implementation or change a base token for everyone.

| Purpose                   | Target timing                          | Policy                                                               |
| ------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Colour feedback           | duration.fast: 160 ms, ease.out        | No stagger; foreground/background share the state commit             |
| Ordinary entrance         | duration.base: 220 ms                  | Use existing distance.xs/sm (4/8 px) where travel explains the cause |
| Ordinary exit             | duration.fast: 160 ms                  | No inherited entrance delay                                          |
| Control state             | spring.snappy: visualDuration 260 ms   | Preserve native activation and pointer ownership                     |
| Layout and numeric reels  | spring.smooth: visualDuration 400 ms   | Retarget from the current visual state; document velocity continuity |
| Measured size             | spring.morph: visualDuration 420 ms    | No authored bounce; clamp the rendered geometry                      |
| Changed-character stagger | stagger.char: 12 ms; target cap 120 ms | Final delay capped after timeScale; bypass under reduced/none        |
| Cyclic reveal stagger     | target step 55 ms, cycle length 3      | Stable 0/55/110 ms slots, entrance only                              |
| Blur                      | Off by default                         | An explicitly reviewed small-text recipe may use at most 4 px        |

Spring visualDuration is an authored feel, not an exact completion deadline. Cleanup follows actual
completion/cancellation, never a matching timeout. Geometry must still clamp a physics spring that
inherits velocity even when its authored bounce is zero. CSS and JS consume one authored token
source; generating both outputs is a migration deliverable, not permission to hand-maintain a
second theme. CSS custom-property delays carry group rhythm without creating per-element timers.

### 2.5 Component bindings and preset refinement

A token supplies a value; a recipe supplies the allowed properties and execution contract; a preset
selects reviewed token assignments; a component binding chooses that preset for a real part/cause.
For example, `button.label.replace` is a target binding to `text.replace` / `text.change`, not a new
recipe. Store the binding's purpose in the individual file and its numeric assignments in the shared
[preset catalogue](motion/presets.md). No component-local motion constants are introduced.

The catalogue defines override precedence, effective clocks, target compact/panel size tokens and
the CSS/Motion single-source requirement. Mode and safety constraints always apply after visual
selection. Built-in display bindings explicitly disable character stagger by default, while the
standalone planned AnimatedText primitive retains its specified character rhythm. Neither policy
permits unchanged characters to replay. A changed preset or component binding requires checking
affected consumers, rather than declaring new `meta.motion` entries for the design names.

## 3. Recipe catalogue

A recipe is a reusable motion formula resolved through `useCadenceMotion().transition(recipe, opts)`
or its documented CSS/engine adapter. The table retains the exact **current runtime identifiers**
for source/document checks. An identifier is not proof of a delivered renderer. V2 additions are
separated in §3.1.0 and must enter the runtime union, metadata and user docs atomically with their
implementation. Behaviour sections below define the target; named baseline differences remain
explicit until their rollout phase completes.

| Recipe            | Purpose                                                                                 | Key parameters                   | Implementation                                                                                                        | reduced behaviour                                                           |
| ----------------- | --------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `reveal`          | Viewport entrance with explicit replay policy                                           | `distance`, `delay`              | V2 grouped observer and CSS states (§3.8); shared renderer pending                                                    | Bypass decorative controller; visible                                       |
| `enter.pop`       | Popovers and cards appearing                                                            | `origin`, `scale`                | scale + opacity, `transformOrigin` follows the anchor                                                                 | Fade only                                                                   |
| `exit.fade`       | Element disappearing                                                                    | `duration`                       | opacity to 0                                                                                                          | Same (opacity kept)                                                         |
| `exit.shrink`     | Closing a popover                                                                       | `scale`                          | scale to 0.96 + opacity                                                                                               | Fade only                                                                   |
| `popup.anchored`  | Base UI popups                                                                          | `side`, `align`                  | `data-starting-style`/`data-ending-style` or Motion `render`                                                          | No scale, pure cross-fade                                                   |
| `layout.move`     | List/grid reordering                                                                    | `spring`                         | `layout` prop + `LayoutGroup` + physics-defined spring                                                                | Layout disabled, instant jump                                               |
| `layout.shared`   | Shared elements (tab indicator, card expansion)                                         | `layoutId` / measured targets    | `layoutId` or a persistent measured indicator (§3.1.4) + physics-defined `spring.morph`                               | Disabled, immediate switch                                                  |
| `list.stagger`    | Items appearing one by one                                                              | `stagger`, `delayChildren`       | variants + `staggerChildren`                                                                                          | All fade in together (no stagger)                                           |
| `gesture.drag`    | Drag / swipe to dismiss                                                                 | `axis`, `threshold`, `velocity`  | `drag` + `useMotionValue` + `animate` spring-back                                                                     | Direct operation retained; no inertial travel; button alternative           |
| `scroll.progress` | Reading progress, parallax                                                              | `offset`                         | `useScroll` + `useSpring`                                                                                             | Static value (no smoothing)                                                 |
| `scroll.navigate` | Navigate to a document section after an explicit link activation                        | measured destination             | Motion number tween writes native scroll offsets; `duration.page` + `ease.inOut` (§3.1.5)                             | Immediate destination                                                       |
| `scroll.story`    | Scroll-narrative timeline                                                               | `trigger`, `scrub`               | GSAP ScrollTrigger (optional dependency)                                                                              | End state shown directly                                                    |
| `text.reveal`     | Headline reveals word by word / line by line                                            | `by`, `stagger`                  | variants + child spans                                                                                                | Whole block fades in                                                        |
| `text.change`     | Changed-only native display text                                                        | `locale`, `granularity`          | Bounded native Text raster/Range proof; opacity only                                                                  | Changed-only opacity, no stagger; none immediate                            |
| `text.split`      | Character by character (GSAP)                                                           | `type`                           | GSAP SplitText (optional)                                                                                             | Shown as a whole                                                            |
| `number.roll`     | Explicit independently committed numeric changes                                        | `locales`, `format`, `direction` | Bounded native-Text/canvas two-cell reels, smooth reviewed physics and exact fallback (§3.7)                          | Exact current value immediately, without duration or delay                  |
| `data.transition` | Data surfaces changing state in place                                                   | `mode`, `loop`                   | CSS continuous form or explicit Motion/engine clock                                                                   | V2 loops static (§3.2); engine geometry instant; permitted one-shot opacity |
| `state.morph`     | A control's own state changing in place (check tick, radio dot, switch thumb, OTP slot) | `axis`, `scale`                  | `animate()` or `layout` + ResizeObserver, or Motion driven by the primitive's render state                            | Indicator at full size, thumb jumps                                         |
| `state.color`     | Explicit surface/foreground colour feedback                                             | scoped properties, fast tween    | CSS owner with active cancellation; no delayed focus geometry                                                         | Short colour tween; none cancels duration and delay                         |
| `geometry.resize` | A control's measured width/height following its content (select trigger, disclosure)    | `axis`, `min`                    | `animate()` on a motion value, or the Base UI disclosure CSS form below; measure content and clamp to the closed size | Instant size change, opacity kept                                           |
| `handoff`         | A value flying from a source that unmounts to a destination that mounts elsewhere       | `origin`                         | inverse transform from `measureOrigin()` + physics spring                                                             | Cross-fade at the destination                                               |
| `feedback.press`  | Press feedback                                                                          | `scale`                          | Native press ownership + committed controls                                                                           | Colour change only                                                          |

Five recipes currently opt into `continuity: "velocity"`: `layout.move`, `layout.shared`, `geometry.resize`,
`number.roll` and `handoff`. They exist to be retargeted while they are still moving (a list reorders twice, a tab
indicator is clicked mid-flight, a second option is selected before the first label lands), and all
travel far enough that losing the velocity is visible. Every other spring stays time-defined on
purpose: `press` is a sub-pixel scale and a popup scales by 4%, where Motion's own guard against
inherited velocity exists for good reason. A recipe that needs continuity must be argued for in this
table, not switched on in a component.

`geometry.resize` resolves to zero duration under `reduced`: a short width tween is still layout
motion, and the size is information, so it jumps. `scroll.navigate` also jumps. V2 immediate paths
must remove delay as well as duration. `handoff` may retain a short opacity tween at the destination
while dropping the transform. Numeric reels use smooth physics with current painted offsets, discard
opposing velocity on reversal, clamp travel to one cell and settle unreadable interruptions immediately.
Reduced/none and zero recipe clock have no reel duration or delay. The resolver alone does not
implement the numeric planner, native text ownership or renderer eligibility checks.

Theme switching is deliberately absent. A view transition is a document-level operation: it resolves
to no Motion `Transition`, so it cannot be a recipe and no component declares it. The site's theme
toggle does it directly when it wants to.

A gesture the primitive owns is not a recipe either. Base UI's drawer moves the sheet through
`--drawer-swipe-*` custom properties, and those variables are the framework's gesture engine, not an
animation Cadence authors: swapping them for `gesture.drag` would mean re-implementing the drag. So
`drawer` declares `popup.anchored` + `exit.fade` and documents the swipe in its Motion contract table.
`gesture.drag` stays in the catalogue for a component that drives Motion directly.

Control adapters use committed layout effects on the client (ordinary effects on the server)
with value/transition signatures, compatible with React
19.0, rather than requiring React 19.2's `useEffectEvent`. For a zero-clock retarget they stop
the old controller, set the target immediately and reassert it once in Motion's public
`frame.update` phase. Motion 13.5.1 queues same-target writes there; an earlier full-mode
write must not overwrite the later none target. Cleanup cancels that reassertion and stops
the controls. This is ordering within `state.morph` / `data.transition`, not a new recipe,
delay, remount or nonzero none transition. The OTP effect similarly keys only on character,
mode and clock, so focus and unrelated renders do not replay a character.
Stopping before paint applies to asynchronous controlled commits as well as input events.
Checkbox and Radio explicitly give scale a zero clock in reduced mode; opacity keeps its recipe.
The same adapter owns CodeBlock's floating Actions, copy glyphs and expand orientation:
an unchanged target must still cancel/retarget when its mode or clock changes.
Press buttons use native pointer/Enter/blur lifecycle to drive this adapter, and disabled/aria-disabled
or a removed press recipe resolves the scale immediately to one without replacing the button.
Only a primary, left-button pointer can start feedback. Its pointerId owns that held gesture:
another contact cannot start feedback or release it. Trusted outside pointerup/pointercancel
releases only that owner; Enter has separate ownership. Blur, disabled and removed recipe cancel
ownership, and unmount removes the outside listeners without synthesizing pointer events.
It also clears the private held gesture: native disabled can swallow pointerup, so
re-enabling the button must not revive that cancelled press. Base owns focus/activation.
Slider uses Base's dragging state, rather than tap, and likewise resolves a disabled thumb
to scale one with a zero clock. CodeBlock copy glyphs explicitly snap scale under reduced.
Select's measured value uses intrinsic `width: auto` in reduced/none. Base can commit
new label text in its own subtree before the parent's ResizeObserver runs; a cached
numeric width must not survive that paint. A single MotionValue owns width in every
mode: jump it to auto and synchronously write that same auto target under reduced/none,
stopping its spring. Switching the style from a MotionValue to a React string permits
an older queued Motion render to overwrite React's auto. Keep the numeric measurement
in the target ref; full resolves its first auto measurement instantly, then springs
on later label changes. The synchronous write is the same prepaint fold policy as CodeBlock.

Select's internal captured-origin adapter only transfers bounded plain disjoint labels until the
changed-run renderer is integrated. Capture belongs to the accepted native selection event and is
consumed once; missing/unsafe or formatter-incompatible labels stay immediate. A frozen source may
retire under its popup's actual lifetime. The paint-only clipped layer owns no interactive subtree
or scroll extent. A lost source/destination mapping cancels the transfer and exposes the current
native destination without a second replacement effect; it never follows a moving item or trigger.
A genuinely local frame may retain common outer scrolling because both endpoints and its layer move
together. Viewport, differential scroll and passive placement corrections invalidate cross-space
captures. These hooks and the conservative pilot do not implement text diffing or full Select v2.

### 3.0 Sidebar composition

This and the following engine/part notes describe the delivered migration baseline. They preserve
engine and native semantics while the rollout plan schedules additional capabilities; they do not
exempt these components from v2 coverage.

Sidebar's desktop offcanvas adapter uses `geometry.resize` with `geometry.compact` for actual
reserved width. Its `layout.move/size-linked` panel transform projects that same clamped physical
size scalar; it has no independent position spring. Native CSS supplies both resting endpoints,
including physical side and floating/inset padding. Temporary width/transform replace effects are
released together. Reduced/none/zero clock and affected focused editors/native capture settle the
whole transaction; passive constraints and unsupported coordinates establish an immediate baseline.
Initial/missing/restored geometry never invents an origin. No content clone or frame-time layout
read is used. Icon gap/container widths project from that same owner, including distinct padded
endpoints. Explicitly registered plain labels keep destination-width text layout and use actual size
completion before opacity reveal. Collapse removes an unusable label lane immediately; unsupported
rich/interactive label shapes and composed submenus use native immediate geometry. Mobile retains
Sheet; inherited controls keep their own recipes.

### 3.0.1 Bubble surface entry

Bubble uses the one-shot `data.transition` recipe for opacity-only entry through
CSS `@starting-style`. It resolves duration locally via `cm.transition()` so nested
providers restore their clock. Full/reduced both fade; none removes starting opacity
and sets zero duration, including live cancellation. Text chunks, variants, alignment,
reactions and resize remain immediate on stable nodes. Static reaction offsets are
positioning, not motion. Bubble has no streaming runtime or measured geometry.

### 3.1.0 V2 recipe additions

`state.color` is supported by the shared CSS executor and resolver. Component adoption is separate;
no catalogue item gains it through a dependency. `text.change/changed-runs` is implemented by the
shared native-string controller and installable AnimatedText. Existing component slots adopt it
explicitly in later tasks; this primitive does not migrate the original 59 components.

| Target recipe | Properties and cause                                                                                  | Mode/cancellation contract                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| state.color   | Explicit background-color, color, border-color, fill/stroke; declared shadow feedback where needed    | Shorter reduced clock; none clears duration and delay, including a running transition       |
| text.change   | Changed grapheme/run opacity and small translation; retained-token position delegated to layout owner | Reduced fades changed parts without travel/stagger; none is immediate; latest revision wins |

Do not rename existing recipe ids merely to introduce capabilities. text.reveal/text.split remain
entrance treatments, not text diff. A supported helper must prove which recipe/form the consuming
part actually exercises; a dependency containing a recipe is not sufficient evidence.

Target component contracts also refine existing recipe forms without claiming that the current
implementation recogniser accepts them. A one-shot `data.transition` may use a component-owned
opacity plus bounded directional transform for an actual content change (for example Tabs panel
activation or a newly inserted Bubble), with direction and distance recorded in that part's contract.
Reduced keeps opacity and removes travel; none is immediate. This does not create a generic entrance
on every render, permit a second engine writer or expand the continuous-loop property allowance.
`geometry.resize` may select reviewed compact/panel presets while retaining its existing ownership,
physics conversion and clamping. `data.progress` is a target preset for the determinate form of
`data.transition`, not an added recipe id. Fill and readout share the bounded monotonic presentation
phase defined in the [preset contract](motion/presets.md#3-default-preset-catalogue), not intermediate business
percentages. If a retarget cannot preserve both that phase and valid reel direction, the readout
shows the latest value immediately while the fill independently reaches its current target.
Migrate validators, declarations, public docs and actual mode evidence for each new form together.

The installed internal content executor uses one bounded finite scalar phase for opacity and
permitted directional translation across actual committed participants. Tabs panel activation and
Calendar month slots adopt these forms; neither retains arbitrary outgoing trees. Calendar shares
that phase across its visible month slots. Native dimensions remain immediate in these integrations:
this does not claim a shared content size-host projection. Sidebar has a separate limited desktop
offcanvas adapter. Tabs retains one list marker
with a separate single transform writer; filled or unsafe paths use immediate native selected paint.
The catalogue remains legacy until its other applicable capabilities and acceptance migrate.

The preset catalogue names the directional forms explicitly: `content.switch` for bounded panel
content travel and `content.month` for the calendar grid. The generic `data.update` preset does not
silently add such travel. Sidebar's `layout.sidebar` binding uses a size-linked `layout.move`
projection: its transform and the reserved-gap `geometry.resize` share one space-progress coordinator,
with transform derived from that value. Equal durations on two independent springs are not proof of
matching geometry. The installed size-linked form covers desktop offcanvas and icon widths; its plain-label
completion gate does not establish the remaining Sidebar text/number/colour capabilities. These forms add no runtime recipe ids.

### 3.1.1 `data.transition` for Embla collections

Carousel uses the engine form of `data.transition`: Embla 8.6.0 exclusively owns track
translation, snap geometry, loop relocation, dragging, focus and resize. Never add a CSS or
Motion transform writer to its track. Position is state, like the Switch thumb: reduced/none
retain the selected slide's translate and direct pointer tracking, but every autonomous engine
interpolation resolves to zero. Track navigation adds no entrance/exit or opacity fallback. This
restriction concerns the engine-owned navigation cause; independent root insertion follows the
[Carousel target presence contract](motion/components/carousel.md) without another track writer.

Resolve the full `data.transition` base from the actual local token scope even while reduced/none
clamps execution. Authored and already-effective duration overrides retain their documented precedence;
never reconstruct the full base from a reduced result or a default constant. Keep the native React
options seed stable across mode/clock changes; update only a library-owned effective default without
reinitializing. Convert with the shared
`carouselClock.unitsPerSecond` calibration (100 engine attraction units per authored second,
not milliseconds or a wall-clock guarantee). Default full timing is therefore duration.base →
22 attraction units; timeScale scales this value. Explicit `opts.duration`, including breakpoint
values, remains caller-owned in full mode. Read effective values from the real engine, preserving
native global/breakpoint merges, explicit API `reInit` options and plugin option changes. A private
instance `reInit` adapter tracks default provenance without replacing Embla's merge. On pointer release, use the engine's effective base
duration instead of DragHandler's hard-coded 25/43-unit release clock. Embla retains its native
friction, momentum target and interruption from the current location/velocity.

A private lifecycle plugin wraps each fresh engine's `scrollBody.useDuration` and `useBaseDuration`: full passes values
through; reduced/none clamp all calls to zero, including drag tracking/release, API calls with
`jump=false`, focus and user plugins using the engine. Restore on destroy and reattach on reInit.
Apply the current mode through a ref so mode changes do not reinitialize or reset selection;
when downgrading autonomous settling, flush the engine's existing target through update/render immediately.
While a pointer owns the drag, preserve its position and ownership; release resolves its current valid
native target immediately. Destroy restores only this adapter's methods/listeners and reInit attaches
to the fresh engine. Hidden/offscreen, print and forced-colours cancel the owned autonomous work;
restoration starts from current state without a navigation replay. Cancel the actual queued native RAF;
an idle policy edit emits no synthetic settle event. Native callbacks may synchronously reInit or start
a successor action, so every remaining flush step checks the engine lifetime and action generation
before touching the shared track or stopping a clock.
At a new native navigation command, a cached viewport block may be stale after synchronous scrolling.
Carousel revalidates ordinary axis-aligned rectangular overflow and inset clips against the viewport,
bounded to 32 ancestor styles and their clipping boxes. Pointer hitability and unrelated overlays do not
define intersection visibility. Unsupported complex clipping conservatively retains cached suspension.
Document suspension still wins. This runs at a new index/distance command, never on positive duration
setters, animation frames or every scroll. A positive-area IO threshold reports edge-touching zero-area
clips, and the newest timed record wins. Older records cannot cancel an action solely from stale geometry.
Successful recovery re-arms native observation, so a hide in the same frame still produces an initial
record. An older negative delivery checks current bounded geometry before cancellation; this also
handles a frame timestamp preceding a command inside that frame.
Cleanup retires the observer/subscription lifetime before draining records and disconnecting. A queued
callback from an old element cannot mutate the replacement owner's policy or cancel its new native action.
The threshold/record rule follows the [Intersection Observer processing algorithm](https://www.w3.org/TR/intersection-observer/#update-intersection-observations-algo).
Plugins that create independent CSS/WAAPI animations or automatic advance own those behaviours;
callers must stop autonomous plugins for reduced/none and provide pause controls for autoplay.
Do not silently remove user plugins. Navigation buttons inherit Button's `feedback.press` recipe;
it remains declared on Button rather than duplicated on Carousel.

Only transforms animate; no track layout tween or render-time measurement. Browser proof must cover
three modes × system preferences, correct final position, reversal, drag release, both axes,
loop/options, plugins/API, dynamic slides and resize. Engine internals are pinned to 8.6.0 and must
be reviewed on upgrade. CSS-only computed transition assertions alone cannot prove this engine.

Embla's existing active-engine cancellation runs in the committed layout phase for reduced/none and a zero clock, so no old trajectory survives the first paint.

### 3.1.2 `data.transition` for Recharts data geometry

Chart uses Recharts 3.10.1's public AnimationControllerProvider. The cause is a series entering or
changing data, not a container mounting. This T4 engine form is an explicit exception to the
transform/opacity/filter rule: SVG paths, sectors and bar geometry interpolate data coordinates,
not DOM layout. No measurement loop or wrapper reveal is added. Recharts owns interpolation and
retargeting from its current series state; Cadence owns the numeric progress clock and easing.

Full uses the data.transition duration and ease tokens (including provider timeScale). Explicit
series animationDuration, animationBegin and animationEasing cannot extend or bypass that clock;
isAnimationActive=false still opts out. Reduced and none complete geometry immediately: fading
an entire chart would obscure comparison, so neither adds an opacity fallback. Static positional
SVG transforms remain in every mode because they encode data coordinates, not animation.
Recharts starts controllers in a passive effect. For its eight installed series, Cadence supplies a terminal
`animationInterpolateFn` and bypasses new autonomous handles in reduced/none or at zero clock, so first
rendered data geometry does not depend on that passive callback. A private React owner adds no DOM,
retains the real series type/key/children and forwards render functions, shapes and native refs directly.
Full preserves the caller interpolator; instantaneous rendering calls it at terminal progress. A running
downgrade or zero clock completes registered handles before paint. Already-present data remains static
on restoration even when a consumer creates new callback/formatter/shape props. A genuine data/geometry
revision re-enables its full-mode action. Callback availability remains the installed engine's own API.

Each series retains one semantic action phase. Positive clocks integrate subsequent deltas against the
current token duration; that action retains its starting easing, and the next data action takes a changed
easing token. Recharts may recreate a handle from current geometry when ordinary props change;
that handle consumes the original easing curve's remaining segment and remaining phase, not a fresh
duration/ease or a second geometry writer. Start/end callbacks for a supported native channel use the
latest committed function once per action; an obsolete action cannot complete its successor. Environment
gates cancel hidden/offscreen, print and forced-colours work without accumulating revisions. Updates
and resize must preserve axes, legend and keyboard tooltip state. No SSR replay wrapper is used.

ChartTooltip disables Recharts' positional CSS animation in every mode; pointer/focus changes
are immediate. Tooltip content, formatters, cursor and caller props remain supported. Independent
custom shapes, nested animation controllers and caller-authored CSS/WAAPI own their own motion;
they must implement the same mode contract. Do not substitute blanket CSS animation suppression
for the engine controller. Review the public controller integration on Recharts upgrades.

### 3.1.3 `data.transition` for calendar month grids

Calendar keeps DayPicker 9.13.2 in charge of selection, displayed months and keyboard focus.
A stable Month component provides its date to the persistent MonthGrid. Committed tables register
with their actual Calendar root. A changed month uses one shared content.month phase to derive
opacity and signed distance.sm travel for all eligible month slots, through held native WAAPI paint
effects. Root padding must provide a safe travel corridor; otherwise opacity remains. Cancelling removes the effect synchronously, including during live downgrades;
there is no Motion DOM visual-element cache to reapply an interrupted transform. This delivered grid
adapter has no mount reveal, outgoing duplicate, delayed content, layout tween or keyed remount.
Rapid changes replace the previous phase from current owned paint and present the latest month.
Reduced uses opacity only; none shows the new table immediately. A live mode or clock change cancels
and settles both properties. The delivered adapter changes actual table height immediately, including
variable week counts. The [Calendar target contract](motion/components/calendar.md) may coordinate
measured outer-host geometry; it does not animate the table's height or add a second grid writer.
Caller components override the corresponding defaults and own their motion; caller styles win.
An explicit DayPicker `animate` owner yields Cadence's grid effect. Zero duration starts no WAAPI handle;
environment cancellation removes only the owned effect and restoration never replays the same month.
DayPicker's optional `animate` API remains forwarded, but its CSS animation engine requires the caller's
stylesheet; Cadence does not import that stylesheet or activate a second animation clock.
Day buttons retain native button semantics and static selection/range styling, using buttonVariants
without Button's independent press recipe. Navigation uses the same static variants.

### 3.1.4 `layout.shared` for the Toc reading indicator

Toc is T3. One persistent decorative indicator follows the active link using the
`layout.shared` physics spring. A ResizeObserver caches link offsets/heights, including
wrapped labels; committed target changes read that cache, not layout. Two Motion values
represent its top/bottom edges, preserving velocity when retargeted. One native style
writer converts those edges to translateY/scaleY on a one-pixel base; it clamps both
edges to the measured rail. Reading/indicator changes author no width/height interpolation or list
reflow. Explicit content revisions of the list shell follow the separate
[Toc target contract](motion/components/toc.md); they do not resize the shell on every active-link change.

Initial placement, reappearance after a cleared selection, reduced, none and zero
clock all jump. Reduced/none use instant native top/height placement and no transform;
live downgrades synchronously stop both springs before paint without replacing the
indicator or links. Restoring full starts at the settled position. Clock changes
retarget the existing values. The server uses the active link's static border until
the first measurement, so no-JS navigation retains a visible current section.
Text/aria-current follow the current section immediately. Click navigation follows
§3.1.5; the site's mobile disclosure remains instant. There is no scroll.progress or popup recipe.

### 3.1.5 `scroll.navigate` for explicit section navigation

T3 Toc links animate the actual scrolling host's offset with `duration.page` and
`ease.inOut`, scaled by the provider clock. This is an explicit exception to the
transform/opacity/filter property rule: moving the native scroll offset preserves
sticky layout, focus, history and scroll tracking. Never translate the article to
simulate scrolling, use a second native smooth-scroll clock, or read layout per frame.
Measure the target, scroll margins/padding and host bounds in the click handler,
clamp the destination, and use instant native scroll writes from one Motion tween.

Reduced, none and zero clock navigate immediately. A live downgrade completes the
current destination before paint; positive clock changes retime from the current
offset. Repeated links cancel the old writer and start from the current position.
Wheel, touch, pointer, scrolling keys, resize, history traversal, external hash changes
and unmount cancel it, with no later snap to the abandoned destination. Completion
focuses the heading without another scroll, preserving any caller tabindex. Modified
clicks, caller-cancelled events and missing targets retain native link behavior.
Keep URL query/history state and hashchange notifications. Initial hashes, reload,
back/forward and no-JS links remain native and never replay the click animation.

The trigger and scroll flight have distinct visibility owners. An offscreen/hidden Toc settles its
indicator; it does not abandon an already activated trip merely because scrolling moves the links out
of view. The connected target and measured scroll host own that trip. Document hiding, print and forced
colours cancel it, as do the native input, target identity and geometry invalidations above.

### 3.2 Continuous recipes run in CSS

Continuous status effects use CSS animate-* utilities and framework --animate-* theme tokens. They
have an active condition and pause when offscreen or the document is hidden. Provider timeScale
retains its existing meaning: it scales recipe/portal clocks, not continuous theme clocks.

The **v2 target** stops autonomous loops in both reduced and none, including Spinner rotation and
Skeleton opacity pulses. A static glyph/text still communicates loading. Full permits local opacity
status feedback and the single-glyph Spinner rotation; it does not authorize moving marquees,
shimmer or decorative large-surface loops. Every loop needs cancellation on the existing node.

The delivered baseline still permits opacity loops and Spinner rotation under reduced; its helper
and tests encode that behaviour. Migrate source, tests and user-facing contracts together. Independent
caller autoplay remains caller-owned and needs accessible controls; do not silently remove plugins.

### 3.3 Presence and composition

SSR and hydration present final content. A component inserted by a later interaction can enter;
viewport entry is a separate cause with a separate replay policy (§3.8). Popups follow their real
open/close lifecycle. Parent presence coordinates the surface; descendants suppress duplicate
entrance for that same cause and retain later independent content/state animation.

An exit needs an owner that remains mounted until the actual surface finishes. A component cannot
animate its own removal after its parent unmounts the entire boundary. Keep exiting visual content
out of the accessible name/tab order without prematurely releasing a modal's lifecycle. Re-entry
reverses the existing surface without resetting focus/state. Entrance delays never carry into exit.
Minimum loading duration and delayed application commits are outside the animation system.

An ordinary opacity entrance is also subordinate to interaction. If autofocus, keyboard focus,
pointer activation or browser find reaches entering content, settle any ancestor entrance envelope
that would leave that target invisible or displaced before presenting the interaction. Do not hide,
disable or delay the real control to finish its entrance. This rule does not reopen a semantically
closed surface or replace Base UI's focus/exit protocol. Decorative outgoing paint is never a second
focus target. Presence and activity return to current semantic resting paint, including disabled or
caller opacity, as defined in the [preset mode rules](motion/presets.md#31-effective-modes-and-clock-ownership).

Default autofocus still runs at the primitive's existing lifecycle point, with existing caller
overrides respected. Settle only entry envelopes that would conceal or displace that focus target;
an independent backdrop or other non-conflicting part may continue. Do not delay autofocus to show
the full entrance, and do not promise that every popup opening completes every entry effect.

Presence identity follows the actual host and committed semantic entity, not the identity of a caller
ref or render callback. Rebinding an external ref on the same host must preserve an otherwise valid
animation; replacing that host or entity revokes the old writer. Native keep-mounted/prevent-unmount
semantics also remain authoritative after visual exit. The detailed registration, retention and
caller-animation boundaries are in [the common lifecycle contract](motion/README.md#31-cancellation-environments-and-renderer-ownership).

Decorative retention is a paint-only representation, not permission to mount another copy of caller
children. It must introduce no duplicate DOM ids or label/ARIA reference targets, form association,
submission/reset/validation participation, live region, event/ref registration or component effects.
`aria-hidden`, `inert` and pointer suppression alone do not establish that contract. Build only the
known bounded visual representation whose semantics and resource lifetime the owner can isolate;
never recursively clone an arbitrary row, panel or React subtree. Rich media, canvas, embedded content
and custom elements are immediate replacements unless their existing owner supplies a safe bounded
visual. Do not remount them, replay media or create new loading/decoding work solely to retain an exit.
If no safe representation exists, omit that outgoing effect while committing the current content and
retaining eligible incoming/disjoint effects. This does not remove or sanitize a primitive's original
subtree retained by its supported native presence policy.

Paint-only retention must also be absent from scrollable overflow, native scroll-anchor selection
and snap destinations. Absolute positioning or a transform alone does not prove that isolation.
An outgoing row, translated text run or digit cell must not add a scrollbar, enlarge the scroll range
or cause a second scroll correction when it retires. Use an already safe decorative clip/layer without
clipping live content, focus outlines or portals; otherwise omit that outgoing/travelling paint.
Current semantic content still determines natural size and scroll extent. This does not suppress the
legitimate extent change of a disclosure, size host or native kept-mounted subtree under its existing
layout policy, and it does not authorize `overflow-anchor: none` on a consumer's whole scroll region.

### 3.4 Measured size and position

geometry.resize is available wherever appropriate, regardless of legacy tier. Observe natural
content and animate a separate shell. One owner measures/writes each axis; ancestors must not spring
behind every frame of a child's spring. Text/number helpers do not create competing shell-width
controllers. Position ownership stays separate from intrinsic size.

The separate natural-content region is the one real rendered content tree, not a second hidden render
of its children. A measurement must not repeat hooks, refs, callbacks, resource requests or native
form/control registration. Use the existing natural region, supported native destination measurements
or an explicitly safe bounded display-only probe. If these cannot provide an exact destination under
the existing DOM/layout contract, use immediate native geometry. No measurement clone of a form,
editor, arbitrary panel or media subtree is authorized. A host without an eligible measurable box,
including a skipped-layout region, supplies no synthetic zero target and no reason to force hidden
content into layout; establish a baseline when it legitimately becomes measurable.

| Cause                                                | Default target behaviour                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| Label/value/icon content revision                    | Animate the affected intrinsic axis from its current visual size  |
| Expansion, content insertion, panel change           | Animate measured height or both axes within constraints           |
| Explicit size prop change                            | Shell geometry may animate; typography/spacing use final layout   |
| Font arrival, viewport resize, passive parent reflow | Re-measure and apply immediately                                  |
| Direct pointer resize                                | Follow input directly; only an applicable release snap may settle |
| Unknown resize origin                                | Apply immediately instead of guessing an authored transition      |

A semantic revision/known expansion starts the measurement transaction. A fixed elapsed window such
as all resizes within 700 ms cannot reliably distinguish content from font or environment changes.
Read before writing, ignore hidden zero measurements until valid, and clamp rendered geometry against
intrinsic minimums, available space and closed-state constraints. A real disclosure may close to zero;
a label must preserve readability. Reduced/none use current intrinsic geometry before paint, not
stale cached dimensions. Each part states whether text reflows during width change or is laid out at
the destination width. Do not solve general resizing by scaling text. Temporary clipping belongs to
the content viewport, not the focus ring or portals, and is removed when no longer needed.

Destination-width layout must pass a readability check. A smaller intermediate shell must not add
truncation beyond the component's existing policy or hide the newly committed control label, caret,
focused control or content required to act. If existing valid overflow cannot preserve that content,
settle the affected axis immediately. A deliberately collapsed disclosure may progressively reveal
body content, but moving focus into the hidden region forces sufficient geometry first. A focused
native editor also takes priority over decorative geometry that would shift its caret, content box
or scroll position; appearance/colour on disjoint properties can continue.

For compound geometry, name one owner for a same-cause axis or coordinate both destinations from
natural layout before starting. Ancestors do not reclassify interpolated child frames as semantic
content changes. Resolve cyclic constraints immediately rather than starting mutually dependent
springs. Recovering from hidden/zero measurements establishes current intrinsic baseline first;
becoming measurable alone does not replay an entrance or manufacture a resize revision.

Measure and write in the same box and coordinate space. Account for `box-sizing`, padding, border
and scrollbar space exactly once when converting natural dimensions to the CSS width/height target.
A viewport `getBoundingClientRect()` affected by press, presence or ancestor scale is not directly a
CSS layout size. Use intrinsic layout dimensions or an explicit safe coordinate conversion; complex
transforms or rotation without a safe conversion use immediate native layout. This does not permit
layout reads on every animation frame.

Position and handoff snapshots also identify their coordinate owner: local layout space, relevant
scroll host, placement/transform context and current viewport mapping. Never subtract rectangles
captured in incompatible spaces or reuse an endpoint after its relationship to that owner changes.
A shared ancestor scrolling both endpoints together does not invalidate a genuinely local selection
path and does not create a new selection. Differential scrolling, sticky relocation, a portal/anchor
change or visual-viewport movement that changes the mapping invalidates affected cached projections.
Settle a local decoration at its current valid native destination; cancel a cross-surface flight and
expose its already-current destination instead of chasing it or replaying a text effect. Preserve
native scrolling, capture and scroll restoration. The separately owned `scroll.navigate` flight keeps
its explicit cancellation rules; its own scroll writes are not a reason to cancel itself.

Use the existing positioning/scroll/visibility owner or a bounded subscription for the active geometry
scope. Refresh a dirty snapshot in a batched read phase when needed, not by measuring all children or
both endpoints every animation frame. If the adapter cannot establish a safe conversion, use the
affected immediate fallback. A keyboard/zoom-driven visual-viewport correction is environment layout,
not a new content-size or entrance cause. These rules apply to the captured source as well as the
destination and preserve valid local work on unrelated owners.

Temporary pixel dimensions are presentation constraints, not a new resting layout policy. On
completion or cancellation, release only the current owner's temporary width/height, min/max and
overflow declarations to the latest native/caller sizing policy. Preserve `auto`, percentages,
flex/grid constraints, field-sizing and native user-resize ownership; never restore a stale captured
style over a newer caller revision. A native adapter that requires a maintained explicit dimension
keeps that dimension under its existing owner. The release must preserve the destination box; if the
natural destination and the temporary constraint cannot agree safely, use immediate native layout
for that axis instead of a second settling animation. A valid measured empty content box may be zero;
an unavailable measurement from hidden/detached content is unknown, not a zero-size target. Existing
minimums, padding and borders still determine the actual host box.

A measured destination is valid only for its committed content and current layout constraints.
Scrollbar occupancy, container-query breakpoint changes, writing mode and caller min/max/overflow
changes can alter the available content width and therefore its wrapped height without a new content
revision. Invalidate the affected destination and settle to current native layout; do not keep chasing
the old spring endpoint. Preserve the caller's scrollbar/gutter and responsive policy. If the animated
host itself would repeatedly cross such a breakpoint or toggle a scrollbar and invalidate its own
destination, use immediate native geometry for that transaction rather than an iterative measurement
loop, an invented fixed width or a new overflow policy. Unrelated paint may continue.

Transform ownership includes the effective composition of CSS `translate`, `rotate`, `scale`, the
`transform` list, origin and SVG transform attributes. Different property spellings do not by
themselves establish independent coordinate owners. Preserve required placement and caller transforms
through one reviewed composition or a compatible separate visual layer; otherwise omit the conflicting
effect. Do not measure an already transformed box as an intrinsic target or clear all transform channels
on cancellation. A proposed layer must also preserve containing blocks, stacking, fixed/sticky
descendants, hit regions and native selectors. `will-change` is temporary and owned; it is not permission
to leave every component promoted or to change those layout relationships at rest.

Dimension names must retain their meaning across coordinate conversions. CSS width/height and an
aspect ratio expressed as width divided by height are physical dimensions; inline/block sizes depend
on the owner's writing mode. Record the actual controlled axis and convert once before applying its
bounds. Do not divide an inline size by a physical aspect ratio and assume the result is block size
in every writing mode. Where the existing native sizing rules cannot provide one definite destination,
use immediate native geometry. This adds no promise of vertical-layout support to an upstream control.

Visual sequencing is conditional on usable geometry, not an assumed ordering of preset durations.
A label fade must not postpone semantic collapse, focus availability or a size commit until its tween
ends. If the available clip becomes insufficient first, settle the affected label paint immediately;
an expansion can reveal it once its destination-visible content fits. Consume the geometry owner's
known projection or completion signal, not per-frame text measurements, a private percentage threshold
or a new timeout. Clock overrides and reversals must preserve this rule. Independent paint may continue.

### 3.5 Colour feedback

state.color explicitly names background-color, color, border-color and applicable fill/stroke.
Shadow feedback requires a declaration; never use transition: all. Semantic theme tokens choose
colours. Foreground/background share the state commit and compatible clocks; verify intermediate
readability and make focus immediately recognisable. Inherited text colour has one owner, not another
interpolation on every descendant. Colour and shadow can repaint; they are not compositor-only.

A theme boundary coordinates document-level changes and suppresses redundant local theme animation
when appropriate. CSS and Motion may share a node only on disjoint properties. Full uses the token
clock, reduced a shortened clock, and none zero duration/delay with running transitions cancelled.
Current colour classes do not universally satisfy this target yet.

If the owned foreground/background transition cannot preserve the required readable state throughout
its intermediate colours, apply that pair's final colours immediately; matching duration tokens alone
do not prove contrast. A forced-colours environment always uses native semantic paint directly. Do not
animate an inherited colour again on each glyph, or overwrite caller colour values with sampled inline
styles left behind after cancellation.

Readability belongs to the rendered combination, including an inherited/transparent background or a
separate selected plate behind the text. Verify the actual permitted timing combinations: one owner
can become immediate on focus while another retains its clock, and nested scopes can resolve different
modes. A palette verified only with simultaneous full-mode endpoints does not cover those cases.
Known related owners coordinate a safe immediate paint result when necessary, without changing their
provider modes or taking over caller paint. Unknown combinations use the existing local immediate
fallback; do not add a descendant colour scanner or per-frame contrast measurements.
This prevents unreadable intermediate paint introduced by the library; it does not recolour or certify
the caller's final palette. Preserve that exact final cascade and its existing override authority.

A selected plate moving behind labels also changes their visible background before it reaches its
destination. The selection binding must preserve readability against both track and moving plate
throughout that path. If its palette/layering cannot do so, place the plate immediately and retain only
independently safe colour feedback. Do not duplicate labels, fade an unchanged label, or delay the
selected semantic state to disguise an unsafe intermediate frame.

A scoped shadow colour transition keeps its geometry and shadow-list topology fixed. Focus ring
width/offset, border width, shadow blur/spread, gradients/background images and filters are not
implicitly granted by `state.color`; unsupported changes settle immediately unless another reviewed
recipe explicitly owns them. Focus/invalid visibility must be established on the first state frame,
not grown from an absent outline. Placeholder paint, a pseudo-element rule, and an SVG arrow may
participate only through their named host/region; no generic descendant colour scanner is implied.
State and theme revisions affecting the same region feed one colour controller, not parallel
hover/theme/selection transitions. Cancellation restores the current cascade rather than leaving
sampled colours or temporary transition overrides pinned inline.

The shared provider library supplies `useStateColor` and `useContinuousMotion` as staged execution
support. Spread their returned bindings, including the managed callback ref, onto the real HTML/SVG
owner. The callback connects delayed portals and replacement render nodes and preserves object,
callback and React 19 cleanup refs. Discarding it is not adoption. This does not migrate catalogue
components or deliver the four planned public primitives.

Disjoint colour and loop owners can share one node without a wrapper: create `loop` with the
external ref, pass `loop.ref` as the colour hook's ref, and spread the final colour bindings onto
the actual SVG/root. Both callbacks then own their cleanup. Declaration recognition follows that
managed-ref chain and runtime evidence must execute both policies in all three modes. An arbitrary
replacement ref or a discarded intermediate ref is not a supported composition.

`useStateColor` accepts unique explicit background/color, individual border colours, fill/stroke,
text-decoration colour and declared box/text shadows. Foreground/background paint is immediate
unless the caller selects `readability: "verified"` for a palette reviewed throughout its intermediate
states. `readability: "immediate"` or `immediate: true` is the safe fallback, not automatic contrast
certification. Focus and invalid paint synchronously suppress that owner's colour clock; outline and
border geometry are not animated. Shadows require matching computed geometry/list topology; unknown
or changing topology settles to the cascade target. The host does not scan pseudo-elements; a named
pseudo region still requires its own authored rule and future adoption proof.

The staged colour hooks require an otherwise unclaimed CSS transition/animation family; the target
registered popup integration also permits explicitly coordinated, disjoint Cadence presence.
A caller-authored transition/animation family from a class or inline style makes the conflicting
hook yield, preserving that writer through mode/clock changes. Ordinary layout/paint classes and
class/style callbacks do not by themselves establish a conflicting family. Removing the
override re-establishes the current policy. Only the hook's own declarations/handles are removed;
disjoint user/native WAAPI or Motion properties survive. Unknown caller class changes are checked
in a committed style transaction, never by frame polling. No wrapper is inserted.
`coordinateMotionTheme` brackets a synchronous theme commit and folds local colour effects before
restoring their clock. Shared document signals handle print, forced-colours, visibility and page
suspension; restoration has no missed-revision queue. Loops use spin/pulse theme clocks, stop under
reduced/none or hidden/offscreen policy, and resume eligible full activity with a fresh clock.
Framework pulse assumes resting opacity one: caller dimming from inline style or the cascade uses
a static fallback, with class/environment changes sampled only at their committed boundary.
Legacy Spinner/Skeleton callers retain their documented baseline until individually migrated.

The target popup coordinator distinguishes that conservative caller boundary from Cadence's own known
presence owner. When registered library presence and explicitly adopted `state.color` share a real node, it combines their declared
disjoint property sets in one transition-family composition, retaining each property's mode, clock
and cancellation rules. The library's default presence family must not silently disable its colour
capability. Focus/invalid settles the colour owner's whole palette; entry interaction settles only
the conflicting entry envelope, leaving an independent backdrop or other property owner eligible.
Unknown caller families keep their authority; if safe composition is unavailable, omit the conflicting
library effect without inserting an incompatible wrapper or cancelling caller animations. This is a
pending integration/verification requirement, not a claim that the staged hooks deliver it today.
Ordinary caller customisation must retain eligible default presence and colour; only an actual
ownership conflict permits the local fallback. Resolve and compare the real form's complete clock
under the [preset binding rules](motion/presets.md#4-selection-overrides-and-effective-clocks), without
replacing caller families with blanket inline cancellation or inferring ownership from a class name.

### 3.6 Changed text

AnimatedText uses text.change, independently of text.reveal/text.split entrances. The target pipeline
is grapheme segmentation, common-prefix/suffix fast paths, bounded order-preserving middle diff
(Myers/LCS or equivalent), then persistent identities for retained content. Never use the entire value
or array index as identity. Character-plus-occurrence alone mismatches repeated letters; prefix/suffix
alone misses unchanged middle runs. Even one retained grapheme stays retained.

Contract examples: Save → Saved adds only d; Send → Sent replaces only d; aba → aaba preserves the
original suffix; aXbYc → aPbQc preserves a/b/c. New/deleted/replaced units receive entry/exit; retained
units may move to make room but never replay a replacement fade. Default text is sharp, with no blur
or scale. Budget changed units and cap stagger. Streaming append uses the prefix fast path; new commits
replace obsolete targets rather than queue historical transitions.

The standalone character stagger's 120 ms ceiling applies to the final start delay after effective
timeScale, alongside the 20-element stagger concurrency limit. Clamp delays or present excess units
immediately rather than scheduling later batches. Built-in display bindings use no stagger.

Intl.Segmenter grapheme boundaries protect combining marks and emoji; Array.from is insufficient.
Segmentation does not guarantee shaping: preserve connected-script, ligature and bidirectional runs;
test wrapping and truncation. If safe diff/shaping or animation budgets cannot be maintained, apply
the affected text immediately. Do not replay the whole string as an undisclosed fallback.

CodeBlock may animate newly inserted/deleted lines as units, but a modification within a retained
line preserves unchanged graphemes/runs. Syntax-highlighting tokens are presentation, not stable text
identity. A single edited character must not fade the whole retained line; unsafe shaping/diff falls
back to immediate affected content. High-frequency Bubble appends animate only new content and may
settle geometry immediately under its documented load policy; this is not an exemption for low-frequency
message edits, attachment expansion or reaction changes. See their individual component contracts.

Known plain-text component slots opt in by default. Arbitrary React elements, rich text, links and
render callbacks retain their structure and explicitly compose AnimatedText when desired. Never
inspect function-component internals/displayName for identity. Input, textarea and contenteditable
values remain native: caret, selection, IME, undo and autofill are not replaced by animated spans.
Labels/helper text are separate display slots. Final semantic text updates immediately. Exit copies
and decorative layers cannot duplicate accessible names or copied text; do not default every update
to aria-live. Selection, copy and accessible-name behaviour need browser proof.

The editing exclusion follows the actual editable context, including inherited `contentEditable`
and `plaintext-only`, not only a component named Input or a local prop. A generic Cell, CardContent,
BubbleContent or other display host inside that context remains exact native editable content in
full, reduced and none. Resolve this eligibility before introducing split/reel nodes or decorative
copies; never replace the editing tree merely to disable its animation. An explicit noneditable
island still needs a safe selection/DOM boundary before using its ordinary display contract. Entering
editing retires conflicting presentation without changing the native value, caret, selection or undo
ownership. Leaving editing establishes the current display baseline and does not replay edits.

Dispatch a known display slot deterministically: a string uses text replacement; a directly supplied
supported numeric value uses reels unless the component explicitly classifies that slot as identity
(for example a page number, shortcut, option name or source code). Do not guess from wording or parse
numeric-looking strings. Rich children/render functions use explicit composition. Title/description
parts are not exempt just because they belong to an overlay. Screen-reader-only names remain immediate.
In a generic display slot without an identity classification, a direct numeric child is the explicit
quantity signal; supply an identifier as a string. No controller guesses intent from a callback,
label wording or neighbouring data, and no new public numeric-detection prop is implied.
Resolve existing content, placeholder, falsy and return-null branches before choosing a renderer for
an actual display slot. Wrapping `0`, `false`, `null`, `undefined` or an empty string must not make an
absent child truthy, bypass a placeholder or turn a null result into a visible part. For example,
FieldError keeps its current children/errors precedence before considering replacement animation.
Changing from string to number or back establishes the new renderer's baseline immediately; do not
invent a numeric origin or run both renderers on the same content. An unavailable grapheme segmenter
or unsupported shaping mapping uses exact immediate text, not code-point splitting.

Display continuity also requires the same semantic slot/entity, not merely the same host and value
type. A shared popup retargeted to another trigger or a recycled display assigned to another record
establishes exact current text/number baselines and retires the old entity's decoration. Use the
primitive's existing trigger/payload identity or the composition's existing keys/revision boundary;
do not infer identity from matching labels, object allocation or array index, and do not invent a
public identity API. An unavailable cross-entity correspondence uses the immediate content fallback.
Ordinary edits to the same identified slot retain changed-only replacement, and an accepted Select
value change remains its explicitly designed selection/handoff cause rather than a generic entity
reset. This content decision does not reopen or remount a surviving popup.

Decomposition must preserve the slot's existing white-space policy, newlines, tabs, text-transform,
letter/word spacing, font features and inline layout. Do not introduce inline-block wrapping or disable
ligatures merely to obtain character transforms. Use a safe shaping run when it preserves the original
rendering; otherwise keep exact immediate text. Animation cannot change wrapping or typography as an
undeclared side effect of adding spans.

The internal plain-string controller keeps one native Text node, including its retained content.
It proves the actual font's whole-string raster against independently painted units and reads the
real host's native Range boxes only at commits. It never splits the semantic tree to obtain opacity
targets: native text-run rounding itself can change layout when Text nodes are split. Raster proof
and aggregate local paint are limited to 262144 pixels and a 4096-pixel axis; unsupported font
features, scripts, clipping or correspondence remain immediate. A private CSS Custom Highlight range
temporarily masks only the incoming changed paint while pixel-only canvases own opacity. This is a
static visibility mask, not a state-colour tween; foreign highlights, selection/find and native editing
take precedence. Mask removal and canvas cancellation expose the exact current native text together.
This requires Custom Highlight and constructable stylesheet support, with immediate fallback when
unavailable. No glyph inline-block, typography override, extra text tree or outer geometry writer is added.
A temporary empty baseline probe must leave native layout rectangles unchanged and is removed before paint.
Entering editing cancels paint without rewriting its existing tree; leaving editing establishes a
fresh baseline. The existing captured-origin adapter can compose only when the entire destination
is its one safe incoming unit; partial-string mappings stay local until a Range-aware handoff exists.
AnimatedText uses this strategy; it does not certify the remaining catalogue components. See the
[Custom Highlight model](https://www.w3.org/TR/css-highlight-api-1/) for DOM-independent range styling.
On Windows, pixel paint can use grayscale antialiasing while resting native text uses LCD subpixel
antialiasing. This does not authorize a font, geometry or shaping change; browser raster checks
distinguish that coverage difference from shifted or extra glyph pixels.
The staged raster renderer currently accepts only unit device scale; other DPR/zoom mappings remain
exact native text. DPR2 raster correspondence failed its actual browser check and is not certified.
Unknown visual-viewport or containing-block/clipping correspondence also uses native immediate text.
A native composition injects its dedicated captured-origin coordinator when needed; ordinary text
does not import that engine. Supplying a capture without that owner uses local replacement.

An active native text range or browser find target is a presentation constraint, not permission to
replace the selection tree. If a split/replacement overlay cannot preserve it, settle that affected
slot to exact current text and omit the effect. `aria-hidden` alone does not guarantee outgoing text
is excluded from selection/copy; verify that separately. Primitive/virtualizer visibility signals
cancel hidden work without adding per-glyph observers or a document-wide polling loop.

### 3.7 Changed numbers

AnimatedNumber implements place-value reels. Interpolating a scalar and formatting each frame is
counting, not rolling; extra slot-machine turns/random letters are separate optional effects. Initial
SSR/hydration shows the actual value, never a roll from zero. Formatting-aware output can use
Intl.NumberFormat.formatToParts to separate digits, grouping, signs and units without changing its
existing display policy.

Integer identities count left from units; fractional identities count right from tenths. 19 → 20
rolls changed columns in the direction of the whole value; 99 → 100 retains units/tens and introduces
hundreds. Unchanged digits stay still. Separators/affixes only enter, exit or reposition as needed.
An existing tabular-nums style helps equal-digit widths, not total digit-count changes; the helper
must not add it automatically and change the component's font metrics. One geometry owner sizes the
surrounding shell; reel movement and shell movement must not fight.

Default direction is trend. Explicit up/down/shortest are alternatives; shortest never silently
reverses trend for a large delta. Bound turns and total visual time. Unchanged formatted output does
not animate. Locale/format-only changes rearrange formatting, not fictitious growth/decline. Define
cross-zero/negative-zero, rounding, precision, percentage/currency, compact notation, large integer,
non-Latin-digit, RTL and NaN/Infinity handling. Unsupported formats show the correct final formatted
value immediately rather than a corrupted reel.

Built-in numeric integration preserves the exact output of the existing display path, including
precision, grouping and sign. Raw React numeric children do not acquire Intl defaults, rounding,
negative-zero signs or expanded exponent notation just to support reels. Existing formatting APIs
remain authoritative. If the original representation cannot be safely decomposed, show that exact
representation immediately. The standalone AnimatedNumber's explicit formatting belongs to
its API; this integration rule does not alter public defaults. See the
[numeric formatting policy](motion/presets.md#51-numeric-identity-and-formatting-decisions).

Numeric slots, including a supported display slot receiving a number directly, opt in. Strings such
as 00123, phone numbers, versions and dates are never parsed heuristically. Mixed content composes an
explicit numeric part. Semantic final values/aria-valuenow update immediately where applicable. Reels
retarget from current cell/subpixel offsets. Reduced/none jump with zero delay. The resolver and
renderer must implement that together; the existing snappy token alone does not provide this contract.

The [preset renderer policy](motion/presets.md#5-geometry-text-and-numerical-limits) defines the bounded
two-cell travel, trend/up/down/shortest directions, retargeting and formatter fallback. Default reels
do not count through intermediate values or make extra turns. Apply the shared moving-column limit
to a known coordinated update as well as an individual display, so splitting a data revision into
many cells cannot create unbounded work. A data/readout composition such as Progress shares a single
presentation transaction rather than assuming matching token names synchronize independent engines.

Readouts derived from direct query/filtering or pointer/keyboard scrubbing reach their current value
immediately in all modes, including a delayed accepted result of that operation. A quiet interval or
blur does not turn such a result into an independent quantity revision. The known composition supplies
the cause; uncertain correspondence takes the immediate readout fallback without parsing strings or
adding request state. Independently identified data/amount updates and discrete selection counts keep
their component's ordinary eligibility. This does not disable every readout merely because an input
elsewhere is focused, and motion never reorders or rejects data accepted by the caller.

### 3.8 Viewport reveal and rhythm

RevealGroup coordinates registered Reveal targets instead of a global selector whitelist. Share an
observer for matching root/options, register/unregister dynamic targets and disconnect on cleanup.
Reduced/none need no decorative hidden state or observer. Target API defaults are in §5.2.

| Signal                 | Meaning                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| Scope readiness        | Successful enhancement; absent means ordinary visible content              |
| Target pending/visible | Presentation only; never replace Base UI data-state or semantic open state |
| Stable rhythm slot     | Assigned to mounted identity; survives reordering and replay               |
| Element delay variable | Entrance delay; exit, focus reveal and downgrade force zero                |

Default replay is once for readable/interactive content; repeat is explicit for narrative regions.
The progression is unenhanced-visible → armed-pending → entering → visible; repeat may return to
pending after leaving. Already-visible SSR content is never re-hidden during initialization. Arm
eligible offscreen targets after successful setup. Failure/unmount restores visibility. Returning to
full after a bypassed entrance must not hide or replay consumed content.

Target defaults: amount 0.08, inset top 0.03/bottom 0.08 as fractions of root height converted to pixel
rootMargin values. Recompute on root resize. Native rootMargin percentages use root width even for
top/bottom: passing these fractions as percent margins would change their meaning. Check
intersectionRatio against amount, not only isIntersecting. Large targets need a reachable threshold
or an appropriate sentinel. Repeat uses distinct enter/leave thresholds to avoid edge flicker; these
belong to the shared trigger policy, not component timers.

Cyclic stagger is (stable slot modulo 3) × 55 ms, exposed through an element-level CSS delay variable.
It yields 0/55/110 ms, not a limit of three simultaneous animations. The concurrency/total stagger
budgets still apply; overflow targets appear immediately or use fewer moving groups. There is no
unbounded reveal queue. Exit is faster and unstaggered, not a complete time-reversed entrance.

CSS transitions need an established before-change computed style, not a physically presented hidden
frame. @starting-style can provide initial styles where applicable; it does not implement viewport
state. Neither single nor double requestAnimationFrame proves paint. Unsupported/failed enhancement
leaves the final visible state; avoid per-target forced layout and timeout rescue animations. The
initial-style adapter needs actual browser first-frame proof.

Pending targets cannot accept invisible pointer activation. Focus-in, hash navigation and explicit
reveal show the target before interaction without delay; repeat cannot hide a focused subtree.
Essential semantic content stays available to assistive technology. Print and scripting-disabled
content are visible. This fallback is decorative reveal policy, not a rule to open closed popups.

### 3.9 Other changes and coordinated examples

Collections cover insert/remove/sort/filter with stable IDs and virtualisation boundaries. Within a
single-active-item scope, a shared selection indicator may move instead of fading independent backgrounds.
Multi-selection retains independent selected states; radio dots may coordinate local transitions without
flying between distant controls. Each component records the suitable selection choreography. Icons use
state.morph; arbitrary SVG path morphing still requires an explicit property-budget review. Media
load/fallback, empty-to-content and helper/error rows coordinate presence/size without delaying error
information. Cached images may appear directly.

Charts/progress retain their engine interpolation and semantic final value. A numeric readout shares
the committed revision and appropriate rhythm; its numeric trend need not match unfinished geometry's
travel direction. Progress uses the shared-phase/immediate-readout rule in §3.1.0. Completion/failure
never waits for a visual interpolation to cross a threshold. Undo/optimistic rollback retargets from
current visuals. Native drag follows input directly; release motion is separate. Route/theme transitions and large scroll stories remain
application compositions, not automatically installed effects on every part.

For Save → Saved, commit semantic text, retain Save nodes, measure final natural width, then start
only d's entry plus shell resize in one transaction. Saving arriving mid-flight cancels obsolete exits
and completion callbacks. For 99 → 100, commit 100 semantically, roll units/tens upward, introduce
hundreds and resize the shell; an intervening 98 retargets from current reels rather than restarting.

---

## 4. Base UI integration

### Native event boundary for press controls

Button, Toggle and ToggleGroupItem share `lib/press-button.tsx`; their default renderer uses `motion.create()` around a native button adapter.
React `onAnimationStart`, `onDrag`, `onDragStart` and `onDragEnd` travel in a private
prop bag to the native button, beyond Motion's reserved-prop filtering. These remain
React native events, including capture/bubble, cancellation and the real currentTarget;
they must never receive Motion animation definitions or pan information. The adapter
also commits the Base/caller ref independently of Motion’s stable ref callback,
cleaning up the previous callback/object ref on identity changes and unmount without
replacing the DOM node. This preserves React 19 cleanup ownership. It adds no DOM wrapper.
The private `whileTap` input selects `scale.press`; native pointer and Enter handlers drive
committed controls with the token transition. Release outside the button uses cleaned-up
window pointer listeners; disabled, recipe removal and blur clear the visual press.
Motion 13.5.1's keyboard tap synthesizes a bubbling pointercancel on a later blur, even
after keyup. That event can cancel a new Base Slider drag, so the adapter does not install
Motion tap listeners. Caller native events and Base activation/focus still run on the same node.
Caller `render` still replaces the default renderer through Base UI. This boundary
does not establish compatibility for other Motion-rendered parts or prove live-mode
cancellation of an already running gesture.

### Native event boundary for public div parts

ProgressIndicator's default renderer and floating CodeBlockActions use `lib/native-div.tsx`.
Its `motion.create()` native div adapter carries the four reserved React handlers and
caller ref in private props, restoring them to the same DOM node and committing ref
identity changes with React 19 cleanup, as for press controls above. Progress keeps
committed control animation; Actions uses the same committed controller for opacity,
including same-target mode/clock retargeting. No recipe, token, DOM wrapper, or caller render ownership changes. Internal
ControlDiv/ControlSpan consumers are not implicitly migrated or certified.

A Base UI popup enters a "closing" phase before it unmounts, waiting for the animation to finish. Understanding these four patterns is what makes "rich animation" land in practice (official docs: [Base UI Animation](https://base-ui.com/react/handbook/animation.md)).

### Supported animation owners

| Owner                  | Contract                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Base CSS popup         | Token-backed starting/ending classes; local portal clock; opacity-only reduced; visible first frame and zero duration under none |
| Motion popup           | Base render + actual mount lifecycle; recipe timing; preserve focus/portal ownership through reversal and cancellation           |
| Persistent layout host | One Motion value/controller owns the property; measured/clamped geometry and immediate reduced/none targets                      |
| Exit teardown          | Keep the actual surface until exit completion; native callbacks and unmount cleanup must settle it deterministically             |

Never add a second CSS/Motion/engine writer to the same property. Evaluate Base class/style callbacks
before caller-last merging. Live downgrade cancels geometry before paint, retains permitted opacity
under reduced and cancels every motion clock under none. Re-entry reverses the actual surface rather
than remounting its focus owner. A portal resolves the local provider clock, including nested full
under outer none subject to the OS preference. Native CSS clock changes do not promise in-flight
retiming; mode downgrade/none cancellation remains mandatory.

### Coordinating one committed change

A semantic revision can coordinate colour, text, icon and size in parallel. Each property has one
writer and each size dependency has one owner. Parent presence consumes only the same entrance
cause; it does not suppress later descendant updates. Never animate the same transform through
press, layout and reveal independently: compose the transform in one adapter or use a deliberate
semantics-preserving visual layer. Avoid blanket wrappers that break table structure, refs, selectors,
Base render callbacks or anchor measurement. Popup anchors must remain stable while their geometry
is used; move feedback to an appropriate visual part when necessary.

Latest committed target wins. Cancel obsolete completion callbacks and removed-node writes; retain
current position/velocity where the recipe promises continuity. Direct input takes priority over
autonomous settling. Live reduced/none and zero-clock changes settle before the next paint even when
the target did not change. Resuming full does not replay settled or consumed transitions. Business
state, focus, disabled/error/success and accessible names commit immediately; no animation queue or
minimum working interval delays them.

Distinguish an input request, an accepted semantic commit and a presentation target. A callback,
new array/object instance or repeated render is not by itself a new action. Compare the known
owner's actual state/content and identity, without deep-scanning arbitrary caller trees. Rejected
controlled requests start no selection, value, text or size animation. Independent accepted press
feedback may still run. Batched A → B → A with no committed B has no B presentation; if B did commit,
the later A is a real reversal from current paint. An unchanged semantic target preserves an eligible
current flight rather than restarting or forcibly settling it. Mode, clock, environment, ownership
and lifetime changes still apply even when that target is unchanged.

Direct-input provenance survives a delayed controlled echo when the existing primitive/integration
can identify it. A Slider value accepted after pointer release is not thereby an unrelated
programmatic animation. The same applies to keyboard edits and composed readouts. Use the native
accepted revision/cause where available; do not classify by elapsed time, current focus, an event
handler's identity or equality with an indefinitely retained requested value. If correspondence is
unknown, preserve native presentation immediately for the affected direct-input geometry/readout.
This does not disable local indicator feedback on discrete Checkbox, Radio or Switch selections.

A native form reset or browser-restored control state, when actually accepted by the primitive,
establishes its current presentation immediately in all three modes. It is not a click, selection
journey, count from zero or a second completion event. Cancel obsolete value/glyph/reel projection
for that reset, including a same-target flight; retain the native reset cancellation, controlled-value
and callback rules. A cancelled reset creates no reset boundary; an ordinary equal-value echo creates
no new motion revision. No animation-only reset handler
may force state, synthesize change/commit callbacks or clear native gesture ownership.

Latest means latest **accepted commit**, not the newest network-request timestamp. Application data
ordering remains caller-owned: motion must display a value the caller actually commits even if it
came from an older request. Reject retired animation/measurement deliveries, not valid caller data.
An internally owned resource such as an image or highlighter result still checks its actual source
and owner lifetime. These are internal cause rules, not a new public transaction prop or request queue.

Async readiness does not supply a missing animation origin. A Suspense fallback, error boundary or
conditionally replaced host has its own actual lifetime; never measure speculative content or keep
the old interactive subtree alive solely until its replacement is ready. If React preserves visible
content during an update, it keeps its existing owner until an actual accepted replacement. If a host
is hidden or replaced, retire its affected presentation work; recovery establishes current native
geometry before considering a later independent revision. Reusing the same semantic key does not
make an old detached host's measurements valid for a new host.

A surviving region may coordinate a committed fallback-to-content replacement using its existing
presence/geometry contract and one real measurable destination. The newly available child's initial
text/number display is an exact baseline, not a diff from placeholder copy or a count from zero. Parent
presence consumes that same child entrance once. First streamed hydration follows the ordinary readable
SSR rule, not a deferred hidden reveal. Application readiness, retry, error and focus decisions never
wait for an animation or acquire new callbacks from these presentation rules.

### Runtime identity and terminal presentation

Design binding names identify reusable contracts, not live controller keys. A runtime owner is scoped
to its actual component instance, part and current host lifetime; a retained semantic item adds its
existing identity within that scope. Two Tabs, Selects or Toasters may use identical values and the
same presets without sharing measurements, origins, exit completions or cancellation. A shared motion
provider supplies policy, not shared selection identity. Portals preserve their logical owner's scope;
neither mounting under the same document body nor using the same `data-slot` merges their owners.
Nested independent collections likewise retain separate selection scopes. Known compound geometry
and aggregate work limits still coordinate at their real enclosing transaction; instance isolation
must not create a fresh budget for each child of that transaction.

Keep a scope stable across ordinary renders and ref handoff. On actual host/owner replacement, retire
its registration before accepting new writes; a delayed cleanup may remove only its own registration,
never a newer registration with the same semantic value. A `layoutId`, map key or origin cache derived
only from a binding name, item value or DOM selector is insufficient. Use existing internal instance
ownership without introducing public id props or nondeterministic SSR markup. Intentional cross-owner
handoff requires the explicit source/destination contract, not accidental identity matching.

Completion is an outcome of owned visual work, not a guarantee that a browser end event will arrive.
An unchanged resolved property, unavailable safe owner, unsupported execution path or immediate
fallback can produce no animation even under full mode and a positive clock. Release the affected
library work and apply its current semantic presentation through the native lifecycle adapter; do
not leave a hidden layer, busy flag, temporary size lock or retained exit waiting for a missing event.
Cancellation/replacement is distinct from successful completion. Retired completion events, bubbled
child transition events and rejected cancellation promises cannot finish a newer action or emit an
application change/success callback. Accept completion only for the current owned handle/property
and revision; cleanup is idempotent and disjoint writers survive.

Native keep-mounted/prevent-unmount and exit-completion rules remain authoritative. This terminal
path neither forces removal nor synthesizes an upstream callback that its policy intentionally
defers. Never guess completion from `visualDuration`, add a timeout watchdog or change native intent
timers. Adapter failure must release any acquired library-owned temporary presentation and retain
exact native content; it does not hide application errors or claim an unavailable effect succeeded.
These are target execution and browser-acceptance requirements, not new runtime capabilities.

## 5. Composition-layer API

### 5.1 Runtime compatibility surface

This Recipe union is the current exported set, kept in sync with lib/motion.ts by registry:check.
It includes shared `state.color` and `text.change` support. AnimatedText is installable; the other public renderers remain pending. The hook's existing
mode/timeScale inheritance and source-distributed API remain compatible during migration.

```ts
export type CadenceMode = "full" | "reduced" | "none";
export type Recipe =
  | "reveal"
  | "enter.pop"
  | "exit.fade"
  | "exit.shrink"
  | "popup.anchored"
  | "layout.move"
  | "layout.shared"
  | "list.stagger"
  | "gesture.drag"
  | "scroll.progress"
  | "scroll.navigate"
  | "scroll.story"
  | "text.reveal"
  | "text.change"
  | "text.split"
  | "number.roll"
  | "data.transition"
  | "state.morph"
  | "state.color"
  | "geometry.resize"
  | "handoff"
  | "feedback.press";

export function useCadenceMotion(): {
  mode: CadenceMode;
  /** drop transform / scale / layout — true for both `reduced` and `none` */
  reduced: boolean;
  /** `mode === "none"` only: a CSS-driven component must resolve to zero duration */
  disabled: boolean;
  timeScale: number;
  transition(recipe: Recipe, options?: { delay?: number; duration?: number; timeScale?: number }): Transition;
  distance: typeof distance;
  spring: typeof spring;
};
```

Implementation notes:

- The provider's MotionConfig fallback uses `duration.base` and `ease.out`, scaled by
  the clock. Shipped Motion parts pass explicit recipe transitions (including controls.start
  and imperative animate calls); their recipe mode branches own reduced/none. The default
  is not a blanket policy for caller-authored Motion components. It does not suppress arbitrary
  caller-authored targets or cancel an already running animation; components own those branches.
- `mode === "none"` → every transition is `{ duration: 0 }`;
- `mode === "reduced"` or a system preference → drop `y/x/scale/rotate/filter`, keep only `opacity`, duration ×0.6;
- `timeScale` (provider prop, default `1`) multiplies durations, spring `visualDuration`, and delays; the docs
  site's speed gear passes `4` for its `0.25×` setting. It scales nothing inside `none` — a disabled transition
  stays disabled;
- a nested provider inherits the mode and the scale it does not set, so a subtree can slow down (or be
  silenced) without resetting the page to `full`; passing `mode` explicitly is how it opts back in;
- with no provider, follow the system preference (`reduced` when requested, otherwise `full`);
- the object returned by `transition()` can be passed straight to Motion's `transition` prop, optionally composed with `delay`.

> `reduced` and `disabled` are deliberately two flags. A component that branches on `reduced` alone
> will keep a 100ms fade under `none` — that is the failure the two-flag split exists to prevent.

### 5.2 Target public primitives

AnimatedText is available as `@cadence/animated-text`, exporting `AnimatedText` and its props from
`cadence/animated-text`. It takes native span props and a string value; it does not accept arbitrary
children, an origin or an identity prop. Auto/grapheme uses the character clock; word groups only
changed paint using Intl word segments and the word clock. All retain the same native text and
conservative proof/fallback policy. AnimatedNumber is available as `@cadence/animated-number`,
exporting `AnimatedNumber` and its props from `cadence/animated-number`. Native span props accompany
the numeric API below. Omitted formatting props retain String(original); supplying locales or format
selects native Intl. This standalone boundary denotes an independently committed quantity; query/filter,
delayed direct-input, reset and restoration readouts remain native JSX. Affixes and format-only revisions
are immediate native text, with no additional text animation owner. Current reel proof requires supported
ASCII/LTR typography, unit device scale and integer resting glyph origins; other mappings stay exact native.
The Reveal rows remain design interfaces. Each primitive has
an independently declared registry item, relative shared imports, namespaced dependencies and its own
contract tests. They do not require every ordinary consumer to wrap each component manually.

| Primitive      | Minimal target API                                                                                                                           | Ownership                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| AnimatedText   | value: string; locale?; granularity: auto/grapheme/word (default auto)                                                                       | Changed display text; no independent outer width spring         |
| AnimatedNumber | value: number/bigint; locales?; format?: Intl.NumberFormatOptions; direction: trend/up/down/shortest (default trend)                         | Place-value reels and final formatted semantics                 |
| RevealGroup    | replay: once/repeat (default once); amount: 0.08; inset: top 0.03/bottom 0.08; stagger: none/cycle (default none); optional observation root | Observer lifecycle, stable group slots and shared reveal policy |
| Reveal         | Base-style render composition with a real ref-capable target; children                                                                       | Registers one target, preserving props/refs/DOM semantics       |

Auto granularity preserves safe shaping runs; it is not permission to split connected scripts into
independent inline blocks. All primitives inherit mode/timeScale. Per-instance raw duration/easing/
spring knobs are not part of the default API. Overrides use shared recipe/token policy. Read-only
numeric display is separate from an editable number field; the latter is not added by this design.

Illustrative target composition (not runnable against the current registry):

```tsx
<CadenceProvider mode="full">
  <Button>{label}</Button>
  <Badge>
    Selected <AnimatedNumber value={count} /> items
  </Badge>
  <AnimatedText value={description} locale="en" />
  <RevealGroup replay="repeat" stagger="cycle">
    <Reveal render={<Card />}>Narrative content</Reveal>
  </RevealGroup>
</CadenceProvider>;
```

Supported plain-string slots use the text capability internally; number-valued display slots use
numeric semantics. Mixed JSX explicitly composes the relevant primitive. Arbitrary children and
render callbacks remain caller-owned. Individual target contracts are in the
[component catalogue](motion/README.md#5-catalogue); component-family rollout remains in the
implementation plan. Internal geometry/presence adapters are shared implementation, not
an obligation to expose more wrapper components or duplicate shadcn APIs.

---

## 6. Three-layer strategy for reducing motion

System preference is a ceiling: a full provider cannot bypass OS reduced motion. An explicit none
stays none. A nested provider inherits omitted mode/clock values; an explicit nested full may override
an outer none only subject to the OS preference, preserving current provider semantics. Standalone
components still follow the OS. data-motion exposes the resolved mode to CSS; writing an attribute
alone is not a universal imperative-engine cancellation API.

Modes apply at the property owner's resolved scope. A full-mode parent envelope can still move or
fade the subtree containing a nested none-mode child; that child creates no local motion, but cannot
opt out of its ancestor's rendered geometry or opacity. It must not counter-transform, overpaint or
cancel the parent's writer. To make the entire presentation immediate, resolve the actual enclosing
owner to none as well. Conversely, an explicitly full child under a none parent may run an independent
later update subject to the OS ceiling and its lifecycle; it does not replay a consumed same-cause
entrance or animate while its parent is semantically closed. This makes owner-local cancellation and
inherited presence consistent without changing provider precedence.

| Capability                 | Full                                            | Reduced                                               | None                                 |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| Decorative viewport reveal | Configured once/repeat                          | Bypass controller; visible                            | Bypass controller; visible           |
| Semantic popup/presence    | Appropriate travel/scale and opacity            | Short opacity only                                    | Immediate lifecycle target           |
| Size/position              | Measured continuity                             | Immediate geometry, no delay                          | Immediate geometry, no delay         |
| Colour                     | Token transition                                | Shortened colour transition                           | Immediate; cancel duration and delay |
| Changed text               | Changed-unit entry/exit; retained-unit movement | Changed-part fade, no travel/blur/stagger             | Immediate text                       |
| Numeric reels              | Place-value rolling                             | Final value immediately                               | Final value immediately              |
| Direct manipulation        | Follow input; applicable release settling       | Preserve operation, remove decorative/inertial motion | Preserve necessary direct operation  |
| Continuous status effects  | Active, visible, pausable CSS loop              | Static equivalent status                              | Static equivalent status             |

This is the v2 target. Current colour feedback and continuous-loop branches must be migrated before
claiming this matrix for an item. Short tween timing continues to use reducedDurationScale; no extra
stagger/delay survives an immediate geometry or numeric path. Zero timeScale is immediate recipe
timing, not a different mode, and does not change the continuous theme-clock contract (§2.2.1/§3.2).

Bypassing the decorative reveal controller never bypasses a semantic state machine: a reduced Dialog
still opens/closes and a Switch still changes value. A live downgrade cancels active motion, not just
the next animation. None disables every library-authored transition, including colour/opacity/filter
and loops. Static placement transforms are permitted when they represent final geometry.

An animation delay is distinct from a primitive's interaction timing or application lifetime.
None/zero removes presentation delay, stagger and animation-only exit holds; it does not remove
Tooltip/HoverCard intent delays, Toast lifetime/pause rules, debouncing explicitly owned by the
application, or the native event order. Do not change those defaults to make a motion mode appear
instant. Conversely, an interaction timer must never be repurposed to postpone semantic completion
or keep an otherwise finished visual alive. Reduced/none preserve any ongoing direct native gesture;
the mode adapter cancels autonomous settling without dropping capture or moving away from input.

Errors, progress, loading and success remain available as text/icons/native state. Announcements are
intentional; do not add aria-live to every animated string. Reduced motion cannot remove input methods
without an equivalent accessible operation, nor can it replace native editing with display animation.

The effective environment can further suppress decorative work: forced-colours and print present
current semantic paint/layout immediately while preserving native focus, selection and closed-state
visibility. Do not force author colours or open closed content for a print snapshot. Document hiding
or page suspension cancels one-shot work and pauses loops; restoration establishes current geometry
and does not replay missed revisions. Eligible full-mode activity may resume. These shared signals,
idempotent cleanup and property-scoped cancellation follow the
[cross-component lifecycle contract](motion/README.md#31-cancellation-environments-and-renderer-ownership).

---

## 7. Performance budgets and implementation rules

| Metric                            | Budget                                             | How it is checked                                           |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Motion runtime (initial)          | ≤ 48 KB gzip (measure the actual required runtime) | Build analysis                                              |
| Per-component added JS            | ≤ 8 KB gzip (shared runtime excluded)              | Build script                                                |
| Initial JS per page               | ≤ 120 KB gzip                                      | Production browser request audit (`site-js-budget.spec.ts`) |
| Frame rate                        | ≥ 55 fps on a mid-range mobile device              | Playwright trace / manual                                   |
| CLS                               | < 0.02                                             | Lighthouse / Playwright                                     |
| Simultaneously animating elements | ≤ 20 (stagger scenarios)                           | Code review                                                 |
| Total stagger duration            | ≤ 400 ms                                           | Code review                                                 |

Implementation rules:

1. **Budget properties explicitly.** Spatial presentation uses transform/opacity; optional filter blur is limited to reviewed small text areas at ≤4 px and is off by default. Colour/border/fill/stroke and declared shadow feedback use state.color. Measured width/height uses geometry.resize, clamped and immediate under reduced/none at any legacy tier. Chart SVG geometry (§3.1.2) and explicit native scroll offsets (§3.1.5) retain their documented exceptions. No generic padding/font-size/radius/path animation is implied by a recipe name.
2. **No layout-read loops**: read `getBoundingClientRect`/`offsetWidth` only in a committed client layout phase, an event measurement transaction or a `ResizeObserver` callback. Batch reads before writes; never read during render, in an abandoned render, or once per animation frame/glyph. A shared layout scheduler may batch a known transaction but must not turn it into polling.
3. **`will-change` is removed once done**: add it only while animating, remove it afterwards (or let Motion manage it).
4. **Bound automatic collection work before measurement**: use the participant limit and counting rules in [presets §5.2](motion/presets.md#52-shared-work-limits), including still-active earlier revisions and retained outgoing decoration. Reject an oversized set before per-member layout reads or copy allocation and use immediate native presentation. Manual, paginated or virtualized compositions require their own bounded adapter and performance evidence; changing the execution technique is not an unlimited exemption.
5. **Reading surfaces do not bounce**: text, numeric readouts and size recipes author bounce zero. Existing press feedback remains separately tokenised. A physics spring inheriting velocity can still cross its target, so geometry clamps the rendered value (rule 9). More expressive gestures require a separately reviewed recipe and do not become everyday defaults.
6. **Keep optional engines optional**: any future scroll.story/GSAP item must declare and load that dependency explicitly. No GSAP component is currently shipped; basic v2 capabilities do not require it.
7. **Keep `AnimatePresence` subtrees small**: wrap only the elements that need an exit, never a whole page.
8. **Interruptible springs are physics-defined**: a recipe that can be retargeted mid-flight
   (`layout.move`, `layout.shared`, `geometry.resize`, `handoff`) declares `continuity: "velocity"`,
   and `transitionFor()` expands the token into `stiffness`/`damping`/`mass` after `timeScale`.
   Never hand a `visualDuration` spring to an element that must reverse smoothly.
9. **Measured geometry is clamped**: use clampMeasuredSize or the documented adapter equivalent
   against intrinsic/closed/available constraints (§3.4). Clamp the rendered value, not the spring.
10. **Bound text and group work**: retained characters do not animate again; diff work and moving
    glyphs have a budget. Reduce moving groups or show final values when limits are exceeded. Cyclic
    delay does not bound concurrency. Reuse observers where appropriate and do not measure every glyph
    on every frame. The 400 ms stagger ceiling applies after timeScale; scale/clamp group delay or
    reduce the moving set to remain within it. The [shared renderer limits](motion/presets.md#52-shared-work-limits)
    include still-active visual work from earlier revisions in the same known scope; frequent commits
    cannot reset the allowance or accumulate obsolete outgoing layers.

---

### Measurement protocol

KB is decimal: page initial JS ≤120000 bytes, Motion ≤48000, component addition ≤8000.
Measure a production page in a fresh browser/context with CDP cache disabled and no storage,
interaction, scrolling, request blocking or script exclusions. Wait for the page, load/networkidle,
another 10 seconds, then networkidle. Count all automatic script/prefetch/async JS responses,
deduplicate absolute URLs, gzip each decoded body separately at level 6 and sum. Do not concatenate
chunks before compression or use transfer encoding/Content-Length as the gzip value. Preserve
response status, SHA-256, initiators and build/root manifests; errors or missing responses fail.
Existing inline theme bootstrap and serialized data are HTML, not external bundles; never move
application code to inline/data/eval or beyond the observation window to evade the gate.

Compiled component addition excludes a declared shared runtime baseline, retains dedicated dependencies
and explicitly distinguishes initial versus reachable async output. Source tier gzip, local-only
compiled code and full consumer addition are separate metrics. Mixed chunks cannot be assigned exact
package gzip by proportional raw-byte allocation. A lean fixture never certifies a complete route.

CLS uses the maximum session window (gap <1 second, total span <5 seconds), excluding recent-input
shifts; keep raw entries and report routes/viewports/actions/window. Cold-load passing results do not
prove untested interactions. FPS needs a real midrange device, environment/thermal/refresh metadata
and presented-frame traces across actual motion windows; desktop emulation or rAF frequency is not
equivalent. Repeat meaningful windows without averaging in idle time.

Reusable collectors: scripts/site-js-budget.mjs, audit-site-pages-js.mjs, audit-w3-site.mjs,
audit-w3-bundles.mjs and audit-w4-interaction-cls.mjs. Save results under .cache/audits; current
gates and future work belong to [the plan](parity-plan.md#8-next-work).

## 8. SSR and hydration

| Rule                                                          | Reason                                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `initial={false}` for above-the-fold elements                 | Avoids the server rendering the end state and the client replaying the animation, which causes flicker   |
| Read system preference through the shared external-store hook | Server/client snapshots agree during hydration; components do not directly query browser state in render |
| No random values or times as initial state                    | Server and client would disagree                                                                         |
| Layout ownership stays in a client boundary                   | Preserve deterministic SSR markup and identity; a Client Component can still render on the server        |
| Popups do not render by default (`open=false`)                | Avoids an extra tree on first paint                                                                      |
| Every animated component is `"use client"`                    | The server never runs animations                                                                         |

Reveal enhancement never globally hides server-visible content. Text/number initial values, locale,
formatting and segmentation must agree on server and first client render. Initial values do not
animate from empty/zero. Stable IDs are deterministic across hydration. CSS media rules protect the
first paint before the shared system-preference subscription updates; JS policy alone is insufficient.
No-JS visibility means present readable content, not a promise that Base UI controls work without JS.

---

CodeBlock's initially folded viewport reserves its built-in line-height and padding through a
static CSS maximum before hydration (`maxLines`, `--leading-relaxed`, `--spacing`). This is initial
layout, not a transition or a new recipe. Under `scripting: none` the cap does not apply, so the
whole source remains readable. The first real measurement replaces the reserve before paint;
subsequent fold changes still use measured, clamped `geometry.resize`. Custom content typography
or padding can change that initial estimate and remains the caller's SSR sizing responsibility.

## 9. Testing motion

### 9.1 Three test layers

| Layer       | Tool                         | Assertions                                                                       |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------- |
| Unit        | Vitest + RTL                 | API behaviour, `data-motion` branches, accessibility attributes, no `@/` imports |
| Interaction | Playwright                   | Final state after open/close/keyboard/drag                                       |
| Visual      | Playwright`toHaveScreenshot` | 3 states (open, closed, mid-animation) × 2 themes × full/reduced/none            |

### 9.2 reduced-motion matrix

```ts
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`dialog ${reducedMotion} ${mode}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(`/components/dialog?motion=${mode}`);
      await page.getByRole("button", { name: "Open" }).click();
      const content = page.getByRole("dialog");
      await expect(content).toBeVisible();
      // after the animation it must be fully visible with no residual transform
      await expect.poll(() => content.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
      if (reducedMotion === "reduce" || mode !== "full") {
        await expect.poll(() => content.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      }
    });
  }
}
```

### 9.3 Asserting the motion "contract"

Animated component suites must execute `expectMotionContract(mode)` in full, reduced and none.
`tests/motion-contract-reporter.mjs` (configured in Vitest) enforces successful runtime calls for every
registry UI/block with a nonempty `meta.motion`; an import, comment, skipped test or dead call does not count.
Currently static items need no fabricated provider/helper; an animated capability triggers the
obligation regardless of legacy tier. The scaffold leaves an intentionally failing contract test until
the animated fixture is implemented.

The shared unit helper checks mounted `data-motion` parts, CSS state classes and local clocks,
continuous animation gating, and observed Motion targets/transitions. Only successful test cases
contribute runtime metadata; skipped suites do not count.
`registry:check` requires the named animated test file to exist. Test-only pass-through
observers preserve real Motion rendering and control methods. Neutral scale/translation is legal;
Switch/Progress retain positional transforms with an instant clock under reduced/none. Static
placement transforms and direct pointer geometry are not entrance animations. The current helper's
Spinner reduced-spin exception is a migration baseline, not the v2 rule; remove it with the source,
loop policy and consumer docs migration. Decorative glyph orientation (for example CodeBlock's
expanded chevron) may retain a rotation target with a zero clock; a timed rotation still fails.
Imperative geometry fixtures opt into `instantImperative` for the reduced clock; none always checks
observed imperative clocks. Engine and native WAAPI animation tests supply an
explicit behavior assertion for their actual clock/keyframes; a wrapper's mode alone is insufficient.
Composition suites include the installed controls, rather than inventing a motion branch on the root.
Use a homogeneous provider fixture; retain dedicated nested-override tests for mixed mode trees.

This is executable unit evidence, not a browser animation sampler or a source property extractor.
The docs recipe set is checked separately by `registry:check`. Existing interaction assertions stay.
Computed Tailwind styles, same-target live cancellation, first paint, system preference, nested
providers, final measured positions and per-frame running geometry still need browser evidence.
Adopting the helper does not close the cross-library running-mode audit.

V2 extends the recognisers/helper to colour properties, shared helper implementation evidence and
reduced static loops. A passing legacy helper is not sufficient evidence for a newly promised v2
capability. Retain negative fixtures so a declared dependency, dead call or wrapper attribute cannot
masquerade as exercised motion.

### 9.4 a11y and visual regression

- `@axe-core/playwright`: run once per component page, 0 violations;
- keyboard script: Tab/Shift+Tab, arrow keys, Esc, Enter/Space;
- visual regression: screenshot key frames only, threshold `maxDiffPixelRatio: 0.01`, so font differences do not turn everything red.

### 9.5 V2 behaviour acceptance

| Area            | Required evidence                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text            | Retained DOM identity; multiple changed runs; repeated letters; insertion/deletion; emoji/combining characters; connected scripts/RTL; wrapping, copy and final accessible text |
| Numbers         | 9↔10, 99↔100, cross-zero, rounding, currency/compact formats, unchanged formatted values, locale change, bounded large jumps and direction                                      |
| Geometry        | Content/size revisions versus passive resize; nested ownership; hidden-zero recovery; intrinsic minimums, wrapping and focus-ring clipping                                      |
| Reveal          | Correct amount/inset; huge targets; first paint/SSR/no-JS; once/repeat; stable delay after reorder; boundary flicker; focus/hash and failure cleanup                            |
| Modes/lifecycle | 3 modes × 2 OS preferences; nested overrides; same-target live downgrade/zero clock; rapid reversal; route/unmount cleanup; no detached writes                                  |
| Colours/loops   | Computed colour clocks and mid-flight none; reduced static status; hidden/offscreen pause; theme-change coordination                                                            |
| Composition     | Parent/child entrance consumed once; press/resize/reveal properties do not compete; portals and engine/native operations stay correct                                           |

Keep API/parity/keyboard checks and actual engine/native WAAPI assertions. Performance evidence is
measured separately under §7, including complete routes and real-device frame presentation.

---

## 10. Anti-pattern list (sent straight back in review)

- ❌ `transition: all 0.3s` (uncontrollable; animates layout properties)
- ❌ Using `setTimeout` to end an animation (not interruptible, out of sync with the real duration)
- ❌ Reading `offsetHeight` in `useEffect` and then writing styles (forces synchronous layout)
- ❌ Driving the same property with CSS and Motion/another engine (disjoint properties on one node are allowed)
- ❌ Spring `bounce > 0.3` on informational UI
- ❌ Infinite loops (marquee, shimmer) that cannot pause or ignore reduced motion
- ❌ Hiding critical information behind an animation (errors, load failures)
- ❌ Unmounting an element outside `AnimatePresence` and expecting an exit animation
- ❌ Adding `overflow: hidden` to `body`/`html` without cleanup (a common drawer bug)
- ❌ Relying on `:hover` as the only state indicator (unusable on touch)
- ❌ Replaying unchanged text, guessing numeric strings, or splitting native editable content
- ❌ Parent and child springing the same size, or animating every passive ResizeObserver notification
- ❌ Treating three stagger slots as a concurrency cap, or rAF as proof that a frame was painted
- ❌ Publishing target recipes/API claims before their source, registry, docs and tests migrate

---

## 11. Motion review checklist

- [ ] Which causality does this animation explain? (If you cannot say it in one sentence, delete it.)
- [ ] Which capability is default, inherited, composed or inapplicable, and who owns each property?
- [ ] Do related text, size, icon and colour changes share a cause without duplicate parent/child entrances?
- [ ] Can the close animation be smoothly interrupted by re-opening?
- [ ] Do the layout springs keep their velocity when retargeted (physics-defined, not `visualDuration`)?
- [ ] Is every measured size constrained appropriately, with current intrinsic geometry and zero delay under reduced/none?
- [ ] Under reduced motion, is the information complete and the state still recognisable?
- [ ] Are properties explicitly allowed, including colour and any measured/engine exception? What layout/paint work occurs?
- [ ] Does it use this document's tokens and recipes? Are there new magic numbers?
- [ ] Is there a matching Playwright assertion or screenshot?
- [ ] Does it pass real-device budgets? CPU throttling is diagnostic and does not replace device evidence.
- [ ] Does the duration match the element's place in the hierarchy?
- [ ] Can it be fully disabled with `data-motion="none"`?
- [ ] Do live downgrade and same-target clock changes cancel running work, including CSS colour and delayed starts?
- [ ] Are unchanged text/value identities, shaping, native editing and accessible final values preserved?
- [ ] Does user-facing documentation describe delivered behaviour, with remaining target work in the plan?

### Data Table composition (B8)

Delivered baseline; row/text/numeric capabilities are scheduled in the v2 plan, not claimed here.

The `registry:block` Data Table is T2 because it composes Button `feedback.press`,
Checkbox / menu `state.morph`, and Dropdown Menu `popup.anchored` / `exit.fade`.
Its rows, column visibility, sorting, filters and page changes update immediately
in all three modes. There is no row reveal, `data.transition` or geometry recipe:
removing or reordering data must not remount the table or its filter input.
Stable application IDs key surviving rows. The installed controls own their
existing motion contracts. Dropdown Menu now owns its portal's token clock just
as Sheet does, resolves caller class/style callbacks last, and removes starting
opacity in `none`; nested full, reduced, none and live downgrade are checked with
the Data Table composition. Each composition must retain the installed controls' own contracts.

### Date Picker composition (B8)

Delivered baseline; value/panel capabilities are scheduled in the v2 plan, not claimed here.

The T2 `registry:block` composes Button `feedback.press`, Popover
`popup.anchored` / `exit.fade` and Calendar `data.transition`. The date label and
selection update immediately. Single/range selection never keys the popup or
calendar by the selected value. Month movement follows §3.1.3 unchanged.
Popover resolves duration.fast locally through the portal with timeScale and
reducedDurationScale; caller callback classes/styles are evaluated and merged
last. Full uses opacity and scale, reduced transitions opacity only, none uses
transition-none/duration-0 and removes decorative hidden starting opacity. A closed
host retained by native policy keeps its correct closed ending paint; `none` does
not make it visible. Removing the scale transition on downgrade cancels an active
scale immediately. Nested
full under outer none restores the local clock, subject to OS reduce. Other popups require their own applicable lifecycle proof.

Site DocumentEntrance follows §3.3's readable SSR/no-JS/hydration baseline. Only a later eligible
client insertion may enter; returning to full after an initial none or restoring an offscreen document
must not re-hide or replay that consumed host. Print retains current semantic visibility. An SSR-hidden
strategy with a noscript repair is not this target contract. Site adoption and browser evidence remain
tracked by the rollout plan; they do not establish delivery of §3.8's separately planned Reveal API.

## 12. Technical references

- [Base UI animation lifecycle](https://base-ui.com/react/handbook/animation): starting/ending styles and interruption.
- [Motion transitions](https://motion.dev/docs/react-transitions): tween and physics/duration spring behaviour.
- [Intersection Observer](https://www.w3.org/TR/intersection-observer/): area thresholds, root margins and delivery.
- [CSS before-change styles](https://www.w3.org/TR/css-transitions-2/#defining-before-change-style): initial transition styles.
- [HTML rendering opportunities](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering): rendering and animation-frame callbacks.
- [Unicode text segmentation](https://www.unicode.org/reports/tr29/) and [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter): grapheme boundaries.
- [CSS text boundary shaping](https://www.w3.org/TR/css-text-3/#boundary-shaping): shaping across inline boundaries.
- [Number format parts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts): locale-aware digit/affix parsing.
- [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot): matching initial server/client output.
