import { CommitRow } from "@/components/git/commit-row";
import type { GitCommit } from "@/lib/git/changeset";

export type CommitListProps = {
  commits: readonly GitCommit[];
};

export function CommitList({ commits }: CommitListProps) {
  return (
    <ul className="max-h-[28rem] overflow-y-auto rounded-lg border bg-card">
      {commits.map((commit) => (
        <CommitRow key={commit.id} commit={commit} />
      ))}
    </ul>
  );
}
