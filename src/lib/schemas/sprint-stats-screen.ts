import { z } from "zod";

import { sprintGoalScreenQuerySchema } from "@/lib/schemas/sprint-goal-screen";

export const sprintStatsScreenQuerySchema = sprintGoalScreenQuerySchema.extend({
  goalOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  sprintStartDate: z.string().optional(),
  sprintFinishDate: z.string().optional(),
});

export type SprintStatsScreenQueryDto = z.infer<typeof sprintStatsScreenQuerySchema>;
