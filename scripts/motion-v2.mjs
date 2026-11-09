/** Source-bound per-item gate. Runtime records come only from successful tests;
 * registry checking checks the plan, and the mandatory reporter checks execution.
 * Neither phase consumes a persisted report as a source of positive evidence. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { installationPlan } from "./installation.mjs";
import { cssPolicyBindings, parameterWriterBindings, stringPresentationBindings } from "./motion-manifest.mjs";
import { motionSource, valueExports } from "./motion-source.mjs";

export const digest = (source) => createHash("sha256").update(source).digest("hex");
const canonical = (value) => JSON.stringify([...value].sort());
const formProperties = {
  "text.change/changed-runs": ["opacity"],
  "number.roll/reels": ["transform"],
  "reveal/viewport": ["opacity", "transform"],
  "layout.shared/selection": ["transform"],
  "data.transition/directional-content": ["opacity", "transform"],
  "data.transition/month-grid": ["opacity", "transform"],
  "layout.move/size-linked": ["transform"],
  "data.transition/opacity": ["opacity"],
  "enter.pop/opacity": ["opacity"],
  "enter.pop/surface": ["opacity", "transform"],
  "exit.fade/opacity": ["opacity"],
  "feedback.press/scale": ["transform"],
  "state.morph/indicator": ["opacity", "transform"],
  "layout.move/position": ["transform"],
  "data.transition/determinate": ["transform"],
  "popup.anchored/presence": ["opacity", "transform"],
  "popup.anchored/edge": ["transform"],
  "popup.anchored/edge-exit": ["transform"],
  "popup.anchored/ending": ["opacity", "transform"],
  "popup.anchored/opacity-enter": ["opacity"],
  "popup.anchored/opacity-exit": ["opacity"],
};

/** Literal authored hosts in the selected live export closure, preserving source
 * offsets. An ambiguous broad export must name its exact slots in regions. */
export function motionHostRegions(source, exported) {
  const selected = motionSource(source, [exported]).source;
  const tree = ts.createSourceFile("component.tsx", selected, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hosts = [];
  const visit = (node) => {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (opening) {
      const slot = opening.attributes.properties.find(
        (attr) => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "data-slot",
      );
      if (slot?.initializer && ts.isStringLiteral(slot.initializer))
        hosts.push({ slot: slot.initializer.text, offset: node.getStart(tree) });
    }
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "useRender") {
      const properties = [];
      const collect = (child) => {
        if (
          ts.isPropertyAssignment(child) &&
          child.name.getText(tree) === '"data-slot"' &&
          ts.isStringLiteral(child.initializer)
        )
          properties.push(child.initializer.text);
        ts.forEachChild(child, collect);
      };
      for (const arg of node.arguments) collect(arg);
      for (const slot of properties) hosts.push({ slot, offset: node.getStart(tree) });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return hosts;
}

/** An explicitly native/N/A boundary cannot hide authored animation. Legacy
 * CSS/pseudo-element clocks and raw engine props have no source-bound parameter
 * executor here; reject them rather than guessing a named preset from timing. */
export function unboundMotionSyntax(source) {
  const tree = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const problems = new Set();
  const writers = new Set(),
    frames = new Set();
  const geometryPolicies = new Set();
  const collectPolicies = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.name.text === "parameters" &&
      node.initializer.arguments[0]?.getText(tree).includes('"geometry.resize/measured"')
    )
      geometryPolicies.add(node.name.text);
    ts.forEachChild(node, collectPolicies);
  };
  collectPolicies(tree);
  for (const statement of tree.statements)
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      ["motion", "motion/react"].includes(statement.moduleSpecifier.text)
    ) {
      const imports = statement.importClause?.namedBindings;
      if (imports && ts.isNamedImports(imports))
        for (const imported of imports.elements) {
          if (["animate", "animateSingleValue", "useAnimate"].includes((imported.propertyName ?? imported.name).text))
            writers.add(imported.name.text);
          if ((imported.propertyName ?? imported.name).text === "frame") frames.add(imported.name.text);
        }
    }
  const visit = (node) => {
    if (
      ts.isJsxAttribute(node) &&
      /^(?:animate|initial|exit|whileTap|whileHover|whileFocus|whileInView|layout|layoutId)$/.test(
        node.name.getText(tree),
      )
    )
      problems.add(`raw engine prop ${node.name.getText(tree)}`);
    if (
      ts.isStringLiteralLike(node) &&
      /(?:^|[\s:])(?:animate-(?!none\b)|transition-(?!none\b)|duration-(?!0\b)|delay-(?!0\b))/.test(node.text)
    )
      problems.add("authored CSS clock/loop, including nested or pseudo-element variants");
    if (
      ts.isPropertyAssignment(node) &&
      /^(?:["']?)(?:animation\w*|transition\w*)(?:["']?)$/.test(node.name.getText(tree))
    ) {
      const value = node.initializer.getText(tree);
      const object = node.parent,
        call = object.parent;
      const geometryPolicy =
        node.name.getText(tree) === "transition" &&
        ts.isPropertyAccessExpression(node.initializer) &&
        geometryPolicies.has(node.initializer.expression.getText(tree)) &&
        ts.isCallExpression(call) &&
        call.arguments[1] === object &&
        ts.isPropertyAccessExpression(call.expression) &&
        call.expression.name.text === "commit" &&
        source.includes("createMeasuredGeometry(");
      if (!geometryPolicy && !/^(?:["'](?:none|0s?|0ms)["']|0)$/.test(value))
        problems.add(`authored style ${node.name.getText(tree)}`);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      /^(?:animate|setKeyframes|transition)$/.test(node.expression.name.text)
    )
      problems.add(`unbound ${node.expression.name.text}() writer`);
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      frames.has(node.expression.expression.text)
    )
      problems.add(`unbound frame.${node.expression.name.text}() clock`);
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (writers.has(node.expression.text) || node.expression.text === "requestAnimationFrame")
    )
      problems.add(`unbound ${node.expression.text}() clock`);
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ["Animation", "KeyframeEffect"].includes(node.expression.text)
    )
      problems.add(`unbound native ${node.expression.text} writer`);
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      /^(?:animation|transition)/.test(node.left.name.text) &&
      !/^(?:["'](?:none|0s?|0ms)["']|0)$/.test(node.right.getText(tree))
    )
      problems.add(`unbound style ${node.left.name.text} clock`);
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "setProperty" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      /^(?:transition|animation)/.test(node.arguments[0].text)
    )
      problems.add(`unbound CSS declaration ${node.arguments[0].text}`);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return [...problems];
}

export async function motionV2Plan(root, registry, contracts, adoption) {
  const problems = [],
    actions = [],
    boundaries = [];
  // One analysis snapshot; runtime receipts still rebind the actual loaded bytes.
  const files = new Map();
  const read = (file) => {
    if (!files.has(file)) files.set(file, readFile(path.join(root, file), "utf8"));
    return files.get(file);
  };
  const physicalRegions = new Map();
  const closeSources = async (file, selected, installed, sources, seen = new Set()) => {
    const key = JSON.stringify([file, selected]);
    if (seen.has(key)) return;
    seen.add(key);
    const source = await read(file);
    sources[file] = digest(source);
    for (const dependency of motionSource(source, selected).imports) {
      if (!dependency.path.startsWith(".")) continue;
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), dependency.path));
      const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.tsx`].find((candidate) =>
        installed.has(candidate),
      );
      if (!target) {
        problems.push(`${file}: v2 live import ${dependency.path} is outside the installation closure`);
        continue;
      }
      await closeSources(target, [dependency.name], installed, sources, seen);
    }
  };
  for (const [id, contract] of contracts) {
    if (contract.migration !== "v2") continue;
    const report = (message) => problems.push(`${id}: v2 ${message}`);
    if (contract.referenceProblems.length) {
      report("valid six-capability contract required");
      continue;
    }
    for (const binding of adoption.bindings.filter((binding) => binding.item === id)) {
      const [, exported] = binding.anchor.split("#");
      const hostOwner = binding.hostOwner ?? binding.owner;
      const file = `registry/cadence/${hostOwner}/index.tsx`;
      const selections = [
        { file, selected: [exported] },
        ...binding.references.flatMap((reference) => reference.selections ?? []),
      ];
      const candidates = [];
      for (const selection of selections)
        for (const selected of selection.selected) {
          const bytes = await read(selection.file);
          const key = JSON.stringify([selection.file, selected]);
          if (!physicalRegions.has(key)) physicalRegions.set(key, motionHostRegions(bytes, selected));
          for (const host of physicalRegions.get(key))
            if (!candidates.some((candidate) => candidate.file === selection.file && candidate.offset === host.offset))
              candidates.push({ ...host, file: selection.file, source: bytes, selected });
        }
      let hosts = candidates;
      const region = contract.regions?.[contract.bindings.get(binding.binding).part];
      if (region) hosts = hosts.filter((host) => region.includes(host.slot));
      if (["text.change/changed-runs", "number.roll/reels"].includes(binding.targetForm))
        hosts = hosts.filter((host) =>
          stringPresentationBindings(motionSource(host.source, [host.selected]).source).some(
            (adapter) =>
              adapter.form === binding.targetForm && adapter.slot === host.slot && adapter.offset === host.offset,
          ),
        );
      if (!hosts.length || (!region && hosts.length !== 1)) {
        report(`${binding.binding}: explicit unambiguous physical regions required`);
        continue;
      }
      for (const host of hosts) {
        const source = host.source,
          exported = host.selected;
        let properties = formProperties[binding.targetForm];
        const controls = parameterWriterBindings(motionSource(source, [exported]).source).filter(
          (writer) => writer.form === binding.targetForm && writer.slot === host.slot && writer.offset === host.offset,
        );
        if (controls.length === 1 && controls[0].properties) {
          if (
            !controls[0].properties.length ||
            controls[0].properties.some((property) => !properties?.includes(property))
          ) {
            report(
              `${binding.binding}: control target must use the form's exact allowed properties ${JSON.stringify(properties)}`,
            );
            continue;
          }
          properties = controls[0].properties;
        }
        if (binding.targetForm.startsWith("state.color/")) {
          const policies = cssPolicyBindings(motionSource(source, [exported]).source).filter(
            (policy) => policy.kind === "useStateColor" && policy.slot === host.slot,
          );
          if (policies.length === 1) properties = policies[0].properties;
        }
        if (binding.targetForm === "data.transition/continuous") {
          const selected = motionSource(source, [exported]).source;
          // Keep a spin/pulse distinction from actual connected syntax, never a
          // default from the desired capability.
          const loops = cssPolicyBindings(selected).filter(
            (policy) => policy.kind === "useContinuousMotion" && policy.slot === host.slot,
          );
          if (loops.length === 1) properties = [loops[0].loop === "spin" ? "transform" : "opacity"];
        }
        if (binding.targetForm === "geometry.resize/measured") {
          // Axis is part of the physical region's authored proof, not guessed
          // from a tier or from the geometry recipe's general allowance.
          properties = contract.axes?.[contract.bindings.get(binding.binding).part];
        }
        if (!properties?.length) {
          report(`${binding.binding}: exact property recogniser required for ${host.slot}`);
          continue;
        }
        const sources = { [file]: digest(await read(file)), [host.file]: digest(source) };
        const installed = new Set(installationPlan(registry.items, id).files.map((entry) => entry.path));
        await closeSources(file, [binding.anchor.split("#")[1]], installed, sources);
        for (const reference of binding.references) {
          sources[reference.file] = digest(await read(reference.file));
          for (const via of reference.via) {
            const dependency = via.split("#")[0];
            sources[dependency] = digest(await read(dependency));
          }
          for (const selection of reference.selections ?? [])
            sources[selection.file] = digest(await read(selection.file));
        }
        if (binding.scopeAnchor) {
          const scopeFile = `registry/cadence/${binding.owner}/index.tsx`;
          sources[scopeFile] = digest(await read(scopeFile));
        }
        const siteOwner = host.file.match(/^registry\/cadence\/([^/]+)\/index\.tsx$/)?.[1] ?? host.file;
        actions.push({
          ...binding,
          hostFile: host.file,
          preset: contract.bindings.get(binding.binding).preset,
          slot: host.slot,
          site: `${siteOwner}:${host.offset}`,
          properties: [...properties].sort(),
          sources,
        });
      }
    }
    for (const boundary of adoption.boundaries.filter((boundary) => boundary.item === id)) {
      const anchors = contract.parts[boundary.part];
      for (const anchor of anchors) {
        const [owner, exported] = anchor.split("#"),
          file = `registry/cadence/${owner}/index.tsx`;
        const source = await read(file);
        let hosts = motionHostRegions(source, exported);
        const region = contract.regions?.[boundary.part];
        if (region) hosts = hosts.filter((host) => region.includes(host.slot));
        if (
          !hosts.length &&
          !adoption.bindings.some((binding) => binding.item === id && binding.scopeAnchor === anchor)
        ) {
          report(`${boundary.capability}/@${boundary.part}: physical native boundary required`);
          continue;
        }
        boundaries.push({ ...boundary, anchor, file, digest: digest(source), slots: hosts.map((host) => host.slot) });
      }
    }
    for (const native of (adoption.nativeActions ?? []).filter((native) => native.item === id)) {
      const source = await read(native.file);
      const hosts = motionHostRegions(source, native.anchor.split("#")[1]);
      if (!hosts.length) {
        report(`${native.binding}: native physical host required`);
        continue;
      }
      boundaries.push({
        item: id,
        capability: `Native ${native.binding}`,
        part: native.part,
        anchor: native.anchor,
        relationship: "native",
        file: native.file,
        digest: digest(source),
        slots: hosts.map((host) => host.slot),
      });
    }
    const required = [...contract.bindings.keys()];
    for (const binding of required)
      if (
        !actions.some((action) => action.item === id && action.binding === binding) &&
        !(adoption.nativeActions ?? []).some((native) => native.item === id && native.binding === binding)
      )
        report(`${binding}: no source-bound action plan`);
    const localSource = await read(`registry/cadence/${id}/index.tsx`);
    for (const exported of valueExports(localSource)) {
      for (const issue of unboundMotionSyntax(motionSource(localSource, [exported]).source))
        report(`${id}#${exported}: ${issue}; use a recognised source-bound executor before v2 adoption`);
      for (const writer of parameterWriterBindings(motionSource(localSource, [exported]).source))
        if (
          !actions.some(
            (action) =>
              action.item === id &&
              action.anchor === `${id}#${exported}` &&
              action.slot === writer.slot &&
              action.targetForm === writer.form &&
              action.site === `${id}:${writer.offset}`,
          )
        )
          report(
            `${id}#${exported}/${writer.slot ?? "unlabelled host"}: live parameter writer has no exact physical target action`,
          );
      for (const policy of cssPolicyBindings(motionSource(localSource, [exported]).source)) {
        if (
          !actions.some(
            (action) =>
              action.item === id &&
              action.anchor === `${id}#${exported}` &&
              action.slot === policy.slot &&
              (policy.kind === "useStateColor"
                ? action.targetForm.startsWith("state.color/")
                : action.targetForm === "data.transition/continuous"),
          )
        )
          report(`${id}#${exported}/${policy.slot}: live policy region has no target action`);
      }
    }
  }
  return { problems, actions, boundaries };
}

/** One record already joins the entire physical action. Never join numerical
 * identities across tests/workers; all relationships are checked within a row. */
export function motionV2ExecutionProblems(id, plan, tests) {
  const problems = [];
  const passed = tests.filter((test) => test.passed);
  for (const action of plan.actions.filter((action) => action.item === id)) {
    for (const mode of ["full", "reduced", "none"]) {
      const found = passed.some((test) =>
        (test.records ?? []).some((record) => {
          if (
            record.binding !== action.binding ||
            record.item !== id ||
            record.mode !== mode ||
            record.preset !== action.preset ||
            record.form !== action.targetForm ||
            record.slot !== action.slot ||
            record.site !== action.site
          )
            return false;
          if (canonical(record.properties ?? []) !== canonical(action.properties)) return false;
          if (
            !record.changed ||
            !record.policy ||
            !record.live ||
            !record.controller ||
            !record.host ||
            !record.instance
          )
            return false;
          if (record.relationship !== action.relationship || record.anchor !== action.anchor) return false;
          if (
            action.relationship === "composed"
              ? !(record.scope && record.scope !== record.instance)
              : record.scope !== record.instance
          )
            return false;
          return Object.entries(action.sources).every(([file, sha]) => record.sources?.[file] === sha);
        }),
      );
      if (!found)
        problems.push(
          `${id}: v2 execute ${action.binding} on ${action.anchor}/${action.slot} with exact source/property/preset policy in ${mode}`,
        );
    }
  }
  for (const boundary of plan.boundaries.filter((boundary) => boundary.item === id)) {
    const found = passed.some((test) =>
      (test.boundaries ?? []).some(
        (record) =>
          record.item === id &&
          record.capability === boundary.capability &&
          record.part === boundary.part &&
          record.anchor === boundary.anchor &&
          record.relationship === boundary.relationship &&
          record.digest === boundary.digest &&
          canonical(record.slots ?? []) === canonical(boundary.slots) &&
          record.live &&
          record.native,
      ),
    );
    if (!found)
      problems.push(
        `${id}: v2 verify ${boundary.capability}/@${boundary.part} ${boundary.relationship} boundary on ${boundary.anchor}`,
      );
  }
  return problems;
}
