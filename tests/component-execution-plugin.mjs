import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));
const ids = new Set(
  registry.items.filter((item) => ["registry:ui", "registry:block"].includes(item.type)).map((item) => item.name),
);
const helper = fileURLToPath(new URL("./component-execution.tsx", import.meta.url)).replaceAll("\\", "/");

/** Record execution inside the original function. Wrapping exports changes Base
 * UI's static child inspection (notably Select labels), so never replace types.
 */
export function componentExecutionPlugin() {
  return {
    name: "cadence-test-component-execution",
    enforce: /** @type {"pre"} */ ("pre"),
    transform(source, filename) {
      const id = filename.replaceAll("\\", "/").match(/\/registry\/cadence\/([^/]+)\/index\.tsx$/)?.[1];
      if (!ids.has(id)) return;
      const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const names = new Set();
      for (const statement of file.statements) {
        if (
          ts.isExportDeclaration(statement) &&
          !statement.isTypeOnly &&
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        )
          for (const entry of statement.exportClause.elements)
            if (!entry.isTypeOnly) names.add((entry.propertyName ?? entry.name).text);
        if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) && statement.name)
          names.add(statement.name.text);
      }
      const points = file.statements
        .filter(
          (node) =>
            ts.isFunctionDeclaration(node) &&
            node.body &&
            node.name &&
            names.has(node.name.text) &&
            /^[A-Z]/.test(node.name.text),
        )
        .map((node) => ({ point: node.body.getStart(file) + 1, name: node.name.text }))
        .sort((a, b) => b.point - a.point);
      if (!points.length) return;
      for (const { point, name } of points)
        source = `${source.slice(0, point)}useCadenceTestExecution(${JSON.stringify(id)},${JSON.stringify(name)});${source.slice(point)}`;
      return { code: `import {useCadenceTestExecution} from ${JSON.stringify(helper)};\n${source}`, map: null };
    },
  };
}
