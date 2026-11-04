import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

// Use Next's existing image dependency; no separate asset runtime or package.
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const svg = await readFile(new URL("../public/favicon.svg", import.meta.url));
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}
await writeFile(new URL("../public/favicon.ico", import.meta.url), Buffer.concat([header, ...images]));
