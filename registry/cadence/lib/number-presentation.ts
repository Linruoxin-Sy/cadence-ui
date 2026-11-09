"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { bindMotionParameters, motionLimits, numberCompact, numberRoll, textProofLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionLease, type MotionRevision } from "./motion-transaction";
import {
  boundNumberRevision,
  type NumberPlan,
  type NumberSnapshot,
  planNumberChange,
  type ReadoutCause,
  type ReelDirection,
} from "./number-plan";
import type { CadenceMotion } from "./provider";
import type { TextSnapshot } from "./text-diff";
import {
  nativeTextContext,
  outgoingTextPaint,
  ownedTextHighlights,
  proveTextLayout,
  selectedTextContext,
} from "./text-layout";

export interface NumberPresentationCommit {
  snapshot: NumberSnapshot;
  revision: MotionRevision;
  cm: CadenceMotion;
  entity: unknown;
  cause?: ReadoutCause;
  direction?: ReelDirection;
  compact?: boolean;
  visible?: boolean;
  /** A separate geometry/fill engine cannot promise this reel's phase. The
   * composition shares the semantic revision but uses an immediate readout. */
  externalGeometry?: boolean;
}

let maskId = 0;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
function textSnapshot(snapshot: NumberSnapshot): TextSnapshot {
  const columns = new Map(snapshot.columns?.map((column) => [column.start, column.identity]));
  return {
    value: snapshot.text,
    units: Array.from(snapshot.text, (text, index) => ({ text, identity: columns.get(index) ?? {} })),
  };
}

/** Internal renderer only. One native Text value; bounded, pixel-only two-cell
 * lanes. No geometry writer, DOM decomposition or frame-time formatting/layout.
 * Physical lifecycle is explicit; no document-removal scanner. */
export function createNumberPresentation(host: HTMLElement, transaction = createMotionTransaction()) {
  const doc = host.ownerDocument,
    view = doc.defaultView;
  const registration = transaction.register(host);
  let alive = true,
    baseline = true,
    editing = nativeTextContext(host),
    nativeOwned = false;
  let current: NumberPresentationCommit | null = null;
  let snapshot: NumberSnapshot | null = null;
  let lease: MotionLease | null = null;
  let generation = 0;
  let clock = "";
  let layer: HTMLElement | null = null;
  let mask: { name: string; highlight: Highlight; sheet: CSSStyleSheet } | null = null;
  let lanes: {
    identity: object;
    place: number;
    first: string | null;
    last: string | null;
    edge: number;
    phase: ReturnType<typeof motionValue<number>>;
    position: number;
    target: number;
    box: string;
    release(): void;
  }[] = [];
  const plain = () => host.childNodes.length <= 1 && (!host.firstChild || host.firstChild.nodeType === 3);
  const stop = () => {
    generation++;
    const old = lanes;
    lanes = [];
    for (const lane of old) {
      lane.phase.stop();
      lane.release();
    }
    if (mask) {
      if (view?.CSS.highlights.get(mask.name) === mask.highlight) view.CSS.highlights.delete(mask.name);
      ownedTextHighlights(doc).delete(mask.highlight);
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((sheet) => sheet !== mask?.sheet);
      mask = null;
    }
    layer?.remove();
    layer = null;
    lease?.finish();
    lease = null;
  };
  const restrict = () => {
    const next = nativeTextContext(host);
    if (editing !== next) {
      editing = next;
      nativeOwned = false;
      baseline = true;
      snapshot = null;
      stop();
    }
    if (
      !plain() ||
      editing ||
      selectedTextContext(host) ||
      !host.isConnected ||
      host.closest('[hidden],[inert],[aria-hidden="true"]')
    )
      stop();
  };
  const chain: HTMLElement[] = [];
  const observer = new MutationObserver((changes) => {
    stop();
    restrict();
    if (changes.some((change) => change.type !== "attributes")) {
      snapshot = null;
      baseline = true;
    }
  });
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    chain.push(node);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "inert", "aria-hidden", "dir", "contenteditable"],
    });
    node.addEventListener("transitionrun", stop, true);
  }
  observer.observe(host, {
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "inert", "aria-hidden", "dir", "contenteditable"],
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
  const nativeInput = () => {
    nativeOwned = true;
    stop();
  };
  for (const name of ["beforeinput", "compositionstart"]) host.addEventListener(name, nativeInput, true);
  for (const name of ["copy", "beforematch"]) host.addEventListener(name, stop, true);
  doc.addEventListener("selectionchange", selection);
  doc.addEventListener("keydown", key, true);
  doc.addEventListener("scroll", stop, true);
  view?.addEventListener("resize", stop);
  view?.visualViewport?.addEventListener("resize", stop);
  view?.visualViewport?.addEventListener("scroll", stop);
  doc.fonts?.addEventListener("loadingdone", stop);
  let blocked = false;
  const unsubscribe = subscribeMotionEnvironment(doc, (environment) => {
    blocked = environment.hidden || environment.immediate || environment.reduced || environment.themeOwned;
    if (blocked) stop();
  });

  // Minimal native edit, retaining the Text node and native selection endpoints.
  // Editing commands/undo are never called, and no synthetic event is emitted.
  const exact = (value: string) => {
    let text = host.firstChild as Text | null;
    if (!text) {
      text = doc.createTextNode("");
      host.append(text);
    }
    if (text.data !== value) {
      let start = 0,
        end = 0;
      while (start < text.length && start < value.length && text.data[start] === value[start]) start++;
      while (
        end < text.length - start &&
        end < value.length - start &&
        text.data[text.length - 1 - end] === value[value.length - 1 - end]
      )
        end++;
      const oldEnd = text.length - end,
        newEnd = value.length - end;
      const selection = doc.getSelection();
      const saved =
        selection?.rangeCount === 1
          ? {
              anchor: selection.anchorNode,
              focus: selection.focusNode,
              a: selection.anchorOffset,
              f: selection.focusOffset,
            }
          : null;
      const map = (offset: number) => (offset <= start ? offset : offset >= oldEnd ? offset + newEnd - oldEnd : newEnd);
      text.replaceData(start, oldEnd - start, value.slice(start, newEnd));
      if (selection && saved && (saved.anchor === text || saved.focus === text))
        selection.setBaseAndExtent(
          saved.anchor as Node,
          saved.anchor === text ? map(saved.a) : saved.a,
          saved.focus as Node,
          saved.focus === text ? map(saved.f) : saved.f,
        );
    }
    observer.takeRecords();
    expectedSize = host.getBoundingClientRect();
    return text;
  };
  const preview = (options: NumberPresentationCommit) =>
    planNumberChange(snapshot, options.snapshot, {
      cause: options.cause,
      direction: options.direction,
      sameEntity: current !== null && Object.is(current.entity, options.entity),
    });
  const boxKey = (layout: NonNullable<ReturnType<typeof proveTextLayout>>, identity: object) => {
    const box = layout.boxes.get(identity);
    return box ? [box.left, box.top, box.width, box.height, layout.font, layout.color, layout.baseline].join("/") : "";
  };
  const play = (revision: MotionRevision, transition: Transition) => {
    const records = lanes;
    lease?.finish();
    lease = registration.begin(revision, ["number.roll"], { numericColumns: records.length }, stop);
    if (!lease?.current()) {
      stop();
      return;
    }
    const epoch = ++generation;
    let remaining = records.length;
    for (const record of records) {
      const from = record.position,
        velocity = record.phase.getVelocity();
      // Motion.stop() samples ahead to wall time. Rebase to the last actually
      // painted scalar; pass the reviewed velocity explicitly after jump resets it.
      record.phase.jump(from);
      animateSingleValue(record.phase, record.target, {
        ...transition,
        velocity: velocity * (record.target - from) > 0 ? velocity : 0,
        onUpdate: () => {
          // A retired delivery has no authority over a newer writer.
          if (alive && generation === epoch && !lease?.current()) stop();
        },
        onComplete: () => {
          if (alive && generation === epoch && lease?.current() && --remaining === 0) stop();
        },
      });
    }
  };
  return {
    preview,
    active: () => new Set(lanes.map((lane) => lane.identity)),
    commit(options: NumberPresentationCommit, allowed = true) {
      if (!alive) return;
      restrict();
      const previous = current;
      const plan = preview(options);
      const beforeSnapshot = snapshot;
      const { cm, revision } = options;
      const parameters = cm.parameters(
        bindMotionParameters(options.compact ? numberCompact : numberRoll, "number.roll/reels"),
      );
      const nextClock = parameters.kind === "reel" ? JSON.stringify(parameters.transition) : "";
      const retime = nextClock !== clock;
      clock = nextClock;
      const eligible =
        allowed &&
        revision.current() &&
        !baseline &&
        !blocked &&
        !editing &&
        !selectedTextContext(host) &&
        !cm.reduced &&
        cm.mode !== "none" &&
        cm.timeScale !== 0 &&
        options.visible !== false &&
        !options.externalGeometry &&
        parameters.kind === "reel" &&
        parameters.transition.duration !== 0;
      current = options;
      // Once native input owns this editor (or its buffer differs from the last
      // accepted prop), mode/clock/prop commits cannot restore display text.
      // Clean controlled display updates retain their existing native semantics.
      if (editing && host.textContent !== (previous?.snapshot.text ?? options.snapshot.text)) nativeOwned = true;
      if ((editing && nativeOwned) || !plain() || host.matches("input,textarea,select,option")) {
        stop();
        snapshot = null;
        baseline = true;
        return;
      }
      const equal =
        previous &&
        Object.is(previous.entity, options.entity) &&
        typeof beforeSnapshot?.value === typeof options.snapshot.value &&
        beforeSnapshot?.text === options.snapshot.text &&
        beforeSnapshot.formatKey === options.snapshot.formatKey &&
        beforeSnapshot.scaleKey === options.snapshot.scaleKey;
      if (equal) {
        snapshot = plan.snapshot;
        if (!eligible || (options.cause !== "independent" && options.cause !== "selection")) stop();
        else if (lanes.length && parameters.kind === "reel" && (retime || revision !== previous.revision))
          play(revision, parameters.transition);
        // Equal semantic output never measures, allocates, restarts or truncates a legal flight.
        return;
      }
      const identities = new Set([...lanes.map((lane) => lane.identity), ...plan.lanes.map((lane) => lane.identity)]);
      const others = [...transaction.activeWork("numericColumns")].reduce(
        (sum, [entity, count]) => sum + (entity === host ? 0 : count),
        0,
      );
      const overflow = identities.size + others > motionLimits.numericColumns;
      if (overflow)
        registration.begin(revision, ["number.roll"], { numericColumns: motionLimits.numericColumns + 1 }, stop);
      const canAnimate = eligible && !plan.immediate && !overflow;
      const before = canAnimate && beforeSnapshot ? proveTextLayout(host, textSnapshot(beforeSnapshot)) : null;
      const text = exact(plan.snapshot.text);
      snapshot = plan.snapshot;
      baseline = false;
      const after = before && proveTextLayout(host, textSnapshot(snapshot));
      observer.takeRecords();
      if (
        !before ||
        !after ||
        !view?.Highlight ||
        !view.CSSStyleSheet ||
        !view.CSS?.highlights ||
        parameters.kind !== "reel"
      ) {
        stop();
        return;
      }
      const highlights = view.CSS.highlights;
      const known = ownedTextHighlights(doc);
      if ([...highlights.values()].some((highlight) => !known.has(highlight))) {
        stop();
        return;
      }
      // A third visible digit cannot replace either current cell without a jump.
      // A reversal to the actual departing digit can reuse BOTH current offsets.
      const continuing =
        lanes.length > 0 &&
        plan.lanes.length === lanes.length &&
        plan.lanes.every((lane) => {
          const old = lanes.find((item) => item.identity === lane.identity);
          return (
            old &&
            (lane.incoming?.digit === old.first || lane.incoming?.digit === old.last) &&
            lane.direction === ((lane.incoming?.digit === old.last ? old.edge : -old.edge) === 1 ? "up" : "down") &&
            old.box === boxKey(after, lane.identity)
          );
        });
      if (lanes.length && !continuing) {
        stop();
        return;
      }
      const ranges: Range[] = [];
      for (const lane of plan.lanes) {
        const column = snapshot.columns?.find((column) => column.identity === lane.identity);
        if (column) {
          const range = doc.createRange();
          range.setStart(text, column.start);
          range.setEnd(text, column.end);
          ranges.push(range);
        }
      }
      const installMask = () => {
        if (mask) {
          highlights.delete(mask.name);
          known.delete(mask.highlight);
          doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((sheet) => sheet !== mask?.sheet);
          mask = null;
        }
        if (!ranges.length) return;
        const name = `cadence-number-${++maskId}`,
          sheet = new view.CSSStyleSheet(),
          highlight = new view.Highlight(...ranges);
        sheet.replaceSync(`::highlight(${name}) { color: transparent; }`);
        mask = { name, sheet, highlight };
        known.add(highlight);
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
        highlights.set(name, highlight);
        if (view.getComputedStyle(host, `::highlight(${name})`).color !== "rgba(0, 0, 0, 0)")
          throw new Error("Numeric mask unavailable");
      };
      try {
        if (!continuing) {
          stop();
          layer = doc.createElement("span");
          layer.inert = true;
          layer.setAttribute("aria-hidden", "true");
          layer.dataset.cadenceNumberLayer = "";
          layer.dataset.cadenceNumberOwner = host.id;
          layer.dataset.motion = cm.mode;
          Object.assign(layer.style, {
            position: "fixed",
            inset: "0",
            contain: "strict",
            overflow: "clip",
            pointerEvents: "none",
            userSelect: "none",
            overflowAnchor: "none",
          });
          let pixels = 0;
          for (const lane of plan.lanes) {
            const a = before.boxes.get(lane.identity),
              b = after.boxes.get(lane.identity),
              box = b ?? a;
            if (!box || (a && b && (a.top !== b.top || a.height !== b.height))) throw new Error("Numeric line changed");
            // Resting native/canvas correspondence is staged at integer origins.
            // Fractional origins stay native; moving offsets remain subpixel.
            if (
              [a, b].some((item) => item && (!Number.isInteger(item.left) || !Number.isInteger(item.top))) ||
              !Number.isInteger(before.baseline) ||
              !Number.isInteger(after.baseline)
            )
              throw new Error("Unproven fractional glyph origin");
            const left = Math.min(a?.left ?? box.left, b?.left ?? box.left),
              right = Math.max(
                (a?.left ?? box.left) + (a?.width ?? box.width),
                (b?.left ?? box.left) + (b?.width ?? box.width),
              );
            if (
              left < 0 ||
              box.top < 0 ||
              right > view.innerWidth ||
              box.top + box.height > view.innerHeight ||
              chain.some((node) => {
                const css = view.getComputedStyle(node),
                  clip = node.getBoundingClientRect();
                return (
                  /(auto|scroll|hidden|clip)/.test(`${css.overflowX} ${css.overflowY}`) &&
                  (left < clip.left || right > clip.right || box.top < clip.top || box.top + box.height > clip.bottom)
                );
              })
            )
              throw new Error("Numeric clipping unavailable");
            const clip = doc.createElement("span");
            clip.dataset.cadenceReel = String(lane.place);
            clip.dataset.motion = cm.mode;
            Object.assign(clip.style, {
              position: "absolute",
              left: "0",
              top: `${box.top}px`,
              width: `${view.innerWidth}px`,
              height: `${box.height}px`,
              overflow: "clip",
            });
            const paints: { canvas: HTMLCanvasElement; incoming: boolean; top: number }[] = [];
            for (const incoming of [false, true]) {
              const digit = incoming ? lane.incoming?.digit : lane.outgoing?.digit;
              if (digit === undefined) continue;
              const layout = incoming ? after : before;
              const canvas = outgoingTextPaint(host, { text: digit, identity: lane.identity }, layout);
              if (!canvas) throw new Error("Numeric paint unavailable");
              pixels += canvas.width * canvas.height;
              if (pixels > textProofLimits.pixels) throw new Error("Numeric pixel capacity");
              canvas.removeAttribute("data-cadence-text-paint");
              canvas.dataset.cadenceNumberCell = incoming ? "target" : "departing";
              canvas.dataset.motion = cm.mode;
              const top = Number.parseFloat(canvas.style.top) - box.top;
              canvas.style.top = `${top}px`;
              clip.append(canvas);
              paints.push({ canvas, incoming, top });
            }
            const phase = motionValue(0),
              edge = lane.direction === "up" ? 1 : -1;
            const record = {
              identity: lane.identity,
              place: lane.place,
              first: lane.outgoing?.digit ?? null,
              last: lane.incoming?.digit ?? null,
              phase,
              position: 0,
              edge,
              target: 1,
              box: boxKey(after, lane.identity),
              release: () => {},
            };
            const update = () => {
              // Token overrides may overshoot. Painted travel stays monotonic
              // inside this revision's one-cell lane, never follows a rebound.
              const value =
                record.target === 1
                  ? Math.max(record.position, clamp(phase.get()))
                  : Math.min(record.position, clamp(phase.get()));
              record.position = value;
              clip.dataset.phase = String(value);
              for (const paint of paints)
                paint.canvas.style.transform = `translateY(${edge * (paint.incoming ? 1 - value : -value) * box.height}px)`;
            };
            record.release = phase.on("change", update);
            update();
            lanes.push(record);
            layer.append(clip);
          }
          doc.body.append(layer);
        }
        installMask();
        for (const record of lanes) {
          const target = continuing
            ? Number(plan.lanes.find((lane) => lane.identity === record.identity)?.incoming?.digit === record.last)
            : 1;
          record.target = target;
        }
        play(revision, parameters.transition);
      } catch {
        stop();
      } // Failure always exposes the exact current native text.
    },
    cancel: stop,
    dispose() {
      if (!alive) return;
      alive = false;
      stop();
      registration.dispose();
      observer.disconnect();
      resize.disconnect();
      unsubscribe();
      for (const name of ["beforeinput", "compositionstart"]) host.removeEventListener(name, nativeInput, true);
      for (const name of ["copy", "beforematch"]) host.removeEventListener(name, stop, true);
      doc.removeEventListener("selectionchange", selection);
      doc.removeEventListener("keydown", key, true);
      doc.removeEventListener("scroll", stop, true);
      view?.removeEventListener("resize", stop);
      view?.visualViewport?.removeEventListener("resize", stop);
      view?.visualViewport?.removeEventListener("scroll", stop);
      doc.fonts?.removeEventListener("loadingdone", stop);
      for (const node of chain) node.removeEventListener("transitionrun", stop, true);
    },
  };
}

/** Known finite composition preflight BEFORE any member measures/allocates.
 * Share options.revision with text/geometry/readout owners; independent caps
 * remain enforced by that same transaction, including still-active work. */
export function commitNumberPresentations(
  entries: readonly { controller: ReturnType<typeof createNumberPresentation>; options: NumberPresentationCommit }[],
) {
  const active = new Set(entries.flatMap(({ controller }) => [...controller.active()]));
  const plans: readonly NumberPlan[] = entries.map(({ controller, options }) => controller.preview(options));
  const bounded = boundNumberRevision(plans, active);
  const allowed = bounded.every((plan, index) => plan === plans[index]);
  for (const entry of entries) entry.controller.commit(entry.options, allowed);
}
