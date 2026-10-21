import { z } from "zod";

import { REVIEW_TIME_STATUSES, READY_STATES } from "@/lib/review-times/types";

export const reviewTimesQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  monthKeys: z.array(z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido (YYYY-MM)")).min(1).max(3),
  repositories: z.array(z.string().trim().min(1)).default([]),
});

export type ReviewTimesQuery = z.infer<typeof reviewTimesQuerySchema>;

export const reviewTimeRowSchema = z.object({
  pullRequestId: z.number(),
  title: z.string(),
  repository: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  reviewerId: z.string().nullable(),
  reviewerName: z.string(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  readyAt: z.string().nullable(),
  readyState: z.enum(READY_STATES),
  isDraft: z.boolean(),
  isCompleted: z.boolean(),
  status: z.enum(REVIEW_TIME_STATUSES),
});

export const reviewTimesResponseSchema = z.object({
  rows: z.array(reviewTimeRowSchema),
  truncated: z.boolean(),
  currentUserId: z.string().nullable(),
  monthKeys: z.array(z.string()).min(1),
  organization: z.string(),
});

export type ReviewTimesResponse = z.infer<typeof reviewTimesResponseSchema>;
