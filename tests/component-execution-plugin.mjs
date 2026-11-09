import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));
const helper = fileURLToPath(new URL("./component-execution.tsx", import.meta.url)).replaceAll("\\", "/");

/** Observe inside the original function and at authored host refs. Export types,
 * JSX types/keys, caller children and Base UI collection identity are preserved.
 * This transform runs only in Vitest; shipped/install/browser code is untouched. */
export function componentExecutionPlugin(additionalItems = []) {
  const ids = new Set(
    [...registry.items, ...additionalItems]
      .filter((item) => ["registry:ui", "registry:block"].includes(item.type))
      .map((item) => item.name),
  );
  return {
    name: "cadence-test-component-execution",
    enforce: /** @type {"pre"} */ ("pre"),
    transform(source, filename) {
      const normalized = filename.replaceAll("\\", "/");
      if (!/\/registry\/cadence\/.*\.[jt]sx?$/.test(normalized)) return;
      const id = normalized.match(/\/registry\/cadence\/([^/]+)\/index\.tsx$/)?.[1];
      const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const names = new Map();
      const effects = new Set();
      const renders = new Set();
      const add = (local, exported) => names.set(local, [...(names.get(local) ?? []), exported]);
      for (const statement of file.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
          const bindings = statement.importClause?.namedBindings;
          if (bindings && ts.isNamedImports(bindings))
            for (const entry of bindings.elements) {
              const imported = (entry.propertyName ?? entry.name).text;
              if (statement.moduleSpecifier.text === "react" && /^use(?:Layout|Insertion)?Effect$/.test(imported))
                effects.add(entry.name.text);
              if (statement.moduleSpecifier.text === "@base-ui/react/use-render" && imported === "useRender")
                renders.add(entry.name.text);
            }
        }
        if (
          ts.isExportDeclaration(statement) &&
          !statement.isTypeOnly &&
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        )
          for (const entry of statement.exportClause.elements)
            if (!entry.isTypeOnly) add((entry.propertyName ?? entry.name).text, entry.name.text);
        if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) && statement.name)
          add(statement.name.text, statement.name.text);
      }
      // Shared adapters choose useEffect/useLayoutEffect through a module alias.
      for (const statement of file.statements)
        if (ts.isVariableStatement(statement))
          for (const declaration of statement.declarationList.declarations)
            if (ts.isIdentifier(declaration.name) && declaration.initializer) {
              const value = declaration.initializer;
              if (
                (ts.isIdentifier(value) && effects.has(value.text)) ||
                (ts.isConditionalExpression(value) &&
                  [value.whenTrue, value.whenFalse].every(
                    (branch) => ts.isIdentifier(branch) && effects.has(branch.text),
                  ))
              )
                effects.add(declaration.name.text);
            }
      let changed = false;
      const transformed = ts.transform(file, [
        (context) => {
          const f = context.factory;
          let origin;
          const call = (method, args) =>
            f.createCallExpression(f.createPropertyAccessExpression(origin, method), undefined, args);
          const visit = (node) => {
            if (
              ids.has(id) &&
              ts.isFunctionDeclaration(node) &&
              node.name &&
              node.body &&
              names.has(node.name.text) &&
              /^[A-Z]/.test(node.name.text)
            ) {
              changed = true;
              const previous = origin;
              origin = f.createUniqueName("cadenceExecution");
              const local = origin;
              const body = ts.visitEachChild(node.body, visit, context);
              const run = call("run", [
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  body,
                ),
              ]);
              origin = previous;
              return f.updateFunctionDeclaration(
                node,
                node.modifiers,
                node.asteriskToken,
                node.name,
                node.typeParameters,
                node.parameters,
                node.type,
                f.createBlock(
                  [
                    f.createVariableStatement(
                      undefined,
                      f.createVariableDeclarationList(
                        [
                          f.createVariableDeclaration(
                            local,
                            undefined,
                            undefined,
                            f.createCallExpression(f.createIdentifier("useCadenceTestExecution"), undefined, [
                              f.createStringLiteral(id),
                              f.createStringLiteral(node.name.text),
                              f.createArrayLiteralExpression(
                                names.get(node.name.text).map((name) => f.createStringLiteral(name)),
                              ),
                            ]),
                          ),
                        ],
                        ts.NodeFlags.Const,
                      ),
                    ),
                    f.createReturnStatement(run),
                  ],
                  true,
                ),
              );
            }
            const result = ts.visitEachChild(node, visit, context);
            if (
              ts.isCallExpression(result) &&
              ts.isIdentifier(result.expression) &&
              effects.has(result.expression.text) &&
              result.arguments.length
            ) {
              changed = true;
              return f.updateCallExpression(result, result.expression, result.typeArguments, [
                f.createCallExpression(f.createIdentifier("bindCurrentExecution"), undefined, [result.arguments[0]]),
                ...result.arguments.slice(1),
              ]);
            }
            if (!origin) return result;
            const opening = ts.isJsxElement(result)
              ? result.openingElement
              : ts.isJsxSelfClosingElement(result)
                ? result
                : undefined;
            const host = opening?.attributes.properties.some(
              (prop) => ts.isJsxAttribute(prop) && prop.name.getText(file) === "data-slot",
            );
            if (
              host ||
              (ts.isCallExpression(result) && ts.isIdentifier(result.expression) && renders.has(result.expression.text))
            ) {
              const observed = call("host", [result, f.createStringLiteral(`${id}:${node.getStart(file)}`)]);
              return node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
                ? f.createJsxExpression(undefined, observed)
                : observed;
            }
            return result;
          };
          return (node) => ts.visitNode(node, visit);
        },
      ]);
      if (!changed) {
        transformed.dispose();
        return;
      }
      const code = ts.createPrinter().printFile(transformed.transformed[0]);
      transformed.dispose();
      return {
        code: `import {useCadenceTestExecution,bindCurrentExecution} from ${JSON.stringify(helper)};\n${code}`,
        map: null,
      };
    },
  };
}
