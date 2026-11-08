/** Observes the installed public controller's real callbacks and cleanup. */
export const observeControllers = {
  name: "w2-observe-chart-controller",
  enforce: "pre",
  transform(code, id) {
    if (!/(?:registry|components)\/cadence\/chart\/index\.tsx$/.test(id.replaceAll("\\", "/"))) return;
    const head = /(\(_timeout,\s*handle,\s*listener(?:,\s*phase)?\)\s*=>\s*\{)/;
    if ((code.match(new RegExp(head, "g"))?.length ?? 0) !== 1) throw new Error("Expected one public Chart controller");
    code = code.replace(
      head,
      `$1
const observed = {handle, phase:typeof phase === "undefined" ? null : phase, origin:typeof phase === "undefined" ? 0 : (phase?.progress ?? 0), created:performance.now(), state:"running", ticks:[], updates:[], applied:[], readClock:()=>current.current};
(window.w2controllers ??= []).push(observed);
(window.w2controllerSets ??= new Set()).add(running.current);
const installedListener = listener;
listener = value => {observed.updates.push({value,time:performance.now(),phaseProgress:observed.phase?.progress});return installedListener(value);};`,
    );
    const completions = code.match(/handle\.complete\(\)/g)?.length ?? 0;
    if (completions < 1 || completions > 2) throw new Error(`Unsupported native completion sites: ${completions}`);
    code = code.replaceAll("handle.complete()", '(observed.state="finished", handle.complete())');
    const retire = /const retire = \(settle = false(?:, terminal\?: MotionSettlement)?\) => \{/g;
    const cleanup = /(return \(\) => \{\s*)done = true;/g;
    const retireCount = code.match(retire)?.length ?? 0,
      cleanupCount = code.match(cleanup)?.length ?? 0;
    if (retireCount + cleanupCount !== 1)
      throw new Error(`Expected one native retirement site: ${retireCount}/${cleanupCount}`);
    code = retireCount
      ? code.replace(retire, '$& if (observed.state !== "finished") observed.state="cancelled";')
      : code.replace(cleanup, '$1observed.state="cancelled"; done = true;');
    const tick = /(const tick = \(now[^)]*\) => \{)/g;
    const from = "const from = Number(handle.getFrom());";
    if ((code.match(tick)?.length ?? 0) !== 1 || code.split(from).length !== 2)
      throw new Error("Expected one native tick and interpolation site");
    code = code.replace(tick, "$1 observed.ticks.push(now);");
    code = code.replace(from, `observed.applied.push({time:now,duration,progress}); ${from}`);
    return code;
  },
};
