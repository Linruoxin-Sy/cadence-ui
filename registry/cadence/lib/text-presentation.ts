"use client";

import type { createCapturedHandoff } from "./captured-handoff";
import {
  bindMotionParameters,
  handoffValue,
  motionLimits,
  motionMilliseconds,
  resolveStaggerParameters,
  textProofLimits,
  textReplace,
} from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import {
  createMotionTransaction,
  knownTextGeometry,
  type MotionLease,
  type MotionRevision,
  nativeTextHeightEcho,
  textGeometryProperties,
} from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { boundTextRevision, changedTextGroups, createTextSnapshot, diffText, shapeTextDiff } from "./text-diff";
import {
  followTextLayout,
  nativeTextContext,
  outgoingTextPaint,
  ownedTextHighlights,
  proveTextLayout,
  selectedTextContext,
  surfaceOnlyAnimation,
  textPaintSignature,
  textSurfacePaint,
} from "./text-layout";

const binding = bindMotionParameters(textReplace, "text.change/changed-runs");
type Capture = Parameters<ReturnType<typeof createCapturedHandoff>["commit"]>[0]["capture"];
let nextMask = 0;
export interface TextPresentationCommit {
  value: string;
  revision: MotionRevision;
  cm: CadenceMotion;
  /** The native owner's existing semantic slot/entity identity. */
  entity: unknown;
  locale?: string;
  granularity?: "auto" | "grapheme" | "word";
  characterStagger?: boolean;
  visible?: boolean;
  capture?: Capture;
  sourceRetired?: boolean;
  /** Compound Select commits its sole size owner before claiming destination paint. */
  deferHandoff?: boolean;
  /** Expected prior display when a compound primitive changes renderer in an editor. */
  nativeBaseline?: string;
  /** Final-width selection-strip adapter; authority still requires real current leases. */
  stripGeometry?: boolean;
}

/** Internal plain-string boundary. One native Text node; no child traversal,
 * semantic decomposition, per-frame layout reads or independent geometry owner.
 * Adapter owns explicit commits and physical disposal, never a removal scanner.
 */
export function createTextPresentation(
  host: HTMLElement,
  transaction = createMotionTransaction(),
  /** Native composition supplies a dedicated coordinator only when it owns origins.
   * This controller disposes it; ordinary text never reaches the handoff engine. */
  handoff?: ReturnType<typeof createCapturedHandoff>,
  sharedHandoff = false,
) {
  const registration = transaction.register(host);
  const doc = host.ownerDocument,
    view = doc.defaultView;
  const highlights = view?.CSS?.highlights;
  const known = ownedTextHighlights(doc);
  let snapshot = createTextSnapshot(host.textContent ?? "");
  let current: TextPresentationCommit | null = null;
  let requested = snapshot.value;
  let alive = true,
    editing = nativeTextContext(host),
    nativeOwned = false,
    baseline = true;
  let generation = 0;
  let retainedValue: string | undefined;
  let retainedEntity: unknown;
  let lease: MotionLease | null = null;
  let active = new Set<object>();
  let handoffWork = 0;
  let capturedCommit: Parameters<ReturnType<typeof createCapturedHandoff>["commit"]>[0] | null = null;
  let animations: Animation[] = [];
  let layer: HTMLElement | null = null;
  let releaseLayoutAnchor: (() => void) | null = null;
  let mask: { name: string; highlight: Highlight; sheet: CSSStyleSheet } | null = null;
  let environment: MotionEnvironment = { hidden: false, immediate: false, reduced: false, themeOwned: false };
  const signature = () => textPaintSignature(chain, view);
  let auditFrame: number | null = null;
  let paintSignature: ReturnType<typeof signature> = [];
  const sameSignature = (nativeHeight: ReadonlySet<HTMLElement> = new Set()) => {
    const next = signature();
    const valid = next.every((value, index) => {
      const before = paintSignature[index];
      const node = chain[index];
      if (!value || !before || !node || value.paint !== before.paint) return false;
      const geometry = current?.stripGeometry ? textGeometryProperties(node, current.cm.mode) : new Set<string>();
      return (
        ([...geometry].some((key) => /^(?:width|min-width|max-width)$/.test(key)) || value.width === before.width) &&
        (nativeHeight.has(node) ||
          [...geometry].some((key) => /^(?:height|min-height|max-height)$/.test(key)) ||
          value.height === before.height) &&
        (geometry.has("transform") || value.transform === before.transform)
      );
    });
    if (valid && nativeHeight.size)
      for (const [index, node] of chain.entries()) {
        const current = next[index],
          previous = paintSignature[index];
        if (nativeHeight.has(node) && current && previous)
          paintSignature[index] = { ...previous, height: current.height };
      }
    return valid;
  };
  const plain = () => host.childNodes.length <= 1 && (!host.firstChild || host.firstChild.nodeType === 3);
  const stop = () => {
    if (auditFrame !== null) view?.cancelAnimationFrame(auditFrame);
    auditFrame = null;
    generation++;
    const old = animations;
    animations = [];
    for (const animation of old) animation.cancel();
    if (mask) {
      if (highlights?.get(mask.name) === mask.highlight) highlights.delete(mask.name);
      known.delete(mask.highlight);
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((sheet) => sheet !== mask?.sheet);
      mask = null;
    }
    releaseLayoutAnchor?.();
    releaseLayoutAnchor = null;
    layer?.remove();
    layer = null;
    lease?.finish();
    lease = null;
    active.clear();
    handoffWork = 0;
    capturedCommit = null;
    handoff?.cancel();
  };
  const restrictions = () => {
    const next = nativeTextContext(host);
    if (next !== editing) {
      retainedValue = !next && (nativeOwned || host.textContent !== requested) ? requested : undefined;
      retainedEntity = current?.entity;
      editing = next;
      nativeOwned = false;
      baseline = retainedValue === undefined;
      stop();
      snapshot = createTextSnapshot(host.textContent ?? "", current?.locale);
      current = null;
    }
    if (
      !plain() ||
      next ||
      selectedTextContext(host) ||
      !host.isConnected ||
      host.closest('[hidden],[inert],[aria-hidden="true"]')
    )
      stop();
  };
  const mutations = new MutationObserver((changes) => {
    const nativeHeight = current?.stripGeometry ? nativeTextHeightEcho(changes, host) : new Set<HTMLElement>();
    if (changes.some((change) => change.type !== "attributes") || !sameSignature(nativeHeight)) stop();
    restrictions();
    if (changes.some((change) => change.type !== "attributes")) {
      if (editing) nativeOwned = true;
      snapshot = createTextSnapshot(host.textContent ?? "", current?.locale);
      baseline = true;
    }
  });
  const chain: HTMLElement[] = [];
  const transition = (event: TransitionEvent) => {
    // Capture sees sibling/descendant feedback too. Only this host's actual
    // ancestor chain can invalidate its raster correspondence.
    if (chain.includes(event.target as HTMLElement) && !textSurfacePaint(event.propertyName)) stop();
  };
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    chain.push(node);
    mutations.observe(node, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class", "style", "hidden", "inert", "dir", "contenteditable"],
    });
    node.addEventListener("transitionrun", transition, true);
  }
  paintSignature = signature();
  mutations.observe(host, {
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "inert", "dir", "contenteditable"],
    childList: true,
    characterData: true,
    subtree: true,
  });
  let expectedSize = host.getBoundingClientRect();
  const resize = new ResizeObserver(() => {
    const box = host.getBoundingClientRect();
    if (
      ["width", "height"].some(
        (axis) =>
          Math.round(box[axis as "width" | "height"] / textProofLimits.coordinateUnit) !==
          Math.round(expectedSize[axis as "width" | "height"] / textProofLimits.coordinateUnit),
      )
    )
      stop();
    expectedSize = box;
  });
  resize.observe(host);
  const selection = () => {
    if (selectedTextContext(host)) stop();
  };
  const key = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") stop();
  };
  const beforeInput = () => {
    stop();
    restrictions();
  };
  doc.addEventListener("selectionchange", selection);
  doc.addEventListener("keydown", key, true);
  host.addEventListener("beforeinput", beforeInput, true);
  host.addEventListener("copy", stop, true);
  host.addEventListener("beforematch", stop);
  doc.addEventListener("scroll", stop, true);
  view?.addEventListener("resize", stop);
  view?.visualViewport?.addEventListener("resize", stop);
  view?.visualViewport?.addEventListener("scroll", stop);
  doc.fonts?.addEventListener("loadingdone", stop);
  const unsubscribe = subscribeMotionEnvironment(doc, (next) => {
    environment = next;
    if (next.hidden || next.immediate || next.reduced || next.themeOwned) stop();
  });
  const exact = (value: string, diff: ReturnType<typeof diffText>) => {
    let text = host.firstChild as Text | null;
    if (!text) {
      text = doc.createTextNode("");
      host.append(text);
    }
    const edits =
      diff.runs.length && host.textContent === snapshot.value
        ? diff.runs.map((run) => ({ start: run.before[0], end: run.before[1], insert: value.slice(...run.after) }))
        : (() => {
            let start = 0,
              end = 0;
            while (start < text.length && start < value.length && text.data[start] === value[start]) start++;
            while (
              end < text.length - start &&
              end < value.length - start &&
              text.data[text.length - 1 - end] === value[value.length - 1 - end]
            )
              end++;
            return [{ start, end: text.length - end, insert: value.slice(start, value.length - end) }];
          })();
    if (edits.every((edit) => edit.start === edit.end && edit.insert === "")) {
      snapshot = diff.snapshot;
      mutations.takeRecords();
      return text;
    }
    const selection = doc.getSelection();
    const ranges = selection
      ? Array.from({ length: selection.rangeCount }, (_, index) => {
          const range = selection.getRangeAt(index);
          return {
            range,
            start: range.startContainer,
            end: range.endContainer,
            from: range.startOffset,
            to: range.endOffset,
          };
        })
      : [];
    const endpoints =
      selection && selection.rangeCount === 1
        ? {
            anchor: selection.anchorNode,
            focus: selection.focusNode,
            from: selection.anchorOffset,
            to: selection.focusOffset,
            collapsed: selection.isCollapsed,
            forward: selection.anchorNode === ranges[0]?.start && selection.anchorOffset === ranges[0]?.from,
          }
        : null;
    const map = (offset: number, start: boolean) => {
      let delta = 0;
      for (const edit of edits) {
        if (offset < edit.start || (offset === edit.start && edit.start === edit.end && !start)) break;
        if (offset === edit.start && edit.start !== edit.end) return offset + delta;
        if (offset < edit.end) return edit.start + delta + (start ? 0 : edit.insert.length);
        delta += edit.insert.length - (edit.end - edit.start);
      }
      return offset + delta;
    };
    // Reverse changed runs preserve unchanged middle content as well as edges.
    for (const edit of [...edits].reverse())
      if (edit.start !== edit.end || edit.insert) text.replaceData(edit.start, edit.end - edit.start, edit.insert);
    // replaceData collapses a native boundary exactly at a replaced run's end.
    // Preserve retained selection/find endpoints and direction explicitly, with
    // the same Text node and no focus, editing command or synthetic input event.
    for (const saved of ranges) {
      if (saved.start === text) saved.range.setStart(text, map(saved.from, true));
      if (saved.end === text) saved.range.setEnd(text, map(saved.to, false));
    }
    if (selection && endpoints && (endpoints.anchor === text || endpoints.focus === text))
      selection.setBaseAndExtent(
        endpoints.anchor as Node,
        endpoints.anchor === text ? map(endpoints.from, endpoints.collapsed || endpoints.forward) : endpoints.from,
        endpoints.focus as Node,
        endpoints.focus === text ? map(endpoints.to, endpoints.collapsed || !endpoints.forward) : endpoints.to,
      );
    snapshot = diff.snapshot;
    mutations.takeRecords();
    expectedSize = host.getBoundingClientRect();
    paintSignature = signature();
    return text;
  };
  const available = () =>
    Boolean(
      view?.Highlight &&
        view.CSSStyleSheet &&
        highlights &&
        host.getRootNode() === doc &&
        highlights.size <= motionLimits.changedGraphemes &&
        [...highlights.values()].every((highlight) => known.has(highlight)),
    );
  return {
    commit(options: TextPresentationCommit) {
      if (!alive) {
        options.capture?.dispose();
        return;
      }
      restrictions();
      const { value, revision, cm } = options;
      const sameEntity = current !== null && Object.is(options.entity, current.entity);
      const previous = current;
      const clock = cm.parameters(binding);
      const transfer = cm.parameters(bindMotionParameters(handoffValue, "handoff/value"));
      const transferClock = transfer.kind === "handoff" ? transfer.spatial : { duration: 0 };
      if (!editing && retainedValue !== undefined) {
        if (value === retainedValue && Object.is(options.entity, retainedEntity)) {
          current = options;
          options.capture?.dispose();
          return;
        }
        retainedValue = undefined;
        if (!Object.is(options.entity, retainedEntity)) baseline = true;
      }
      if (editing && host.textContent !== (previous ? requested : (options.nativeBaseline ?? requested)))
        nativeOwned = true;
      current = options;
      if (editing && nativeOwned) {
        requested = value;
        stop();
        options.capture?.dispose();
        return;
      }
      if (previous?.revision === revision && value === requested && sameEntity) {
        if (
          !revision.current() ||
          cm.mode === "none" ||
          options.granularity !== previous.granularity ||
          options.locale !== previous.locale ||
          options.stripGeometry !== previous.stripGeometry ||
          cm.timeScale === 0 ||
          options.visible === false ||
          clock.kind !== "text" ||
          Number(clock.enter.duration) === 0
        )
          stop(); // live-text-policy
        else if (layer && (cm.reduced !== previous.cm.reduced || cm.mode !== previous.cm.mode)) {
          const nextSignature = signature();
          const box = host.getBoundingClientRect();
          if (
            !lease?.current() ||
            nextSignature.some((value, index) => !value || value.paint !== paintSignature[index]?.paint) ||
            (["width", "height"] as const).some(
              (axis) =>
                Math.round(box[axis] / textProofLimits.coordinateUnit) !==
                Math.round(expectedSize[axis] / textProofLimits.coordinateUnit),
            ) ||
            !proveTextLayout(host, snapshot, {
              surfacePaint: true,
              geometryMode: options.stripGeometry ? cm.mode : undefined,
            })
          ) {
            stop();
            return;
          }
          // A compound downgrade has already released its spatial overlay in
          // before-layout. Accept that proven final allocation, never arbitrary
          // paint changes, before the pending ancestor mutation audit runs.
          expectedSize = box;
          paintSignature = nextSignature;
          mutations.takeRecords();
          // A permitted opacity flight survives a live policy edit. Capture
          // actual paint before cancelling its old clock; discard all stagger
          // delays and keep the current native mask and destination.
          const paints = [...layer.querySelectorAll("canvas")];
          const from = paints.map((canvas) => view?.getComputedStyle(canvas).opacity ?? "1");
          const old = animations;
          const epoch = ++generation;
          animations = [];
          for (const animation of old) animation.cancel();
          try {
            for (const [index, canvas] of paints.entries()) {
              const entering = canvas.dataset.cadenceTextKind === "enter";
              const transition = entering ? clock.enter : clock.exit;
              animations.push(
                canvas.animate([{ opacity: from[index] }, { opacity: entering ? 1 : 0 }], {
                  duration: motionMilliseconds(Number(transition.duration)),
                  delay: 0,
                  easing: `cubic-bezier(${cm.scope.tokens.ease[entering ? "out" : "in"].join(",")})`,
                  fill: "both",
                }),
              );
            }
          } catch {
            stop();
            return;
          }
          void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (alive && generation === epoch && lease?.current()) stop();
          });
        }
        if (capturedCommit) handoff?.commit({ ...capturedCommit, transition: transferClock, immediate: cm.reduced });
        if (options.capture !== previous.capture) options.capture?.dispose();
        return;
      }
      const changed = value !== requested;
      requested = value;
      if (!plain() || host.matches("input,textarea,select,option")) {
        stop();
        options.capture?.dispose();
        return;
      }
      const diff = diffText(snapshot, value, options.locale);
      const units = diff.runs.flatMap((run) => [...run.outgoing, ...run.incoming]);
      const proposed = new Set(units.map((unit) => unit.identity));
      const union = new Set([...active, ...proposed]);
      const others = [...transaction.activeWork("changedGraphemes")].reduce(
        (sum, [entity, work]) => sum + (entity === host ? 0 : work),
        -handoffWork,
      );
      const overflow =
        boundTextRevision([diff], active)[0]?.immediate === "changed" ||
        union.size + others > motionLimits.changedGraphemes;
      if (overflow)
        registration.begin(revision, ["text.change"], { changedGraphemes: motionLimits.changedGraphemes + 1 }, stop);
      stop();
      const canAnimate =
        revision.current() &&
        sameEntity &&
        changed &&
        !baseline &&
        !diff.immediate &&
        !overflow &&
        options.visible !== false &&
        !editing &&
        !selectedTextContext(host) &&
        !environment.hidden &&
        !environment.immediate &&
        !environment.themeOwned &&
        !(environment.reduced && !cm.reduced) &&
        cm.mode !== "none" &&
        cm.timeScale !== 0 &&
        clock.kind === "text" &&
        Number(clock.enter.duration) > 0 &&
        available();
      const geometryMode = options.stripGeometry ? cm.mode : undefined;
      const before = canAnimate ? proveTextLayout(host, snapshot, { surfacePaint: true, geometryMode }) : null;
      const text = exact(value, diff);
      if (!sameEntity) snapshot = createTextSnapshot(value, options.locale);
      baseline = false;
      const after = before && proveTextLayout(host, snapshot, { surfacePaint: true, geometryMode });
      mutations.takeRecords();
      const proof =
        before &&
        after &&
        shapeTextDiff(diff, {
          // Actual-font raster correspondence proves every boundary. Range boxes
          // supply the unchanged native layout; no semantic split tree is made.
          before: new Set(diff.runs.flatMap((run) => [...run.before])),
          after: new Set(diff.runs.flatMap((run) => [...run.after])),
        });
      if (!proof || proof.immediate || clock.kind !== "text" || !view || !highlights) {
        options.capture?.dispose();
        handoff?.commit({
          revision,
          capture: null,
          destination: host,
          transition: transferClock,
          immediate: cm.reduced,
          sourceRetired: true,
          current: () => alive && current?.revision === revision,
          fallback() {},
          terminal() {},
        });
        return;
      }
      const incoming = diff.runs.flatMap((run) => run.incoming),
        outgoing = diff.runs.flatMap((run) => run.outgoing);
      const local = () => {
        handoffWork = 0;
        if (!alive || !revision.current()) return;
        lease = registration.begin(revision, ["text.change"], { changedGraphemes: units.length }, stop);
        if (!lease?.current()) return;
        active = proposed;
        const epoch = generation;
        const word = options.granularity === "word";
        const groups = changedTextGroups(snapshot, incoming, word, options.locale);
        if (!groups) {
          stop();
          return;
        }
        const groupCount = new Set(groups.values()).size;
        const rhythm = resolveStaggerParameters(
          groupCount,
          word ? "word" : "char",
          cm.mode,
          cm.timeScale,
          cm.scope.tokens,
        );
        const last = Math.max(0, Math.min(units.length, motionLimits.staggerElements) - 1);
        // Standalone text keeps the stricter final character-delay cap in word mode too.
        const step = Math.min(rhythm.step, last ? motionLimits.characterDelay / last : 0);
        const moving =
          options.characterStagger && !cm.reduced
            ? resolveStaggerParameters(units.length, "char", cm.mode, cm.timeScale, cm.scope.tokens)
            : { moving: units.length, step: 0 };
        const ranges: Range[] = [];
        let pixels = 0,
          movingIndex = 0;
        const paints: { canvas: HTMLCanvasElement; incoming: boolean; index: number }[] = [];
        const add = (unit: (typeof incoming)[number], entering: boolean) => {
          if (movingIndex >= moving.moving) return;
          const layout = entering ? after : before;
          const box = layout.boxes.get(unit.identity);
          if (
            !box ||
            box.width <= 0 ||
            box.left < 0 ||
            box.top < 0 ||
            box.left + box.width > view.innerWidth ||
            box.top + box.height > view.innerHeight ||
            chain.some((node) => {
              const css = view.getComputedStyle(node);
              if (!/(auto|scroll|hidden|clip)/.test(`${css.overflowX} ${css.overflowY}`)) return false;
              const clip = node.getBoundingClientRect();
              return (
                box.left < clip.left ||
                box.top < clip.top ||
                box.left + box.width > clip.right ||
                box.top + box.height > clip.bottom
              );
            })
          )
            return;
          const canvas = outgoingTextPaint(host, unit, layout);
          if (!canvas) return;
          pixels += canvas.width * canvas.height;
          if (pixels > textProofLimits.pixels) return;
          canvas.dataset.cadenceTextKind = entering ? "enter" : "exit";
          canvas.dataset.motion = cm.mode;
          paints.push({ canvas, incoming: entering, index: groups.get(unit.identity) ?? 0 });
          movingIndex++;
          if (entering) {
            let offset = 0;
            for (const item of snapshot.units ?? []) {
              if (item.identity === unit.identity) break;
              offset += item.text.length;
            }
            const range = doc.createRange();
            range.setStart(text, offset);
            range.setEnd(text, offset + unit.text.length);
            ranges.push(range);
          }
        };
        for (const unit of outgoing) add(unit, false);
        for (const unit of incoming) add(unit, true);
        if (!paints.length) {
          stop();
          return;
        }
        try {
          if (ranges.length) {
            const name = `cadence-text-${++nextMask}`;
            const sheet = new view.CSSStyleSheet();
            sheet.replaceSync(`::highlight(${name}) { color: transparent; }`);
            const highlight = new view.Highlight(...ranges);
            mask = { name, sheet, highlight };
            known.add(highlight);
            doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
            highlights.set(name, highlight);
            if (view.getComputedStyle(host, `::highlight(${name})`).color !== "rgba(0, 0, 0, 0)") {
              stop();
              return;
            }
          }
          layer = doc.createElement("span");
          layer.inert = true;
          layer.setAttribute("aria-hidden", "true");
          layer.dataset.cadenceTextLayer = "";
          layer.dataset.cadenceTextOwner = host.id;
          layer.dataset.motion = cm.mode;
          Object.assign(layer.style, {
            position: "fixed",
            inset: "0",
            contain: "strict",
            overflow: "clip",
            pointerEvents: "none",
            userSelect: "none",
            overflowAnchor: "none",
            scrollSnapAlign: "none",
          });
          for (const item of paints) layer.append(item.canvas);
          doc.body.append(layer);
          releaseLayoutAnchor = followTextLayout(host, layer, stop);
          if (!releaseLayoutAnchor) throw new Error("Native display anchor unavailable");
          const audit = () => {
            auditFrame = null;
            if (!alive || !layer || !lease?.current() || !current) {
              stop();
              return;
            }
            let count = 0;
            for (const node of chain) {
              if (!node.getAnimations) {
                stop();
                return;
              }
              const handles = node.getAnimations();
              count += handles.length;
              if (
                count > motionLimits.collectionVisuals ||
                handles.some(
                  (animation) => !knownTextGeometry(animation, current?.cm.mode) && !surfaceOnlyAnimation(animation),
                )
              ) {
                stop();
                return;
              }
            }
            auditFrame = view.requestAnimationFrame(audit);
          };
          if (options.stripGeometry) auditFrame = view.requestAnimationFrame(audit);
          for (const { canvas, incoming: entering, index } of paints) {
            const transition = entering ? clock.enter : clock.exit;
            const animation = canvas.animate(
              entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
              {
                duration: motionMilliseconds(Number(transition.duration)),
                delay: motionMilliseconds(entering && options.characterStagger && !cm.reduced ? step * index : 0),
                easing: `cubic-bezier(${cm.scope.tokens.ease[entering ? "out" : "in"].join(",")})`,
                fill: "both",
              },
            );
            animations.push(animation);
          }
          void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (alive && generation === epoch && lease?.current()) stop();
          });
        } catch {
          stop();
        } // Unsupported/CSP/native failure never leaves hidden text.
      };
      // The same shaped native snapshot proves the one contiguous incoming run.
      // Only that Range is concealed; retained glyphs remain ordinary native ink.
      const run = diff.runs.length === 1 ? diff.runs[0] : null;
      if (
        handoff &&
        options.capture &&
        run &&
        incoming.length > 0 &&
        options.capture.text === run.incoming.map((unit) => unit.text).join("")
      ) {
        const range = doc.createRange();
        range.setStart(text, run.after[0]);
        range.setEnd(text, run.after[1]);
        const epoch = generation;
        active = proposed;
        handoffWork = incoming.length;
        capturedCommit = {
          revision,
          capture: options.capture,
          destination: host,
          transition: transferClock,
          immediate: cm.reduced,
          sourceRetired: options.sourceRetired ?? false,
          current: () => alive && current?.revision === revision && options.visible !== false,
          fallback: local,
          terminal: () => {
            if (generation === epoch) {
              active.clear();
              handoffWork = 0;
              capturedCommit = null;
            }
          },
          slot: "text-handoff-paint",
          run:
            !options.deferHandoff && options.capture.text === value
              ? undefined
              : {
                  current: () =>
                    host.firstChild === text &&
                    host.textContent === value &&
                    range.toString() === options.capture?.text,
                  bounds: () => range.getBoundingClientRect(),
                  conceal() {
                    const name = `cadence-text-${++nextMask}`;
                    const sheet = new view.CSSStyleSheet();
                    sheet.replaceSync(`::highlight(${name}) { color: transparent; }`);
                    const highlight = new view.Highlight(range);
                    const release = () => {
                      if (highlights.get(name) === highlight) highlights.delete(name);
                      known.delete(highlight);
                      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((candidate) => candidate !== sheet);
                    };
                    try {
                      known.add(highlight);
                      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
                      highlights.set(name, highlight);
                      if (view.getComputedStyle(host, `::highlight(${name})`).color === "rgba(0, 0, 0, 0)")
                        return release;
                    } catch {
                      /* Native/CSP failure exposes exact current text. */
                    }
                    release();
                    return null;
                  },
                },
        };
        const accepted = capturedCommit;
        const transfer = () => {
          if (alive && capturedCommit === accepted && generation === epoch) handoff.commit(accepted);
          else options.capture?.dispose();
        };
        if (options.deferHandoff) queueMicrotask(transfer);
        else transfer();
        return;
      }
      options.capture?.dispose();
      local();
    },
    cancel: stop,
    dispose() {
      if (!alive) return;
      alive = false;
      stop();
      if (sharedHandoff) handoff?.cancel();
      else handoff?.dispose();
      registration.dispose();
      mutations.disconnect();
      resize.disconnect();
      unsubscribe();
      doc.removeEventListener("selectionchange", selection);
      doc.removeEventListener("keydown", key, true);
      host.removeEventListener("beforeinput", beforeInput, true);
      host.removeEventListener("copy", stop, true);
      host.removeEventListener("beforematch", stop);
      doc.removeEventListener("scroll", stop, true);
      view?.removeEventListener("resize", stop);
      view?.visualViewport?.removeEventListener("resize", stop);
      view?.visualViewport?.removeEventListener("scroll", stop);
      doc.fonts?.removeEventListener("loadingdone", stop);
      for (const node of chain) node.removeEventListener("transitionrun", transition, true);
    },
  };
}
