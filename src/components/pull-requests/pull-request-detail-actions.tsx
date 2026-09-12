"use client";

import { MoreHorizontal } from "lucide-react";

import { PullRequestVoteMenu } from "@/components/pull-requests/pull-request-vote-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PullRequestDetail } from "@/lib/pull-requests/detail-types";

export type PullRequestDetailActionsProps = {
  detail: PullRequestDetail;
  pending: boolean;
  onVote: (vote: number) => void;
  onAbandon: () => void;
  onReactivate: () => void;
  onCancelAutoComplete: () => void;
};

export function PullRequestDetailActions({
  detail,
  pending,
  onVote,
  onAbandon,
  onReactivate,
  onCancelAutoComplete,
}: PullRequestDetailActionsProps) {
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
          <DropdownMenuItem
            onClick={() => {
              if (window.confirm("¿Abandonar este pull request?")) onAbandon();
            }}
          >
            Abandonar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
