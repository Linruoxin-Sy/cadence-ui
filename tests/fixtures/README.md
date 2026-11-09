# Executable test inputs

preview-variants.json defines the page/variant applicability consumed by the browser suite.
popup-motion.tsx renders actual registry popups for B4's live mode/cancellation/focus checks.
The Playwright helper compiles this input and serves it through intercepted fixture requests,
using production CSS. Its native mode input emits change without an outside press: production
header presses may legitimately dismiss a non-modal popup. Production routes retain their separate
entry/exit, keyboard, SSR/no-JS, examples, visual and accessibility checks. This fixture certifies no
complete-route performance or SSR budget.
motion/*.json contain only the old source and hashes needed to reproduce clock/geometry/flight
regressions. They are intentionally defective specimens, never installable registry source.
Keep regression inputs stable; update them only when the corresponding test contract changes.
Generated samples, logs, traces and audit output belong in ignored .cache/audits, not here or docs.

motion-target/ contains a small authored target reference graph and drift mutations. Tests exercise
Markdown parsing, part/capability/preset closure, property-scope mistakes and fail-closed migration.
These fixtures neither install planned recipes nor certify runtime v2 behaviour.

motion-coverage/ contains negative installed-ownership declarations. They reject unknown/missing
schema, relationships and owners, false inapplicable effects and placeholder reasons. The tests
keep target assessments separate from exact delivered forms and actual live integration evidence.
