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

export function isGitFilePath(path: string): boolean {
  const normalized = path.trim().replace(/\\/g, "/");
  if (!normalized || normalized.endsWith("/")) return false;

  const name = normalized.split("/").at(-1)?.toLowerCase() ?? "";
  if (!name) return false;
  if (name.includes(".")) return true;
  return EXTENSIONLESS_FILES.has(name) || name.startsWith(".");
}
