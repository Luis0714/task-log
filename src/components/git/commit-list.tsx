import { CommitRow } from "@/components/git/commit-row";
import type { GitCommit } from "@/lib/git/changeset";

export type CommitListProps = Readonly<{
  commits: readonly GitCommit[];
}>;

export function CommitList({ commits }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        No hay commits entre estas ramas.
      </p>
    );
  }

  return (
    <ul className="max-h-[28rem] min-w-0 overflow-y-auto rounded-lg border bg-card">
      {commits.map((commit) => (
        <CommitRow key={commit.id} commit={commit} />
      ))}
    </ul>
  );
}
