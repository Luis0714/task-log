import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { PullRequestFilterState } from "@/lib/pull-requests/types";

export type PullRequestFilterPeople = {
  members: readonly AdoTeamMemberDto[];
  membersLoading: boolean;
  membersError: string | null;
};

export type PullRequestFiltersFormModel = {
  filters: PullRequestFilterState;
  people: PullRequestFilterPeople;
  onChange: (next: PullRequestFilterState) => void;
};
