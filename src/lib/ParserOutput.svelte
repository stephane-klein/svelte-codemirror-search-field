<script>
  import { parse } from "$lib/search-field/parser/index.js";
  import { astToSql } from "$lib/astToSql.js";

  let { doc, implicitOp = null } = $props();

  const result = $derived(parse(doc, { implicitOp }));

  const astText = $derived(JSON.stringify(result.ast, null, 2));

  const errorsText = $derived(
    result.errors.length === 0
      ? "No errors"
      : result.errors
          .map((e) => `[${e.kind}] @${e.offset}: ${e.message.split("\n")[0]}`)
          .join("\n"),
  );

  const elementsText = $derived(
    result.elements
      .map((el) => `${el.type} ${JSON.stringify(el.text)} @${el.from}-${el.to}`)
      .join("\n"),
  );

  const sqlText = $derived(
    result.errors.length === 0 ? astToSql(result.ast) : null,
  );
</script>

<details class="parser-output" open>
  <summary>
    Parser output —
    {result.errors.length === 0
      ? "valid"
      : `${result.errors.length} error${result.errors.length > 1 ? "s" : ""}`}
  </summary>
  <div class="parser-grid">
    <div>
      <p class="parser-label">AST</p>
      <pre class="parser-value">{astText}</pre>
    </div>
    <div>
      <p class="parser-label">Errors</p>
      <pre class="parser-value" class:parser-error={result.errors.length > 0}>{errorsText}</pre>
    </div>
    <div>
      <p class="parser-label">Elements</p>
      <pre class="parser-value">{elementsText || "—"}</pre>
    </div>
  </div>
  <div class="parser-sql">
    <p class="parser-label">
      Example SQL — illustrative, uses pg_trgm (GIN <code>gin_trgm_ops</code>) on
      <code>description</code>
    </p>
    <pre class="parser-value">{sqlText || "—"}</pre>
  </div>
</details>

<style>
  .parser-output {
    margin: 4px 0 12px;
  }

  .parser-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }

  .parser-label {
    font-size: 12px;
    color: #666;
    margin: 0 0 2px;
  }

  .parser-sql {
    margin-top: 8px;
  }

  .parser-sql code {
    font-family: ui-monospace, "Cascadia Code", monospace;
    font-size: 11px;
    background: #eee;
    padding: 0 3px;
    border-radius: 2px;
  }

  .parser-value {
    font-family: ui-monospace, "Cascadia Code", monospace;
    font-size: 12px;
    background: #f7f7f7;
    border: 1px solid #eee;
    border-radius: 3px;
    padding: 6px 8px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    color: #333;
  }

  .parser-error {
    color: #cc0000;
  }
</style>
