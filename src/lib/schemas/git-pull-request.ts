import { z } from "zod";

import { DESCRIPTION_MAX_LENGTH } from "@/lib/pull-requests/copy";
import {
  PULL_REQUEST_LIFECYCLE_STATUSES,
  PULL_REQUEST_VOTE_STATUSES,
} from "@/lib/pull-requests/types";

export const createPullRequestBodySchema = z
  .object({
    project: z.string().trim().min(1, "Indica el proyecto."),
    repository: z.string().trim().min(1, "Indica el repositorio."),
    source: z.string().trim().min(1, "Indica la rama origen."),
    target: z.string().trim().min(1, "Indica la rama destino."),
    title: z.string().trim().min(1, "Indica el título.").max(400),
    description: z.string().max(DESCRIPTION_MAX_LENGTH).optional().default(""),
    optionalReviewers: z.array(z.string().trim().min(1)).default([]),
    requiredReviewers: z.array(z.string().trim().min(1)).default([]),
    tags: z.array(z.string().trim().min(1)).default([]),
    linkedWorkItemIds: z.array(z.coerce.number().int().positive()).default([]),
    autoComplete: z.boolean().default(false),
  })
  .refine((value) => value.source !== value.target, {
    message: "Origen y destino deben ser distintas.",
    path: ["target"],
  });

export type CreatePullRequestBody = z.infer<typeof createPullRequestBodySchema>;

export const createPullRequestResponseSchema = z.object({
  pullRequestId: z.number().int().positive(),
  title: z.string(),
  autoCompleteApplied: z.boolean(),
});

export type CreatePullRequestResponse = z.infer<typeof createPullRequestResponseSchema>;

export const listPullRequestsQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  status: z.enum(PULL_REQUEST_LIFECYCLE_STATUSES).default("active"),
  repository: z.string().trim().optional(),
});

export const pullRequestListItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  status: z.enum(PULL_REQUEST_VOTE_STATUSES),
  lifecycleStatus: z.enum(PULL_REQUEST_LIFECYCLE_STATUSES),
  approvalSummary: z.string().nullable(),
  sourceBranch: z.string(),
  targetBranch: z.string(),
  author: z.string(),
  reviewers: z.array(z.string()),
  commentCount: z.number().int().nonnegative(),
  changedFileCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
  hasConflicts: z.boolean(),
  isMine: z.boolean(),
  needsMyReview: z.boolean(),
  repository: z.string(),
  project: z.string(),
});

export const pullRequestListResponseSchema = z.object({
  items: z.array(pullRequestListItemSchema),
  activeCount: z.number().int().nonnegative(),
});
