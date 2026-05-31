import { z } from "zod";

import { sprintGoalScopeSchema } from "@/lib/schemas/sprint-story-goals";

export const sprintGoalShareQuerySchema = sprintGoalScopeSchema
  .pick({
    project: true,
    team: true,
    sprintPath: true,
  })
  .extend({
    sprintName: z.string().trim().min(1).max(200),
    sprintStartDate: z.string().trim().max(50).optional(),
    sprintFinishDate: z.string().trim().max(50).optional(),
  });

export type SprintGoalShareQueryDto = z.infer<typeof sprintGoalShareQuerySchema>;
