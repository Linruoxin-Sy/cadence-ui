import { copyFile, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, ".cache/react19-consumer");
await mkdir(target, { recursive: true });
await cp(path.join(root, "registry/cadence"), path.join(target, "registry/cadence"), { recursive: true });
for (const file of ["package.json", "index.html", "vite.config.mjs"])
  await copyFile(path.join(root, "tests/fixtures/react19-consumer", file), path.join(target, file));
await copyFile(path.join(root, "tests/fixtures/react19-consumer/main.tsx.txt"), path.join(target, "main.tsx"));
console.log(target);
