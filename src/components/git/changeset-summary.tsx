import { DiffStat } from "@/components/git/diff-stat";

export type ChangesetSummaryProps = Readonly<{
  fileCount: number;
  additions: number;
  deletions: number;
}>;

export function ChangesetSummary({
  fileCount,
  additions,
  deletions,
}: ChangesetSummaryProps) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span>
        {fileCount} {fileCount === 1 ? "archivo" : "archivos"}
      </span>
      <DiffStat additions={additions} deletions={deletions} />
    </p>
  );
}
