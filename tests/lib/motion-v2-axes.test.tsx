import { describe, expect, it } from "vitest";
import { motionV2ExecutionProblems } from "../../scripts/motion-v2.mjs";

describe("directional geometry evidence", () => {
  const action = {
    item: "fixture",
    binding: "fixture.root.resize",
    preset: "geometry.compact",
    targetForm: "geometry.resize/measured",
    slot: "fixture",
    site: "fixture:1",
    relationship: "default",
    anchor: "fixture#Root",
    properties: ["height", "width"],
    sources: { "source.tsx": "actual-source" },
  };
  const plan = { actions: [action], boundaries: [] };
  const records = ["full", "reduced", "none"].flatMap((mode, index) =>
    ["height", "width"].map((axis, offset) => ({
      item: "fixture",
      binding: action.binding,
      preset: action.preset,
      form: action.targetForm,
      mode,
      slot: action.slot,
      site: action.site,
      relationship: action.relationship,
      anchor: action.anchor,
      properties: [axis],
      sources: action.sources,
      changed: true,
      policy: true,
      live: true,
      controller: index * 2 + offset + 1,
      host: index * 2 + offset + 1,
      instance: index * 2 + offset + 1,
      scope: index * 2 + offset + 1,
    })),
  );
  const check = (rows: typeof records) => motionV2ExecutionProblems("fixture", plan, [{ passed: true, records: rows }]);
  it("requires every actual axis within one passing test and keeps every row's identity/source policy", () => {
    expect(check(records)).toEqual([]);
    expect(check(records.filter((row) => row.properties[0] === "width"))).toHaveLength(3);
    expect(
      motionV2ExecutionProblems("fixture", plan, [
        { passed: true, records: records.filter((row) => row.properties[0] === "width") },
        { passed: true, records: records.filter((row) => row.properties[0] === "height") },
      ]),
    ).toHaveLength(3);
    expect(motionV2ExecutionProblems("fixture", plan, [{ passed: false, records }])).toHaveLength(3);
    for (const corrupt of [
      (row: (typeof records)[number]) => ({ ...row, properties: ["opacity"] }),
      (row: (typeof records)[number]) => ({ ...row, properties: ["height", "height"] }),
      (row: (typeof records)[number]) => ({ ...row, sources: { "source.tsx": "retired-source" } }),
      (row: (typeof records)[number]) => ({ ...row, scope: row.instance + 1 }),
      (row: (typeof records)[number]) => ({ ...row, changed: false }),
      (row: (typeof records)[number]) => ({ ...row, slot: "another-host" }),
    ])
      expect(check(records.map(corrupt))).toHaveLength(3);
  });
  it("does not combine partial colour owners into an exact colour claim", () => {
    const paint = {
      ...action,
      targetForm: "state.color/surface-foreground",
      properties: ["background-color", "color"],
    };
    const rows = records.map((row) => ({
      ...row,
      form: paint.targetForm,
      properties: [row.properties[0] === "width" ? "color" : "background-color"],
    }));
    expect(
      motionV2ExecutionProblems("fixture", { actions: [paint], boundaries: [] }, [{ passed: true, records: rows }]),
    ).toHaveLength(3);
  });
});
