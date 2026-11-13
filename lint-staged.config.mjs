/**
 * Formats and lints only the files a commit contains, so the hook stays cheap and
 * `pnpm check` remains the gate that decides whether a change may merge.
 *
 * `--write` repairs formatting and import order and lint-staged re-stages the result;
 * `--no-errors-on-unmatched` and `--files-ignore-unknown` keep a staged file that
 * Biome's `files.includes` excludes (registry payloads, MDX) from failing the commit.
 */
export default {
  "*.{js,mjs,cjs,jsx,ts,tsx,json,jsonc,css,md}": [
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
  ],
};
