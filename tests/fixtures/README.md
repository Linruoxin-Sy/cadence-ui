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
