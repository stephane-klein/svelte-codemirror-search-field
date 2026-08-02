import { CstParser } from "chevrotain";
import {
  allTokens,
  And,
  Or,
  Not,
  Tag,
  Word,
  LParen,
  RParen,
  QuotedString,
} from "./lexer.js";

class SearchQueryParser extends CstParser {
  constructor() {
    super(allTokens, { recoveryEnabled: true });
    this.performSelfAnalysis();
  }

  expression = this.RULE("expression", () => {
    this.SUBRULE(this.bloc);
    this.MANY(() => {
      this.SUBRULE(this.following);
    });
  });

  following = this.RULE("following", () => {
    this.OPTION(() => {
      this.SUBRULE(this.operator);
    });
    this.SUBRULE(this.bloc);
  });

  bloc = this.RULE("bloc", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.notExpr) },
      { ALT: () => this.SUBRULE(this.parenExpr) },
      { ALT: () => this.CONSUME(Tag) },
      { ALT: () => this.CONSUME(QuotedString) },
      { ALT: () => this.CONSUME(Word) },
    ]);
  });

  notExpr = this.RULE("notExpr", () => {
    this.CONSUME(Not);
    this.SUBRULE(this.bloc);
  });

  parenExpr = this.RULE("parenExpr", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
  });

  operator = this.RULE("operator", () => {
    this.OR([
      { ALT: () => this.CONSUME(And) },
      { ALT: () => this.CONSUME(Or) },
    ]);
  });
}

export const parser = new SearchQueryParser();
