import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

async function serve(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const parts = (await context.params).path;
  const frozen = parts.length === 3 && parts[0] === "snapshots" && /^[a-f0-9]{64}$/.test(parts[1] ?? "");
  const name = parts.at(-1) ?? "";
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if ((!frozen && parts.length !== 1) || !/^[a-z0-9-]+\.(json|md)$/.test(name)) return missing();
  try {
    const body = await readFile(path.join(process.cwd(), "public/r", ...parts));
    const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
    const headers = {
      "Content-Type": name.endsWith(".md") ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8",
      "Cache-Control": frozen ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
      ETag: etag,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    };
    const matches = request.headers
      .get("if-none-match")
      ?.split(",")
      .some((value) => value.trim().replace(/^W\//, "") === etag || value.trim() === "*");
    if (matches) return new Response(null, { status: 304, headers });
    return new Response(request.method === "HEAD" ? null : new Uint8Array(body), { headers });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return missing();
    throw error;
  }
}

export const GET = serve;
export const HEAD = serve;
