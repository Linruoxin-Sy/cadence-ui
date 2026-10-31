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

/** Reads a balanced bracket group whose opening character is at `start`. */
function readGroup(text, start) {
  const open = text[start];
  const close = { "{": "}", "(": ")", "[": "]" }[open];
  if (!close) return null;
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === open) depth += 1;
    else if (text[index] === close) {
      depth -= 1;
      if (depth === 0) return { body: text.slice(start + 1, index), end: index };
    }
  }
  return null;
}

/**
 * The `{ … }` groups a type expression adds at its top level: `X & { size?: A }`,
 * but not the object inside `Array<{ message?: string }>`.
 */
function topLevelGroups(text) {
  const groups = [];
  let angle = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "<") angle += 1;
    else if (char === ">") angle -= 1;
    else if (char === "{" && angle <= 0) {
      const group = readGroup(text, index);
      if (!group) continue;
      groups.push(group.body);
      index = group.end;
    }
  }
  return groups;
}

/** Splits on top-level commas, so `Pick<A, "b" | "c">` stays in one piece. */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if ("{[(".includes(char)) depth += 1;
    else if ("}])".includes(char)) depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * The props a component *declares*, per exported part:
 *
 *   { SelectTrigger: { size: '"default"', children: null }, … }
 *
 * A value is the default the signature writes, or `null` when the prop is
 * destructured without one. The type annotation is not resolved — most props come
 * from a Base UI type, which no regex can read.
 *
 * Why this is the surface worth comparing: exports and `data-slot` catch a rename,
 * and nothing else catches a prop upstream added or a default that moved. Cadence
 * destructures the props it acts on, so a prop with a default in both files is a
 * prop both components own, and their defaults must agree.
 */
export function extractProps(source) {
  const body = stripComments(source);
  const props = {};

  for (const match of body.matchAll(/(?:^|\n)\s*(?:export\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g)) {
    const name = match[1];
    const open = (match.index ?? 0) + match[0].length - 1;
    const params = readGroup(body, open);
    if (!params) continue;

    const text = params.body.trim();
    const declared = {};
    let typeText = "";

    if (text.startsWith("{")) {
      const destructured = readGroup(text, 0);
      if (!destructured) continue;
      for (const entry of splitTopLevel(destructured.body)) {
        if (entry.startsWith("...")) continue;
        // `name`, `name = default`, `name: local`, `name: local = default`.
        const parsed = entry.match(/^([A-Za-z0-9_$]+)\s*(?::\s*[A-Za-z0-9_$]+(?:\s*=\s*[\s\S]+)?|\s*=\s*[\s\S]+)?$/);
        if (!parsed) continue;
        const value = entry.slice(parsed[1].length);
        const equals = value.indexOf("=");
        declared[parsed[1]] = equals === -1 ? null : value.slice(equals + 1).trim();
      }
      typeText = text.slice(destructured.end + 1);
    } else {
      // `function Foo(props: X)` names no prop; only the inline type can add one.
      const colon = text.indexOf(":");
      typeText = colon === -1 ? "" : text.slice(colon + 1);
    }

    // Inline object members: `{ size?: "sm" | "default" }`, often after `&`. Only
    // groups at the top level count — `errors?: Array<{ message?: string }>` names
    // `errors`, not `message`.
    for (const group of topLevelGroups(typeText)) {
      for (const entry of splitTopLevel(group.replace(/;/g, ","))) {
        const parsed = entry.match(/^([A-Za-z0-9_$]+)\s*\??\s*:/);
        if (parsed && !(parsed[1] in declared)) declared[parsed[1]] = null;
      }
    }

    props[name] = declared;
  }

  return props;
}
