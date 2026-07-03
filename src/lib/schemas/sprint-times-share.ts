import { z } from "zod";

import { sprintGoalScopeSchema } from "@/lib/schemas/sprint-story-goals";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import { parseSprintTimesShareWeekIndex } from "@/lib/sprints/sprint-times-share-variant";

export const sprintTimesShareVariantSchema = z
  .string()
  .refine(
    (value) =>
      value === "full" || parseSprintTimesShareWeekIndex(value as `week${number}`) !== null,
    "Variante de share inválida.",
  )
  .transform((value) => value as "full" | `week${number}`);

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
