import { z } from "zod";

import { sprintGoalScopeSchema } from "@/lib/schemas/sprint-story-goals";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";

export const sprintTimesShareVariantSchema = z.enum(["full", "week1", "week2"]);

export const sprintTimesShareQuerySchema = sprintGoalScopeSchema
  .pick({
    project: true,
    team: true,
    sprintPath: true,
  })
  .extend({
    sprintName: z.string().trim().min(1).max(200),
    sprintStartDate: z.string().trim().max(50).optional(),
    sprintFinishDate: z.string().trim().max(50).optional(),
    goalOnly: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) =>
        value === undefined ? SPRINT_STATS_GOAL_ONLY_DEFAULT : value === "true",
      ),
    variant: sprintTimesShareVariantSchema.default("full"),
  });

export type SprintTimesShareQueryDto = z.infer<typeof sprintTimesShareQuerySchema>;
