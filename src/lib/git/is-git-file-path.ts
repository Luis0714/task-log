const EXTENSIONLESS_FILES = new Set([
  "dockerfile",
  "makefile",
  "license",
  "licence",
  "jenkinsfile",
  "procfile",
  "gemfile",
  "rakefile",
  "vagrantfile",
  "codeowners",
  "authors",
  "copying",
  "notice",
  "changelog",
  "changes",
  "gitignore",
  "gitattributes",
  "editorconfig",
  "npmrc",
  "nvmrc",
  "env",
]);

export const MAX_FILE_DIFF_PATHS = 80;

export function isGitFilePath(path: string): boolean {
  const normalized = path.trim().replace(/\\/g, "/");
  if (!normalized || normalized.endsWith("/")) return false;

  const name = normalized.split("/").at(-1)?.toLowerCase() ?? "";
  if (!name) return false;
  if (name.includes(".")) return true;
  return EXTENSIONLESS_FILES.has(name) || name.startsWith(".");
}

export function sanitizeGitDiffPath(path: string): string | null {
  const normalized = path.trim().replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").includes("..")) return null;
  if (!isGitFilePath(normalized)) return null;
  return normalized;
}

export function uniqueDiffPaths(
  paths: readonly string[],
  priorityPath?: string | null,
): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    const sanitized = sanitizeGitDiffPath(path);
    if (!sanitized || seen.has(sanitized)) continue;
    seen.add(sanitized);
    unique.push(sanitized);
  }

  const priority = priorityPath ? sanitizeGitDiffPath(priorityPath) : null;
  if (!priority || !seen.has(priority)) return unique;
  return [priority, ...unique.filter((path) => path !== priority)];
}

export function resolveFileDiffPaths(
  paths: readonly string[],
  priorityPath?: string | null,
): string[] {
  return uniqueDiffPaths(paths, priorityPath).slice(0, MAX_FILE_DIFF_PATHS);
}
