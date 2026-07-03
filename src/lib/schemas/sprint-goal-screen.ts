import type { z } from "zod";

import { sprintGoalScopeSchema } from "@/lib/schemas/sprint-story-goals";

export const sprintGoalScreenQuerySchema = sprintGoalScopeSchema.pick({
  project: true,
  team: true,
  sprintPath: true,
});

export type SprintGoalScreenQueryDto = z.infer<typeof sprintGoalScreenQuerySchema>;
