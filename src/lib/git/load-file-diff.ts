import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  getGitFileContent,
  normalizeGitBranchName,
  resolveGitRepositoryId,
} from "@/lib/azure-devops/git";
import type { GitFileChange, GitFileChangeKind } from "@/lib/git/changeset";
import { buildLineDiffHunks, countDiffStats } from "@/lib/git/line-diff";

const MAX_FILE_CHARS = 200_000;

export type LoadFileDiffInput = {
  project: string;
  repository: string;
  source: string;
  target: string;
  path: string;
};

function inferKind(before: string | null, after: string | null): GitFileChangeKind {
  if (before == null && after != null) return "added";
  if (before != null && after == null) return "deleted";
  return "modified";
}

export async function loadFileDiff(input: LoadFileDiffInput): Promise<GitFileChange> {
  const source = normalizeGitBranchName(input.source);
  const target = normalizeGitBranchName(input.target);
  const path = input.path.trim();
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryId = await resolveGitRepositoryId(auth, input.repository);
  const [after, before] = await Promise.all([
    getGitFileContent(auth, repositoryId, path, source),
    getGitFileContent(auth, repositoryId, path, target),
  ]);

  if (before == null && after == null) {
    throw new Error("No se encontró el archivo en las ramas seleccionadas.");
  }

  const beforeText = before ?? "";
  const afterText = after ?? "";
  if (beforeText.length > MAX_FILE_CHARS || afterText.length > MAX_FILE_CHARS) {
    return {
      path: path.replace(/^\//, ""),
      kind: inferKind(before, after),
      additions: 0,
      deletions: 0,
      hunks: [
        {
          header: "@@ archivo demasiado grande @@",
          lines: [
            {
              type: "context",
              content: "Este archivo es demasiado grande para mostrar el diff aquí.",
            },
          ],
        },
      ],
    };
  }

  const hunks = buildLineDiffHunks(beforeText, afterText);
  const stats = countDiffStats(hunks);

  return {
    path: path.replace(/^\//, ""),
    kind: inferKind(before, after),
    additions: stats.additions,
    deletions: stats.deletions,
    hunks,
  };
}
