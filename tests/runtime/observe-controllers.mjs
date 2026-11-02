/** Observes the installed public controller's real callbacks and cleanup. */
export const observeControllers = {
  name: "w2-observe-chart-controller",
  enforce: "pre",
  transform(code, id) {
    if (!id.replaceAll("\\", "/").endsWith("/registry/cadence/chart/index.tsx")) return;
    const head = /(\(_timeout,\s*handle,\s*listener\)\s*=>\s*\{)/;
    if (!head.test(code)) throw new Error("Missing public Chart controller");
    code = code.replace(
      head,
      `$1
const observed = {handle, state:"running", ticks:[], updates:[], applied:[]};
(window.w2controllers ??= []).push(observed);
(window.w2controllerSets ??= new Set()).add(running.current);
const installedListener = listener;
listener = value => {observed.updates.push({value,time:performance.now()});return installedListener(value);};`,
    );
    code = code.replace("handle.complete();", 'observed.state="finished"; handle.complete();');
    code = code.replace(/(return \(\) => \{\s*)done = true;/, '$1observed.state="cancelled"; done = true;');
    code = code.replace(/(const tick = \(now[^)]*\) => \{)/, "$1 observed.ticks.push(now);");
    code = code.replace(
      "const from = Number(handle.getFrom());",
      "observed.applied.push({time:now,duration,progress}); const from = Number(handle.getFrom());",
    );
    return code;
  },
};
