import ts from "typescript";

// The exact properties the installed default interpolators write. Payload
// fields sharing names such as x/y on a polar datum are not sector geometry.
export const seriesGeometryProperties = {
  Bar: ["x", "y", "width", "height"],
  Line: ["x", "y"],
  Area: ["x", "y"],
  Pie: ["startAngle", "endAngle"],
  Scatter: ["cx", "cy", "size"],
  Radar: ["x", "y"],
  RadialBar: ["startAngle", "endAngle"],
  Funnel: ["x", "y", "upperWidth", "lowerWidth", "height"],
};

export function observeEmbla(code, file) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let offset;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "Animations")
      for (const statement of node.body.statements)
        if (ts.isReturnStatement(statement) && statement.expression?.getText(source) === "self")
          offset = statement.getStart(source);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (offset === undefined) return;
  return (
    code.slice(0, offset) +
    'Object.defineProperty(self,"__cadenceObserve",{value:()=>({animationId,lastTimeStamp,accumulatedTime})});\n' +
    code.slice(offset)
  );
}

/** Observe the installed interpolator's inputs/result without changing either reference. */
export function observeSeries(code, file) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const replacements = [];
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /^default(Bar|Line|Area|Pie|Scatter|Radar|RadialBar|Funnel)AnimateItems$/.test(node.name.text) &&
      node.initializer
    ) {
      const series = node.name.text.slice(7, -12);
      const original = code.slice(node.initializer.getStart(source), node.initializer.end);
      const wrapped = `((installed)=>(...args)=>{
        const result=installed(...args);
        const keys=${JSON.stringify(seriesGeometryProperties[series])};
        const geometry=value=>value && Object.fromEntries(keys.filter(key=>typeof value[key] === "number").map(key=>[key,value[key]]));
        const controller=window.w2controllers?.at(-1);
        const update=controller?.updates.at(-1);
        const matched=update && Object.is(update.value,args[1]);
        (window.nativeInterpolations ??= []).push({series:${JSON.stringify(series)},time:performance.now(),progress:args[1],globalProgress:matched ? update.phaseProgress : null,phaseId:controller?.phase ? window.engineIdentity(controller.phase) : null,controllerId:controller ? window.engineIdentity(controller) : null,origin:controller?.origin,associated:Boolean(matched),previous:args[0]?.map(item=>geometry(item.prev)),target:args[0]?.map(item=>geometry(item.next)),geometry:result?.map(geometry)});
        return result;
      })(${original})`;
      replacements.push({ start: node.initializer.getStart(source), end: node.initializer.end, wrapped });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    code = code.slice(0, replacement.start) + replacement.wrapped + code.slice(replacement.end);
  return replacements.length ? code : undefined;
}
