"use client";

import { useEffect, useMemo, useState } from "react";

import { BugSummaryCard } from "@/components/bugs/bug-summary-card";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import { appToast } from "@/lib/toast";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { cn } from "@/lib/utils";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatInitialCompletedWork(hours: number | undefined): string {
  if (hours === undefined || !Number.isFinite(hours)) return "0";
  return String(hours);
}

function parseCompletedWorkInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export type BugDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bug: AdoWorkItemOptionDto | null;
  bugStates: readonly AdoTaskStateDto[];
  statesLoading?: boolean;
  project: string | null;
  sprintWorkingDays?: readonly SprintWorkingDay[];
  onSaved?: () => void;
};

export function BugDetailSheet({
  open,
  onOpenChange,
  bug,
  bugStates,
  statesLoading = false,
  project,
  sprintWorkingDays = [],
  onSaved,
}: BugDetailSheetProps) {
  const [draftState, setDraftState] = useState("");
  const [draftWorkingDate, setDraftWorkingDate] = useState("");
  const [draftCompletedWork, setDraftCompletedWork] = useState("0");
  const [saving, setSaving] = useState(false);

  const stateOptions = useMemo(() => bugStates.map((state) => state.name), [bugStates]);
  const statesReady = !statesLoading && stateOptions.length > 0;

  const sprintDateBounds = useMemo(() => {
    if (sprintWorkingDays.length === 0) return { min: undefined, max: undefined };
    return {
      min: sprintWorkingDays[0]?.value,
      max: sprintWorkingDays[sprintWorkingDays.length - 1]?.value,
    };
  }, [sprintWorkingDays]);

  useEffect(() => {
    if (bug) {
      setDraftState(bug.state);
      setDraftWorkingDate(bug.workingDate?.trim() || getDefaultWorkingDate());
      setDraftCompletedWork(formatInitialCompletedWork(bug.loggedHours));
    }
  }, [bug?.id, bug?.state, bug?.workingDate, bug?.loggedHours]);

  const initialWorkingDate = bug?.workingDate?.trim() ?? "";
  const initialCompletedWork = bug?.loggedHours ?? 0;

  const parsedCompletedWork = parseCompletedWorkInput(draftCompletedWork);
  const isStateDirty = Boolean(bug && draftState !== bug.state);
  const isDateDirty = Boolean(bug && draftWorkingDate !== initialWorkingDate);
  const isHoursDirty = Boolean(
    bug && parsedCompletedWork !== null && parsedCompletedWork !== initialCompletedWork,
  );
  const isDirty = isStateDirty || isDateDirty || isHoursDirty;
  const hasValidDate = DATE_KEY_PATTERN.test(draftWorkingDate);
  const hasValidHours = parsedCompletedWork !== null;
  const canSave =
    isDirty && hasValidDate && hasValidHours && statesReady && Boolean(project) && !saving;

  async function handleSave() {
    if (!bug || !project || !canSave || parsedCompletedWork === null) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/ado/work-items/${bug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          state: draftState,
          workingDate: draftWorkingDate,
          completedWork: parsedCompletedWork,
        }),
      });
      const payload = (await res.json()) as { error?: string; detail?: string };

      if (!res.ok) {
        const message = [payload.error, payload.detail].filter(Boolean).join(" — ");
        appToast.error(message || "No se pudo guardar el bug.");
        return;
      }

      appToast.success("Bug actualizado.");
      onSaved?.();
      onOpenChange(false);
    } catch {
      appToast.error("No se pudo guardar el bug.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bug</SheetTitle>
          <SheetDescription
            className={cn(bug && "line-clamp-2 text-pretty text-foreground/80")}
            title={bug?.title}
          >
            {bug?.title ?? "Selecciona un bug para ver el detalle."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            {bug ? (
              <>
                <BugSummaryCard item={bug} />

                <section className="space-y-2">
                  <Label htmlFor="bug-working-date">Fecha de trabajo</Label>
                  <DatePicker
                    id="bug-working-date"
                    value={draftWorkingDate}
                    min={sprintDateBounds.min}
                    max={sprintDateBounds.max}
                    disabled={saving}
                    onChange={setDraftWorkingDate}
                  />
                  <p className="text-muted-foreground text-xs">
                    Working Date en Azure DevOps. Obligatoria al cambiar el estado.
                  </p>
                </section>

                <section className="space-y-2">
                  <Label htmlFor="bug-completed-work">Completed Work (horas)</Label>
                  <Input
                    id="bug-completed-work"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={draftCompletedWork}
                    disabled={saving}
                    onChange={(event) => setDraftCompletedWork(event.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Horas registradas en el bug. Obligatorias al cambiar el estado.
                  </p>
                </section>

                <section className="space-y-2">
                  <Label htmlFor="bug-state">Estado</Label>
                  {statesLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={draftState || undefined}
                      onValueChange={(value) => setDraftState(value ?? "")}
                      disabled={!statesReady || saving}
                    >
                      <SelectTrigger id="bug-state" className="w-full">
                        <SelectValue
                          placeholder={
                            statesReady ? "Selecciona un estado" : "Estados no disponibles"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stateOptions.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </section>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Selecciona un bug para ver el detalle.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className={cn("border-t pt-4")}>
          <Button
            type="button"
            className="w-full"
            disabled={!canSave}
            onClick={() => void handleSave()}
          >
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
