"use client";

import type { ReactNode } from "react";
import { ListTree } from "lucide-react";

import { DraftCard, type DraftCardVariant } from "@/components/forms/draft-card";
import { PbiSelectComboboxField } from "@/components/time-log/fields/pbi-select-combobox-field";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { BulkGroup } from "@/lib/time-log/bulk-group";
import { cn } from "@/lib/utils";

export type TimeLogBulkGroupCardProps = Readonly<{
  group: BulkGroup;
  index: number;
  pbis: readonly AdoWorkItemOptionDto[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  canRemove: boolean;
  disabled?: boolean;
  totalTasks: number;
  totalHours: number;
  completedTasks: number;
  pbiError?: string;
  onPbiChange: (pbiId: string | null) => void;
  onRemove: () => void;
  children: ReactNode;
}>;

function getPbiLabel(
  group: BulkGroup,
  pbis: readonly AdoWorkItemOptionDto[],
): string {
  if (!group.pbiId) return "Selecciona una historia de usuario";
  const pbi = pbis.find((item) => String(item.id) === group.pbiId);
  return pbi ? `Historia: #${pbi.id} ${pbi.title}` : `Historia #${group.pbiId}`;
}

function variantFor(
  completedTasks: number,
  totalTasks: number,
): DraftCardVariant {
  if (totalTasks === 0) return "default";
  if (completedTasks === totalTasks) return "success";
  return "default";
}

export function TimeLogBulkGroupCard({
  group,
  index,
  pbis,
  isOpen,
  onOpenChange,
  canRemove,
  disabled = false,
  totalTasks,
  totalHours,
  completedTasks,
  pbiError,
  onPbiChange,
  onRemove,
  children,
}: TimeLogBulkGroupCardProps) {
  const idPrefix = `bulk-group-${group.id}`;
  const pbiLabel = getPbiLabel(group, pbis);
  const variant = variantFor(completedTasks, totalTasks);

  return (
    <DraftCard
      id={group.id}
      index={index}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      summary={
        <span
          className={cn(
            "flex items-center gap-2",
            !group.pbiId && "text-muted-foreground italic",
          )}
        >
          <ListTree className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{pbiLabel}</span>
        </span>
      }
      status={
        <span
          className="text-muted-foreground inline-flex items-center gap-2 text-xs tabular-nums"
          aria-live="polite"
        >
          <span>
            Total Tareas:{" "}
            <strong className="text-foreground">{totalTasks}</strong>
          </span>
          <span aria-hidden>·</span>
          <span>
            Total horas:{" "}
            <strong className="text-foreground">{totalHours}</strong>
          </span>
        </span>
      }
      variant={variant}
      canRemove={canRemove}
      onRemove={onRemove}
      disabled={disabled}
      triggerLabel={`Historia ${index + 1}`}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-pbi`}
            className="text-sm leading-none font-medium"
          >
            Historia de usuario <span className="text-destructive">*</span>
          </label>
          <PbiSelectComboboxField
            id={`${idPrefix}-pbi`}
            pbis={pbis}
            value={group.pbiId || null}
            onValueChange={onPbiChange}
            disabled={disabled}
          />
          {pbiError ? (
            <p className="text-destructive text-xs">{pbiError}</p>
          ) : null}
        </div>

        <div className="space-y-3">{children}</div>
      </div>
    </DraftCard>
  );
}
