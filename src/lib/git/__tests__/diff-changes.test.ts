import { describe, expect, it } from "vitest";

import type { GitDiffHunk } from "@/lib/git/changeset";
import {
  collectDiffChanges,
  findDiffChangeAtLine,
  type DiffChangeAnchor,
} from "@/lib/git/diff-changes";

function hunk(lines: GitDiffHunk["lines"]): GitDiffHunk {
  return { header: "@@ -1,1 +1,1 @@", lines };
}

describe("collectDiffChanges", () => {
  it("devuelve vacío si no hay hunks o solo hay contexto", () => {
    expect(collectDiffChanges([])).toEqual([]);
    expect(
      collectDiffChanges([
        hunk([{ type: "context", oldNumber: 1, newNumber: 1, content: "keep" }]),
      ]),
    ).toEqual([]);
  });

  it("agrupa adiciones y borrados consecutivos en un solo cambio", () => {
    expect(
      collectDiffChanges([
        hunk([
          { type: "context", oldNumber: 1, newNumber: 1, content: "keep" },
          { type: "deletion", oldNumber: 2, content: "old" },
          { type: "addition", newNumber: 2, content: "new" },
          { type: "context", oldNumber: 3, newNumber: 3, content: "keep" },
        ]),
      ]),
    ).toEqual([{ hunkIndex: 0, startLineIndex: 1, endLineIndex: 2 }]);
  });

  it("separa cambios cuando hay contexto en medio", () => {
    expect(
      collectDiffChanges([
        hunk([
          { type: "addition", newNumber: 1, content: "one" },
          { type: "context", oldNumber: 1, newNumber: 2, content: "keep" },
          { type: "deletion", oldNumber: 2, content: "two" },
        ]),
      ]),
    ).toEqual([
      { hunkIndex: 0, startLineIndex: 0, endLineIndex: 0 },
      { hunkIndex: 0, startLineIndex: 2, endLineIndex: 2 },
    ]);
  });

  it("trata hunks distintos como cambios independientes", () => {
    expect(
      collectDiffChanges([
        hunk([{ type: "addition", newNumber: 1, content: "one" }]),
        hunk([{ type: "deletion", oldNumber: 8, content: "two" }]),
      ]),
    ).toEqual([
      { hunkIndex: 0, startLineIndex: 0, endLineIndex: 0 },
      { hunkIndex: 1, startLineIndex: 0, endLineIndex: 0 },
    ]);
  });
});

describe("findDiffChangeAtLine", () => {
  const changes: DiffChangeAnchor[] = [
    { id: "a", hunkIndex: 0, startLineIndex: 1, endLineIndex: 2 },
    { id: "b", hunkIndex: 1, startLineIndex: 0, endLineIndex: 0 },
  ];

  it("encuentra el cambio que cubre la línea", () => {
    expect(findDiffChangeAtLine(changes, 0, 2)?.id).toBe("a");
    expect(findDiffChangeAtLine(changes, 1, 0)?.id).toBe("b");
  });

  it("devuelve undefined fuera de un bloque", () => {
    expect(findDiffChangeAtLine(changes, 0, 0)).toBeUndefined();
    expect(findDiffChangeAtLine(changes, 2, 0)).toBeUndefined();
  });
});
