import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

// Inventory is discovery, never proof. Keep individual private animated hosts.
const paths = readdirSync("registry/cadence", { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "lib")
  .map((e) => `registry/cadence/${e.name}/index.tsx`);
paths.push("components/site/document-entrance.tsx");
const records = [];
for (const path of paths) {
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const id = path.split("/")[2];
  const basic = [
    "button",
    "toggle",
    "toggle-group",
    "slider",
    "checkbox",
    "radio-group",
    "switch",
    "progress",
    "input-otp",
  ].includes(id);
  const existing =
    id === "document-entrance.tsx"
      ? []
      : id === "code-block"
        ? ["tests/e2e/motion-matrix.spec.ts (tabs/fold only)"]
        : [
              "button",
              "checkbox",
              "radio-group",
              "switch",
              "slider",
              "toggle",
              "toggle-group",
              "progress",
              "input-otp",
            ].includes(id)
          ? ["tests/e2e/b3.spec.ts (Button: motion-matrix.spec.ts)"]
          : ["select", "combobox", "dropdown-menu", "context-menu"].includes(id)
            ? ["tests/e2e/b5.spec.ts"]
            : [
                `tests/e2e/${id === "sidebar" ? "sidebar-component" : id}.spec.ts (inspect applicability; filename alone is not proof)`,
              ];
  const targets = {
    Button: "Base Button default rendered button",
    Checkbox: "Base Checkbox Indicator rendered span",
    RadioGroupItem: "Base Radio Indicator rendered span",
    Switch: "Base Switch Thumb rendered span",
    Slider: "Base Slider Thumb rendered div; Base dragging state",
    ProgressIndicator: "Base Progress Indicator rendered native div",
    InputOTPSlot: "OTP slot character span",
    Toggle: "Base Toggle default button",
    ToggleGroupItem: "Base ToggleGroup item button",
    ContextMenuCheckboxItem: "Base ContextMenu CheckboxItemIndicator span",
    ContextMenuRadioItem: "Base ContextMenu RadioItemIndicator span",
    DropdownMenuCheckboxItem: "Base Dropdown CheckboxItemIndicator span",
    DropdownMenuRadioItem: "Base Dropdown RadioItemIndicator span",
    CodeBlockExpandButton: "direct motion span inside expand button, not its SVG",
    CodeBlockCopyButton: "one of two private copy/check glyph spans; target expression distinguishes them",
    DocumentEntrance: "actual article/section/div selected by as; shared motionProps",
    CalendarMonthGrid: "actual native month-grid table",
    Sidebar: "desktop sidebar-container via progress/onUpdate",
  };
  const add = (node, writer, target, recipe) =>
    records.push({
      path,
      owner: owner(node),
      line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      writer,
      target: target === "private host; see owner/source" ? targets[owner(node)] : target,
      recipe,
      sourceSha256: createHash("sha256").update(source).digest("hex"),
      source: node.getText(file),
      existingProofCandidates: existing,
      applicableProof:
        "docs/evidence/engine-runtime.md names the executed cases and precise missing conditions for this owner; initial filename matches are not closure",
      status: basic
        ? "BOUNDED browser proof: tests/runtime/controls.mjs actual hosts, six mode/OS cells, controlled commit/clock/reversal/cancellation/cleanup; see basic-controls-runtime.json and engine-runtime.md for limits"
        : "OPEN: reconcile actual part against existing raw evidence; discovery does not close runtime obligations",
      remaining: basic
        ? [
            "Real Next SSR/hydration initial-path proof reuses production cases only where they sample this actual host; no blanket full-library hydration claim",
            "Switch resize first rAF precedes ResizeObserver delivery; second rAF endpoint is proven, not synchronous first-rAF measurement",
            "Positive inherited/explicit clocks 8/4/2 exercised; zero/negative/nonfinite timeScale not certified",
          ]
        : [
            "initial full/reduced/none × two OS; SSR/hydration where applicable",
            "active same-target mode/clock, inherited/explicit clock and full inside none",
            "nonempty partial frames, semantic target, reversal/resize/controlled updates and cleanup",
          ],
    });
  function owner(node) {
    for (let p = node.parent; p; p = p.parent) if (ts.isFunctionDeclaration(p) && p.name) return p.name.text;
    return "module";
  }
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(file);
      if (/^(motion\.|ControlSpan$|ControlDiv$|NativeControlDiv$|PressButton$|NativeMotionDiv$)/.test(tag)) {
        const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
        const get = (name) => attrs.find((a) => a.name.getText(file) === name)?.initializer?.getText(file);
        add(
          node,
          tag,
          get("data-slot") ?? "private host; see owner/source",
          get("transition") ?? "imperative motion value or parent recipe; inspect source",
        );
      }
    }
    if (ts.isCallExpression(node) && ["animate", "element.animate"].includes(node.expression.getText(file)))
      add(node, node.expression.getText(file), node.arguments[0]?.getText(file), node.arguments.at(-1)?.getText(file));
    ts.forEachChild(node, visit);
  }
  visit(file);
}
// Engine integration sites have no Motion host and must not disappear from discovery.
for (const [path, needle, writer, target] of [
  [
    "registry/cadence/chart/index.tsx",
    "const controller =",
    "Recharts AnimationController",
    "supported series actual SVG/data targets",
  ],
  ["registry/cadence/carousel/index.tsx", "useEmblaCarousel(", "Embla", "track transform and loop relocation"],
]) {
  const source = readFileSync(path, "utf8");
  const at = source.indexOf(needle);
  if (at < 0) throw Error(`missing ${needle}`);
  records.push({
    path,
    line: source.slice(0, at).split("\n").length,
    writer,
    target,
    status: "OPEN: reconcile installed engine, per-series/per-target raw trajectories and cancellation",
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    existingProofCandidates: [`tests/e2e/${path.split("/")[2]}.spec.ts`],
  });
}
writeFileSync(
  "docs/evidence/engine-writers.json",
  `${JSON.stringify({ scope: "Actual source discovery; CSS closure stays in css-lifecycle. Menubar and composite delegates inherit actual owners; no GSAP writer exists.", records }, null, 2)}\n`,
);
console.log(`${records.length} actual writer sites (private hosts included)`);
