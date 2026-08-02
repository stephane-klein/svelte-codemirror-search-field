import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "../index.js";

const types = (result) => result.elements.map((el) => el.type);

test("valid: #linux and #git", () => {
  const r = parse("#linux and #git");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(types(r), ["tag", "operator", "tag"]);
  assert.deepEqual(r.elements[0], { type: "tag", text: "linux", from: 0, to: 6 });
  assert.equal(r.elements[1].text, "and");
  assert.deepEqual(r.elements[2], { type: "tag", text: "git", from: 11, to: 15 });
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.name, "linux");
  assert.equal(r.ast.right.name, "git");
});

test("typing in progress: #linux an does not crash and reports an error", () => {
  const r = parse("#linux an");
  assert.ok(r.errors.length >= 1);
  assert.deepEqual(types(r), ["tag", "word"]);
  assert.equal(r.elements[0].text, "linux");
  assert.equal(r.ast.type, "tag");
});

test("unclosed parenthesis: (#linux and #git", () => {
  const r = parse("(#linux and #git");
  assert.ok(r.errors.length >= 1);
  assert.deepEqual(types(r), ["open", "tag", "operator", "tag"]);
  assert.equal(r.ast.type, "and");
});

test("left-to-right associativity: a or b and c = (a or b) and c", () => {
  const r = parse("a or b and c");
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.type, "or");
  assert.equal(r.ast.left.left.type, "unknown");
  assert.equal(r.ast.left.left.text, "a");
  assert.equal(r.ast.left.right.text, "b");
  assert.equal(r.ast.right.text, "c");
});

test("a and b or c = (a and b) or c", () => {
  const r = parse("a and b or c");
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "or");
  assert.equal(r.ast.left.type, "and");
  assert.equal(r.ast.right.text, "c");
});

test("French synonyms and symbols", () => {
  const et = parse("#a et #b");
  assert.deepEqual(et.errors, []);
  assert.equal(et.ast.type, "and");
  const ou = parse("#a ou #b");
  assert.deepEqual(ou.errors, []);
  assert.equal(ou.ast.type, "or");
  const amp = parse("#a && #b");
  assert.deepEqual(amp.errors, []);
  assert.equal(amp.ast.type, "and");
  const pipe = parse("#a || #b");
  assert.deepEqual(pipe.errors, []);
  assert.equal(pipe.ast.type, "or");
});

test("not / non / !", () => {
  const not = parse("not #linux");
  assert.deepEqual(not.errors, []);
  assert.equal(not.ast.type, "not");
  assert.equal(not.ast.operand.type, "tag");
  const non = parse("non #linux");
  assert.deepEqual(non.errors, []);
  assert.equal(non.ast.type, "not");
  const bang = parse("a ! b");
  assert.deepEqual(types(bang), ["word", "operator", "word"]);
  assert.equal(bang.elements[1].text, "!");
});

test("! glued to a word is not an operator", () => {
  assert.deepEqual(types(parse("foo!")), ["word"]);
  assert.deepEqual(types(parse("a !b")), ["word", "word"]);
  assert.deepEqual(types(parse("!(#a)")), ["word", "open", "tag", "close"]);
});

test("quoted: content protected, no operator or tag inside", () => {
  const r = parse('#a and "foo and #bar"');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(types(r), ["tag", "operator", "quoted"]);
  assert.equal(r.elements[2].text, "foo and #bar");
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.right.type, "quoted");
});

test("unclosed quote: the rest is absorbed into the string", () => {
  const r = parse('#a "b #c');
  assert.deepEqual(types(r), ["tag", "quoted"]);
  assert.ok(r.errors.length >= 1);
  assert.equal(r.elements[1].text, "b #c");
});

test("juxtaposition: error but elements are lossless", () => {
  const r = parse("#ffmpeg #wireshark #ffmpeg");
  assert.ok(r.errors.length >= 1);
  assert.deepEqual(types(r), ["tag", "tag", "tag"]);
  assert.deepEqual(r.elements.map((el) => el.text), ["ffmpeg", "wireshark", "ffmpeg"]);
});

test("juxtaposition inside parentheses: all tags present in elements", () => {
  const r = parse("(#docker #podman) and (#linux #git)");
  assert.ok(r.errors.length >= 1);
  assert.deepEqual(types(r), ["open", "tag", "tag", "close", "operator", "open", "tag", "tag", "close"]);
  assert.deepEqual(r.elements.map((el) => el.text), ["(", "docker", "podman", ")", "and", "(", "linux", "git", ")"]);
});

test('juxtaposition of tag + string: wanted "missing operator" error', () => {
  const r = parse('#linux "texte"');
  assert.ok(r.errors.length >= 1);
  assert.match(r.errors[0].message, /missing operator/i);
  assert.deepEqual(types(r), ["tag", "quoted"]);
});

test("tag boundaries: #a[b], #a{ are two elements", () => {
  assert.deepEqual(types(parse("#a[b]")), ["tag", "word"]);
  assert.deepEqual(types(parse("#a{")), ["tag", "word"]);
  assert.deepEqual(types(parse("#a,")), ["tag", "word"]);
});

test("operators inside a tag: no operator pill", () => {
  const r = parse("#foo&&bar");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(types(r), ["tag"]);
  assert.equal(r.elements[0].text, "foo&&bar");
});

test("empty input", () => {
  const r = parse("");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.elements, []);
  assert.equal(r.ast, null);
});

test("whitespace-only input", () => {
  const r = parse("   ");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.elements, []);
});

test("bare hash: lexing error, no elements", () => {
  const r = parse("#");
  assert.ok(r.errors.length >= 1);
  assert.equal(r.errors[0].kind, "lexing");
  assert.deepEqual(r.elements, []);
});

test("error shape: { kind, message, offset }", () => {
  const r = parse("#linux an");
  for (const e of r.errors) {
    assert.equal(typeof e.message, "string");
    assert.equal(typeof e.offset, "number");
  }
});

test("nested parentheses", () => {
  const r = parse("((#a) or (#b))");
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "or");
  assert.equal(r.ast.left.type, "tag");
  assert.equal(r.ast.right.type, "tag");
});

test("not on parentheses: not (#a or #b)", () => {
  const r = parse("not (#a or #b)");
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "not");
  assert.equal(r.ast.operand.type, "or");
});

test("strict default: juxtaposition reports a missing operator and stays lossy", () => {
  const r = parse("#a #b");
  assert.ok(r.errors.length >= 1);
  assert.match(r.errors[0].message, /missing operator/i);
  assert.equal(r.ast.type, "tag");
  assert.equal(r.ast.name, "a");
});

test("implicitOp and: juxtaposition folds with and, no error", () => {
  const r = parse("#a #b", { implicitOp: "and" });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.type, "tag");
  assert.equal(r.ast.right.type, "tag");
});

test("implicitOp or: juxtaposition folds with or, no error", () => {
  const r = parse("#a #b", { implicitOp: "or" });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "or");
});

test("implicitOp and: left-to-right fold over three juxtaposed blocs", () => {
  const r = parse("#a #b #c", { implicitOp: "and" });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.type, "and");
  assert.equal(r.ast.left.left.name, "a");
  assert.equal(r.ast.left.right.name, "b");
  assert.equal(r.ast.right.name, "c");
});

test("implicitOp and: mixed explicit and implicit operators", () => {
  const r = parse("#a and #b #c", { implicitOp: "and" });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.type, "and");
  assert.equal(r.ast.left.left.name, "a");
  assert.equal(r.ast.left.right.name, "b");
  assert.equal(r.ast.right.name, "c");
});

test("implicitOp and: juxtaposition inside parentheses folds too", () => {
  const r = parse("(#a #b) and (#c #d)", { implicitOp: "and" });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ast.type, "and");
  assert.equal(r.ast.left.type, "and");
  assert.equal(r.ast.right.type, "and");
});

test("implicitOp or: still reports real errors", () => {
  const r = parse("#a or", { implicitOp: "or" });
  assert.ok(r.errors.length >= 1);
});
