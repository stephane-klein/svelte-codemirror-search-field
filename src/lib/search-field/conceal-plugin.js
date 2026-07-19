import { ViewPlugin, Decoration } from "@codemirror/view";
import { TagWidget } from "./tag-widget.js";
import { OperatorWidget } from "./operator-widget.js";

const TAG_PATTERN = /#[^\s#(),\[\]{}<>]+/g;

function expandRange(from, to, threshold, max) {
  return [
    Math.max(0, from - threshold),
    Math.min(max, to + threshold),
  ];
}

export function findOperators(docStr) {
  const results = [];

  const wordRe = /\b(or|and|et|ou|not|non)\b/gi;
  let m;
  while ((m = wordRe.exec(docStr)) !== null) {
    results.push({ from: m.index, to: m.index + m[0].length, text: m[0] });
  }

  const symRe = /\|\||&&/g;
  while ((m = symRe.exec(docStr)) !== null) {
    results.push({ from: m.index, to: m.index + m[0].length, text: m[0] });
  }

  const exclRe = /(?:^|\s)!(?=\s|$)/g;
  while ((m = exclRe.exec(docStr)) !== null) {
    const start = m.index + (m[0][0] === " " ? 1 : 0);
    results.push({ from: start, to: start + 1, text: "!" });
  }

  results.sort((a, b) => a.from - b.from);
  return results;
}

export function findQuotedRanges(docStr) {
  const ranges = [];
  let i = 0;
  while (i < docStr.length) {
    const start = docStr.indexOf('"', i);
    if (start === -1) break;
    const end = docStr.indexOf('"', start + 1);
    if (end === -1) {
      ranges.push({ from: start + 1, to: Infinity });
      break;
    }
    ranges.push({ from: start + 1, to: end });
    i = end + 1;
  }
  return ranges;
}

export function checkParens(docStr, quotedRanges) {
  let balance = 0;
  for (let i = 0; i < docStr.length; i++) {
    if (quotedRanges.some((r) => i >= r.from && i < r.to)) continue;
    if (docStr[i] === "(") balance++;
    if (docStr[i] === ")") {
      balance--;
      if (balance < 0) return { type: "unmatched_close" };
    }
  }
  if (balance > 0) return { type: "unmatched_open" };
  return null;
}

function tagDecorations(view, threshold, showImplicit, defaultOp) {
  const widgets = [];
  const doc = view.state.doc;
  const docStr = doc.toString();
  const docLength = docStr.length;
  const selections = view.state.selection.ranges;
  const hasFocus = view.hasFocus;
  const quotedRanges = findQuotedRanges(docStr);

  function addConceal(from, to, text, isTag) {
    const insideQuotes = quotedRanges.some((qr) => from >= qr.from && to <= qr.to);
    if (insideQuotes) return;
    const [eFrom, eTo] = expandRange(from, to, threshold, docLength);

    const nearCursor = hasFocus && selections.some(
      (sel) => eFrom <= sel.to && sel.from <= eTo
    );

    if (nearCursor) return;

    const toPos = to;
    const widget = isTag
      ? new TagWidget({
          tag: text,
          onClick: () => {
            view.dispatch({
              selection: { anchor: toPos },
              scrollIntoView: true,
            });
            view.focus();
          },
        })
      : new OperatorWidget({
          text,
          onClick: () => {
            view.dispatch({
              selection: { anchor: toPos },
              scrollIntoView: true,
            });
            view.focus();
          },
        });

    widgets.push(Decoration.replace({}).range(from, to));
    widgets.push(Decoration.widget({ widget }).range(from));
  }

  TAG_PATTERN.lastIndex = 0;

  const tags = [];
  let match;
  while ((match = TAG_PATTERN.exec(docStr)) !== null) {
    tags.push({ from: match.index, to: match.index + match[0].length, text: match[0].slice(1), type: "tag" });
  }

  const operators = findOperators(docStr).map((op) => ({ ...op, type: "operator" }));

  const parens = [];
  for (let i = 0; i < docStr.length; i++) {
    if (docStr[i] === "(" || docStr[i] === ")") {
      if (!quotedRanges.some((r) => i >= r.from && i < r.to)) {
        parens.push({ from: i, to: i + 1, text: docStr[i], type: docStr[i] === "(" ? "open" : "close" });
      }
    }
  }

  const elements = [...tags, ...operators, ...parens].sort((a, b) => a.from - b.from);

  for (const el of elements) {
    if (el.type === "tag") {
      addConceal(el.from, el.to, el.text, true);
    } else if (el.type === "operator") {
      let from = el.from;
      let to = el.to;
      if (from > 0 && docStr[from - 1] === " ") from--;
      if (to < docLength && docStr[to] === " ") to++;
      addConceal(from, to, el.text, false);
    }
  }

  if (showImplicit) {
    for (let i = 1; i < elements.length; i++) {
      const prev = elements[i - 1];
      const curr = elements[i];
      if (prev.type === "operator" || curr.type === "operator") continue;
      const between = docStr.slice(prev.to, curr.from);
      if (/^\s*$/.test(between) && between.length > 0) {
        addConceal(prev.to, curr.from, defaultOp, false);
      }
    }
  }

  return Decoration.set(widgets, true);
}

export function concealPlugin(threshold = 1, showImplicit = false, defaultOp = "and") {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = tagDecorations(view, threshold, showImplicit, defaultOp);
      }

      update(update) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged ||
          update.focusChanged
        ) {
          this.decorations = tagDecorations(update.view, threshold, showImplicit, defaultOp);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}
