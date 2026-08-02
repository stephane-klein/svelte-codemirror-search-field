import { ViewPlugin, Decoration } from "@codemirror/view";
import { TagWidget } from "./tag-widget.js";
import { OperatorWidget } from "./operator-widget.js";
import { parse } from "./parser/index.js";

function expandRange(from, to, threshold, max) {
  return [
    Math.max(0, from - threshold),
    Math.min(max, to + threshold),
  ];
}

export function buildConcealments(docStr, options = {}) {
  const { threshold = 0, selections = [], hasFocus = false, showImplicit = false, defaultOp = "and" } = options;
  const docLength = docStr.length;
  const { elements } = parse(docStr);
  const quotedRanges = elements
    .filter((el) => el.type === "quoted")
    .map(({ from, to }) => ({ from, to }));
  const concealments = [];

  const insideQuotes = (from, to) =>
    quotedRanges.some((qr) => from >= qr.from && to <= qr.to);

  function addConceal(from, to, text, isTag) {
    if (insideQuotes(from, to)) return;
    const [eFrom, eTo] = expandRange(from, to, threshold, docLength);

    const nearCursor = hasFocus && selections.some(
      (sel) => eFrom <= sel.to && sel.from <= eTo,
    );

    if (nearCursor) return;

    concealments.push({ from, to, text, isTag });
  }

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
    const boundaries = elements.filter(
      (el) =>
        el.type === "tag" ||
        el.type === "operator" ||
        ((el.type === "open" || el.type === "close") && !insideQuotes(el.from, el.to)),
    );
    for (let i = 1; i < boundaries.length; i++) {
      const prev = boundaries[i - 1];
      const curr = boundaries[i];
      if (prev.type === "operator" || curr.type === "operator") continue;
      const between = docStr.slice(prev.to, curr.from);
      if (/^\s*$/.test(between) && between.length > 0) {
        addConceal(prev.to, curr.from, defaultOp, false);
      }
    }
  }

  return concealments;
}

function tagDecorations(view, threshold, showImplicit, defaultOp) {
  const widgets = [];
  const docStr = view.state.doc.toString();
  const selections = view.state.selection.ranges;

  const concealments = buildConcealments(docStr, {
    threshold,
    selections,
    hasFocus: view.hasFocus,
    showImplicit,
    defaultOp,
  });

  for (const c of concealments) {
    const toPos = c.to;
    const widget = c.isTag
      ? new TagWidget({
          tag: c.text,
          onClick: () => {
            view.dispatch({
              selection: { anchor: toPos },
              scrollIntoView: true,
            });
            view.focus();
          },
        })
      : new OperatorWidget({
          text: c.text,
          onClick: () => {
            view.dispatch({
              selection: { anchor: toPos },
              scrollIntoView: true,
            });
            view.focus();
          },
        });

    widgets.push(Decoration.replace({}).range(c.from, c.to));
    widgets.push(Decoration.widget({ widget }).range(c.from));
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
