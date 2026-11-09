import ts from "typescript";

const cache = new Map();
const models = new Map();

// A conservative static boundary, not a runtime conformance certificate. Keep
// source positions so form recognisers can inspect actual syntax, not comments.
export function motionSource(source, exports) {
  const key = `${exports?.slice().sort().join(",") ?? "*"}\0${source}`;
  if (cache.has(key)) return cache.get(key);
  let model = models.get(source);
  if (!model) {
    const file = ts.createSourceFile("motion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const host = ts.createCompilerHost({ noLib: true, noResolve: true });
    host.getSourceFile = (name) => (name === file.fileName ? file : undefined);
    model = {
      file,
      checker: ts.createProgram([file.fileName], { noLib: true, noResolve: true }, host).getTypeChecker(),
    };
  }
  // The same module is visited through several selected exports. Reuse binding,
  // not its live-root result; bound memory independently of the string cache.
  models.delete(source);
  if (models.size >= 16) models.delete(models.keys().next().value);
  models.set(source, model);
  const { file, checker } = model;
  const removed = [];
  const erase = (node, replacement = "") => removed.push([node.getStart(file), node.end, replacement]);
  const dead = (node) => {
    if (ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return erase(node);
    if (
      ts.isIfStatement(node) &&
      [ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.TrueKeyword].includes(node.expression.kind)
    ) {
      if (node.expression.kind === ts.SyntaxKind.FalseKeyword) erase(node.thenStatement, ";");
      else if (node.elseStatement) erase(node.elseStatement, ";");
    }
    if (
      ts.isConditionalExpression(node) &&
      [ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.TrueKeyword].includes(node.condition.kind)
    )
      erase(node.condition.kind === ts.SyntaxKind.FalseKeyword ? node.whenTrue : node.whenFalse, "0");
    if (
      ts.isBinaryExpression(node) &&
      ((node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
        node.left.kind === ts.SyntaxKind.FalseKeyword) ||
        (node.operatorToken.kind === ts.SyntaxKind.BarBarToken && node.left.kind === ts.SyntaxKind.TrueKeyword))
    )
      erase(node.right, "0");
    if (
      (ts.isWhileStatement(node) && node.expression.kind === ts.SyntaxKind.FalseKeyword) ||
      (ts.isForStatement(node) && node.condition?.kind === ts.SyntaxKind.FalseKeyword)
    )
      erase(node.statement, ";");
    if (ts.isBlock(node)) {
      let terminal = false;
      for (const statement of node.statements) {
        if (terminal) erase(statement);
        if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) terminal = true;
      }
    }
    ts.forEachChild(node, dead);
  };
  dead(file);
  const hidden = (node) => removed.some(([start, end]) => node.getStart(file) >= start && node.end <= end);
  const declarations = new Map();
  const dependencies = new Map();
  const roots = new Set();
  const imports = new Map();
  const exported = new Set();
  for (const statement of file.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const entry of statement.exportClause.elements) {
        if (entry.isTypeOnly || (exports && !exports.includes(entry.name.text))) continue;
        const symbol = checker.getSymbolAtLocation(entry.propertyName ?? entry.name);
        if (symbol) roots.add(checker.getExportSpecifierLocalTargetSymbol(entry) ?? symbol);
        exported.add((entry.propertyName ?? entry.name).text);
      }
    if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (statement.name && (!exports || exports.includes(statement.name.text))) exported.add(statement.name.text);
      if (ts.isVariableStatement(statement))
        for (const entry of statement.declarationList.declarations)
          if (ts.isIdentifier(entry.name) && (!exports || exports.includes(entry.name.text)))
            exported.add(entry.name.text);
    }
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      !statement.importClause?.isTypeOnly
    ) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const entry of bindings.elements)
          if (!entry.isTypeOnly)
            imports.set(checker.getSymbolAtLocation(entry.name), {
              path: statement.moduleSpecifier.text,
              name: (entry.propertyName ?? entry.name).text,
              local: entry.name.text,
            });
    }
  }
  const collect = (node, owner) => {
    if (hidden(node)) return;
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name && ts.isIdentifier(node.name)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      declarations.set(symbol, node);
      if (node.parent === file || (ts.isVariableDeclaration(node) && node.parent.parent.parent === file)) {
        if (exported.has(node.name.text)) roots.add(symbol);
      }
      owner = symbol;
    }
    if (ts.isIdentifier(node) && !ts.isDeclarationName(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      if (symbol && owner) {
        const refs = dependencies.get(owner) ?? new Set();
        refs.add(symbol);
        dependencies.set(owner, refs);
      }
    }
    ts.forEachChild(node, (child) => collect(child, owner));
  };
  collect(file);
  // Local snippets used by parser tests have no public export boundary.
  if (!exports && !roots.size)
    for (const [symbol, node] of declarations)
      if (ts.isFunctionDeclaration(node) && node.parent === file) roots.add(symbol);
  const live = new Set();
  const visit = (symbol) => {
    if (live.has(symbol)) return;
    live.add(symbol);
    for (const dependency of dependencies.get(symbol) ?? []) visit(dependency);
  };
  for (const root of roots) visit(root);
  for (const [symbol, node] of declarations) if (!live.has(symbol)) erase(node);
  // Remove trivia independently; a string containing code remains a string.
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, source);
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan())
    if ([ts.SyntaxKind.SingleLineCommentTrivia, ts.SyntaxKind.MultiLineCommentTrivia].includes(token))
      removed.push([scanner.getTokenPos(), scanner.getTextPos()]);
  const chars = source.split("");
  for (const [start, end, replacement] of removed) {
    for (let index = start; index < end; index++) if (!/[\r\n]/.test(chars[index])) chars[index] = " ";
    if (replacement) chars[start] = replacement;
  }
  const result = {
    source: chars.join(""),
    imports: [...imports].filter(([symbol]) => live.has(symbol)).map(([, value]) => value),
  };
  if (cache.size >= 512) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}

export function transitionCalls(source) {
  const file = ts.createSourceFile("motion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const recipes = [];
  const walk = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "transition" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      recipes.push(node.arguments[0].text);
    ts.forEachChild(node, walk);
  };
  walk(file);
  return recipes;
}

/** Follow local clock values into a writer input, rather than accepting a
 * resolver result rendered as text or used only for a diagnostic dependency. */
export function transitionUsedByWriter(source, recipe) {
  const file = ts.createSourceFile("motion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const scopes = new Map();
  const assignments = new Map();
  const scopeOf = (node) => {
    while (node && !ts.isBlock(node) && !ts.isSourceFile(node)) node = node.parent;
    return node;
  };
  const collect = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const scope = scopeOf(node.parent);
      const bindings = scopes.get(scope) ?? new Map();
      bindings.set(node.name.text, node.initializer);
      scopes.set(scope, bindings);
    }
    ts.forEachChild(node, collect);
  };
  collect(file);
  const bindingScope = (name, node) => {
    let scope = scopeOf(node.parent);
    while (scope && !scopes.get(scope)?.has(name)) scope = scopeOf(scope.parent);
    return scope;
  };
  const assign = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left)
    ) {
      let base = node.left.expression;
      while (ts.isPropertyAccessExpression(base)) base = base.expression;
      if (ts.isIdentifier(base)) {
        const scope = bindingScope(base.text, node);
        const values = assignments.get(scope) ?? new Map();
        const key = node.left.getText(file);
        values.set(key, [...(values.get(key) ?? []), node.right]);
        assignments.set(scope, values);
      }
    }
    ts.forEachChild(node, assign);
  };
  assign(file);
  const contains = (node, seen = new Set()) => {
    if (seen.has(node)) return false;
    seen.add(node);
    if (ts.isPropertyAccessExpression(node)) {
      let base = node.expression;
      while (ts.isPropertyAccessExpression(base)) base = base.expression;
      if (
        ts.isIdentifier(base) &&
        (assignments.get(bindingScope(base.text, node))?.get(node.getText(file)) ?? []).some((value) =>
          contains(value, seen),
        )
      )
        return true;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "transition" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === recipe
    )
      return true;
    if (ts.isIdentifier(node) && !ts.isDeclarationName(node)) {
      let scope = scopeOf(node.parent);
      while (scope) {
        const binding = scopes.get(scope)?.get(node.text);
        if (binding) return contains(binding, seen);
        scope = scopeOf(scope.parent);
      }
    }
    let found = false;
    ts.forEachChild(node, (child) => {
      if (contains(child, seen)) found = true;
    });
    return found;
  };
  let found = false;
  const walk = (node) => {
    const attribute =
      ts.isJsxAttribute(node) &&
      (["transition", "style", "animationDuration"].includes(node.name.getText(file)) ||
        (node.name.getText(file) === "value" &&
          /(?:Provider|Context)$/.test(node.parent.parent.tagName.getText(file))));
    const call =
      ts.isCallExpression(node) &&
      /^(?:animate|animateSingleValue|useEmblaCarousel|.*\.(?:start|commit|retime|useDuration))$/.test(
        node.expression.getText(file),
      );
    if ((attribute || call) && contains(node)) found = true;
    ts.forEachChild(node, walk);
  };
  walk(file);
  return found;
}
