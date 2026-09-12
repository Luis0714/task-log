export const LARGE_COMMIT_THRESHOLD = 100;

export function isLargeCommitMerge(commitCount: number): boolean {
  return commitCount >= LARGE_COMMIT_THRESHOLD;
}
