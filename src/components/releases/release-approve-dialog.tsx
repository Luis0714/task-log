"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ReleaseBranchLabel } from "@/components/releases/release-branch-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RELEASE_APPROVE_CONFIRM,
  RELEASE_APPROVE_DESCRIPTION,
  RELEASE_APPROVE_TITLE,
} from "@/lib/releases/copy";
import type { ReleaseApprovalTarget } from "@/lib/releases/types";
import { PersonLabel } from "@/components/team-members/person-label";

export type ReleaseApproveDialogProps = {
  target: ReleaseApprovalTarget | null;
  onConfirm: (approvalId: number, environment: string) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
};

export function ReleaseApproveDialog({
  target,
  onConfirm,
  onOpenChange,
}: ReleaseApproveDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const open = target !== null;

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  async function handleConfirm() {
    if (!target || submitting) return;
    setSubmitting(true);
    const ok = await onConfirm(target.approvalId, target.environmentName);
    setSubmitting(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{RELEASE_APPROVE_TITLE}</DialogTitle>
          {target ? (
            <p className="text-muted-foreground text-xs font-medium">
              {target.environmentShortName} · {target.releaseName}
            </p>
          ) : null}
          <DialogDescription>
            {target
              ? RELEASE_APPROVE_DESCRIPTION(target.environmentName)
              : ""}
          </DialogDescription>
        </DialogHeader>

        {target ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <PersonLabel name={target.createdBy} className="text-muted-foreground" />
            <ReleaseBranchLabel branch={target.branch} />
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={submitting} />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting || !target}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            {RELEASE_APPROVE_CONFIRM}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
