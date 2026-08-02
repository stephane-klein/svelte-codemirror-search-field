# search-field parser

Search DSL parsing module built on [Chevrotain](https://chevrotain.io), framework-agnostic (no dependency on CodeMirror or Svelte). Designed to be extractable as-is into an independent npm package if need.

## Public API

```js
import { parse } from "./index.js";

const { ast, errors, elements } = parse("#linux and #git");
const { ast: astLoose } = parse("#linux #git", { implicitOp: "and" });
```

- `ast` — semantic, framework-agnostic AST (see contract below). `null` for empty input.
- `errors` — normalized list `{ kind: "lexing" | "parsing", message, offset }`. `offset` may be `-1` (end of input). Consumers must not depend on Chevrotain's internal types.
- `elements` — **lossless lexical view**: flat list `{ type, text, from, to }` derived from the lexer tokens, ordered by position. This is what enables UI decoration, including on invalid inputs (juxtaposed tags, typing in progress) that the strict parser cannot structure.

### `implicitOp` option

`parse(input, { implicitOp })` controls how juxtaposed blocs (no explicit operator between them) are handled:

- **Default (`implicitOp` omitted or `null`)** — strict: a juxtaposition is reported as a `parsing` error (`Missing operator (and or or) between juxtaposed expressions`) and the AST stays lossy (only the first bloc). This is the contract for SQL generation.
- **`implicitOp: "and"` / `implicitOp: "or"`** — the juxtaposed blocs are folded left-to-right with that operator and produce **no error**. This is the UI-facing behavior (the demo passes the configured implicit operator).

`elements` are identical in both modes.

### `elements` types

| type             | text                            | from / to                             |
|------------------|---------------------------------|---------------------------------------|
| `tag`            | tag name **without** the `#`    | full span including the `#`           |
| `operator`       | `and`, `et`, `&&`, `or`, `ou`,  `not`, `non`, `!` | token span     |
| `quoted`         | content between quotes          | **inner** span (excluding the quotes) |
| `open` / `close` | `(` / `)`                       | character span                        |
| `word`           | raw text                        | span                                  |

## AST contract

```
{ type: "tag",     name, from, to }
{ type: "quoted",  text, from, to }
{ type: "not",     operand, from, to }
{ type: "and" | "or", left, right, from, to }
{ type: "unknown", text, from, to }   // raw word, tolerance
```

Parentheses are unwrapped: `(#a and #b)` produces the same `and` node as `#a and #b`, with `from`/`to` spanning the parentheses.

## Associativity: important pitfall

`and` and `or` have the **same precedence** and fold **strictly left to right**:

```
a or b and c   →   (a or b) and c
```

There is **no** classic `and` > `or` precedence. This choice is faithful to the original Peggy grammar (see `postgres-tags-model-poc`). Do not "fix" it in a consumer.

## Intended behaviors

- **Juxtaposition without an operator** (`#linux "texte"`, `#a #b`) → in strict mode, a `Missing operator` error in `errors` (consistent with the Peggy grammar, invalid for SQL). With `implicitOp`, the juxtaposed blocs fold into that operator and produce no error. UI decoration is always possible via `elements` (lossless).
- **Unclosed quote** → the remaining content is absorbed into a `quoted` node (lenient live-editing handling).
- **`!` only standalone** (`a ! b`): `!foo`, `!(...)` and `foo!` do not produce an operator. Accepted limitation, to lift via the grammar if needed.
- **Error recovery enabled** (`recoveryEnabled: true`): on invalid input (e.g. `#linux an` while typing `and`), the parser does not throw, builds a partial CST and reports errors separately.

## Tests

```bash
node --test src/lib/search-field/parser/test/parser.test.js
```
