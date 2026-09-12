"use client";

import { useMemo, useState } from "react";

import { ChangedFileTree } from "@/components/git/changed-file-tree";
import { ChangesetSummary } from "@/components/git/changeset-summary";
import { FileDiffPanel } from "@/components/git/file-diff-panel";
import type { GitFileChange } from "@/lib/git/changeset";
import { buildFileTree } from "@/lib/git/file-tree";
import { sumDiffStats } from "@/lib/git/sum-diff-stats";

export type ChangesetExplorerProps = {
  files: readonly GitFileChange[];
};

export function ChangesetExplorer({ files }: ChangesetExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    () => files[0]?.path ?? null,
  );
  const tree = useMemo(() => buildFileTree(files), [files]);
  const stats = useMemo(() => sumDiffStats(files), [files]);
  const selected = files.find((file) => file.path === selectedPath) ?? files[0] ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ChangesetSummary
        fileCount={files.length}
        additions={stats.additions}
        deletions={stats.deletions}
      />
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start">
        <aside className="min-w-0 max-h-56 overflow-auto rounded-lg border bg-card p-2 md:max-h-[28rem] md:w-56 md:shrink-0">
          <ChangedFileTree
            nodes={tree}
            selectedPath={selected?.path ?? null}
            onSelect={setSelectedPath}
          />
        </aside>
        <div className="min-w-0 flex-1">
          <FileDiffPanel file={selected} />
        </div>
      </div>
    </div>
  );
}
