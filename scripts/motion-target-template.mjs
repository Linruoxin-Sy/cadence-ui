import { CAPABILITIES } from "./motion-targets.mjs";

/** Deliberately unfinished: scaffolding never invents applicability or proves a migration. */
export function motionTargetTemplate(id, title, part) {
  return `# ${title} motion contract

Status: target design; implementation and verification pending.

TODO: author the individual intent and native boundaries. Inherit the [shared contract](../README.md)
and [presets](../presets.md); these references do not declare installed recipes.

## Contract references

\`\`\`json motion-contract
${JSON.stringify({ schema: 1, target: "motion-v2", migration: "legacy", parts: { root: [`${id}#${part}`] } }, null, 2)}
\`\`\`

## Capability ownership

| Capability | Coverage and owner | References |
| --- | --- | --- |
${CAPABILITIES.map((name) => `| ${name} | TODO: assess applicability, actual owner and reason. | TODO |`).join("\n")}

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| TODO: real trigger and region | TODO | TODO | TODO | TODO: ${id}.root.phase → preset → recipe/form |

## Interruption and lifecycle

TODO: rapid revisions, reversal/reopen, close/unmount, native operation and live mode/zero-clock cancellation.

## Geometry and performance

TODO: measurement phase, axes, bounds, property ownership, immediate fallback and work limits.

## Acceptance scenarios

TODO: observable checks for the individual actions; design references alone never prove runtime behaviour.
`;
}

export function appendMotionIndex(markdown, id, title) {
  if (markdown.includes(`](components/${id}.md)`)) throw new Error(`motion index already contains ${id}`);
  const heading = "## 6. Maintenance and migration";
  if (!markdown.includes(heading)) throw new Error("motion index is missing its maintenance boundary");
  return markdown.replace(
    heading,
    `- [${title}](components/${id}.md) — newly scaffolded; author the individual contract.\n\n${heading}`,
  );
}
