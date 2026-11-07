# Design and contributor documentation

This directory contains current concepts, contracts and future work. User-facing documentation lives
in `content/docs/` and `content/components/`; component inventory and install metadata live in
`registry.json`. Git history is the record of completed work, measurements and handoffs.

| Read                                                            | Before                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Overall design](overall-design.md)                             | Changing architecture, install paths, shared code, APIs, themes or the build |
| [Animation system](animation-system.md)                         | Changing tokens, recipes, modes, engine integration or motion tests          |
| [Individual component motion](motion/README.md)                 | Designing or reviewing one component's parts, choreography and six capabilities |
| [Motion presets and bindings](motion/presets.md)                 | Selecting component rhythm or changing shared parameter assignments          |
| [Animation system rollout](animation-system-plan.md)            | Choosing a v2 migration task, its dependencies or its acceptance evidence    |
| [Site and distribution](documentation-site-and-distribution.md) | Changing MDX, previews, site controls, registry HTTP or snapshots            |
| [Architecture decisions](adr.md)                                | Revisiting a foundational decision                                           |
| [Scope and next work](parity-plan.md)                           | Choosing work, a tier or a batch, or checking unresolved requirements        |

The animation system defines the accepted v2 target and identifies the existing implementation as
the migration baseline. The rollout plan records remaining work; it is not a list of delivered APIs.
Component source, registry metadata, public MDX and executable checks must continue to agree on what
actually ships. Proposed recipes, shared primitives and capability metadata enter those outputs only
with their implementation and evidence. ADR-020 records the partial supersession of older animation
decisions; their historical wording does not establish a second target contract.

ADR-021 requires an individual motion design for every component. Global style provides direction;
the execution contract remains mandatory. Target part-level designs live centrally under
`motion/components/<id>.md`, one file per current UI/block id, with common parameter assignments in
`motion/presets.md`. Public MDX continues to describe delivered behavior, not these pending targets.

Keep rules in their owning document and link to them. Update future work by replacing resolved items,
not appending completion logs. Add no handoff, evidence or archive directory here. Test inputs belong
in `tests/fixtures/`; generated audit reports, traces and screenshots belong in ignored `.cache/`.
Never delete a fixture needed by a regression test as part of documentation cleanup.
