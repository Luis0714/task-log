"use client";

import { ChevronRight, Folder } from "lucide-react";
import type { ReactNode } from "react";

import { DiffStat } from "@/components/git/diff-stat";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { FileTreeFolder } from "@/lib/git/file-tree";

export type ChangedFileFolderProps = {
  folder: FileTreeFolder;
  children: ReactNode;
};

export function ChangedFileFolder({ folder, children }: ChangedFileFolderProps) {
  return (
    <Collapsible defaultOpen className="min-w-0">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group/folder-btn flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/70"
          />
        }
      >
        <ChevronRight
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-aria-expanded/folder-btn:rotate-90"
          aria-hidden
        />
        <Folder className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
        <DiffStat additions={folder.additions} deletions={folder.deletions} />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-3 border-l border-border/60 pl-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
