## What changed

<!-- One or two sentences. Link the migration task or issue. -->

## Motion contract review

Answer these for every action row you add or change, before writing source:

- **Host:** which part and DOM anchor carries the written property?
- **Owner:** which execution instance owns it (`local`, `inherited`, `composed`, `native`)?
- **Relationship:** is that local or cross-instance, and does the contract say so?

`node scripts/motion-probe.mjs --id <id>` prints the plan the gates will derive; a `(no plan)` on a
non-native binding means the host is unresolved. See
[docs/motion/evidence-recipes.md](docs/motion/evidence-recipes.md) when a record will not join.

## Verification

- [ ] Declared recipes = source calls = registry metadata = MDX frontmatter and Motion contract table.
- [ ] `pnpm check:static` (typecheck, lint, registry and parity).
- [ ] Scoped suite: `pnpm test:local tests/components/<id>.test.tsx`.
- [ ] Shared hits: `pnpm exec vitest run <file>` for each `grep -rl <id> tests/` path.
- [ ] Gate suites when contracts, presets, metadata, MDX templates or gate scripts changed:
  `pnpm test:gate`.
- [ ] One full `pnpm test` per change set, in the background. Paste the file/test counts and say
  explicitly whether any failure is a known entry in
  [docs/testing-quarantine.md](docs/testing-quarantine.md).
- [ ] No test was skipped, excluded or edited to hide a failure.
- [ ] Native/API/accessibility behavior and all three modes are covered; browser, buildId and
  screenshot evidence is stated as done or explicitly left unresolved.

## Notes for review

<!-- Tradeoffs, known gaps, and work deliberately left out. Do not describe planned work as shipped. -->
