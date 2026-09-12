import { describe, expect, it } from "vitest";

import {
  isGitFilePath,
  MAX_FILE_DIFF_PATHS,
  resolveFileDiffPaths,
  sanitizeGitDiffPath,
  uniqueDiffPaths,
} from "@/lib/git/is-git-file-path";

describe("isGitFilePath", () => {
  it("acepta archivos con extensión y nombres conocidos", () => {
    expect(isGitFilePath("src/app/page.tsx")).toBe(true);
    expect(isGitFilePath("Dockerfile")).toBe(true);
    expect(isGitFilePath(".gitignore")).toBe(true);
  });

  it("rechaza carpetas", () => {
    expect(isGitFilePath("src/app/")).toBe(false);
    expect(isGitFilePath("")).toBe(false);
  });
});

describe("sanitizeGitDiffPath", () => {
  it("normaliza y rechaza rutas inseguras", () => {
    expect(sanitizeGitDiffPath("/src/app/page.tsx")).toBe("src/app/page.tsx");
    expect(sanitizeGitDiffPath("src/../secret.ts")).toBeNull();
    expect(sanitizeGitDiffPath("")).toBeNull();
  });
});

describe("uniqueDiffPaths", () => {
  it("deduplica y pone primero el archivo prioritario", () => {
    expect(
      uniqueDiffPaths(
        ["src/a.ts", "/src/a.ts", "src/b.ts", "src/c.ts"],
        "src/c.ts",
      ),
    ).toEqual(["src/c.ts", "src/a.ts", "src/b.ts"]);
  });
});

describe("resolveFileDiffPaths", () => {
  it("limita la cantidad de archivos precargados y prioriza el seleccionado", () => {
    const paths = Array.from(
      { length: MAX_FILE_DIFF_PATHS + 5 },
      (_, index) => `src/file-${index}.ts`,
    );
    const priority = `src/file-${MAX_FILE_DIFF_PATHS}.ts`;
    const resolved = resolveFileDiffPaths(paths, priority);
    expect(resolved).toHaveLength(MAX_FILE_DIFF_PATHS);
    expect(resolved[0]).toBe(priority);
    expect(resolved).not.toContain(`src/file-${MAX_FILE_DIFF_PATHS + 4}.ts`);
  });
});
