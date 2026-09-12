export type BranchComparisonInput = {
  repository: string;
  source: string;
  target: string;
};

export type BranchComparison = {
  hasChanges: boolean;
  aheadCount: number;
  fileCount: number;
};

export const LARGE_COMMIT_THRESHOLD = 100;

const COMPARE_COUNTS: Record<string, Pick<BranchComparison, "aheadCount" | "fileCount">> = {
  "feat/HU175→develop": { aheadCount: 1, fileCount: 5 },
  "feat/HU175→main": { aheadCount: 135, fileCount: 48 },
};

function pairKey(source: string, target: string): string {
  return `${source}→${target}`;
}

export function compareBranchesMock({
  source,
  target,
}: BranchComparisonInput): BranchComparison | null {
  if (!source || !target) return null;

  if (source === target) {
    return { hasChanges: false, aheadCount: 0, fileCount: 0 };
  }

  const counts = COMPARE_COUNTS[pairKey(source, target)] ?? {
    aheadCount: 4,
    fileCount: 8,
  };

  return {
    hasChanges: true,
    aheadCount: counts.aheadCount,
    fileCount: counts.fileCount,
  };
}

export function isLargeCommitMerge(comparison: BranchComparison): boolean {
  return comparison.hasChanges && comparison.aheadCount >= LARGE_COMMIT_THRESHOLD;
}
