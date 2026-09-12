"use client";

import { ChevronDown, Files } from "lucide-react";
import { useState } from "react";

import { ChangedFileTree } from "@/components/git/changed-file-tree";
import { FileTypeIcon } from "@/components/git/file-type-icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { GitFileChange } from "@/lib/git/changeset";
import { fileNameFromPath } from "@/lib/git/file-name";
import type { FileTreeNode } from "@/lib/git/file-tree";

export type ChangesetMobileFilePickerProps = Readonly<{
  nodes: readonly FileTreeNode[];
  selected: GitFileChange | null;
  fileCount: number;
  onSelect: (path: string) => void;
}>;

export function ChangesetMobileFilePicker({
  nodes,
  selected,
  fileCount,
  onSelect,
}: ChangesetMobileFilePickerProps) {
  const [open, setOpen] = useState(false);
  const name = selected ? fileNameFromPath(selected.path) : "Seleccionar archivo";
  const directory = selected
    ? selected.path.split("/").slice(0, -1).join("/")
    : "";
  const subtitle = directory || `${fileCount} ${fileCount === 1 ? "archivo" : "archivos"}`;

  return (
    <>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-left hover:bg-muted/70"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Cambiar archivo. Actual: ${selected?.path ?? "ninguno"}`}
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <FileTypeIcon name={name} />
        ) : (
          <Files className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-xs font-medium">{name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[75dvh] max-h-[75dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <div
            className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>
              Archivos cambiados
              <span className="ml-2 font-normal text-muted-foreground">({fileCount})</span>
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            <ChangedFileTree
              nodes={nodes}
              selectedPath={selected?.path ?? null}
              onSelect={(path) => {
                onSelect(path);
                setOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
