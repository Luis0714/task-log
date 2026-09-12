import { PullRequestConflictFiles } from "@/components/pull-requests/pull-request-conflict-files";

export type PullRequestConflictsPanelProps = Readonly<{
  hasConflicts: boolean;
  files: readonly string[];
}>;

export function PullRequestConflictsPanel({
  hasConflicts,
  files,
}: PullRequestConflictsPanelProps) {
  if (!hasConflicts) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Este pull request no tiene conflictos de fusión.
      </p>
    );
  }

  if (files.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Hay conflictos de fusión, pero Azure no devolvió la lista de archivos.
      </p>
    );
  }

  return <PullRequestConflictFiles files={files} />;
}
