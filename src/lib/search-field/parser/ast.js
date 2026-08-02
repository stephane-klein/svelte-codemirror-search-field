import { And, Or, Tag, Word, QuotedString, endOffset } from "./lexer.js";

function tagToAst(node) {
  const tok = node.children.Tag?.[0];
  if (!tok) return null;
  return {
    type: "tag",
    name: tok.image.slice(1),
    from: tok.startOffset,
    to: endOffset(tok),
  };
}

function wordToAst(node) {
  const tok = node.children.Word?.[0];
  if (!tok) return null;
  return {
    type: "unknown",
    text: tok.image,
    from: tok.startOffset,
    to: endOffset(tok),
  };
}

function quotedToAst(node) {
  const tok = node.children.QuotedString?.[0];
  if (!tok) return null;
  const closed = tok.image.endsWith('"');
  return {
    type: "quoted",
    text: tok.image.slice(1, closed ? -1 : undefined),
    from: tok.startOffset + 1,
    to: closed ? endOffset(tok) - 1 : endOffset(tok),
  };
}

function blocToAst(node, ctx) {
  if (!node || !node.children) return null;
  if (node.children.notExpr) return notExprToAst(node.children.notExpr[0], ctx);
  if (node.children.parenExpr) return parenExprToAst(node.children.parenExpr[0], ctx);
  return tagToAst(node) || quotedToAst(node) || wordToAst(node) || null;
}

function notExprToAst(node, ctx) {
  const notTok = node.children.Not?.[0];
  const operand = blocToAst(node.children.bloc?.[0], ctx);
  if (!notTok) return operand;
  return {
    type: "not",
    operand,
    from: notTok.startOffset,
    to: operand ? operand.to : endOffset(notTok),
  };
}

function parenExprToAst(node, ctx) {
  const lparen = node.children.LParen?.[0];
  const inner = expressionToAst(node.children.expression?.[0], ctx);
  if (!inner) return null;
  const rparen = node.children.RParen?.[0];
  inner.from = lparen ? lparen.startOffset : inner.from;
  inner.to = rparen ? endOffset(rparen) : inner.to;
  return inner;
}

export function expressionToAst(node, ctx = { implicitOp: null, errors: [] }) {
  if (!node || !node.children) return null;
  const first = blocToAst(node.children.bloc?.[0], ctx);
  const followings = node.children.following || [];
  if (!first) return null;

  let current = first;
  for (const following of followings) {
    const bloc = blocToAst(following.children.bloc?.[0], ctx);
    const opNode = following.children.operator?.[0];

    if (opNode) {
      const andTok = opNode.children.And?.[0];
      const orTok = opNode.children.Or?.[0];
      const tok = andTok || orTok;
      current = {
        type: andTok ? "and" : "or",
        left: current,
        right: bloc,
        from: current.from,
        to: bloc ? bloc.to : endOffset(tok),
      };
    } else if (ctx.implicitOp) {
      current = {
        type: ctx.implicitOp,
        left: current,
        right: bloc,
        from: current.from,
        to: bloc ? bloc.to : current.to,
      };
    } else {
      if (bloc) {
        ctx.errors.push({
          kind: "parsing",
          message: "Missing operator (and or or) between juxtaposed expressions",
          offset: bloc.from,
        });
      }
      break;
    }
  }
  return current;
}

export function normalizeErrors(lexErrors, parseErrors) {
  const lexing = (lexErrors || []).map((e) => ({
    kind: "lexing",
    message: e.message,
    offset: e.offset,
  }));
  const parsing = (parseErrors || []).map((e) => ({
    kind: "parsing",
    message: e.message,
    offset: e.token ? e.token.startOffset : -1,
  }));
  return [...lexing, ...parsing];
}
