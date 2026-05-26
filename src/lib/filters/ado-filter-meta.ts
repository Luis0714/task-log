import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type AdoFilterMeta = {
  members: AdoTeamMemberDto[];
  states: AdoTaskStateDto[];
};

export const EMPTY_ADO_FILTER_META: AdoFilterMeta = { members: [], states: [] };
