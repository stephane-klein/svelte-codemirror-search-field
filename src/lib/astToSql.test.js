import { describe, test, expect } from "vitest";
import { astToSql } from "./astToSql.js";
import { parse } from "./search-field/parser/index.js";

const tag = (name) => ({ type: "tag", name });
const quoted = (text) => ({ type: "quoted", text });
const unknown = (text) => ({ type: "unknown", text });

describe("astToSql", () => {
  test("tag maps to = ANY(tags)", () => {
    expect(astToSql(tag("linux"))).toBe("'linux' = ANY(tags)");
  });

  test("quoted maps to a pg_trgm ILIKE on description, not a tag", () => {
    expect(astToSql(quoted("foo bar"))).toBe("description ILIKE '%foo bar%'");
  });

  test("unknown (free word) maps to a pg_trgm ILIKE on description", () => {
    expect(astToSql(unknown("foo"))).toBe("description ILIKE '%foo%'");
  });

  test("and and or nest with parentheses", () => {
    const and = { type: "and", left: tag("a"), right: tag("b") };
    expect(astToSql(and)).toBe("('a' = ANY(tags) AND 'b' = ANY(tags))");
    const or = { type: "or", left: and, right: tag("c") };
    expect(astToSql(or)).toBe("(('a' = ANY(tags) AND 'b' = ANY(tags)) OR 'c' = ANY(tags))");
  });

  test("not wraps its operand", () => {
    expect(astToSql({ type: "not", operand: tag("a") })).toBe("(NOT 'a' = ANY(tags))");
  });

  test("single quotes are escaped", () => {
    expect(astToSql(tag("O'Reilly"))).toBe("'O''Reilly' = ANY(tags)");
    expect(astToSql(unknown("l'été"))).toBe("description ILIKE '%l''été%'");
  });

  test("null input or missing children yield null", () => {
    expect(astToSql(null)).toBe(null);
    expect(astToSql({ type: "and", left: tag("a"), right: null })).toBe(null);
    expect(astToSql({ type: "not", operand: null })).toBe(null);
  });

  test("unknown node type yields null", () => {
    expect(astToSql({ type: "bogus" })).toBe(null);
  });

  test("end-to-end: parse with implicitOp and generates SQL", () => {
    const { ast, errors } = parse("#linux foo", { implicitOp: "and" });
    expect(errors).toEqual([]);
    expect(astToSql(ast)).toBe(
      "('linux' = ANY(tags) AND description ILIKE '%foo%')",
    );
  });
});
