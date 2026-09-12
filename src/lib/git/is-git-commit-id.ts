const COMMIT_ID = /^[0-9a-f]{7,40}$/i;

export function isGitCommitId(value: string): boolean {
  return COMMIT_ID.test(value.trim());
}
