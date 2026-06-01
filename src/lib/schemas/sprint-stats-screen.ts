import { z } from "zod";

import { sprintGoalScreenQuerySchema } from "@/lib/schemas/sprint-goal-screen";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";

export const sprintStatsScreenQuerySchema = sprintGoalScreenQuerySchema.extend({
  goalOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) =>
      value === undefined ? SPRINT_STATS_GOAL_ONLY_DEFAULT : value === "true",
    ),
  sprintStartDate: z.string().optional(),
  sprintFinishDate: z.string().optional(),
});

export type SprintStatsScreenQueryDto = z.infer<typeof sprintStatsScreenQuerySchema>;
