import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const digest = (body) => createHash("sha256").update(body).digest("hex");
export const treeDigest = (files) =>
  digest(JSON.stringify(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));

export async function verifySnapshots(root) {
  const dir = path.join(root, "public/r/snapshots");
  const entries = await readdir(dir).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const retained = JSON.parse(
    await readFile(path.join(root, "registry-snapshots.json"), "utf8").catch((error) => {
      if (error.code === "ENOENT") return "[]";
      throw error;
    }),
  );
  if (JSON.stringify([...retained].sort()) !== JSON.stringify([...entries].sort()))
    throw new Error("Retained snapshot inventory changed");
  for (const id of entries) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error(`Invalid snapshot directory: ${id}`);
    const folder = path.join(dir, id);
    const manifest = JSON.parse(await readFile(path.join(folder, "manifest.json"), "utf8"));
    if (treeDigest(manifest.files) !== id) throw new Error(`Snapshot identity mismatch: ${id}`);
    const actual = (await readdir(folder)).filter((name) => name !== "manifest.json").sort();
    if (JSON.stringify(actual) !== JSON.stringify(Object.keys(manifest.files).sort()))
      throw new Error(`Snapshot inventory mismatch: ${id}`);
    for (const [name, hash] of Object.entries(manifest.files)) {
      if (!/^[a-z0-9-]+\.(json|md)$/.test(name)) throw new Error(`Invalid snapshot file: ${name}`);
      if (digest(await readFile(path.join(folder, name))) !== hash)
        throw new Error(`Frozen snapshot changed: ${id}/${name}`);
    }
  }
}

// Explicit publication preparation only. Normal builds verify and retain, never freeze.
export async function freezeSnapshot(root) {
  await verifySnapshots(root);
  const dir = path.join(root, "public/r");
  const bodies = new Map();
  for (const name of (await readdir(dir)).sort()) {
    if (/^[a-z0-9-]+\.(json|md)$/.test(name)) bodies.set(name, await readFile(path.join(dir, name)));
  }
  const files = Object.fromEntries([...bodies].map(([name, body]) => [name, digest(body)]));
  const id = treeDigest(files);
  const folder = path.join(dir, "snapshots", id);
  await mkdir(folder, { recursive: true });
  for (const [name, body] of bodies) {
    try {
      await writeFile(path.join(folder, name), body, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  await writeFile(path.join(folder, "manifest.json"), `${JSON.stringify({ files }, null, 2)}\n`, { flag: "wx" }).catch(
    (error) => {
      if (error.code !== "EEXIST") throw error;
    },
  );
  const retained = JSON.parse(await readFile(path.join(root, "registry-snapshots.json"), "utf8").catch(() => "[]"));
  await writeFile(
    path.join(root, "registry-snapshots.json"),
    `${JSON.stringify([...new Set([...retained, id])], null, 2)}\n`,
  );
  await verifySnapshots(root);
  return id;
}
