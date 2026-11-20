import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * `public/llms*.txt` are build output, not tracked files (ADR-025). Tests may read them, but they
 * must exist because `pnpm registry:build` wrote them — a missing file is a missing build, and the
 * failure should say so instead of surfacing a bare ENOENT.
 */
function missing(file: string) {
  return new Error(`${file} is generated, not committed. Run \`pnpm registry:build\` before this test (ADR-025).`);
}

function isMissing(error: unknown) {
  return (error as { code?: string }).code === "ENOENT";
}

export async function readBuiltFile(root: string, file: string) {
  try {
    return await readFile(path.join(root, file), "utf8");
  } catch (error) {
    if (isMissing(error)) throw missing(file);
    throw error;
  }
}

export function readBuiltFileSync(root: string, file: string) {
  try {
    return readFileSync(path.join(root, file), "utf8");
  } catch (error) {
    if (isMissing(error)) throw missing(file);
    throw error;
  }
}
