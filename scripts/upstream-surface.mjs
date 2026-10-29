/**
 * Reads the public surface of a component file: the names it exports and the
 * `data-slot` values it renders.
 *
 * Both sides of the parity check go through here — shadcn's source and ours — so
 * the comparison is apples to apples. This is deliberately a light regex pass,
 * not a TypeScript parse: every upstream file exports through either a trailing
 * `export { … }` block or an `export function`, and `data-slot` is always a
 * string literal. `scripts/check-registry.mjs` uses the same approach for export
 * uniqueness.
 */

/**
 * Strips block comments before any extraction. Doc comments legitimately mention
 * `data-slot="tooltip-content"` while explaining a variant, and that is not a slot
 * the file renders.
 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

export function extractExports(source) {
  const names = new Set();
  for (const block of stripComments(source).matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const entry of (block[1] ?? "").split(",")) {
      const cleaned = entry.replace(/\btype\b/g, "").trim();
      if (!cleaned) continue;
      names.add(
        cleaned
          .split(/\s+as\s+/)
          .pop()
          .trim(),
      );
    }
  }
  for (const match of stripComments(source).matchAll(
    /export\s+(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z0-9_]+)/g,
  )) {
    if (match[1]) names.add(match[1]);
  }
  return [...names].sort();
}

export function extractSlots(source) {
  const body = stripComments(source);
  const slots = new Set();
  for (const match of body.matchAll(/data-slot="([^"]+)"/g)) if (match[1]) slots.add(match[1]);
  // `useRender({ state: { slot: "badge" } })` renders data-slot from state, not JSX.
  for (const match of body.matchAll(/\bslot:\s*"([^"]+)"/g)) if (match[1]) slots.add(match[1]);
  return [...slots].sort();
}
