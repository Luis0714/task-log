import { describe, expect, it } from "vitest";

import type { GitDiffLine } from "@/lib/git/changeset";
import { inlineDiff, inlineDiffsForLines } from "@/lib/git/inline-diff";

describe("inlineDiff", () => {
  it("resalta solo el token que cambió", () => {
    const diff = inlineDiff(
      "import {AssignGuardianWapper} from",
      "import {AssignGuardianStudentProps}",
    );

    expect(diff).not.toBeNull();
    expect(diff?.before.filter((segment) => segment.changed).map((segment) => segment.text)).toEqual([
      "AssignGuardianWapper",
      " from",
    ]);
    expect(diff?.after.filter((segment) => segment.changed).map((segment) => segment.text)).toEqual([
      "AssignGuardianStudentProps",
    ]);
  });

  it("no anota líneas sin nada en común", () => {
    expect(inlineDiff("alpha", "omega")).toBeNull();
  });
});

describe("inlineDiffsForLines", () => {
  it("empareja un borrado con la adición siguiente", () => {
    const lines: GitDiffLine[] = [
      { type: "context", oldNumber: 1, newNumber: 1, content: "keep" },
      { type: "deletion", oldNumber: 2, content: "const name = old" },
      { type: "addition", newNumber: 2, content: "const name = next" },
    ];

    const inline = inlineDiffsForLines(lines);
    expect(inline[0]).toBeNull();
    expect(inline[1]?.some((segment) => segment.changed && segment.text === "old")).toBe(true);
    expect(inline[2]?.some((segment) => segment.changed && segment.text === "next")).toBe(true);
  });
});
