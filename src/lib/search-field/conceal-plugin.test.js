import { describe, test, expect } from "vitest";
import { buildConcealments } from "./conceal-plugin.js";

const noFocus = { hasFocus: false };
const summary = (cs) => cs.map((c) => [c.from, c.to, c.text, c.isTag]);

describe("buildConcealments — UI regression", () => {
  test("juxtaposed tags: all concealed (recovery-loss regression guard)", () => {
    const cs = buildConcealments("#ffmpeg #wireshark", noFocus);
    expect(summary(cs)).toEqual([
      [0, 7, "ffmpeg", true],
      [8, 18, "wireshark", true],
    ]);
  });

  test("operator: pill absorbs adjacent spaces", () => {
    const cs = buildConcealments("#linux and #git", noFocus);
    expect(summary(cs)).toEqual([
      [0, 6, "linux", true],
      [6, 11, "and", false],
      [11, 15, "git", true],
    ]);
  });

  test("cursor inside a tag: that tag stays visible, others concealed", () => {
    const cs = buildConcealments("#linux #git", {
      hasFocus: true,
      selections: [{ from: 2, to: 2 }],
    });
    expect(summary(cs)).toEqual([[7, 11, "git", true]]);
  });

  test("multi-selection covering everything: nothing concealed", () => {
    const cs = buildConcealments("#linux #git", {
      hasFocus: true,
      selections: [{ from: 0, to: 6 }, { from: 7, to: 11 }],
    });
    expect(summary(cs)).toEqual([]);
  });

  test("threshold widens the protected zone around the cursor", () => {
    const cs = buildConcealments("#linux #git", {
      hasFocus: true,
      threshold: 2,
      selections: [{ from: 0, to: 0 }],
    });
    expect(summary(cs)).toEqual([[7, 11, "git", true]]);
  });

  test("without focus, everything is concealed even with a cursor", () => {
    const cs = buildConcealments("#linux #git", {
      hasFocus: false,
      selections: [{ from: 2, to: 2 }],
    });
    expect(summary(cs)).toEqual([
      [0, 6, "linux", true],
      [7, 11, "git", true],
    ]);
  });

  test("showImplicit: implicit operator between juxtaposed tags", () => {
    const cs = buildConcealments("#linux #git", {
      ...noFocus,
      showImplicit: true,
      defaultOp: "and",
    });
    expect(summary(cs)).toEqual([
      [0, 6, "linux", true],
      [7, 11, "git", true],
      [6, 7, "and", false],
    ]);
  });

  test("showImplicit with parentheses: implicit only between tags of the same group", () => {
    const cs = buildConcealments("(#docker #podman)", {
      ...noFocus,
      showImplicit: true,
    });
    expect(summary(cs)).toEqual([
      [1, 8, "docker", true],
      [9, 16, "podman", true],
      [8, 9, "and", false],
    ]);
  });

  test("quoted content: never concealed", () => {
    const cs = buildConcealments('"#foo"', noFocus);
    expect(cs).toEqual([]);
  });

  test("unclosed parenthesis: inner decoration is still present", () => {
    const cs = buildConcealments("(#a and #b", noFocus);
    expect(summary(cs)).toEqual([
      [1, 3, "a", true],
      [3, 8, "and", false],
      [8, 10, "b", true],
    ]);
  });

  test("plain words: no concealment", () => {
    const cs = buildConcealments("foo bar", noFocus);
    expect(cs).toEqual([]);
  });

  test("standalone ! : operator pill", () => {
    const cs = buildConcealments("a ! b", noFocus);
    expect(summary(cs)).toEqual([[1, 4, "!", false]]);
  });

  test("not : operator pill", () => {
    const cs = buildConcealments("not #linux", noFocus);
    expect(summary(cs)).toEqual([
      [0, 4, "not", false],
      [4, 10, "linux", true],
    ]);
  });

  test("unclosed quote: everything after is absorbed into the string", () => {
    const cs = buildConcealments('#a "b #c', noFocus);
    expect(summary(cs)).toEqual([[0, 2, "a", true]]);
  });
});
