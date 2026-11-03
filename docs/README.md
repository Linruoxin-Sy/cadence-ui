# Design and contributor documentation

This directory contains current concepts, contracts and future work. User-facing documentation lives
in `content/docs/` and `content/components/`; component inventory and install metadata live in
`registry.json`. Git history is the record of completed work, measurements and handoffs.

| Read                                                            | Before                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Overall design](overall-design.md)                             | Changing architecture, install paths, shared code, APIs, themes or the build |
| [Animation system](animation-system.md)                         | Changing tokens, recipes, modes, engine integration or motion tests          |
| [Site and distribution](documentation-site-and-distribution.md) | Changing MDX, previews, site controls, registry HTTP or snapshots            |
| [Architecture decisions](adr.md)                                | Revisiting a foundational decision                                           |
| [Scope and next work](parity-plan.md)                           | Choosing work, a tier or a batch, or checking unresolved requirements        |

Keep rules in their owning document and link to them. Update future work by replacing resolved items,
not appending completion logs. Add no handoff, evidence or archive directory here. Test inputs belong
in `tests/fixtures/`; generated audit reports, traces and screenshots belong in ignored `.cache/`.
Never delete a fixture needed by a regression test as part of documentation cleanup.
