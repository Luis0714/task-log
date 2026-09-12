export type DiffStats = {
  additions: number;
  deletions: number;
};

export function sumDiffStats(items: readonly DiffStats[]): DiffStats {
  return items.reduce(
    (total, item) => ({
      additions: total.additions + item.additions,
      deletions: total.deletions + item.deletions,
    }),
    { additions: 0, deletions: 0 },
  );
}
