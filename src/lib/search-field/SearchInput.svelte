<script>
  import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap } from "@codemirror/commands";
  import { concealPlugin } from "./conceal-plugin.js";
  import { parse } from "./parser/index.js";
  import { tagAutocompleteExtension } from "./autocomplete-plugin.js";
  import { editorTheme } from "./editor-theme.js";

  let {
    threshold = 0,
    autocompleteMinChars = 0,
    autocompleteDebounceMs = 200,
    showImplicit = false,
    implicitOp = "and",
    doc = "",
    ph = "Search...",
    tags = null,
    onchange = () => {},
  } = $props();

  let container;
  let view;
  let viewReady = $state(false);
  let rawContent = $state("");
  let showParensError = $state(false);

  let operatorError = $derived.by(() => {
    if (!rawContent) return false;
    const { elements } = parse(rawContent);
    const quotedRanges = elements
      .filter((el) => el.type === "quoted")
      .map(({ from, to }) => ({ from, to }));
    const outside = elements.filter(
      (el) =>
        el.type === "operator" &&
        !quotedRanges.some((qr) => el.from >= qr.from && el.to <= qr.to),
    );
    for (let i = 1; i < outside.length; i++) {
      const between = rawContent.slice(outside[i - 1].to, outside[i].from);
      if (/^\s*$/.test(between)) return true;
    }
    return false;
  });

  let parensError = $derived.by(() => {
    if (!rawContent) return null;
    const { elements } = parse(rawContent);
    const quotedRanges = elements
      .filter((el) => el.type === "quoted")
      .map(({ from, to }) => ({ from, to }));
    let balance = 0;
    for (const el of elements) {
      if (el.type !== "open" && el.type !== "close") continue;
      if (quotedRanges.some((qr) => el.from >= qr.from && el.to <= qr.to)) continue;
      if (el.type === "open") {
        balance++;
      } else {
        balance--;
        if (balance < 0) return { type: "unmatched_close" };
      }
    }
    if (balance > 0) return { type: "unmatched_open" };
    return null;
  });

  const concealCompartment = new Compartment();
  const autocompleteCompartment = new Compartment();
  const singleLine = EditorState.transactionFilter.of((tr) => {
    if (tr.newDoc.lines > 1) return [];
    return tr;
  });
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      rawContent = update.state.doc.toString();
      showParensError = false;
    }
  });

  $effect(() => {
    if (!container) return;

    view = new EditorView({
      doc,
      extensions: [
        singleLine,
        updateListener,
        cmPlaceholder(ph),
        keymap.of(defaultKeymap),
        keymap.of([
          {
            key: "Enter",
            run: () => { showParensError = true; return true; },
          },
        ]),
        concealCompartment.of(concealPlugin(1, false, "and")),
        autocompleteCompartment.of(tagAutocompleteExtension(1, 100, tags)),
        editorTheme,
      ],
      parent: container,
    });

    view.dom.addEventListener("focusout", (e) => {
      if (!view.dom.contains(e.relatedTarget)) {
        showParensError = true;
      }
    });

    rawContent = view.state.doc.toString();
    viewReady = true;

    return () => {
      viewReady = false;
      view.destroy();
    };
  });

  $effect(() => {
    if (!viewReady) return;
    const t = threshold;
    const s = showImplicit;
    const o = implicitOp;
    const m = autocompleteMinChars;
    const d = autocompleteDebounceMs;
    const tg = tags;

    view.dispatch({
      effects: [
        concealCompartment.reconfigure(concealPlugin(t, s, o)),
        autocompleteCompartment.reconfigure(tagAutocompleteExtension(m, d, tg)),
      ],
    });
  });

  $effect(() => {
    onchange(rawContent);
  });
</script>

<div class="search-row">
  <div class="editor-wrapper" bind:this={container}></div>
  <button onclick={() => (showParensError = true)}>Apply</button>
</div>

{#if operatorError}
  <p class="error-msg">Consecutive boolean operators detected</p>
{/if}

{#if parensError && (parensError.type === "unmatched_close" || showParensError)}
  <p class="error-msg">
    {parensError.type === "unmatched_close"
      ? "Unmatched closing parenthesis"
      : "Unclosed opening parenthesis"}
  </p>
{/if}

<p class="raw-label">Raw value:</p>
<pre class="raw-value">{rawContent || "\u00A0"}</pre>

<style>
  .search-row {
    display: flex;
    align-items: stretch;
    gap: 4px;
  }

  .editor-wrapper {
    flex: 1;
    min-width: 0;
    border: 1px solid #aaa;
    border-radius: 4px;
  }

  .editor-wrapper:focus-within {
    border-color: #66f;
  }

  .error-msg {
    color: #cc0000;
    font-size: 13px;
    margin: 4px 0 0;
  }

  .raw-label {
    font-size: 12px;
    color: #666;
    margin: 8px 0 2px;
  }

  .raw-value {
    font-family: ui-monospace, "Cascadia Code", monospace;
    font-size: 13px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 6px 8px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    color: #333;
  }
</style>
