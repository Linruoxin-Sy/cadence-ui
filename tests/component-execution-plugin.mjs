import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { motionEvidenceKey } from "../scripts/motion-evidence-authority.mjs";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));
const helper = fileURLToPath(new URL("./component-execution.tsx", import.meta.url)).replaceAll("\\", "/");
const controllerHelper = fileURLToPath(new URL("./controller-execution.mjs", import.meta.url)).replaceAll("\\", "/");
const productRoot = fileURLToPath(new URL("../registry/", import.meta.url)).replaceAll("\\", "/");

/** Observe inside the original function and at authored host refs. Export types,
 * JSX types/keys, caller children and Base UI collection identity are preserved.
 * Vitest and the opt-in browser QA runner use this transform. Distributed source
 * and ordinary consumer builds are untouched. */
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
      const normalized = filename.replaceAll("\\", "/").split("?")[0];
      if (
        [helper, fileURLToPath(new URL("./motion-v2-contract.ts", import.meta.url)).replaceAll("\\", "/")].includes(
          normalized,
        )
      )
        return {
          code: source.replace('"__CADENCE_TEST_EVIDENCE_KEY__"', JSON.stringify(motionEvidenceKey)),
          map: null,
        };
      if (!/\/(?:registry|components)\/cadence\/.*\.[jt]sx?$/.test(normalized)) return;
      const id = normalized.match(/\/(?:registry|components)\/cadence\/([^/]+)\/index\.tsx$/)?.[1];
      const module = normalized;
      const digest = createHash("sha256").update(source).digest("hex");
      const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const names = new Map();
      const effects = new Set();
      const reactNamespaces = new Set();
      const renders = new Set();
      const motionHooks = new Set(),
        motionScopeHooks = new Set();
      const add = (local, exported) => names.set(local, [...(names.get(local) ?? []), exported]);
      for (const statement of file.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
          const bindings = statement.importClause?.namedBindings;
          if (statement.moduleSpecifier.text === "react") {
            if (bindings && ts.isNamespaceImport(bindings)) reactNamespaces.add(bindings.name.text);
            if (statement.importClause?.name) reactNamespaces.add(statement.importClause.name.text);
          }
          if (bindings && ts.isNamedImports(bindings))
            for (const entry of bindings.elements) {
              const imported = (entry.propertyName ?? entry.name).text;
              if (statement.moduleSpecifier.text.endsWith("/provider")) {
                if (imported === "useCadenceMotion") motionHooks.add(entry.name.text);
                if (imported === "useCadenceMotionScope") motionScopeHooks.add(entry.name.text);
              }
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
      const transformed = ts.transform(file, [
        (context) => {
          const f = context.factory;
          let origin;
          let copiedPolicy;
          let copiedController;
          let policyBinding = false;
          let parameterResolver = false;
          let cmVariables = new Set(),
            parameterVariables = new Set();
          const call = (method, args) =>
            f.createCallExpression(f.createPropertyAccessExpression(origin, method), undefined, args);
          const sourceReceipt = () =>
            f.createObjectLiteralExpression([
              f.createPropertyAssignment("module", f.createStringLiteral(module)),
              f.createPropertyAssignment("digest", f.createStringLiteral(digest)),
            ]);
          const visit = (node) => {
            if (
              normalized.endsWith("/lib/css-motion.ts") &&
              ts.isFunctionDeclaration(node) &&
              node.name?.text === "bindings"
            ) {
              const previous = policyBinding;
              policyBinding = true;
              const result = ts.visitEachChild(node, visit, context);
              policyBinding = previous;
              return result;
            }
            if (policyBinding && ts.isReturnStatement(node) && node.expression)
              return f.updateReturnStatement(
                node,
                f.createCallExpression(f.createIdentifier("observePolicyBinding"), undefined, [
                  node.expression,
                  f.createIdentifier("ownership"),
                ]),
              );
            if (ts.isFunctionDeclaration(node) && node.name?.text === "resolveMotionParameters") {
              const previous = parameterResolver;
              parameterResolver = true;
              const result = ts.visitEachChild(node, visit, context);
              parameterResolver = previous;
              return result;
            }
            if (
              parameterResolver &&
              (ts.isArrowFunction(node) ||
                ts.isFunctionExpression(node) ||
                ts.isFunctionDeclaration(node) ||
                ts.isMethodDeclaration(node))
            ) {
              const previous = parameterResolver;
              parameterResolver = false;
              const result = ts.visitEachChild(node, visit, context);
              parameterResolver = previous;
              return result;
            }
            if (parameterResolver && ts.isReturnStatement(node) && node.expression)
              return f.updateReturnStatement(
                node,
                f.createCallExpression(f.createIdentifier("observeResolvedParameters"), undefined, [
                  node.expression,
                  f.createIdentifier("binding"),
                  f.createIdentifier("mode"),
                ]),
              );
            if (
              ts.isFunctionDeclaration(node) &&
              [
                "createTextPresentation",
                "createNumberPresentation",
                "createViewportReveal",
                "createSelectionProjection",
                "createContentTransition",
                "createSizeLinkedGeometry",
                "createMeasuredGeometry",
                "createTabsLayout",
                "createTabsItem",
                "createInlinePresence",
                "createInlineEntrance",
                "createSelectPopup",
                "createCapturedHandoff",
                "createSurfacePresence",
                ...(normalized.endsWith("/lib/css-motion.ts") ? ["acquireFamily"] : []),
              ].includes(node.name?.text)
            ) {
              const previous = copiedController;
              copiedController = { kind: node.name.text, args: node.parameters.map((parameter) => parameter.name) };
              const result = ts.visitEachChild(node, visit, context);
              copiedController = previous;
              return result;
            }
            if (
              copiedController &&
              (ts.isArrowFunction(node) ||
                ts.isFunctionExpression(node) ||
                ts.isFunctionDeclaration(node) ||
                ts.isMethodDeclaration(node) ||
                ts.isGetAccessorDeclaration(node))
            ) {
              const previous = copiedController;
              copiedController = undefined;
              const result = ts.visitEachChild(node, visit, context);
              copiedController = previous;
              return result;
            }
            if (copiedController && ts.isReturnStatement(node) && node.expression)
              return f.updateReturnStatement(
                node,
                f.createCallExpression(f.createIdentifier("observeCopiedController"), undefined, [
                  node.expression,
                  f.createStringLiteral(copiedController.kind),
                  f.createArrayLiteralExpression([f.createSpreadElement(f.createIdentifier("arguments"))]),
                  sourceReceipt(),
                ]),
              );
            if (
              (!normalized.startsWith(productRoot) || node.name?.text === "useControlAnimation") &&
              ts.isFunctionDeclaration(node) &&
              ["useStateColor", "useContinuousMotion", "useControlAnimation"].includes(node.name?.text)
            ) {
              const previous = copiedPolicy;
              copiedPolicy = {
                kind:
                  node.name.text === "useStateColor"
                    ? "color"
                    : node.name.text === "useControlAnimation"
                      ? "control"
                      : "loop",
                args: node.parameters.map((parameter) => parameter.name),
              };
              const result = ts.visitEachChild(node, visit, context);
              copiedPolicy = previous;
              return result;
            }
            if (
              copiedPolicy &&
              (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node))
            ) {
              const previous = copiedPolicy;
              copiedPolicy = undefined;
              const result = ts.visitEachChild(node, visit, context);
              copiedPolicy = previous;
              return result;
            }
            if (copiedPolicy && ts.isReturnStatement(node) && node.expression) {
              return f.updateReturnStatement(
                node,
                f.createCallExpression(
                  f.createIdentifier(
                    copiedPolicy.kind === "control" ? "useObserveControlPolicy" : "useObserveCopiedPolicy",
                  ),
                  undefined,
                  [
                    node.expression,
                    ...(copiedPolicy.kind === "control" ? [] : [f.createStringLiteral(copiedPolicy.kind)]),
                    f.createArrayLiteralExpression(copiedPolicy.args),
                    ...(copiedPolicy.kind === "control" ? [sourceReceipt()] : []),
                  ],
                ),
              );
            }
            if (ts.isFunctionDeclaration(node) && node.name && node.body && /^[A-Z]/.test(node.name.text)) {
              const previous = origin;
              const previousCM = cmVariables,
                previousParameters = parameterVariables;
              cmVariables = new Set(cmVariables);
              parameterVariables = new Set(parameterVariables);
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
              cmVariables = previousCM;
              parameterVariables = previousParameters;
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
                            f.createCallExpression(
                              f.createIdentifier(
                                ids.has(id) && names.has(node.name.text)
                                  ? "useCadenceTestExecution"
                                  : "useCadenceDelegateExecution",
                              ),
                              undefined,
                              ids.has(id) && names.has(node.name.text)
                                ? [
                                    f.createStringLiteral(id),
                                    f.createStringLiteral(node.name.text),
                                    f.createArrayLiteralExpression(
                                      names.get(node.name.text).map((name) => f.createStringLiteral(name)),
                                    ),
                                    f.createStringLiteral(module),
                                    f.createStringLiteral(digest),
                                    f.createElementAccessExpression(
                                      f.createIdentifier("arguments"),
                                      f.createNumericLiteral(0),
                                    ),
                                  ]
                                : [
                                    f.createElementAccessExpression(
                                      f.createIdentifier("arguments"),
                                      f.createNumericLiteral(0),
                                    ),
                                  ],
                            ),
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
              normalized.endsWith("/lib/viewport-reveal.ts") &&
              ts.isCallExpression(result) &&
              ts.isPropertyAccessExpression(result.expression) &&
              result.expression.expression.getText(file) === "style" &&
              result.expression.name.text === "setProperty" &&
              result.arguments[0]?.getText(file) === "property"
            )
              return f.createCallExpression(f.createIdentifier("observeNativeDeclaration"), undefined, [
                f.createPropertyAccessExpression(f.createIdentifier("target"), "node"),
                result.arguments[0],
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  result,
                ),
              ]);
            if (ts.isVariableDeclaration(result) && result.initializer && ts.isCallExpression(result.initializer)) {
              const expression = result.initializer.expression;
              if (ts.isIdentifier(result.name)) {
                cmVariables.delete(result.name.text);
                parameterVariables.delete(result.name.text);
                if (ts.isIdentifier(expression) && motionHooks.has(expression.text)) cmVariables.add(result.name.text);
                if (
                  ts.isPropertyAccessExpression(expression) &&
                  expression.name.text === "parameters" &&
                  ts.isIdentifier(expression.expression) &&
                  cmVariables.has(expression.expression.text)
                )
                  parameterVariables.add(result.name.text);
              } else if (
                ts.isObjectBindingPattern(result.name) &&
                ts.isIdentifier(expression) &&
                motionScopeHooks.has(expression.text)
              )
                for (const member of result.name.elements)
                  if ((member.propertyName ?? member.name).getText(file) === "cm" && ts.isIdentifier(member.name))
                    cmVariables.add(member.name.text);
            }
            if (
              ts.isJsxAttribute(result) &&
              result.name.getText(file) === "transition" &&
              result.initializer &&
              ts.isJsxExpression(result.initializer) &&
              result.initializer.expression &&
              ts.isObjectLiteralExpression(result.initializer.expression)
            ) {
              const parts = [];
              const collect = (child) => {
                if (
                  ts.isPropertyAccessExpression(child) &&
                  ts.isIdentifier(child.expression) &&
                  parameterVariables.has(child.expression.text)
                )
                  parts.push(child);
                ts.forEachChild(child, collect);
              };
              collect(result.initializer.expression);
              if (!parts.length) return result;
              return f.updateJsxAttribute(
                result,
                result.name,
                f.updateJsxExpression(
                  result.initializer,
                  f.createCallExpression(f.createIdentifier("observeTransitionComposite"), undefined, [
                    result.initializer.expression,
                    f.createArrayLiteralExpression(parts),
                  ]),
                ),
              );
            }
            if (
              ts.isBinaryExpression(result) &&
              result.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
              ts.isPropertyAccessExpression(result.left) &&
              ts.isPropertyAccessExpression(result.left.expression) &&
              result.left.expression.name.text === "style" &&
              ["transform", "opacity", "width", "height"].includes(result.left.name.text)
            )
              return f.createCallExpression(f.createIdentifier("observeNativeStyle"), undefined, [
                result.left.expression.expression,
                f.createStringLiteral(result.left.name.text),
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  result.right,
                ),
              ]);
            if (
              ts.isCallExpression(result) &&
              ts.isPropertyAccessExpression(result.expression) &&
              result.expression.name.text === "setKeyframes"
            )
              return f.createCallExpression(f.createIdentifier("observeNativeKeyframes"), undefined, [
                result.expression.expression,
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  f.createArrayLiteralExpression(result.arguments),
                ),
                result.expression.questionDotToken ? f.createTrue() : f.createFalse(),
                result.questionDotToken ? f.createTrue() : f.createFalse(),
              ]);
            if (
              ts.isCallExpression(result) &&
              ts.isPropertyAccessExpression(result.expression) &&
              result.expression.name.text === "animate" &&
              !result.questionDotToken &&
              !result.expression.questionDotToken
            )
              return f.createCallExpression(f.createIdentifier("observeNativeAnimation"), undefined, [
                result.expression.expression,
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  f.createArrayLiteralExpression(result.arguments),
                ),
              ]);
            if (
              ts.isCallExpression(result) &&
              ((ts.isIdentifier(result.expression) && effects.has(result.expression.text)) ||
                (ts.isPropertyAccessExpression(result.expression) &&
                  ts.isIdentifier(result.expression.expression) &&
                  reactNamespaces.has(result.expression.expression.text) &&
                  /^use(?:Layout|Insertion)?Effect$/.test(result.expression.name.text))) &&
              result.arguments.length
            ) {
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
              opening ||
              (ts.isCallExpression(result) && ts.isIdentifier(result.expression) && renders.has(result.expression.text))
            ) {
              const sourceSite = id ? id : normalized.slice(normalized.lastIndexOf("/registry/cadence/") + 1);
              let observed =
                host || !opening
                  ? call("host", [
                      result,
                      f.createStringLiteral(`${sourceSite}:${node.getStart(file)}`),
                      f.createStringLiteral(module),
                      f.createStringLiteral(digest),
                    ])
                  : result;
              if (opening) observed = call("child", [observed]);
              return node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
                ? f.createJsxExpression(undefined, observed)
                : observed;
            }
            return result;
          };
          return (node) => ts.visitNode(node, visit);
        },
      ]);
      const code = ts.createPrinter().printFile(transformed.transformed[0]);
      transformed.dispose();
      return {
        code: `import {useCadenceTestExecution,useCadenceDelegateExecution,bindCurrentExecution,registerExecutionModule} from ${JSON.stringify(helper)};\nimport {useObserveCopiedPolicy,useObserveControlPolicy,observeCopiedController,observeResolvedParameters,observeNativeAnimation,observeNativeKeyframes,observeNativeStyle,observeNativeDeclaration,observeTransitionComposite,observePolicyBinding} from ${JSON.stringify(controllerHelper)};\nregisterExecutionModule(${JSON.stringify(module)},${JSON.stringify(digest)});\n${code}`,
        map: null,
      };
    },
  };
}
