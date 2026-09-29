/**
 * Anchoring highlights in HTML by character offsets over the container's text,
 * with the quoted text as a fallback when the offsets no longer match.
 */

export interface TextPosition { start: number; end: number; text: string }

function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement?.closest('script,style,noscript') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

/** Character offsets of a DOM range relative to the container's concatenated text. */
export function rangeToOffsets(root: Node, range: Range): TextPosition | null {
  let start = -1, end = -1, acc = 0;
  for (const node of textNodes(root)) {
    const len = node.data.length;
    if (node === range.startContainer) start = acc + range.startOffset;
    if (node === range.endContainer) end = acc + range.endOffset;
    // Boundaries on element nodes: resolve to the first/last text node inside.
    if (start < 0 && range.startContainer.nodeType === Node.ELEMENT_NODE && range.startContainer.contains(node) && range.comparePoint(node, 0) >= 0) start = acc;
    if (end < 0 && range.endContainer.nodeType === Node.ELEMENT_NODE && range.endContainer.contains(node) && range.comparePoint(node, len) <= 0) end = acc + len;
    acc += len;
  }
  if (start < 0 || end < 0 || end <= start) return null;
  return { start, end, text: range.toString() };
}

/** Build a DOM range from character offsets. */
export function offsetsToRange(root: Node, start: number, end: number): Range | null {
  const range = document.createRange();
  let acc = 0, haveStart = false;
  for (const node of textNodes(root)) {
    const len = node.data.length;
    if (!haveStart && start >= acc && start <= acc + len) { range.setStart(node, start - acc); haveStart = true; }
    if (haveStart && end >= acc && end <= acc + len) { range.setEnd(node, end - acc); return range; }
    acc += len;
  }
  return null;
}

/** Re-find a position: trust the offsets if the text still matches, otherwise search for the quote near them. */
export function resolvePosition(root: Node, pos: TextPosition): Range | null {
  const direct = offsetsToRange(root, pos.start, pos.end);
  if (direct && norm(direct.toString()) === norm(pos.text)) return direct;
  const full = textNodes(root).map(n => n.data).join('');
  const needle = pos.text;
  const candidates: number[] = [];
  let i = full.indexOf(needle);
  while (i >= 0) { candidates.push(i); i = full.indexOf(needle, i + 1); }
  if (!candidates.length) return null;
  const best = candidates.reduce((a, b) => (Math.abs(b - pos.start) < Math.abs(a - pos.start) ? b : a));
  return offsetsToRange(root, best, best + needle.length);
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Wrap every text node inside the range with a span (splitting boundary nodes). Returns the spans. */
export function wrapRange(range: Range, makeSpan: () => HTMLElement): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const root = range.commonAncestorContainer;
  const nodes = textNodes(root.nodeType === Node.TEXT_NODE ? root.parentNode! : root).filter(n => range.intersectsNode(n));
  for (const node of nodes) {
    let target = node;
    if (node === range.startContainer && range.startOffset > 0) target = target.splitText(range.startOffset);
    if (node === range.endContainer) {
      const endOffset = node === range.startContainer ? range.endOffset - range.startOffset : range.endOffset;
      if (endOffset < target.data.length) target.splitText(endOffset);
    }
    if (!target.data.trim() && target.data.length === 0) continue;
    const span = makeSpan();
    target.parentNode!.insertBefore(span, target);
    span.appendChild(target);
    spans.push(span);
  }
  return spans;
}

/** Remove wrapper spans, merging text back. */
export function unwrapAll(root: HTMLElement, selector: string) {
  root.querySelectorAll(selector).forEach(el => {
    const parent = el.parentNode!;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  root.normalize();
}
