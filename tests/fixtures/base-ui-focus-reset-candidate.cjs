// Isolated upstream candidate, deliberately never imported by product code.
// A site-only dependency patch would not follow copied registry items into a
// consumer's project. Passing this candidate is not a distributed-library fix.
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");

const upstreamSha = "e5dfd11767a4928fc19479ba3d3e047f1a74a93cc71525fcdd5da596348cd6bc";
const candidateSha = "714d04d13b0b2e154e9e28393a822c5fc4032f72bbbeb16ddd1b727cbb2f6282";
const sha = (source) => createHash("sha256").update(source).digest("hex");

function transformFocusReset(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  assert.equal(sha(normalized), upstreamSha, "Candidate requires the exact Base UI 1.9.0 ESM hook");
  const needle = "if (!enabled) {\n      return undefined;\n    }";
  assert.equal(normalized.split(needle).length - 1, 2);
  // Once the interaction is disabled, its onBlur/onMouseLeave handlers no
  // longer run. Their stale dismissal block must not survive re-enabling.
  const result = normalized.replace(
    needle,
    "if (!enabled) {\n      blockFocusRef.current = false;\n      blockedReferenceRef.current = null;\n      return undefined;\n    }",
  );
  assert.equal(sha(result), candidateSha);
  return result;
}

module.exports = transformFocusReset;
module.exports.upstreamSha = upstreamSha;
module.exports.candidateSha = candidateSha;
