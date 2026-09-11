export type BranchComparisonInput = {
  repository: string;
  source: string;
  target: string;
};

export type BranchComparison = {
  hasChanges: boolean;
  aheadCount: number;
};

export const LARGE_COMMIT_THRESHOLD = 100;

const NO_CHANGES_PAIRS = new Set(["feat/HU175→develop"]);
const LARGE_COMMIT_PAIRS = new Set(["feat/HU175→main"]);

function pairKey(source: string, target: string): string {
  return `${source}→${target}`;
}

export function compareBranchesMock({
  source,
  target,
}: BranchComparisonInput): BranchComparison | null {
  if (!source || !target) return null;

  if (source === target || NO_CHANGES_PAIRS.has(pairKey(source, target))) {
    return { hasChanges: false, aheadCount: 0 };
  }

  if (LARGE_COMMIT_PAIRS.has(pairKey(source, target))) {
    return { hasChanges: true, aheadCount: 135 };
  }

  return { hasChanges: true, aheadCount: 4 };
}
