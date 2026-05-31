import {
  sortDataTableRows,
  type DataTableSortSpec,
} from "@/lib/data-table/data-table-sort";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";

export type SprintStoryGoalSortField = "id" | "title" | "state";

export const SPRINT_STORY_GOAL_SORT_OPTIONS = [
  { value: "id", label: "ID" },
  { value: "title", label: "Título" },
  { value: "state", label: "Estado" },
] as const satisfies readonly { value: SprintStoryGoalSortField; label: string }[];

export const DEFAULT_SPRINT_STORY_GOAL_SORT: DataTableSortSpec<SprintStoryGoalSortField> = {
  field: "id",
  direction: "asc",
};

const sprintStoryGoalSortAccessors = {
  id: (row: SprintStoryGoalRowModel) => row.workItem.id,
  title: (row: SprintStoryGoalRowModel) => row.workItem.title,
  state: (row: SprintStoryGoalRowModel) => row.workItem.state ?? "",
} as const;

export function sortSprintStoryGoalRows(
  rows: readonly SprintStoryGoalRowModel[],
  spec: DataTableSortSpec<SprintStoryGoalSortField> | null,
): SprintStoryGoalRowModel[] {
  return sortDataTableRows(rows, spec, sprintStoryGoalSortAccessors);
}
