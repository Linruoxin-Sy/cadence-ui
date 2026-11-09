import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkMotionCoverage,
  implementationOwner,
  motionCoverageProblems,
  motionMetadataProblems,
} from "../../scripts/motion-coverage.mjs";
import { migrationProblems } from "../../scripts/motion-migration.mjs";
import negatives from "../fixtures/motion-coverage/negative.json";

const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const button = registry.items.find((item: { name: string }) => item.name === "button");
const key = "feedback.press/one-shot";
const evidence = (owner: string) => ({
  references: {
    button: [
      { recipe: "feedback.press", form: "one-shot", file: `registry/cadence/${owner}/index.tsx`, via: [] as string[] },
    ],
  },
});

describe("minimal installed coverage", () => {
  it.each(negatives)("fails closed for $name", ({ field, value, error }) => {
    const item = structuredClone(button);
    if (["schema", "effects"].includes(field)) item.meta.motionCoverage[field] = value;
    else item.meta.motionCoverage.effects[key][0][field] = value;
    expect(motionCoverageProblems(item).join("\n")).toContain(error);
  });
  it("requires exact installed forms and rejects target capabilities as installed defaults", () => {
    expect(checkMotionCoverage(registry)).toEqual([]);
    const item = structuredClone(button);
    item.meta.motionCoverage.effects = {};
    expect(motionCoverageProblems(item)).toContain(`${key}: missing installed ownership`);
    item.meta.motionCoverage.effects["text.change/changed-runs"] = button.meta.motionCoverage.effects[key];
    expect(motionCoverageProblems(item).join("\n")).toContain("ownership without a declared recipe/form");
    item.meta.motionCoverage.available = true;
    expect(motionCoverageProblems(item)).toContain("unknown motionCoverage field");
  });
  it("requires every distinct reached owner and rejects empty, duplicate or conflicting ownership lists", () => {
    const item = structuredClone(button);
    item.registryDependencies = ["@cadence/other"];
    const implementations = evidence("button");
    implementations.references.button.push({
      recipe: "feedback.press",
      form: "one-shot",
      file: "registry/cadence/other/index.tsx",
      via: ["registry/cadence/button/index.tsx#Other"],
    });
    expect(checkMotionCoverage({ items: [item] }, implementations).join("\n")).toContain(
      "reached integration other missing ownership",
    );
    const owner = { ...item.meta.motionCoverage.effects[key][0], relationship: "inherited", owner: "other" };
    item.meta.motionCoverage.effects[key].push(owner);
    expect(checkMotionCoverage({ items: [item] }, implementations)).toEqual([]);
    item.meta.motionCoverage.effects[key].push({ ...owner, relationship: "composed" });
    expect(motionCoverageProblems(item).join("\n")).toContain("duplicate/conflicting integration owner");
    item.meta.motionCoverage.effects[key] = [];
    expect(motionCoverageProblems(item).join("\n")).toContain("nonempty integration ownership list required");
  });
  it("distinguishes the local adapter from an inherited selected import and the shared lib executor", () => {
    expect(checkMotionCoverage({ items: [button] }, evidence("button"))).toEqual([]);
    expect(checkMotionCoverage({ items: [button] }, evidence("other")).join("\n")).toContain(
      "not the reached installed integration",
    );
    expect(checkMotionCoverage({ items: [button] }, { references: {} }).join("\n")).toContain(
      "not the reached installed integration",
    );
    expect(
      implementationOwner({
        file: "registry/cadence/lib/executor.ts",
        via: ["registry/cadence/tabs/index.tsx#Adapter"],
      }),
    ).toBe("tabs");
    const inherited = structuredClone(button);
    inherited.registryDependencies = ["@cadence/other"];
    Object.assign(inherited.meta.motionCoverage.effects[key][0], { relationship: "inherited", owner: "other" });
    expect(checkMotionCoverage({ items: [inherited] }, evidence("other"))).toEqual([]);
    expect(checkMotionCoverage({ items: [inherited] }, { references: {} }).join("\n")).toContain(
      "not the reached installed integration",
    );
    inherited.meta.motionCoverage.effects[key][0].relationship = "default";
    expect(motionCoverageProblems(inherited).join("\n")).toContain("default requires the local integration owner");
  });
  it("allows explicit composition without making it local default or waiving implementation evidence", () => {
    const group = registry.items.find((item: { name: string }) => item.name === "reveal-group");
    expect(group.meta.motionCoverage.effects["reveal/viewport"][0].relationship).toBe("composed");
    expect(checkMotionCoverage({ items: [group] }, { references: {} }).join("\n")).toContain(
      "not the reached installed integration",
    );
    expect(migrationProblems("v2").join("\n")).toContain("legacy evidence cannot certify v2");
    const staticItem = registry.items.find((item: { name: string }) => item.name === "card");
    expect(staticItem.meta.motionCoverage.effects).toEqual({});
    expect(staticItem.meta.motionCoverage).not.toHaveProperty("capabilities");
  });
  it("compares full public objects independent of key order and rejects omissions/drift", () => {
    const frontmatter = {
      motionCoverage: structuredClone(button.meta.motionCoverage),
      motionProfile: structuredClone(button.meta.motionProfile),
    };
    expect(motionMetadataProblems(button, frontmatter)).toEqual([]);
    frontmatter.motionCoverage.effects[key][0].owner = "other";
    expect(motionMetadataProblems(button, frontmatter)).toContain(
      "button: docs motionCoverage differs from installed metadata",
    );
    expect(motionMetadataProblems(button, {}).length).toBe(2);
  });
});
