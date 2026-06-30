"use client";

import { Lock } from "lucide-react";

import { BugSummaryCard } from "@/components/bugs/bug-summary-card";
import type { ParentHuOption } from "@/components/tasks/task-detail-sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SprintDateBounds } from "@/lib/dashboard/sprint-days";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { isDoneTaskStateName } from "@/lib/time-log/task-state-utils";
import { cn } from "@/lib/utils";

export type BugDetailSheetBodyProps = {
  bug: AdoWorkItemOptionDto | null;
  project: string | null;
  draftState: string;
  onDraftStateChange: (value: string) => void;
  draftWorkingDate: string;
  onDraftWorkingDateChange: (value: string) => void;
  draftCompletedWork: string;
  onDraftCompletedWorkChange: (value: string) => void;
  draftReopenedDate: string;
  onDraftReopenedDateChange: (value: string) => void;
  draftNewParentId: number | undefined;
  onDraftNewParentIdChange: (value: number | undefined) => void;
  currentParent: ParentHuOption | null;
  parentHuOptions: readonly ParentHuOption[];
  reopening: boolean;
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
  draftReopenedDate,
  onDraftReopenedDateChange,
  draftNewParentId,
  onDraftNewParentIdChange,
  currentParent,
  parentHuOptions,
  reopening,
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

  // El campo Working Date de ADO está bloqueado (read-only) cuando el Bug
  // está en un estado "Done" / "Closed". Mostramos el picker deshabilitado
  // con un tooltip explicativo para que el usuario entienda por qué no puede
  // editarlo y qué tiene que hacer (cambiar el estado) si quiere moverlo.
  const isWorkingDateLocked = isDoneTaskStateName(draftState || bug.state);

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
        <div className="flex items-center gap-1.5">
          <Label htmlFor="bug-working-date" required>
            Fecha de trabajo
          </Label>
          {isWorkingDateLocked ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    tabIndex={0}
                    aria-label="Fecha de trabajo bloqueada"
                    className="text-muted-foreground inline-flex size-4 cursor-help items-center justify-center"
                  />
                }
              >
                <Lock className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="top">
                Cambiá el estado para poder editarla.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="relative">
          <DatePicker
            id="bug-working-date"
            value={draftWorkingDate}
            min={sprintDateBounds.min}
            max={sprintDateBounds.max}
            disabled={saving || isWorkingDateLocked}
            className={cn(isWorkingDateLocked && "opacity-60")}
            onChange={onDraftWorkingDateChange}
          />
          {isWorkingDateLocked ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    tabIndex={0}
                    aria-label="Fecha de trabajo bloqueada"
                    className="absolute inset-0 block cursor-not-allowed rounded-md"
                  />
                }
              />
              <TooltipContent side="top">
                Solo lectura en estado
                {" "}
                <span className="font-semibold">{draftState || bug.state}</span>.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          {isWorkingDateLocked
            ? "Solo lectura mientras el bug esté en estado cerrado."
            : "Fecha de trabajo en Azure DevOps. Obligatoria al cambiar el estado."}
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

      {reopening ? (
        <section className="space-y-2">
          <Label htmlFor="bug-reopened-date" required>
            Fecha de reapertura
          </Label>
          <DatePicker
            id="bug-reopened-date"
            value={draftReopenedDate}
            min={sprintDateBounds.min}
            max={sprintDateBounds.max}
            disabled={saving}
            onChange={onDraftReopenedDateChange}
          />
          <p className="text-muted-foreground text-xs">
            Obligatoria al pasar el Bug a &ldquo;Reopened&rdquo;. Se envía como
            Custom.ReOpenedWorkingDate.
          </p>
        </section>
      ) : null}

      {parentHuOptions.length > 0 || currentParent ? (
        <section className="space-y-2">
          <Label htmlFor="bug-parent-hu">HU padre</Label>
          {(() => {
            const allHuOptions = [
              ...(currentParent && !parentHuOptions.some((o) => o.id === currentParent.id)
                ? [currentParent]
                : []),
              ...parentHuOptions,
            ];
            const selectedId = draftNewParentId ?? bug.parentId;
            const selectedHu = allHuOptions.find((o) => o.id === selectedId);
            return (
              <Select
                value={selectedId !== undefined ? String(selectedId) : ""}
                onValueChange={(v) => {
                  const id = Number(v);
                  onDraftNewParentIdChange(id !== bug.parentId ? id : undefined);
                }}
                disabled={saving}
              >
                <SelectTrigger id="bug-parent-hu" className="w-full">
                  <SelectValue placeholder="Selecciona HU padre">
                    {selectedHu ? selectedHu.title : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allHuOptions.map((hu) => (
                    <SelectItem key={hu.id} value={String(hu.id)}>
                      #{hu.id} {hu.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </section>
      ) : null}
    </>
  );
}
