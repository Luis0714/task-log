"use client";

import { BugSummaryCard } from "@/components/bugs/bug-summary-card";
import { WorkItemAdoQuickLinks } from "@/components/work-items/work-item-ado-quick-links";
import { WorkItemDescriptionBlock } from "@/components/work-items/work-item-description-block";
import { WorkItemStateLabel } from "@/components/work-items/work-item-state-label";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintDateBounds } from "@/lib/dashboard/sprint-days";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BugDetailSheetBodyProps = {
  bug: AdoWorkItemOptionDto | null;
  project: string | null;
  draftState: string;
  onDraftStateChange: (value: string) => void;
  draftWorkingDate: string;
  onDraftWorkingDateChange: (value: string) => void;
  draftCompletedWork: string;
  onDraftCompletedWorkChange: (value: string) => void;
  stateOptions: readonly string[];
  statesReady: boolean;
  statesLoading: boolean;
  sprintDateBounds: SprintDateBounds;
  saving: boolean;
};

export function BugDetailSheetBody({
  bug,
  project,
  draftState,
  onDraftStateChange,
  draftWorkingDate,
  onDraftWorkingDateChange,
  draftCompletedWork,
  onDraftCompletedWorkChange,
  stateOptions,
  statesReady,
  statesLoading,
  sprintDateBounds,
  saving,
}: BugDetailSheetBodyProps) {
  if (!bug) {
    return (
      <p className="text-muted-foreground text-sm">Selecciona un Bug para ver el detalle.</p>
    );
  }

  return (
    <>
      <section className="space-y-1">
        <Label>Título</Label>
        <p className="text-muted-foreground line-clamp-2 text-sm font-semibold" title={bug.title}>
          {bug.title}
        </p>
        {bug.acceptanceCriteria?.trim() ? (
          <WorkItemDescriptionBlock html={bug.acceptanceCriteria} label="Acceptance Criteria" />
        ) : null}
      </section>

      <WorkItemAdoQuickLinks
        project={project}
        links={[
          { workItemId: bug.id, label: `Bug #${bug.id}` },
          ...(bug.parentId
            ? [{ workItemId: bug.parentId, label: `HU #${bug.parentId}` }]
            : []),
        ]}
      />

      <BugSummaryCard item={bug} project={project} />

      <section className="space-y-2">
        <Label htmlFor="bug-working-date" required>
          Fecha de trabajo
        </Label>
        <DatePicker
          id="bug-working-date"
          value={draftWorkingDate}
          min={sprintDateBounds.min}
          max={sprintDateBounds.max}
          disabled={saving}
          onChange={onDraftWorkingDateChange}
        />
        <p className="text-muted-foreground text-xs">
          Fecha de trabajo en Azure DevOps. Obligatoria al cambiar el estado.
        </p>
      </section>

      <section className="space-y-2">
        <Label htmlFor="bug-completed-work" required>
          Trabajo completado (horas)
        </Label>
        <Input
          id="bug-completed-work"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          value={draftCompletedWork}
          disabled={saving}
          onChange={(event) => onDraftCompletedWorkChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Horas registradas en el Bug. Obligatorias al cambiar el estado.
        </p>
      </section>

      <section className="space-y-2">
        <Label htmlFor="bug-state" required>
          Estado
        </Label>
        {statesLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={draftState || undefined}
            onValueChange={(value) => onDraftStateChange(value ?? "")}
            disabled={!statesReady || saving}
          >
            <SelectTrigger id="bug-state" className="w-full">
              <SelectValue
                placeholder={statesReady ? "Selecciona un estado" : "Estados no disponibles"}
              >
                {draftState ? <WorkItemStateLabel state={draftState} /> : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((state) => (
                <SelectItem key={state} value={state}>
                  <WorkItemStateLabel state={state} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </section>
    </>
  );
}
