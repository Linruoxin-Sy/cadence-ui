// One fresh authority per Vitest coordinator process. The compiler injects its
// key into private helper module bindings in workers; it is never a test prop,
// environment variable, persisted report or exported worker signing API.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const key = Symbol.for("cadence.motion-evidence.coordinator");
globalThis[key] ??= randomBytes(32).toString("hex");
export const motionEvidenceKey = globalThis[key];
export function verifiedMotionEvidence(envelopes, test, kind) {
  const rows = [];
  for (const envelope of envelopes ?? []) {
    if (
      envelope.test !== test ||
      envelope.kind !== kind ||
      !Array.isArray(envelope.rows) ||
      typeof envelope.signature !== "string" ||
      !/^[a-f\d]{64}$/.test(envelope.signature)
    )
      continue;
    const payload = JSON.stringify({ test, kind, rows: envelope.rows });
    const expected = createHmac("sha256", motionEvidenceKey).update(payload).digest();
    const received = Buffer.from(envelope.signature, "hex");
    if (received.length === expected.length && timingSafeEqual(expected, received)) rows.push(...envelope.rows);
  }
  return rows;
}
