import { createToken, Lexer } from "chevrotain";

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  line_breaks: false,
  group: Lexer.SKIPPED,
});

export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });

export const QuotedString = createToken({
  name: "QuotedString",
  pattern: /"[^"]*"?/,
});

export const And = createToken({
  name: "And",
  pattern: /&&|\b(?:and|et)\b/,
});

export const Or = createToken({
  name: "Or",
  pattern: /\|\||\b(?:or|ou)\b/,
});

export const Not = createToken({
  name: "Not",
  pattern: /\b(?:not|non)\b|(?<!\S)!(?!\S)/,
});

export const Tag = createToken({
  name: "Tag",
  pattern: /#[^\s#(),\[\]{}<>"]+/,
});

export const Word = createToken({
  name: "Word",
  pattern: /[^\s#()"]+/,
});

export const allTokens = [
  WhiteSpace,
  LParen,
  RParen,
  QuotedString,
  And,
  Or,
  Not,
  Tag,
  Word,
];

export const lexer = new Lexer(allTokens, { positionTracking: "onlyOffset" });

export function endOffset(tok) {
  return tok.startOffset + tok.image.length;
}
