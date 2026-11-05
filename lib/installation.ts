import { readFile } from "node:fs/promises";
import path from "node:path";

export async function getInstallationFiles(id: string) {
  const payload = JSON.parse(await readFile(path.join(process.cwd(), "public", "r", `${id}.json`), "utf8")) as {
    files: Array<{ target: string; content: string }>;
  };
  return payload.files;
}
