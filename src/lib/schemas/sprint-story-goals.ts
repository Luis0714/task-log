import { z } from "zod";

export const sprintGoalScopeSchema = z.object({
  organization: z.string().trim().min(1),
  project: z.string().trim().min(1).max(200),
  team: z.string().trim().min(1).max(200),
  sprintPath: z.string().trim().min(1).max(500),
});

export const sprintStoryGoalDraftSchema = z.object({
  workItemId: z.number().int().positive(),
  includedInGoal: z.boolean().optional().default(true),
  targetStateName: z.string().trim().max(100).optional().default(""),
  targetTacTagName: z.string().trim().max(200).optional().default(""),
});

export const sprintStoryGoalsPutBodySchema = z.object({
  project: z.string().trim().min(1).max(200),
  team: z.string().trim().min(1).max(200),
  sprintPath: z.string().trim().min(1).max(500),
  generalObjective: z.string().trim().max(2000).optional().default(""),
  goals: z.array(sprintStoryGoalDraftSchema),
});

export type SprintGoalScopeDto = z.infer<typeof sprintGoalScopeSchema>;
export type SprintStoryGoalDraftDto = z.infer<typeof sprintStoryGoalDraftSchema>;
