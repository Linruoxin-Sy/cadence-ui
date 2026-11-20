/**
 * The canonical order of the `items` array in `registry.json`.
 *
 * Entries are written in registry id order, so adding a component lands in one place everyone can
 * predict: two branches that add different ids no longer compete for the same region, and a conflict
 * is resolved mechanically by taking both entries and rerunning `pnpm registry:build` (ADR-025).
 * `scripts/new-item.mjs` inserts at the same position, and `scripts/check-registry.mjs` fails when
 * the committed file disagrees, so insertion order cannot drift back in.
 *
 * The comparison is ascending code-unit order, not `localeCompare`: ICU collation depends on the
 * build and the locale, so a committed artifact would otherwise differ per machine.
 */

/** Ascending code-unit order of two registry ids. */
export function compareItemNames(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** A copy in canonical order; the argument is never mutated. */
export function sortRegistryItems(items) {
  return [...items].sort((left, right) => compareItemNames(left.name, right.name));
}

/**
 * Problems for the first out-of-order neighbours, one line each.
 *
 * The report names the pair rather than printing the whole order: a contributor has to know which
 * entry is in the wrong place after a merge, not re-read 80 item names.
 */
export function registryOrderProblems(items, surface = "registry.json") {
  const problems = [];
  for (let index = 1; index < items.length; index++) {
    if (compareItemNames(items[index - 1].name, items[index].name) <= 0) continue;
    problems.push(
      `${surface}: item "${items[index].name}" follows "${items[index - 1].name}", which sorts after it — write items in registry id order and let \`pnpm registry:build\` do it (ADR-025)`,
    );
  }
  return problems;
}

/** Problems for repeated ids. Taking both sides of a conflict must not be able to add two of one item. */
export function duplicateItemProblems(items, surface = "registry.json") {
  const problems = [];
  const seen = new Map();
  for (const [index, item] of items.entries()) {
    if (!seen.has(item.name)) {
      seen.set(item.name, index);
      continue;
    }
    problems.push(`${surface}: duplicate item "${item.name}" (entries ${seen.get(item.name)} and ${index}) — keep one`);
  }
  return problems;
}

/** Index of the top-level `items` array's opening bracket. */
function itemsArrayStart(text) {
  const anchor = /"items"\s*:\s*\[/.exec(text);
  if (!anchor) throw new Error('registry.json has no top-level "items" array');
  return anchor.index + anchor[0].length - 1;
}

/**
 * Slice the `items` array into one text block per entry.
 *
 * Formatting is not ours to decide: `registry.json` is a Biome-formatted file (`pnpm lint` gates it),
 * and re-serialising it would expand every `["a", "b"]` into six lines. Moving whole blocks keeps the
 * reorder to the entries themselves, so a rebuild on a merged conflict changes nothing else.
 */
function itemBlocks(text) {
  const open = itemsArrayStart(text);
  const blocks = [];
  let depth = 1;
  let inString = false;
  let start = open + 1;
  for (let index = open + 1; index < text.length; index++) {
    const character = text[index];
    if (inString) {
      if (character === "\\") index++;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "[" || character === "{") {
      depth++;
      continue;
    }
    if (character === "}" || character === "]") {
      depth--;
      if (depth === 0) {
        blocks.push(text.slice(start, index));
        return { head: text.slice(0, open + 1), blocks, tail: text.slice(index) };
      }
      continue;
    }
    if (character === "," && depth === 1) {
      blocks.push(text.slice(start, index));
      start = index + 1;
    }
  }
  throw new Error('registry.json: unterminated "items" array');
}

/**
 * The same file with its `items` entries in `orderedItems` order and everything else untouched.
 *
 * `currentItems` is the parsed file order **in file order**, which is how the blocks are matched to
 * names. Each block keeps its own internal formatting; only its position and the surrounding
 * indentation are normalised.
 */
export function reorderItemsText(text, currentItems, orderedItems) {
  const { head, blocks, tail } = itemBlocks(text);
  if (blocks.length !== currentItems.length) {
    throw new Error(
      `registry.json: parsed ${currentItems.length} items but found ${blocks.length} blocks — refusing to reorder an unparsable file`,
    );
  }
  if (!orderedItems.length) throw new Error("registry.json: refusing to write an empty items array");
  const position = new Map(currentItems.map((item, index) => [item.name, index]));
  const body = orderedItems
    .map((item, index) => {
      const block = blocks[position.get(item.name)];
      if (block === undefined) throw new Error(`registry.json: no entry text for "${item.name}"`);
      const last = index === orderedItems.length - 1;
      return `\n    ${block.trim()}${last ? "" : ","}`;
    })
    .join("");
  return `${head}${body}\n  ${tail}`;
}
