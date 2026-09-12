import { DiffStat } from "@/components/git/diff-stat";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import type { GitFileChange } from "@/lib/git/changeset";
import { fileNameFromPath } from "@/lib/git/file-name";
import { cn } from "@/lib/utils";

export type ChangedFileRowProps = {
  change: GitFileChange;
  selected: boolean;
  onSelect: (path: string) => void;
};

export function ChangedFileRow({ change, selected, onSelect }: ChangedFileRowProps) {
  const name = fileNameFromPath(change.path);

  return (
    <button
      type="button"
      title={change.path}
      onClick={() => onSelect(change.path)}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        selected ? "bg-muted text-foreground" : "hover:bg-muted/70",
      )}
    >
      <FileTypeIcon name={name} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <DiffStat additions={change.additions} deletions={change.deletions} />
    </button>
  );
}
