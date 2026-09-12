import { describe, expect, it } from "vitest";

import type { GitDiffHunk, GitFileChange } from "@/lib/git/changeset";
import {
  collectDiffChanges,
  estimateGlobalChangePosition,
  findDiffChangeAtLine,
  resolveDiffChangeStep,
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

function file(
  path: string,
  hunks: GitDiffHunk[] = [],
): GitFileChange {
  return { path, kind: "modified", additions: 0, deletions: 0, hunks };
}

function additionHunks(count: number): GitDiffHunk[] {
  return Array.from({ length: count }, (_, index) =>
    hunk([{ type: "addition", newNumber: index + 1, content: `line-${index}` }]),
  );
}

describe("resolveDiffChangeStep", () => {
  const a = file("a.ts", additionHunks(2));
  const b = file("b.ts", additionHunks(1));
  const c = file("c.ts", additionHunks(3));
  const files = [a, b, c];
  const loaded = new Set(["a.ts", "b.ts", "c.ts"]);

  it("avanza al siguiente cambio del mismo archivo", () => {
    expect(
      resolveDiffChangeStep({
        files,
        loadedPaths: loaded,
        currentPath: "a.ts",
        currentChangeIndex: 0,
        direction: 1,
      }),
    ).toEqual({ filePath: "a.ts", changeIndex: 1, landing: null });
  });

  it("al terminar un archivo salta al primero del siguiente", () => {
    expect(
      resolveDiffChangeStep({
        files,
        loadedPaths: loaded,
        currentPath: "a.ts",
        currentChangeIndex: 1,
        direction: 1,
      }),
    ).toEqual({ filePath: "b.ts", changeIndex: 0, landing: null });
  });

  it("al inicio de un archivo vuelve al último del anterior", () => {
    expect(
      resolveDiffChangeStep({
        files,
        loadedPaths: loaded,
        currentPath: "b.ts",
        currentChangeIndex: 0,
        direction: -1,
      }),
    ).toEqual({ filePath: "a.ts", changeIndex: 1, landing: null });
  });

  it("recorre en círculo del último archivo al primero", () => {
    expect(
      resolveDiffChangeStep({
        files,
        loadedPaths: loaded,
        currentPath: "c.ts",
        currentChangeIndex: 2,
        direction: 1,
      }),
    ).toEqual({ filePath: "a.ts", changeIndex: 0, landing: null });
  });

  it("omite archivos ya cargados sin bloques de cambio", () => {
    const empty = file("empty.ts", [
      hunk([{ type: "context", oldNumber: 1, newNumber: 1, content: "keep" }]),
    ]);
    expect(
      resolveDiffChangeStep({
        files: [a, empty, b],
        loadedPaths: new Set(["a.ts", "empty.ts", "b.ts"]),
        currentPath: "a.ts",
        currentChangeIndex: 1,
        direction: 1,
      }),
    ).toEqual({ filePath: "b.ts", changeIndex: 0, landing: null });
  });

  it("marca landing si el siguiente archivo aún no está cargado", () => {
    expect(
      resolveDiffChangeStep({
        files: [a, file("pending.ts"), b],
        loadedPaths: new Set(["a.ts", "b.ts"]),
        currentPath: "a.ts",
        currentChangeIndex: 1,
        direction: 1,
      }),
    ).toEqual({ filePath: "pending.ts", changeIndex: 0, landing: "first" });
  });
});

describe("estimateGlobalChangePosition", () => {
  it("suma cambios cargados y estima 1 por archivo pendiente", () => {
    const files = [
      file("a.ts", additionHunks(2)),
      file("b.ts"),
      file("c.ts", additionHunks(1)),
    ];
    expect(
      estimateGlobalChangePosition(files, new Set(["a.ts", "c.ts"]), "c.ts", 0),
    ).toEqual({ current: 4, total: 4 });
  });
});
