import { z } from "zod";

export const adoSprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  timeFrame: z.enum(["past", "current", "future"]).optional(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
});

export const adoWorkItemOptionSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  type: z.string(),
  state: z.string(),
});

export const adoSprintsResponseSchema = z.object({
  sprints: z.array(adoSprintSchema),
});

export const adoWorkItemsResponseSchema = z.object({
  workItems: z.array(adoWorkItemOptionSchema),
});

export type AdoSprintDto = z.infer<typeof adoSprintSchema>;
export type AdoWorkItemOptionDto = z.infer<typeof adoWorkItemOptionSchema>;
