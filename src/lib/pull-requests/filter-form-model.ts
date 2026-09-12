import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { PullRequestFilterState } from "@/lib/pull-requests/types";

export type PullRequestFilterPeople = {
  members: readonly AdoTeamMemberDto[];
  membersLoading: boolean;
  membersError: string | null;
};

export type PullRequestFilterRepos = {
  names: readonly string[];
  loading: boolean;
};

export type PullRequestFiltersFormModel = {
  filters: PullRequestFilterState;
  people: PullRequestFilterPeople;
  repositories: PullRequestFilterRepos;
  onChange: (next: PullRequestFilterState) => void;
};
