import { FileTypeIcon } from "@/components/git/file-type-icon";

export type PullRequestConflictFilesProps = {
  files: readonly string[];
};

export function PullRequestConflictFiles({ files }: PullRequestConflictFilesProps) {
  if (files.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card p-3">
      <h2 className="text-sm font-medium">Archivos en conflicto</h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {files.map((path) => (
          <li key={path} className="flex min-w-0 items-center gap-2 text-sm">
            <FileTypeIcon name={path} />
            <span className="truncate font-mono text-xs" title={path}>
              {path}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
