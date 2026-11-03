# Executable test inputs

preview-variants.json defines the page/variant applicability consumed by the browser suite.
motion/*.json contain only the old source and hashes needed to reproduce clock/geometry/flight
regressions. They are intentionally defective specimens, never installable registry source.
Keep regression inputs stable; update them only when the corresponding test contract changes.
Generated samples, logs, traces and audit output belong in ignored .cache/audits, not here or docs.
