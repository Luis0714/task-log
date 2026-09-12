import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  getGitFileContent,
  normalizeGitBranchName,
  resolveGitRepositoryId,
} from "@/lib/azure-devops/git";
import type { GitFileChange, GitFileChangeKind } from "@/lib/git/changeset";
import { isGitCommitId } from "@/lib/git/is-git-commit-id";
import { sanitizeGitDiffPath } from "@/lib/git/is-git-file-path";
import { buildLineDiffHunks, countDiffStats } from "@/lib/git/line-diff";

const MAX_FILE_CHARS = 200_000;

export type LoadFileDiffInput = {
  project: string;
  repository: string;
  source: string;
  target: string;
  path: string;
};

export type FileDiffContext = {
  auth: AdoCallerAuth;
  repositoryId: string;
  source: string;
  target: string;
  sourceType: "branch" | "commit";
  targetType: "branch" | "commit";
};

function inferKind(before: string | null, after: string | null): GitFileChangeKind {
  if (before == null && after != null) return "added";
  if (before != null && after == null) return "deleted";
  return "modified";
}

export async function createFileDiffContext(
  input: Omit<LoadFileDiffInput, "path">,
): Promise<FileDiffContext> {
  const source = normalizeGitBranchName(input.source);
  const target = normalizeGitBranchName(input.target);
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  const repositoryId = await resolveGitRepositoryId(auth, input.repository);
  return {
    auth,
    repositoryId,
    source,
    target,
    sourceType: isGitCommitId(source) ? "commit" : "branch",
    targetType: isGitCommitId(target) ? "commit" : "branch",
  };
}

export async function loadFileDiffWithContext(
  context: FileDiffContext,
  path: string,
): Promise<GitFileChange> {
  const normalizedPath = sanitizeGitDiffPath(path);
  if (!normalizedPath) {
    throw new Error("Ruta de archivo inválida.");
  }
  const [after, before] = await Promise.all([
    getGitFileContent(
      context.auth,
      context.repositoryId,
      normalizedPath,
      context.source,
      context.sourceType,
    ),
    getGitFileContent(
      context.auth,
      context.repositoryId,
      normalizedPath,
      context.target,
      context.targetType,
    ),
  ]);

  if (before == null && after == null) {
    throw new Error("No se encontró el archivo en las ramas seleccionadas.");
  }

  const beforeText = before ?? "";
  const afterText = after ?? "";
  if (beforeText.length > MAX_FILE_CHARS || afterText.length > MAX_FILE_CHARS) {
    return {
      path: normalizedPath,
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
    path: normalizedPath,
    kind: inferKind(before, after),
    additions: stats.additions,
    deletions: stats.deletions,
    hunks,
  };
}

export async function loadFileDiff(input: LoadFileDiffInput): Promise<GitFileChange> {
  const context = await createFileDiffContext(input);
  return loadFileDiffWithContext(context, input.path);
}
