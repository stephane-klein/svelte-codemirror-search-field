import { Tag, And, Or, Not, LParen, RParen, QuotedString, Word, endOffset } from "./lexer.js";

export function buildElements(tokens) {
  const elements = [];
  for (const tok of tokens) {
    const { tokenType } = tok;
    if (tokenType === Tag) {
      elements.push({
        type: "tag",
        text: tok.image.slice(1),
        from: tok.startOffset,
        to: endOffset(tok),
      });
    } else if (tokenType === And || tokenType === Or || tokenType === Not) {
      elements.push({
        type: "operator",
        text: tok.image,
        from: tok.startOffset,
        to: endOffset(tok),
      });
    } else if (tokenType === QuotedString) {
      const closed = tok.image.endsWith('"');
      elements.push({
        type: "quoted",
        text: tok.image.slice(1, closed ? -1 : undefined),
        from: tok.startOffset + 1,
        to: closed ? endOffset(tok) - 1 : endOffset(tok),
      });
    } else if (tokenType === LParen) {
      elements.push({ type: "open", text: "(", from: tok.startOffset, to: endOffset(tok) });
    } else if (tokenType === RParen) {
      elements.push({ type: "close", text: ")", from: tok.startOffset, to: endOffset(tok) });
    } else if (tokenType === Word) {
      elements.push({
        type: "word",
        text: tok.image,
        from: tok.startOffset,
        to: endOffset(tok),
      });
    }
  }
  return elements;
}
