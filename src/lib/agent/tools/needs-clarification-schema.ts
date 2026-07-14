import { z } from "zod";

export const clarificationQuestionSchema = z.string().min(1).max(500);

export const clarificationCandidateSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  state: z.string().min(1).max(100).optional(),
});
