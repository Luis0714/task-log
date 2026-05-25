import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type SprintItemsDataSnapshot = {
  items: AdoWorkItemOptionDto[];
  itemStates: AdoTaskStateDto[];
  teamMembers: Awaited<
    ReturnType<typeof import("@/lib/azure-devops/work-item-type-states").listTeamMembers>
  >;
  nonWorkingDates: string[];
  error: string | null;
};
