# Evidence recipes for the motion gates

Status: field notes from migrated components. This file records the source shapes that produce a
joinable runtime record; it does not change any contract. [README.md](README.md) owns the reference
schema, [presets.md](presets.md) the parameters, and [the animation system](../animation-system.md) the
common execution rules. Where they disagree, they win.

A v2 contract is accepted only when a record produced by the running component joins the declared
action: same item, binding, preset, form, mode, slot and site. The effect is rarely the expensive part.
The expense is discovering, one gate failure at a time, which shape of source emits a joinable record at
all. The recipes below are the shapes that do. Snippets are illustrative shapes, not copyable component
source; the real components keep their native props, refs and accessibility paths.

## How to read a failure

Start from the text, not the design. `no source-bound action plan`, `explicit unambiguous physical
regions required`, `presentation ... unmatched` and `live policy region has no target action` are
different defects with different fixes; the message names the field that disagreed. Before changing the
component, run `node scripts/motion-probe.mjs --id <id>` and compare the plan's `site`, slot and property
subset with what the record claims. When the plan is already ambiguous, no amount of runtime work makes
the record join.

## 1. A text or number part must be its own component

- **Symptom**: the DOM is correct, the animation runs, and the presentation record still does not match
  the declared part.
- **Cause**: the parent calls a helper that returns JSX. The element exists, but its origin export is the
  parent's, so `origin.exports` cannot name the part the contract references.
- **Failing shape**:

  ```tsx
  // The span is created by Row, so its origin export is Row, not ItemTitle.
  function Row({ title }: { title: string }) {
    return <span data-slot="item-title">{title}</span>;
  }
  ```

- **Passing shape**: export the part as a component and render it as an element.

  ```tsx
  function ItemTitle({ children }: { children: React.ReactNode }) {
    return <span data-slot="item-title">{children}</span>;
  }
  function Row({ title }: { title: string }) {
    return <ItemTitle>{title}</ItemTitle>;
  }
  ```

- **Prove it**: the record's `origin.exports` names `ItemTitle`, and `expectV2MotionAction` matches the
  declared `item.text.replace`. The record follows the element, not the value.

## 2. Put the presence provider inside the row

- **Symptom**: the row's own record reports the exit phase, or `present=false`, on an entrance.
- **Cause**: a provider wrapped around the row instead of inside it. The row is then outside the subtree
  that receives the new presence value, so its `form` is the previous commit's.
- **Failing shape**:

  ```tsx
  // The row host is outside the provider; it never sees the new presence value.
  <MotionPresentation scope={scope}>
    <Row />
  </MotionPresentation>
  ```

- **Passing shape**: the provider is inside the row component and wraps only the host it controls.

  ```tsx
  function Item() {
    return (
      <MotionPresentation scope={scope}>
        <ItemHost data-slot="item" />
      </MotionPresentation>
    );
  }
  ```

- **Prove it**: assert the row's form on the first commit, not only after a re-render. A later assertion
  can observe the previous phase and look correct.

## 3. `form` is the last committed phase, not the intended one

- **Symptom**: a correct effect is recorded under `exit` (or the reverse) in one mode.
- **Cause**: `form` describes the last commit that reached the node. A same-tick state change, an early
  unmount or a delayed provider update rewrites it after the effect you meant to prove.
- **Shape**: make the phase change happen in the commit that also renders the content. Prove it by
  reading the record after the interaction, not by reasoning about the call order.
- **Prove it**:

  ```tsx
  await expectV2MotionAction("item", "item.root.exit", "full", () => view.rerender(draw(false)));
  ```

  The callback performs the interaction; the helper reads the record after that commit. A record read
  before the callback is evidence about a different phase.

## 4. Overriding `data-slot` means remapping `regions`

- **Symptom**: the record exists but is filtered out of the action; the part is "unused" or the region
  resolves to nothing.
- **Cause**: `regions` names literal host slots. A part that rewrites `data-slot` (an item separator, for
  instance) no longer matches the slot the region lists.
- **Failing shape**:

  ```jsonc
  // contract says the rule lives in the row slot
  "regions": { "separator": ["item"] }
  ```

  ```tsx
  // source writes a different literal slot
  <div data-slot="item-separator" />
  ```

- **Passing shape**: keep the region in step with the literal slot the part writes.

  ```jsonc
  "regions": { "separator": ["item-separator"] }
  ```

- **Prove it**: the probe's `slot/parts` column for `item.separator.enter` names `item-separator`, and the
  record is not filtered out of the action. A region is a physical claim, so it must name the slot that
  is actually on the node.

## 5. jsdom has no layout

- **Symptom**: a geometry action passes review, then reports no site or no properties.
- **Cause**: measurement in jsdom returns zeros. Any action whose site depends on measured geometry is
  not certifiable there. `getBoundingClientRect()` and range rectangles are all zero unless a test fakes
  them; a fake rectangle proves the writer, not the browser layout.
- **Shape**: state the geometry action through its parameter form plus the sibling or box change that a
  test can observe; leave measured geometry to browser evidence and record that obligation rather than
  claiming it.
- **Prove it**: assert the parameter/form, the destination/settled style and the preserved native path;
  record the browser measurement as unresolved in the handoff. Do not write a zero-rectangle assertion
  and call the geometry verified.

## 6. A parent driving a child's transform is not a local action

- **Symptom**: the transform is visibly correct and the local record never joins, or joins with a
  different owner instance.
- **Cause**: `layout.move` and sibling offsets are written by the parent, while the record's owner is the
  child. `owner.instance === host.instance` never holds.
- **Shape**: declare the binding on the instance that writes the property (inherited or composed), or
  move the write to the owning part. Do not relabel a parent write as a default action of the child.
- **Prove it**: the probe plan's `site` and the record's owner refer to the same instance. If the write
  lives on a parent, the action is inherited/composed; a `default` action with a child owner cannot join.

## 7. `readabilityGate` must agree with `immediate`

- **Symptom**: a gated colour owner fluctuates between immediate and 0.16 s, and the family is recorded
  as a conflict.
- **Cause**: the gate is a runtime predicate read at commit time, but the insertion-effect fast path in
  `useStateColor` writes `transition-duration` from a gate-free clock on every render, overwriting a
  gated `0s`.
- **Failing shape**:

  ```tsx
  useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: (host) => !host.textContent,
  });
  ```

- **Passing shape**: decide the same condition eagerly and pass it as `immediate`, so both paths agree.

  ```tsx
  const text = paintsText(children);
  useStateColor(ref, cm, ["color"], {
    readability: "verified",
    immediate: text,
    readabilityGate: (host) => !host.textContent,
  });
  ```

- **Prove it**: the owner's `transition-duration` is `0s` on every commit where the gate is false; it does
  not flip to the token duration between commits. Treat the gate as an additional reason to be immediate,
  not as a second clock source.

## 8. Read the gate in this order, not end to end

- `scripts/motion-targets.mjs` — reference schema: parts, anchors, action chains, preset/form pairs.
- `scripts/motion-adoption.mjs` — declared form → installed owner and relationship.
- `scripts/motion-v2.mjs` — physical host, region, property subset and site.
- One migrated component's test — the record shapes that actually pass.

Reading the six design documents end to end costs more than those three scripts and one test, and the
scripts answer "what will this record have to say". Use `motion-probe` for the plan and grep for a
specific rule when a message names one.

## Adding a recipe

Add an entry only when a shape cost a real retreat: a contract, source, metadata and test corrected
because the gate could not certify an otherwise correct effect. Write it as symptom, cause, failing
shape, passing shape, and how to prove it. Do not add timing reports, task records or per-component
delivery notes; those belong in Git history and `.cache/`.
