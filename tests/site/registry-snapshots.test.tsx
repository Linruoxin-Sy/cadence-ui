import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { freezeSnapshot, verifySnapshots } from "../../scripts/registry-snapshots.mjs";

test("explicit snapshots survive changed aliases, repeat freezes and reject corruption", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cadence-freeze-"));
  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(root, "public/r"), { recursive: true });
    const alias = path.join(root, "public/r/button.json");
    await writeFile(alias, '{"name":"button","docs":"old"}');
    const old = await freezeSnapshot(root);
    expect(await freezeSnapshot(root)).toBe(old);
    await writeFile(alias, '{"name":"button","docs":"new"}');
    const next = await freezeSnapshot(root);
    expect(next).not.toBe(old);
    const frozen = path.join(root, "public/r/snapshots", old, "button.json");
    expect(await readFile(frozen, "utf8")).toContain('"old"');
    await verifySnapshots(root);
    await writeFile(frozen, "corrupt");
    await expect(verifySnapshots(root)).rejects.toThrow("Frozen snapshot changed");
    await rm(path.join(root, "public/r/snapshots", old), { recursive: true });
    await expect(verifySnapshots(root)).rejects.toThrow("Retained snapshot inventory changed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
