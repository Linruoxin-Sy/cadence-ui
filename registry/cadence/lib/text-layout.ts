import { type CadenceMode, textProofLimits } from "./motion";
import { knownTextGeometry } from "./motion-transaction";
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
  letterSpacing: string;
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

/** These CSS paint properties change neither glyph ink nor its coordinate map.
 * Foreground, opacity, layout and unknown engine properties stay fail-closed. */
export function textSurfacePaint(property: string) {
  return /^(background-color|border-(top|right|bottom|left)-color|box-shadow)$/.test(
    property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
  );
}
export function surfaceOnlyAnimation(animation: Animation) {
  const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes?.();
  if (!frames?.length) return false;
  const properties = frames.flatMap((frame) =>
    Object.keys(frame).filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)),
  );
  return properties.length > 0 && properties.every(textSurfacePaint);
}

/** Conservative actual-font raster correspondence, never an ASCII-only proof.
 * Unsupported scripts/features remain exact native text. No typography overrides.
 */
export function proveTextLayout(
  host: HTMLElement,
  snapshot: TextSnapshot,
  { surfacePaint = false, geometryMode }: { surfacePaint?: boolean; geometryMode?: CadenceMode } = {},
): TextLayout | null {
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
    (css.letterSpacing !== "normal" && !/^-?(?:\d+(?:\.\d+)?|\.\d+)px$/.test(css.letterSpacing)) ||
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
      (style.transform !== "none" &&
        (() => {
          // Native popup placement is a stable translation, not glyph scaling.
          // Range boxes already contain that viewport mapping. Active transforms
          // remain rejected by the animation check below and layout invalidation.
          const matrix = new DOMMatrixReadOnly(style.transform);
          return !matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0;
        })()) ||
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
      !["normal", "1"].includes(style.zoom) ||
      node
        .getAnimations()
        .some(
          (animation) =>
            !knownTextGeometry(animation, geometryMode) && (!surfacePaint || !surfaceOnlyAnimation(animation)),
        )
    )
      return null;
  }
  const canvas = host.ownerDocument.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.font = css.font;
  context.fontKerning = css.fontKerning as CanvasFontKerning;
  const letterSpacing = css.letterSpacing === "normal" ? "0px" : css.letterSpacing;
  if (letterSpacing !== "0px") {
    if (typeof context.letterSpacing !== "string") return null;
    context.letterSpacing = letterSpacing;
    if (context.letterSpacing !== letterSpacing) return null;
    const spaced = context.measureText(snapshot.value).width;
    context.letterSpacing = "0px";
    const unspaced = context.measureText(snapshot.value).width;
    context.letterSpacing = letterSpacing;
    if (snapshot.value && spaced === unspaced) return null;
  }
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
  if (typeof context.letterSpacing === "string") context.letterSpacing = letterSpacing;
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
    if (rects.length !== 1) {
      const ink = context.measureText(unit.text);
      if (
        unit.text !== " " ||
        rects.length !== 2 ||
        ink.actualBoundingBoxLeft !== 0 ||
        ink.actualBoundingBoxRight !== 0 ||
        [...rects].some(
          (rect) => rect.width !== 0 || ![rect.left, rect.top, rect.height].every(Number.isFinite) || rect.height <= 0,
        )
      )
        return null;
    }
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
    letterSpacing,
  };
}

let nextLayoutAnchor = 0;
/** Native coordinate transport, not an animated position owner. Preserve the
 * single native Text tree while fixed pixel layers follow an intrinsic shell. */
export function followTextLayout(host: HTMLElement, layer: HTMLElement, revoke: () => void): (() => void) | null {
  const doc = host.ownerDocument,
    view = doc.defaultView;
  const attribute = "data-cadence-layout-anchor";
  if (
    !view?.CSS.supports("anchor-name", "--cadence-display") ||
    !view.CSS.supports("left", "anchor(--cadence-display left)") ||
    host.getRootNode() !== doc ||
    host.hasAttribute(attribute) ||
    view.getComputedStyle(host).getPropertyValue("anchor-name") !== "none"
  )
    return null;
  const id = String(++nextLayoutAnchor),
    name = `--cadence-display-${id}`;
  const sheet = new view.CSSStyleSheet();
  const origin = host.getBoundingClientRect();
  let alive = true;
  const observer = new MutationObserver(() => {
    if (alive && host.getAttribute(attribute) !== id) revoke();
  });
  const dispose = () => {
    alive = false;
    observer.disconnect();
    if (host.getAttribute(attribute) === id) host.removeAttribute(attribute);
    doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((value) => value !== sheet);
  };
  try {
    sheet.replaceSync(`[${attribute}="${id}"] { anchor-name: ${name}; }`);
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    host.setAttribute(attribute, id);
    layer.style.left = `anchor(${name} left)`;
    layer.style.top = `anchor(${name} top)`;
    // Check the actual containing tree/scope, not CSS.supports alone.
    const mapped = layer.getBoundingClientRect();
    if (
      view.getComputedStyle(host).getPropertyValue("anchor-name") !== name ||
      Math.abs(mapped.left - origin.left) > textProofLimits.coordinateUnit ||
      Math.abs(mapped.top - origin.top) > textProofLimits.coordinateUnit
    ) {
      dispose();
      return null;
    }
    // Native anchor coordinates quantize to a layout unit, while a projected
    // getBoundingClientRect can retain finer precision. Cancel that measured
    // initial offset; larger/different mappings still fail closed above.
    layer.style.left = `calc(anchor(${name} left) - ${mapped.left}px)`;
    layer.style.top = `calc(anchor(${name} top) - ${mapped.top}px)`;
    observer.observe(host, { attributes: true, attributeFilter: [attribute] });
    return dispose;
  } catch {
    dispose();
    return null;
  }
}

/** Candidate pixels must fit the original overflow clip, including used rounded
 * corners. CSS scales all corner radii by one factor before subtracting borders.
 * No clipping tree or typography is cloned; unknown shapes stay native. */
function insideTextClips(host: HTMLElement, box: Box) {
  const view = host.ownerDocument.defaultView;
  if (!view) return false;
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    const css = view.getComputedStyle(node);
    if (!/(auto|scroll|hidden|clip)/.test(`${css.overflowX} ${css.overflowY}`)) continue;
    const outer = node.getBoundingClientRect();
    const borders = [css.borderLeftWidth, css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth].map(
      Number.parseFloat,
    ) as [number, number, number, number];
    if (
      borders.some((value) => !Number.isFinite(value)) ||
      node.clientLeft !== Math.round(borders[0]) ||
      node.clientTop !== Math.round(borders[1])
    )
      return false;
    const left = outer.left + borders[0],
      top = outer.top + borders[1];
    const width = Math.min(node.clientWidth, outer.width - borders[0] - borders[2]);
    const height = Math.min(node.clientHeight, outer.height - borders[1] - borders[3]);
    if (box.left < left || box.top < top || box.left + box.width > left + width || box.top + box.height > top + height)
      return false;
    const length = (value: string, size: number) => {
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|%)?$/.test(value)) return NaN;
      return Number.parseFloat(value) * (value.endsWith("%") ? size / 100 : 1);
    };
    const radius = (value: string): [number, number] => {
      const [x = "", y = x] = value.split(/\s+/);
      return [length(x, outer.width), length(y, outer.height)];
    };
    const corners = [
      radius(css.borderTopLeftRadius),
      radius(css.borderTopRightRadius),
      radius(css.borderBottomRightRadius),
      radius(css.borderBottomLeftRadius),
    ] as const;
    if (corners.flat().some((value) => !Number.isFinite(value))) return false;
    const factor = Math.min(
      1,
      outer.width / (corners[0][0] + corners[1][0]),
      outer.width / (corners[3][0] + corners[2][0]),
      outer.height / (corners[0][1] + corners[3][1]),
      outer.height / (corners[1][1] + corners[2][1]),
    );
    if (!Number.isFinite(factor)) return false;
    const radii = corners.map(([x, y], i): [number, number] => [
      Math.max(0, x * factor - borders[i === 0 || i === 3 ? 0 : 2]),
      Math.max(0, y * factor - borders[i < 2 ? 1 : 3]),
    ]);
    for (const x of [box.left - left, box.left + box.width - left])
      for (const y of [box.top - top, box.top + box.height - top]) {
        for (const [i, [rx, ry]] of radii.entries()) {
          const dx = Math.max(0, rx - (i === 0 || i === 3 ? x : width - x));
          const dy = Math.max(0, ry - (i < 2 ? y : height - y));
          if (rx > 0 && ry > 0 && dx > 0 && dy > 0 && (dx / rx) ** 2 + (dy / ry) ** 2 > 1) return false;
        }
      }
  }
  return true;
}

/** Paint contains pixels only: no outgoing accessible/selectable/findable string. */
export function outgoingTextPaint(host: HTMLElement, unit: TextUnit, layout: TextLayout, alignPixels = false) {
  const box = layout.boxes.get(unit.identity);
  if (!box || box.width <= 0) return null;
  const canvas = host.ownerDocument.createElement("canvas");
  const ratio = host.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.font = layout.font;
  context.fontKerning = layout.kerning;
  if (typeof context.letterSpacing === "string") context.letterSpacing = layout.letterSpacing;
  const metrics = context.measureText(unit.text);
  const inkLeft = Math.min(box.left, box.left - metrics.actualBoundingBoxLeft);
  const inkRight = Math.max(box.left + box.width, box.left + metrics.actualBoundingBoxRight);
  const inkTop = alignPixels ? box.top : Math.min(box.top, box.top + layout.baseline - metrics.actualBoundingBoxAscent);
  const inkBottom = alignPixels
    ? box.top + box.height
    : Math.max(box.top + box.height, box.top + layout.baseline + metrics.actualBoundingBoxDescent);
  if (!insideTextClips(host, { left: inkLeft, top: inkTop, width: inkRight - inkLeft, height: inkBottom - inkTop }))
    return null;
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
  // A numeric cell can start at a fractional layout coordinate. Keep its canvas
  // texture on the device-pixel grid and raster the actual glyph offset inside
  // it; translating an integer-origin raster would resample its resting glyph.
  const left = alignPixels ? Math.floor((box.left - padding) * ratio) / ratio : box.left - padding;
  const top = alignPixels ? Math.floor((box.top - padding) * ratio) / ratio : box.top - padding;
  const width = Math.ceil((box.left + box.width + padding - left) * ratio),
    height = Math.ceil((box.top + box.height + padding - top) * ratio);
  if (width * height > textProofLimits.pixels || Math.max(width, height) > textProofLimits.axis) return null;
  canvas.width = width;
  canvas.height = height;
  context.scale(ratio, ratio);
  context.font = layout.font;
  context.fontKerning = layout.kerning;
  if (typeof context.letterSpacing === "string") context.letterSpacing = layout.letterSpacing;
  context.fillStyle = layout.color;
  context.fillText(unit.text, box.left - left, box.top - top + layout.baseline);
  Object.assign(canvas.style, {
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width / ratio}px`,
    height: `${height / ratio}px`,
    pointerEvents: "none",
    userSelect: "none",
  });
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.cadenceTextPaint = "";
  return canvas;
}

/** Exact inherited paint/allocation signature for native-height receipt coordination. */
export function textPaintSignature(chain: readonly HTMLElement[], view: Window | null) {
  return chain.map((node) => {
    const css = view?.getComputedStyle(node);
    return css
      ? {
          paint: [
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
          ].join("/"),
          width: css.width,
          height: css.height,
          transform: css.transform,
        }
      : null;
  });
}
