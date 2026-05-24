import { z } from "zod";

export const workItemFiltersSchema = z.object({
  search: z.string(),
  assignedToMe: z.boolean(),
  state: z.string(),
});

export type WorkItemFilters = z.infer<typeof workItemFiltersSchema>;

export const DEFAULT_WORK_ITEM_FILTERS: WorkItemFilters = {
  search: "",
  assignedToMe: false,
  state: "",
};
