import { textProofLimits } from "./motion";
import type { TextSnapshot, TextUnit } from "./text-diff";

type Box = Pick<DOMRect, "left" | "top" | "width" | "height">;
const highlights = new WeakMap<Document, Set<Highlight>>();
/** Trusted pixel-only text/reel masks share a document registry. Unknown caller
 * highlights still force native paint; one family's mask is not foreign work. */
export function ownedTextHighlights(doc: Document) {
  let known = highlights.get(doc);
  if (!known) {
    known = new Set<Highlight>();
    highlights.set(doc, known);
  }
  return known;
}

export type TextLayout = {
  boxes: Map<object, Box>;
  font: string;
  color: string;
  ascent: number;
  descent: number;
  baseline: number;
  kerning: CanvasFontKerning;
};

/** Actual inherited editing, including plaintext-only and explicit false islands. */
export function nativeTextContext(host: HTMLElement) {
  if (host.ownerDocument.designMode === "on" || host.isContentEditable) return true;
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    const value = node.getAttribute("contenteditable")?.toLowerCase();
    if (value === "false") return false;
    if (value === "" || value === "true" || value === "plaintext-only") return true;
  }
  return Boolean(host.closest("input,textarea,select,option"));
}

export function selectedTextContext(host: HTMLElement) {
  const selection = host.ownerDocument.getSelection();
  if (!selection || selection.isCollapsed) return false;
  for (let index = 0; index < selection.rangeCount; index++) {
    if (selection.getRangeAt(index).intersectsNode(host)) return true;
  }
  return false;
}

/** Conservative actual-font raster correspondence, never an ASCII-only proof.
 * Unsupported scripts/features remain exact native text. No typography overrides.
 */
export function proveTextLayout(host: HTMLElement, snapshot: TextSnapshot): TextLayout | null {
  const view = host.ownerDocument.defaultView;
  const css = view?.getComputedStyle(host);
  const viewport = view?.visualViewport;
  if (
    // Native/canvas glyph coverage is proven at unit device scale only.
    // Other scales keep exact native text until that correspondence is proven.
    view?.devicePixelRatio !== 1 ||
    (viewport && (viewport.scale !== 1 || viewport.offsetLeft !== 0 || viewport.offsetTop !== 0)) ||
    !css ||
    !snapshot.units ||
    !host.isConnected ||
    host.textContent !== snapshot.value ||
    nativeTextContext(host) ||
    selectedTextContext(host) ||
    host.closest('[hidden],[inert],[aria-hidden="true"]') ||
    css.visibility !== "visible" ||
    css.display === "none" ||
    css.opacity !== "1" ||
    css.direction !== "ltr" ||
    css.writingMode !== "horizontal-tb" ||
    css.textTransform !== "none" ||
    css.textShadow !== "none" ||
    css.textDecorationLine !== "none" ||
    !["normal", "0px"].includes(css.letterSpacing) ||
    !["normal", "0px"].includes(css.wordSpacing) ||
    css.fontFeatureSettings !== "normal" ||
    css.fontVariationSettings !== "normal" ||
    css.fontVariant !== "normal" ||
    !css.font ||
    /[^\x20-\x7e]/.test(snapshot.value) ||
    !host.ownerDocument.fonts?.check(css.font, snapshot.value || " ")
  )
    return null;
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (
      style.visibility !== "visible" ||
      style.display === "none" ||
      style.opacity !== "1" ||
      style.transform !== "none" ||
      style.translate !== "none" ||
      style.scale !== "none" ||
      style.rotate !== "none" ||
      style.filter !== "none" ||
      style.perspective !== "none" ||
      style.backdropFilter !== "none" ||
      style.clipPath !== "none" ||
      style.maskImage !== "none" ||
      /layout|paint|strict|content/.test(style.contain) ||
      style.contentVisibility !== "visible" ||
      /transform|filter|perspective/.test(style.willChange) ||
      (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`) &&
        [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomLeftRadius,
          style.borderBottomRightRadius,
        ].some((radius) => Number.parseFloat(radius) !== 0)) ||
      !["normal", "1"].includes(style.zoom) ||
      node.getAnimations().length > 0
    )
      return null;
  }
  const canvas = host.ownerDocument.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.font = css.font;
  context.fontKerning = css.fontKerning as CanvasFontKerning;
  const metrics = context.measureText(snapshot.value);
  const padding = Math.ceil(Number.parseFloat(css.fontSize));
  const ascent = metrics.fontBoundingBoxAscent,
    descent = metrics.fontBoundingBoxDescent;
  const width = Math.ceil(metrics.width) + padding * 2;
  const height = Math.ceil(ascent + descent) + padding * 2;
  if (
    ![width, height, ascent, descent].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    width > textProofLimits.axis ||
    height > textProofLimits.axis ||
    width * height > textProofLimits.pixels
  )
    return null;
  canvas.width = width;
  canvas.height = height;
  context.font = css.font;
  context.fontKerning = css.fontKerning as CanvasFontKerning;
  context.fillText(snapshot.value, padding, padding + ascent);
  const whole = context.getImageData(0, 0, width, height).data;
  context.clearRect(0, 0, width, height);
  let x = padding;
  for (const unit of snapshot.units) {
    context.fillText(unit.text, x, padding + ascent);
    x += context.measureText(unit.text).width;
  }
  const separate = context.getImageData(0, 0, width, height).data;
  if (whole.some((value, index) => value !== separate[index])) return null;
  const boxes = new Map<object, Box>();
  let offset = 0;
  for (const unit of snapshot.units) {
    const text = host.firstChild;
    if (text?.nodeType !== 3) return null;
    const range = host.ownerDocument.createRange();
    const start = offset;
    range.setStart(text, start);
    range.setEnd(text, start + unit.text.length);
    const rects = range.getClientRects();
    if (rects.length !== 1) return null;
    const box = rects[0];
    if (!box || ![box.left, box.top, box.width, box.height].every(Number.isFinite) || box.height <= 0) return null;
    boxes.set(unit.identity, { left: box.left, top: box.top, width: box.width, height: box.height });
    offset += unit.text.length;
  }
  let baseline = ascent;
  if (snapshot.units.length) {
    // Canvas font bounding metrics can round differently from native line boxes
    // at fractional device scales. A zero-size, empty baseline probe measures
    // the REAL line baseline, never a second content tree or a glyph wrapper.
    const original = [...host.getClientRects()].map((box) => [box.left, box.top, box.width, box.height].join("/"));
    const probe = host.ownerDocument.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "all:initial;display:inline-block;width:0;height:0;line-height:0;vertical-align:baseline;border:0;padding:0;margin:0";
    host.append(probe);
    const top = probe.getBoundingClientRect().top;
    const current = [...host.getClientRects()].map((box) => [box.left, box.top, box.width, box.height].join("/"));
    probe.remove();
    if (original.length !== current.length || original.some((box, index) => box !== current[index])) return null;
    const last = boxes.get(snapshot.units[snapshot.units.length - 1]?.identity ?? {});
    if (!last) return null;
    baseline = top - last.top;
    if (!Number.isFinite(baseline) || baseline <= 0 || baseline > last.height) return null;
  }
  return {
    boxes,
    font: css.font,
    color: css.color,
    ascent,
    descent,
    baseline,
    kerning: css.fontKerning as CanvasFontKerning,
  };
}

/** Paint contains pixels only: no outgoing accessible/selectable/findable string. */
export function outgoingTextPaint(host: HTMLElement, unit: TextUnit, layout: TextLayout) {
  const box = layout.boxes.get(unit.identity);
  if (!box || box.width <= 0) return null;
  const canvas = host.ownerDocument.createElement("canvas");
  const ratio = host.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.font = layout.font;
  const metrics = context.measureText(unit.text);
  const padding =
    Math.ceil(
      Math.max(
        0,
        metrics.actualBoundingBoxLeft,
        metrics.actualBoundingBoxRight - box.width,
        metrics.actualBoundingBoxAscent - layout.baseline,
        metrics.actualBoundingBoxDescent - (box.height - layout.baseline),
      ),
    ) + 1;
  const width = Math.ceil((box.width + padding * 2) * ratio),
    height = Math.ceil((box.height + padding * 2) * ratio);
  if (width * height > textProofLimits.pixels || Math.max(width, height) > textProofLimits.axis) return null;
  canvas.width = width;
  canvas.height = height;
  context.scale(ratio, ratio);
  context.font = layout.font;
  context.fontKerning = layout.kerning;
  context.fillStyle = layout.color;
  context.fillText(unit.text, padding, padding + layout.baseline);
  Object.assign(canvas.style, {
    position: "absolute",
    left: `${box.left - padding}px`,
    top: `${box.top - padding}px`,
    width: `${width / ratio}px`,
    height: `${height / ratio}px`,
    pointerEvents: "none",
    userSelect: "none",
  });
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.cadenceTextPaint = "";
  return canvas;
}
