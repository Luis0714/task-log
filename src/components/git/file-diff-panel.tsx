import { DiffHunk } from "@/components/git/diff-hunk";
import { DiffStat } from "@/components/git/diff-stat";
import type { GitFileChange } from "@/lib/git/changeset";

export type FileDiffPanelProps = {
  file: GitFileChange | null;
};

export function FileDiffPanel({ file }: FileDiffPanelProps) {
  if (!file) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground">
        Selecciona un archivo para ver el diff.
      </div>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <header className="flex min-w-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="min-w-0 truncate font-mono text-xs sm:text-sm">{file.path}</h3>
        <DiffStat additions={file.additions} deletions={file.deletions} />
      </header>
      <div className="max-h-[28rem] overflow-auto">
        {file.hunks.map((hunk) => (
          <DiffHunk key={hunk.header} hunk={hunk} />
        ))}
      </div>
    </section>
  );
}
