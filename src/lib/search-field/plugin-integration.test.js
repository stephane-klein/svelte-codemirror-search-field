import { describe, test, expect } from "vitest";
import { EditorView, Decoration } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { concealPlugin } from "./conceal-plugin.js";

function pluginDecorations(docStr, options = {}) {
  const { threshold = 0, showImplicit = false } = options;
  const spec = concealPlugin(threshold, showImplicit, "and");
  const state = EditorState.create({ doc: docStr, extensions: [spec] });
  const view = new EditorView({ state, parent: document.body });
  view.contentDOM.blur();
  const decorations = view.plugin(spec).decorations;
  const ranges = [];
  if (decorations instanceof Decoration.set([], false).constructor) {
    decorations.between(0, docStr.length, (from, to, deco) => {
      ranges.push({ from, to, spec: deco.spec });
    });
  }
  view.destroy();
  return ranges;
}

describe("concealPlugin — real EditorView integration", () => {
  test("produces replace + widget decorations for #linux and #git", () => {
    const ranges = pluginDecorations("#linux and #git");
    const replaces = ranges.filter((r) => r.spec?.widget === undefined);
    const widgets = ranges.filter((r) => r.spec?.widget !== undefined);
    expect(replaces.length).toBe(3);
    expect(widgets.length).toBe(3);
    expect(widgets.map((w) => w.from)).toEqual([0, 6, 11]);
  });

  test("no decoration when everything is quoted", () => {
    const ranges = pluginDecorations('"#linux"');
    expect(ranges.length).toBe(0);
  });
});
