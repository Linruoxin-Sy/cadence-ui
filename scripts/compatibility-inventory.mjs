// Type evidence, never a runtime compatibility gate. Every row stays open until
// its actual implementation/context and behavior have been audited.
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const upstream = JSON.parse(readFileSync("upstream/manifest.json", "utf8"));
const packages = Object.fromEntries(
  Object.keys(JSON.parse(readFileSync("package.json", "utf8")).dependencies).map((name) => [
    name,
    JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8")).version,
  ]),
);
const flags = ts.TypeFormatFlags.NoTruncation;
const relative = (value) =>
  value
    .replaceAll("\\", "/")
    .replaceAll(`${process.cwd().replaceAll("\\", "/")}/`, "")
    .replace(/node_modules\/\.pnpm\/[^/]+\/node_modules\//g, "node_modules/");
const items = registry.items.filter((item) => ["registry:ui", "registry:block"].includes(item.type));
const matrix = items.map((item) => {
  const source = item.files.find((file) => file.path.endsWith("index.tsx")).path;
  const sf = program.getSourceFile(source);
  const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sf)).map((symbol) => {
    const location = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? sf;
    const type = checker.getTypeOfSymbolAtLocation(symbol, location);
    const signature = type.getCallSignatures()[0];
    const parameter = signature?.parameters[0];
    const props = parameter ? checker.getTypeOfSymbolAtLocation(parameter, location) : undefined;
    const surfaces = {};
    for (const name of [
      "className",
      "style",
      "render",
      "ref",
      "onAnimationStart",
      "onDrag",
      "onDragStart",
      "onDragEnd",
    ]) {
      const prop = props?.getProperty(name);
      if (!prop) continue;
      const declaration = prop.valueDeclaration ?? prop.declarations?.[0] ?? location;
      const propType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, location));
      surfaces[name] = {
        type: relative(checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, location), location, flags)),
        acceptsCallback: (propType.isUnion() ? propType.types : [propType]).some(
          (type) => type.getCallSignatures().length > 0,
        ),
        declaration: relative(declaration.getSourceFile().fileName),
        line: declaration.getSourceFile().getLineAndCharacterOfPosition(declaration.getStart()).line + 1,
      };
    }
    return {
      name: symbol.name,
      callable: Boolean(signature),
      surfaces,
      status: "open: type inventory only; inspect implementation and actual context",
    };
  });
  const text = readFileSync(source, "utf8");
  return {
    id: item.name,
    source,
    upstream: upstream.items[item.name],
    imports: [...text.matchAll(/from "([^"]+)"/g)].map((match) => match[1]),
    priorSuite: `tests/components/${item.name}.test.tsx`,
    priorEvidence: "Historical suites/handoffs retained; no library-wide runtime conclusion inferred.",
    exports,
  };
});
writeFileSync(
  "docs/evidence/compatibility-inventory.json",
  `${JSON.stringify(
    {
      pin: upstream.pin.ref,
      installedPackages: packages,
      scope:
        "All 58 UI/block items, all actual exports. Non-component exports are retained; empty surfaces do not imply no DOM/provider/context applicability. Types are installed TypeScript resolution, not regex API inference.",
      limitation:
        "No row is runtime-certified by this generated inventory. Ref/render/callback presence alone cannot prove forwarding, cancellation, caller-last, context correctness or native semantics. Button bounded evidence is in compatibility-button.md.",
      items: matrix,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `${matrix.length} items / ${matrix.reduce((sum, item) => sum + item.exports.length, 0)} exports inventoried`,
);
