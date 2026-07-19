<script>
  import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap } from "@codemirror/commands";
  import { concealPlugin, findOperators, findQuotedRanges, checkParens } from "./conceal-plugin.js";
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
    const operators = findOperators(rawContent);
    const quotedRanges = findQuotedRanges(rawContent);
    const outside = operators.filter(
      (op) => !quotedRanges.some((qr) => op.from >= qr.from && op.to <= qr.to),
    );
    for (let i = 1; i < outside.length; i++) {
      const between = rawContent.slice(outside[i - 1].to, outside[i].from);
      if (/^\s*$/.test(between)) return true;
    }
    return false;
  });

  let parensError = $derived.by(() => {
    if (!rawContent) return null;
    return checkParens(rawContent, findQuotedRanges(rawContent));
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
