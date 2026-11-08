"use client";

import type { createCapturedHandoff } from "./captured-handoff";
import {
  bindMotionParameters,
  motionLimits,
  motionMilliseconds,
  resolveStaggerParameters,
  textProofLimits,
  textReplace,
} from "./motion";
import { type MotionEnvironment, subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease, type MotionRevision } from "./motion-transaction";
import type { CadenceMotion } from "./provider";
import { boundTextRevision, changedTextGroups, createTextSnapshot, diffText, shapeTextDiff } from "./text-diff";
import { nativeTextContext, outgoingTextPaint, proveTextLayout, selectedTextContext } from "./text-layout";

const binding = bindMotionParameters(textReplace, "text.change/changed-runs");
type Capture = Parameters<ReturnType<typeof createCapturedHandoff>["commit"]>[0]["capture"];
const ownedHighlights = new WeakMap<Document, Set<Highlight>>();
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
) {
  const registration = transaction.register(host);
  const doc = host.ownerDocument,
    view = doc.defaultView;
  const highlights = view?.CSS?.highlights;
  const known = ownedHighlights.get(doc) ?? new Set<Highlight>();
  ownedHighlights.set(doc, known);
  let snapshot = createTextSnapshot(host.textContent ?? "");
  let current: TextPresentationCommit | null = null;
  let requested = snapshot.value;
  let alive = true,
    editing = nativeTextContext(host),
    baseline = true;
  let generation = 0;
  let lease: MotionLease | null = null;
  let active = new Set<object>();
  let handoffWork = 0;
  let capturedCommit: Parameters<ReturnType<typeof createCapturedHandoff>["commit"]>[0] | null = null;
  let animations: Animation[] = [];
  let layer: HTMLElement | null = null;
  let mask: { name: string; highlight: Highlight; sheet: CSSStyleSheet } | null = null;
  let environment: MotionEnvironment = { hidden: false, immediate: false, reduced: false, themeOwned: false };
  const signature = () =>
    chain
      .map((node) => {
        const css = view?.getComputedStyle(node);
        return (
          css &&
          [
            css.font,
            css.color,
            css.whiteSpace,
            css.letterSpacing,
            css.wordSpacing,
            css.textTransform,
            css.textDecorationLine,
            css.fontFeatureSettings,
            css.fontVariationSettings,
            css.opacity,
            css.visibility,
            css.display,
            css.width,
            css.height,
            css.transform,
            css.translate,
            css.scale,
            css.rotate,
            css.filter,
            css.perspective,
            css.position,
            css.overflowX,
            css.overflowY,
            css.clipPath,
            css.maskImage,
            css.backdropFilter,
            css.contentVisibility,
            css.contain,
            css.willChange,
            css.borderTopLeftRadius,
            css.borderTopRightRadius,
            css.borderBottomLeftRadius,
            css.borderBottomRightRadius,
            css.zoom,
          ].join("/")
        );
      })
      .join("|");
  let paintSignature = "";
  const plain = () => host.childNodes.length <= 1 && (!host.firstChild || host.firstChild.nodeType === 3);
  const stop = () => {
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
      editing = next;
      baseline = true;
      stop();
      snapshot = createTextSnapshot(host.textContent ?? "", current?.locale);
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
    if (changes.some((change) => change.type !== "attributes") || signature() !== paintSignature) stop();
    restrictions();
    if (changes.some((change) => change.type !== "attributes")) {
      snapshot = createTextSnapshot(host.textContent ?? "", current?.locale);
      baseline = true;
    }
  });
  const chain: HTMLElement[] = [];
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    chain.push(node);
    mutations.observe(node, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "inert", "dir", "contenteditable"],
    });
    node.addEventListener("transitionrun", stop, true);
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
    if (box.width !== expectedSize.width || box.height !== expectedSize.height) stop();
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
      current = options;
      if (previous?.revision === revision && value === requested && sameEntity) {
        if (
          !revision.current() ||
          cm.reduced !== previous.cm.reduced ||
          cm.mode !== previous.cm.mode ||
          options.granularity !== previous.granularity ||
          options.locale !== previous.locale ||
          cm.timeScale === 0 ||
          options.visible === false ||
          clock.kind !== "text" ||
          Number(clock.enter.duration) === 0
        )
          stop(); // live-text-policy
        if (capturedCommit)
          handoff?.commit({ ...capturedCommit, transition: cm.transition("handoff"), immediate: cm.reduced });
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
      const before = canAnimate ? proveTextLayout(host, snapshot) : null;
      const text = exact(value, diff);
      if (!sameEntity) snapshot = createTextSnapshot(value, options.locale);
      baseline = false;
      const after = before && proveTextLayout(host, snapshot);
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
      // The existing handoff owns an HTMLElement, not a native Range. Compose
      // only the actual complete one-unit destination; partial labels stay local.
      if (
        handoff &&
        options.capture &&
        diff.runs.length === 1 &&
        incoming.length === 1 &&
        outgoing.length === 0 &&
        options.capture.text === value &&
        value === incoming[0]?.text
      ) {
        const epoch = generation;
        active = proposed;
        handoffWork = incoming.length;
        capturedCommit = {
          revision,
          capture: options.capture,
          destination: host,
          transition: cm.transition("handoff"),
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
        };
        handoff.commit(capturedCommit);
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
      handoff?.dispose();
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
      for (const node of chain) node.removeEventListener("transitionrun", stop, true);
    },
  };
}
