"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkItemSelectOption } from "@/components/time-log/work-item-select-option";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";
import { LinkedRenamedHint } from "@/components/news-stories/linked-renamed-hint";
import { LinkedScopeMeta } from "@/components/news-stories/linked-scope-meta";
import { LinkedValidationBadge } from "@/components/news-stories/linked-validation-badge";

export type LinkedRowProps = Readonly<{
  row: ProjectTeamNewsStory;
  validation: NewsStoryValidationEntry | undefined;
  onUnlink: (item: ProjectTeamNewsStory) => void;
}>;

/**
 * Una fila de la lista de HUs vinculadas: presentación (título + meta +
 * hint de renombrado) + acciones (state badge + validación + papelera).
 */
export function LinkedRow({ row, validation, onUnlink }: LinkedRowProps) {
  return (
    <li className="border-border/40 flex items-start gap-3 border-t px-3 py-2.5 transition-colors first:border-t-0 hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <WorkItemSelectOption
          item={{
            id: row.workItemId,
            title:
              row.workItemTitleSnapshot ??
              `HU #${row.workItemId} (sin título guardado)`,
            type: "User Story",
            state: "",
          }}
          variant="select"
          className="gap-1.5"
        />
        <LinkedScopeMeta row={row} />
        <LinkedRenamedHint validation={validation} />
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {validation?.currentState ? (
          <WorkItemStateBadge
            state={validation.currentState}
            className="max-w-26"
          />
        ) : null}
        <LinkedValidationBadge validation={validation} />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Desvincular"
          onClick={() => onUnlink(row)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
