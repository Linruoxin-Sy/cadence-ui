# Animation system implementation plan

The execution plan is not kept in this file. It lives in the
[issue tracker](https://github.com/Linruoxin-Sy/cadence-ui/issues?q=is%3Aissue%20label%3Amotion-v2), one
epic per phase, each listing child issues with their dependencies and acceptance criteria:

- [#36 contract-to-tooling alignment](https://github.com/Linruoxin-Sy/cadence-ui/issues/36)
- [#37 shared capabilities and the four public primitives](https://github.com/Linruoxin-Sy/cadence-ui/issues/37)
- [#38 the five pilots](https://github.com/Linruoxin-Sy/cadence-ui/issues/38)
- [#39 catalogue rollout by ownership family](https://github.com/Linruoxin-Sy/cadence-ui/issues/39)
- [#40 functional distribution, then performance governance](https://github.com/Linruoxin-Sy/cadence-ui/issues/40)

Change the plan by editing its issue, not by growing this page.

## What stays in this directory

This directory holds the concepts and contracts, not the schedule. [animation-system.md](animation-system.md)
is the target contract, [motion/README.md](motion/README.md) and
[motion/presets.md](motion/presets.md) are the per-component and shared-parameter designs, and
[parity-plan.md](parity-plan.md) records scope, compatibility tiers and catalogue-level future work.

Progress and evidence live in Git history and in the issue that closed the work. An issue marked done
is not a performance acceptance; ADR-023 separates functional migration completion from performance
governance. A design or a closed task never by itself makes a shipped component claim a capability it
does not execute.
