"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PULL_REQUEST_VOTE, PULL_REQUEST_VOTE_ACTIONS } from "@/lib/pull-requests/vote";

export type PullRequestVoteMenuProps = {
  currentVote: number;
  disabled?: boolean;
  onVote: (vote: number) => void;
};

function currentVoteLabel(vote: number): string {
  if (vote >= PULL_REQUEST_VOTE.approvedWithSuggestions) return "Aprobado";
  if (vote === PULL_REQUEST_VOTE.waiting) return "Esperando";
  if (vote <= PULL_REQUEST_VOTE.rejected) return "Rechazado";
  return "Aprobar";
}

export function PullRequestVoteMenu({
  currentVote,
  disabled,
  onVote,
}: PullRequestVoteMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button type="button" variant="outline" disabled={disabled} />}
      >
        {currentVoteLabel(currentVote)}
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {PULL_REQUEST_VOTE_ACTIONS.map((option) => (
          <div key={option.vote}>
            {option.vote === PULL_REQUEST_VOTE.none ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              onClick={() => onVote(option.vote)}
              className="justify-between"
            >
              {option.label}
              {currentVote === option.vote && option.vote !== PULL_REQUEST_VOTE.none ? (
                <Check className="size-3.5" />
              ) : null}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
