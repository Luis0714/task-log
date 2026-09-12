export const PULL_REQUEST_VOTE = {
  approved: 10,
  approvedWithSuggestions: 5,
  none: 0,
  waiting: -5,
  rejected: -10,
} as const;

export type PullRequestVoteValue =
  (typeof PULL_REQUEST_VOTE)[keyof typeof PULL_REQUEST_VOTE];

export const PULL_REQUEST_VOTE_ACTIONS = [
  {
    vote: PULL_REQUEST_VOTE.approved,
    label: "Aprobar",
  },
  {
    vote: PULL_REQUEST_VOTE.approvedWithSuggestions,
    label: "Aprobar con sugerencias",
  },
  {
    vote: PULL_REQUEST_VOTE.waiting,
    label: "Esperar al autor",
  },
  {
    vote: PULL_REQUEST_VOTE.rejected,
    label: "Rechazar",
  },
  {
    vote: PULL_REQUEST_VOTE.none,
    label: "Restablecer voto",
  },
] as const;

export function isApprovedVote(vote: number): boolean {
  return vote >= PULL_REQUEST_VOTE.approvedWithSuggestions;
}

export function reviewerVoteLabel(vote: number): string {
  if (vote >= PULL_REQUEST_VOTE.approved) return "Aprobado";
  if (vote >= PULL_REQUEST_VOTE.approvedWithSuggestions) {
    return "Aprobado con sugerencias";
  }
  if (vote === PULL_REQUEST_VOTE.waiting) return "Esperando al autor";
  if (vote <= PULL_REQUEST_VOTE.rejected) return "Rechazado";
  return "Sin revisión";
}
