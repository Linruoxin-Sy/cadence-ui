/**
 * Content identity for one registry payload (ADR-025).
 *
 * The hash answers "did *this* item's distributed bytes change?" — not "which commit built it?".
 * It therefore covers only the item's own inputs: its files on disk (with their install targets), the
 * docs body it distributes and its metadata. Everything else is either derived from those (payload
 * JSON, `/r/<id>.md`, `llms.txt`) or shared across items (`public/r/registry.json`), so one component
 * edit leaves every other payload byte-identical.
 *
 * This module holds the function the build *and* the freshness check would use, so the two can
 * never disagree about what "the same content" means.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const LABEL = "cadence-payload-v1";

/**
 * JSON with object keys sorted at every depth, so key order in `registry.json` cannot change a hash.
 * Arrays keep their authored order: `files` order and `meta.motion` order are meaningful input.
 */
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** `meta` as it is hashed: the payload metadata without the hash it is about to receive. */
export function hashableMeta(meta) {
  if (!meta) return null;
  const { sourceSha: _ignored, ...rest } = meta;
  return rest;
}

async function fileDigest(root, file) {
  try {
    return createHash("sha256")
      .update(await readFile(path.join(root, file)))
      .digest("hex");
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

/**
 * 8 hex characters over the item's files (path, target and content digest, sorted by path), its
 * `docs` body and its metadata without `sourceSha`. Same inputs, same output, on any machine.
 */
export async function componentSha(root, item) {
  const hash = createHash("sha256");
  hash.update(`${LABEL}\n`);
  const files = [...(item.files ?? [])].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const file of files) {
    hash.update(`file:${file.path}->${file.target ?? ""}\n${await fileDigest(root, file.path)}\n`);
  }
  hash.update(
    `docs:${createHash("sha256")
      .update(item.docs ?? "")
      .digest("hex")}\n`,
  );
  hash.update(`meta:${stableJson(hashableMeta(item.meta))}\n`);
  return hash.digest("hex").slice(0, 8);
}
