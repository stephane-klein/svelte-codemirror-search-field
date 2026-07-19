import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme({
  "&": { height: "100%", maxWidth: "100%", overflow: "hidden" },
  ".cm-scroller": { overflow: "hidden" },
  ".cm-content": {
    padding: "0 8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    caretColor: "#000",
    fontFamily: "inherit",
    fontSize: "inherit",
    overflowX: "hidden",
  },
  ".cm-line": { overflow: "hidden" },
  ".cm-cursor": { borderLeftColor: "#000" },
  ".cm-gutters": { display: "none" },
  ".cm-tag-pill": {
    padding: "0.15em 0.5em",
    borderRadius: "0.4em",
    fontSize: "0.9em",
    fontWeight: "600",
    whiteSpace: "nowrap",
    userSelect: "none",
    fontFamily: "inherit",
    margin: "0 0.1em",
  },
  ".cm-operator-pill": {
    padding: "0.05em 0.25em",
    margin: "0 0.2em",
    borderRadius: "0.3em",
    fontSize: "0.75em",
    fontWeight: "500",
    whiteSpace: "nowrap",
    userSelect: "none",
    fontFamily: "inherit",
    backgroundColor: "#e5e5e5",
    color: "#666",
    textTransform: "uppercase",
  },
  ".cm-tooltip": {
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    color: "#1a1a1a",
    fontSize: "14px",
    maxHeight: "280px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete ul": {
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  ".cm-tooltip.cm-tooltip-autocomplete ul li": {
    padding: "3px 8px",
    lineHeight: "1.5",
  },
  ".cm-tooltip.cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "#0066cc",
    color: "#fff",
  },
  ".cm-completionMatchedText": {
    fontWeight: "700",
  },
  "&.cm-focused": { outline: "none" },
});
