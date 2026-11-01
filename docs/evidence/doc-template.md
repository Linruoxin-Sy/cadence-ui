# Tier-specific template evidence (2026-11-02)

Authority: documentation-site-and-distribution §2. The old twelve-area table included
site title/preview, while AGENTS/CONTRIBUTING said nine/twelve sections and actual
bodies had variable flat examples. This was a real documentation and enforcement gap.
The resolution keeps tier-specific membership, not a total heading quota, and requires
responsiveness/performance at every tier. Inventory: doc-template-inventory.json.

All 20 T0 docs were reviewed: Resizable already had split coverage; the other 19 gain
combined sections explaining real parent sizing, overflow, native/SSR and runtime costs.
Card documents optional ResizeObserver, Field its container query, Textarea CSS sizing,
ScrollArea Base UI interaction and Table no virtualization. The 4 KiB limit measures
own shipped source gzip, not installed dependency or application bundle bytes. T1
Button gains 6 KiB-source-budget/press feedback coverage. No T0 zero-JS claim is made.
Select/Combobox gain caller data ownership, and two menu API groups gain inline-code
part names. No registry source, API, motion recipe, dependency or pin changes.

`scripts/doc-template.mjs` is called from build-registry and check-registry; pnpm check
already runs the latter. new-item validates before writing and emits legal headings
for all T0–T5, including --input ownership. Stubs remain intentionally incomplete
implementations, not install-ready new components. New input IDs must be added to the
explicit INPUT_DOCS set when implemented; --input supplies their initial section.

`tests/lib/doc-template.test.tsx`: 26 tests. Positive controls cover all 58 actual
bodies, flexible extra examples, API parts, comments and fences. Real check-registry
processes reject missing required/performance/ownership/keyboard sections, opening
and later ordering defects, Examples wrappers, nested/H1/deep/non-part API headings,
Setext/HTML headings, duplicate/empty sections and combined+split duplicates with
source-path diagnostics. A real registry:build process rejects a missing section before
writing. Six actual new-item processes create each tier in isolated fixtures; the real
check entry accepts their template (while correctly rejecting incomplete payload/source
stubs), then rejects a removed performance section. Retention inventory is copied into
fixtures; retained artifacts are never modified.

Representative Card/Input/Resizable/Button/Dialog/DataTable/Attachment MDX compiles
through next-mdx-remote with the site's GFM plugin and renders to HTML with real tables
and required headings. This is content/render validation, not a new browser layout,
whole-library accessibility, animation or performance certification.

Targeted template + existing motion-docs suites: 46/46, 2 files, 16.05s, exit0
(.cache/doc-template-tests.log). The initial HTML-heading guard incorrectly counted
Card's inline-code h3 example; it now excludes inline code and the full positive
inventory passes. Existing 58-doc recipe checks and 38 animated runtime-helper suites
remain required. Full pnpm check: 593/593 tests, 81/81 files, 82.35s, exit0
(.cache/doc-template-check.log), including types/lint/registry/parity and the mandatory
38-suite runtime-helper reporter. Source/payload commits and final-source repeat are
recorded in the handoff.

Initial JS remains the preceding measured 291423 gzip bytes /23 scripts against
120000 OPEN. No site client code changed and no new budget/browser measurement is
claimed here. ADR-009/016, the full prototype adoption gate and all global audits remain.
