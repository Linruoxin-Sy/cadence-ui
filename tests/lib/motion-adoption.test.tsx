import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { installationPlan } from "../../scripts/installation.mjs";
import { checkMotionPartAdoption, installedTargetForm } from "../../scripts/motion-adoption.mjs";
import { checkMotionCoverage } from "../../scripts/motion-coverage.mjs";
import { checkMotionImplementations } from "../../scripts/motion-implementation.mjs";
import { checkMotionTargets, parseMotionTarget, parseTargetPresets } from "../../scripts/motion-targets.mjs";
import negatives from "../fixtures/motion-adoption/negative.json";

const root = process.cwd();
const original = JSON.parse(await readFile("registry.json", "utf8"));
const presetSource = await readFile("docs/motion/presets.md", "utf8");
const { presets } = parseTargetPresets(presetSource);
const contractSource = await readFile("tests/fixtures/motion-adoption/contract.md.txt", "utf8");
const source = await readFile("tests/fixtures/motion-adoption/source.tsx.txt", "utf8");
const reason = "Actual connected fixture integration; runtime acceptance is a separate obligation.";
const parse = (text: string, id = "fixture") => parseMotionTarget(text, id, presets);

async function fixture(motion = [{ recipe: "state.color", form: "css-transition" }]) {
  const directory = process.env.CADENCE_GATE_EVIDENCE ?? path.join(root, ".cache");
  await mkdir(directory, { recursive: true });
  const temp = await mkdtemp(path.join(directory, "motion-adoption-"));
  const file = "registry/cadence/fixture/index.tsx";
  const item = {
    name: "fixture",
    type: "registry:ui",
    files: [{ path: file, target: "@components/cadence/fixture/index.tsx" }],
    registryDependencies: ["@cadence/cadence-provider"],
    meta: {
      motion,
      motionCoverage: {
        schema: 1,
        effects: Object.fromEntries(
          motion.map(({ recipe, form }) => [
            `${recipe}/${form}`,
            [{ relationship: "default", owner: "fixture", reason }],
          ]),
        ),
      },
    },
  };
  const registry = { items: [item, ...structuredClone(original.items)] };
  await put(temp, file, source);
  for (const entry of installationPlan(registry.items, "fixture").files)
    if (entry.path !== file) await put(temp, entry.path, await readFile(entry.path, "utf8"));
  return { temp, file, item, registry };
}

async function put(temp: string, file: string, text: string) {
  await mkdir(path.dirname(path.join(temp, file)), { recursive: true });
  await writeFile(path.join(temp, file), text);
}

function effect(item: Awaited<ReturnType<typeof fixture>>["item"], form: string) {
  const record = item.meta.motionCoverage.effects[form]?.[0];
  if (!record) throw new Error(`missing fixture effect ${form}`);
  return record;
}

describe("selected-part static adoption subgate (not full v2 acceptance)", () => {
  it("resolves real shipped text, number and viewport adapters without promoting their markers", async () => {
    const contracts = new Map();
    for (const id of ["animated-text", "animated-number", "reveal"]) {
      const text = await readFile(`docs/motion/components/${id}.md`, "utf8");
      expect(parse(text, id).migration).toBe("legacy");
      contracts.set(id, parse(text.replace('"migration": "legacy"', '"migration": "v2"'), id));
    }
    const result = await checkMotionPartAdoption(root, original, contracts);
    expect(result.problems).toEqual([]);
    expect(result.bindings.map((binding) => binding.installedForm).sort()).toEqual([
      "number.roll/reels",
      "reveal/viewport",
      "text.change/changed-runs",
    ]);
    for (const binding of result.bindings) {
      expect(binding.relationship).toBe("default");
      expect(binding.references.length).toBeGreaterThan(0);
      expect(binding.references.every((ref) => ref.anchors.includes(binding.anchor))).toBe(true);
    }
    expect(result.boundaries.length).toBeGreaterThan(0);
    // Static positives deliberately do not remove the strict runtime gate.
    for (const contract of contracts.values())
      expect(contract.problems.join("\n")).toContain("legacy evidence cannot certify v2");
  });

  it("checks the actual source closure and exact combined palette, with the registry hook still fail-closed", async () => {
    const { temp, registry, item } = await fixture();
    const contracts = new Map([["fixture", parse(contractSource)]]);
    const result = await checkMotionPartAdoption(temp, registry, contracts);
    expect(result.problems).toEqual([]);
    expect(result.bindings[0]).toMatchObject({
      anchor: "fixture#Fixture",
      owner: "fixture",
      targetForm: "state.color/surface-foreground",
      installedForm: "state.color/css-transition",
    });
    const installedRegistry = { items: installationPlan(registry.items, "fixture").items };
    const implementations = await checkMotionImplementations(temp, installedRegistry);
    expect(implementations.problems).toEqual([]);
    expect(checkMotionCoverage({ items: [item] }, implementations)).toEqual([]);
    await put(temp, "docs/motion/presets.md", presetSource);
    await put(temp, "docs/motion/README.md", "[Fixture](components/fixture.md)");
    await put(temp, "docs/motion/components/fixture.md", contractSource.replace("fixture#Fixture", "fixture#Plain"));
    const checked = await checkMotionTargets(temp, installedRegistry);
    expect(checked.problems.join("\n")).toContain("not adopted by actual fixture#Plain");
    expect(checked.problems.join("\n")).toContain("legacy evidence cannot certify v2");
  });

  it("keeps real caller-registered RevealGroup composition pending joint scope/host evidence", async () => {
    const contracts = new Map();
    for (const id of ["reveal", "reveal-group"])
      contracts.set(
        id,
        parse(
          (await readFile(`docs/motion/components/${id}.md`, "utf8")).replace(
            '"migration": "legacy"',
            '"migration": "v2"',
          ),
          id,
        ),
      );
    const result = await checkMotionPartAdoption(root, original, contracts);
    expect(result.problems).toContain(
      "reveal-group: adoption: reveal-group.target.enter: composed action requires joint scope/host registration evidence (pending)",
    );
    expect(result.problems.every((problem) => problem.startsWith("reveal-group:"))).toBe(true);
    expect(result.bindings.some((binding) => binding.item === "reveal-group")).toBe(false);
    expect(result.bindings.some((binding) => binding.item === "reveal")).toBe(true);
  });

  it.each(negatives)("rejects $name using selected source rather than declared labels", async (negative) => {
    const { temp, file, registry } = await fixture();
    const originalText = negative.file === "source" ? source : contractSource;
    expect(originalText).toContain(negative.from);
    const changed = originalText.replace(negative.from, negative.to);
    await put(temp, file, negative.file === "source" ? changed : source);
    const result = await checkMotionPartAdoption(
      temp,
      registry,
      new Map([["fixture", parse(negative.file === "contract" ? changed : contractSource)]]),
    );
    expect(
      [...result.problems, ...parse(negative.file === "contract" ? changed : contractSource).referenceProblems].join(
        "\n",
      ),
    ).toContain(negative.error);
  });

  it("rejects unknown forms, missing declarations and wrong owner records", async () => {
    const { temp, item, registry } = await fixture();
    expect(installedTargetForm("state.color/surface-foreground")).toBe("state.color/css-transition");
    for (const form of [
      "data.transition/opacity",
      "enter.pop/opacity",
      "native/editor",
      "feedback.press/scale",
      "imaginary/one-shot",
    ])
      expect(installedTargetForm(form)).toBeNull();
    const unknown = contractSource.replaceAll("state.color/surface-foreground", "state.color/unknown");
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(unknown)]]))).problems.join("\n"),
    ).toContain("valid parsed target references required");
    item.meta.motion = [];
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contractSource)]]))).problems.join(
        "\n",
      ),
    ).toContain("requires declared installed state.color/css-transition");
    item.meta.motion = [{ recipe: "state.color", form: "css-transition" }];
    effect(item, "state.color/css-transition").owner = "other";
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contractSource)]]))).problems.join(
        "\n",
      ),
    ).toContain("lacks default installed owner fixture");
  });

  it("retains the capability graph and checks every installed owner even when prose says composed or absent", async () => {
    const { temp, item, registry } = await fixture();
    const hidden = contractSource.replaceAll("default: `fixture.paint.colour`", "composed: `fixture.paint.colour`");
    expect(parse(hidden).referenceProblems).toEqual([]);
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(hidden)]]))).problems.join("\n"),
    ).toContain("composed action requires joint scope/host registration evidence (pending)");
    item.meta.motion.push({ recipe: "data.transition", form: "continuous" });
    item.meta.motionCoverage.effects["data.transition/continuous"] = [
      { relationship: "default", owner: "fixture", reason },
    ];
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contractSource)]]))).problems.join(
        "\n",
      ),
    ).toContain("data.transition/continuous: installed owner fixture has no verified target action");
  });

  it("keeps surface-only and foreground-only property ownership distinct", async () => {
    const { temp, file, registry } = await fixture();
    for (const [form, properties, capability] of [
      ["surface", '["background-color"]', "Text colour"],
      ["foreground", '["color"]', "Surface colour"],
    ] as const) {
      const document = contractSource
        .replaceAll("state.color/surface-foreground", `state.color/${form}`)
        .replace(
          new RegExp(`(\\| ${capability} \\|[^\\n]+\\| )default: \\x60fixture.paint.colour\\x60`),
          "$1not-applicable: `@paint`",
        );
      expect(parse(document).referenceProblems).toEqual([]);
      await put(temp, file, source.replace('["background-color", "color"]', properties));
      expect((await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(document)]]))).problems).toEqual(
        [],
      );
    }
  });

  it("does not combine independent surface/foreground hooks or revive dead hooks", async () => {
    const { temp, file, registry } = await fixture();
    const variants = [
      source
        .replace('["background-color", "color"]', '["background-color"]')
        .replace(
          "return <span {...paint}",
          'const other = useStateColor(undefined, cm, ["color"]); return <><span {...paint} data-slot="fixture-surface"/><span {...other}',
        )
        .replace("</span>;", "</span></>;"),
      source.replace("const paint =", "if (false) { const paint =").replace("\n}\n", "\n} return <span/>; }\n"),
      source.replace("const paint =", "return <span/>; const paint ="),
      source.replace("const paint =", "const diagnostic =").replace("{...paint}", ""),
    ];
    for (const broken of variants) {
      await put(temp, file, broken);
      expect(
        (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contractSource)]]))).problems.join(
          "\n",
        ),
      ).toContain("not adopted by actual fixture#Fixture");
    }
  });

  it("rejects legacy animate-* loops even when installed legacy form recognition succeeds", async () => {
    const { temp, file, registry } = await fixture([{ recipe: "data.transition", form: "continuous" }]);
    const contract = contractSource
      .replaceAll("state.color/surface-foreground", "data.transition/continuous")
      .replaceAll("default: `fixture.paint.colour`", "not-applicable: `@paint`")
      .replace("→ `state.color` →", "→ `status.loop` →");
    expect(parse(contract).referenceProblems).toEqual([]);
    await put(
      temp,
      file,
      'export function Fixture(){return <span className="animate-spin animate-none" data-slot="fixture"/>}',
    );
    expect(
      (await checkMotionImplementations(temp, { items: installationPlan(registry.items, "fixture").items })).problems,
    ).toEqual([]);
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contract)]]))).problems.join("\n"),
    ).toContain("not adopted by actual fixture#Fixture");
    await put(
      temp,
      file,
      source.replaceAll("useStateColor", "useContinuousMotion").replace('["background-color", "color"]', '"spin"'),
    );
    expect((await checkMotionPartAdoption(temp, registry, new Map([["fixture", parse(contract)]]))).problems).toEqual(
      [],
    );
  });

  it("resolves inherited aliases at the exact migrated dependency, rejecting declarations without a live path", async () => {
    const { temp, file, item, registry } = await fixture([{ recipe: "text.change", form: "changed-runs" }]);
    item.registryDependencies = ["@cadence/animated-text"];
    const originalText = await readFile("docs/motion/components/animated-text.md", "utf8");
    const ownerContract = originalText.replace('"migration": "legacy"', '"migration": "v2"');
    const inheritedContract = ownerContract
      .replaceAll("animated-text.text", "fixture.text")
      .replace("default: `fixture.text.replace`", "inherited: `fixture.text.replace`");
    const record = effect(item, "text.change/changed-runs");
    record.relationship = "inherited";
    record.owner = "animated-text";
    const live =
      'import {AnimatedText as Label} from "../animated-text"; export function Fixture(){return <Label value="Text"/>}';
    for (const entry of installationPlan(registry.items, "fixture").files)
      if (entry.path !== file) await put(temp, entry.path, await readFile(entry.path, "utf8"));
    const contracts = new Map([
      ["fixture", parse(inheritedContract)],
      ["animated-text", parse(ownerContract, "animated-text")],
    ]);
    expect(parse(inheritedContract).referenceProblems).toEqual([]);
    await put(temp, file, live);
    const positive = await checkMotionPartAdoption(temp, registry, contracts);
    expect(positive.problems).toEqual([]);
    const inherited = positive.bindings.find((binding) => binding.item === "fixture");
    expect(inherited).toMatchObject({
      anchor: "animated-text#AnimatedText",
      owner: "animated-text",
      relationship: "inherited",
    });
    expect(inherited?.references[0]?.via).toContain(`${file}#Label`);
    for (const broken of [
      live.replace('<Label value="Text"/>', "<span/>"),
      live.replace("import {", "import type {").replace('<Label value="Text"/>', "<span/>"),
      live
        .replace("return <Label", "if(false) return <Label")
        .replace('value="Text"/>}', 'value="Text"/>; return <span/>}'),
      live
        .replace("export function Fixture()", "function Unused()")
        .concat("export function Fixture(){return <span/>}"),
      live.replace("return <Label", "return <span/>; return <Label"),
    ]) {
      await put(temp, file, broken);
      expect((await checkMotionPartAdoption(temp, registry, contracts)).problems.join("\n")).toContain(
        "not adopted by actual animated-text#AnimatedText",
      );
    }
    await put(temp, file, live);
    item.registryDependencies = [];
    expect((await checkMotionPartAdoption(temp, registry, contracts)).problems.join("\n")).toContain(
      "is not an explicit dependency",
    );
    item.registryDependencies = ["@cadence/animated-text"];
    contracts.set("animated-text", parse(originalText, "animated-text"));
    expect((await checkMotionPartAdoption(temp, registry, contracts)).problems.join("\n")).toContain(
      "must retain its migrated owner's exact preset/form and responsibility",
    );
    contracts.set("animated-text", parse(ownerContract, "animated-text"));
    const mismatched = parse(inheritedContract.replace("→ `text.replace` →", "→ `text.no-stagger` →"));
    // Unknown/incorrect preset/form cannot be rescued by the dependency's helper.
    expect(
      (await checkMotionPartAdoption(temp, registry, new Map([...contracts, ["fixture", mismatched]]))).problems.join(
        "\n",
      ),
    ).toContain("valid parsed target references required");
  });

  it("rejects a valid alternate preset when the actual numeric dependency retains another binding", async () => {
    const { temp, file, item, registry } = await fixture([{ recipe: "number.roll", form: "reels" }]);
    item.registryDependencies = ["@cadence/animated-number"];
    const ownerText = (await readFile("docs/motion/components/animated-number.md", "utf8")).replace(
      '"migration": "legacy"',
      '"migration": "v2"',
    );
    const inheritedText = ownerText
      .replaceAll("animated-number.number", "fixture.number")
      .replace("default: `fixture.number.roll`", "inherited: `fixture.number.roll`");
    const record = effect(item, "number.roll/reels");
    record.relationship = "inherited";
    record.owner = "animated-number";
    for (const entry of installationPlan(registry.items, "fixture").files)
      if (entry.path !== file) await put(temp, entry.path, await readFile(entry.path, "utf8"));
    await put(
      temp,
      file,
      'import {AnimatedNumber as Quantity} from "../animated-number"; export function Fixture(){return <Quantity value={12}/>}',
    );
    const contracts = new Map([
      ["fixture", parse(inheritedText)],
      ["animated-number", parse(ownerText, "animated-number")],
    ]);
    expect((await checkMotionPartAdoption(temp, registry, contracts)).problems).toEqual([]);
    const wrong = parse(inheritedText.replace("→ `number.roll` →", "→ `number.compact` →"));
    expect(wrong.referenceProblems).toEqual([]);
    contracts.set("fixture", wrong);
    expect((await checkMotionPartAdoption(temp, registry, contracts)).problems.join("\n")).toContain(
      "must retain its migrated owner's exact preset/form and responsibility",
    );
  });
});
