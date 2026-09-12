"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { PullRequestVoteMenu } from "@/components/pull-requests/pull-request-vote-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailActionsProps = Readonly<{
  detail: PullRequestDetail;
  pending: boolean;
  onVote: (vote: number) => void;
  onAbandon: () => Promise<boolean>;
  onReactivate: () => void;
  onCancelAutoComplete: () => void;
}>;

export function PullRequestDetailActions({
  detail,
  pending,
  onVote,
  onAbandon,
  onReactivate,
  onCancelAutoComplete,
}: PullRequestDetailActionsProps) {
  const [abandonOpen, setAbandonOpen] = useState(false);

  if (detail.lifecycleStatus === "completed") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled title="Aún no disponible">
          Cherry-pick
        </Button>
        <Button type="button" variant="outline" disabled title="Aún no disponible">
          Revertir
        </Button>
      </div>
    );
  }

  if (detail.lifecycleStatus === "abandoned") {
    return (
      <Button type="button" disabled={pending} onClick={onReactivate}>
        Reactivar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <PullRequestVoteMenu currentVote={detail.myVote} disabled={pending} onVote={onVote} />
      {detail.autoCompleteSetBy ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancelAutoComplete}
        >
          Cancelar autocompletado
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          render={<Button type="button" variant="outline" size="icon" disabled={pending} />}
        >
          <MoreHorizontal />
          <span className="sr-only">Más acciones</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAbandonOpen(true)}>
            Abandonar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={abandonOpen}
        onOpenChange={setAbandonOpen}
        title="Abandonar pull request"
        description="El pull request se marcará como abandonado en Azure DevOps. Podrás reactivarlo después."
        confirmLabel="Abandonar"
        confirmVariant="destructive"
        onConfirm={onAbandon}
      />
    </div>
  );
}
