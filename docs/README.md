# Design and contributor documentation

This directory contains current concepts and contracts. User-facing documentation lives in
`content/docs/` and `content/components/`; component inventory and install metadata live in
`registry.json`. The execution plan and its acceptance evidence live in the issue tracker; Git
history is the record of completed work, measurements and handoffs.

| Read                                                            | Before                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Overall design](overall-design.md)                             | Changing architecture, install paths, shared code, APIs, themes or the build         |
| [Animation system](animation-system.md)                         | Changing tokens, recipes, modes, engine integration or motion tests                  |
| [Individual component motion](motion/README.md)                 | Designing or reviewing one component's parts, choreography and six capabilities      |
| [Motion evidence recipes](motion/evidence-recipes.md)           | Writing source that the gates can certify, or diagnosing a record that will not join |
| [Motion presets and bindings](motion/presets.md)                | Selecting component rhythm or changing shared parameter assignments                  |
| [Where the rollout plan lives](animation-system-plan.md)        | Choosing a v2 migration task: the phase epics point at the issue for each one        |
| [Site and distribution](documentation-site-and-distribution.md) | Changing MDX, previews, site controls, registry HTTP or snapshots                    |
| [Architecture decisions](adr.md)                                | Revisiting a foundational decision                                                   |
| [Scope and next work](parity-plan.md)                           | Choosing work, a tier or a batch, or checking unresolved requirements                |

The animation system defines the accepted v2 target and identifies the existing implementation as
the migration baseline. The tracker holds the remaining work; a task there is not a delivered API.
Component source, registry metadata, public MDX and executable checks must continue to agree on what
actually ships. Proposed recipes, shared primitives and capability metadata enter those outputs only
with their implementation and evidence. ADR-020 records the partial supersession of older animation
decisions; their historical wording does not establish a second target contract.

ADR-021 requires an individual motion design for every component. Global style provides direction;
the execution contract remains mandatory. Target part-level designs live centrally under
`motion/components/<id>.md`, one file per current UI/block id, with common parameter assignments in
`motion/presets.md`. Public MDX continues to describe delivered behavior, not these pending targets.

ADR-023 supersedes conflicting performance-stage requirements (including ADR-022): intended v2
effects and full-library functional migration come first; numeric cost/workload budgets are advisory
and adjustable with bounded work and correctness retained. Separate post-migration performance
assessment, budget redesign, optimization and acceptance; historical failures remain unresolved.
See animation-system §7 and its rollout plan before interpreting older budget wording.

Keep rules in their owning document and link to them. Update future work by replacing resolved items,
not appending completion logs. Add no handoff, evidence or archive directory here. Test inputs belong
in `tests/fixtures/`; generated audit reports, traces and screenshots belong in ignored `.cache/`.
Never delete a fixture needed by a regression test as part of documentation cleanup.
