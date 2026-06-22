"use client";

import { BugDetailSheetBody } from "@/components/bugs/bug-detail-sheet-body";
import { DeleteWorkItemDialog } from "@/components/work-items/delete-work-item-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBugDetailForm } from "@/hooks/bugs/use-bug-detail-form";
import { appToast } from "@/lib/toast";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

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
  const form = useBugDetailForm({
    bug,
    bugStates,
    statesLoading,
    project,
    sprintWorkingDays,
    onSaved,
    onClose: () => onOpenChange(false),
  });

  async function handleSave() {
    const result = await form.save();
    if (result.ok) {
      appToast.success("Bug actualizado.");
      return;
    }
    appToast.error(result.message);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bug</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex flex-col gap-6 pb-4">
            <BugDetailSheetBody
              bug={bug}
              project={project}
              draftState={form.draftState}
              onDraftStateChange={form.setDraftState}
              draftWorkingDate={form.draftWorkingDate}
              onDraftWorkingDateChange={form.setDraftWorkingDate}
              draftCompletedWork={form.draftCompletedWork}
              onDraftCompletedWorkChange={form.setDraftCompletedWork}
              stateOptions={form.stateOptions}
              statesReady={form.statesReady}
              statesLoading={form.statesLoading}
              sprintDateBounds={form.sprintDateBounds}
              saving={form.saving}
            />
          </div>
        </div>

        <SheetFooter className={cn("border-t flex-row gap-2")}>
          {bug && project ? (
            <DeleteWorkItemDialog
              workItemId={bug.id}
              project={project}
              itemLabel="bug"
              disabled={form.saving}
              className="flex-1"
              onDeleted={() => {
                onSaved?.();
                onOpenChange(false);
              }}
            />
          ) : null}
          <Button
            type="button"
            className="flex-1"
            disabled={!form.canSave}
            onClick={() => void handleSave()}
          >
            {form.saving ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
