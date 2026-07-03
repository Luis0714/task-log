import { z } from "zod";

export const sprintSnapshotQuerySchema = z.object({
  project: z.string().trim().min(1).max(200),
  team: z.string().trim().min(1).max(200),
  sprintPath: z.string().trim().min(1).max(500),
});

export const finalizeSprintSnapshotBodySchema = sprintSnapshotQuerySchema.extend({
  source: z.enum(["manual", "auto"]).optional().default("manual"),
  sprintName: z.string().trim().max(200).optional(),
  sprintStartDate: z.string().trim().max(40).optional(),
  sprintFinishDate: z.string().trim().max(40).optional(),
});

export type SprintSnapshotQueryDto = z.infer<typeof sprintSnapshotQuerySchema>;
export type FinalizeSprintSnapshotBodyDto = z.infer<typeof finalizeSprintSnapshotBodySchema>;
