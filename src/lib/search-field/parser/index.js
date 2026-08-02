import { lexer } from "./lexer.js";
import { parser } from "./parser.js";
import { expressionToAst, normalizeErrors } from "./ast.js";
import { buildElements } from "./elements.js";

export function parse(input, options = {}) {
  const { implicitOp = null } = options;
  const lexResult = lexer.tokenize(input);
  const tokens = lexResult.tokens;

  if (tokens.length === 0) {
    return {
      ast: null,
      errors: normalizeErrors(lexResult.errors, []),
      elements: [],
    };
  }

  parser.input = tokens;
  const cst = parser.expression();

  const errors = [];
  const ast = expressionToAst(cst, { implicitOp, errors });
  const allErrors = [...normalizeErrors(lexResult.errors, parser.errors), ...errors];

  return {
    ast,
    errors: allErrors,
    elements: buildElements(tokens),
  };
}
