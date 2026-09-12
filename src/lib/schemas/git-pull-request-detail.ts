import { z } from "zod";

import { gitFileChangeSchema } from "@/lib/schemas/git-compare";
import {
  PULL_REQUEST_LIFECYCLE_STATUSES,
  PULL_REQUEST_VOTE_STATUSES,
} from "@/lib/pull-requests/types";
import { LINKABLE_WORK_ITEM_KINDS } from "@/lib/work-items/linkable-work-item";

export const pullRequestDetailQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().optional(),
});

const checkSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: z.enum(["pending", "succeeded", "failed"]),
});

const reviewerSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  isRequired: z.boolean(),
  vote: z.number().int(),
});

const workItemSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  type: z.string(),
  kind: z.enum(LINKABLE_WORK_ITEM_KINDS),
  state: z.string(),
});

export const pullRequestDetailSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  lifecycleStatus: z.enum(PULL_REQUEST_LIFECYCLE_STATUSES),
  voteStatus: z.enum(PULL_REQUEST_VOTE_STATUSES),
  approvalSummary: z.string().nullable(),
  sourceBranch: z.string(),
  targetBranch: z.string(),
  repository: z.string(),
  project: z.string(),
  author: z.string(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
  closedBy: z.string().nullable(),
  autoCompleteSetBy: z.string().nullable(),
  hasConflicts: z.boolean(),
  isDraft: z.boolean(),
  isMine: z.boolean(),
  needsMyReview: z.boolean(),
  myVote: z.number().int(),
  mergeCommitId: z.string().nullable(),
  mergeCommitAuthor: z.string().nullable(),
  mergeCommitDate: z.string().nullable(),
  compare: z.object({
    source: z.string(),
    target: z.string(),
  }),
  reviewers: z.array(reviewerSchema),
  labels: z.array(z.string()),
  workItems: z.array(workItemSchema),
  checks: z.array(checkSchema),
  conflictedFiles: z.array(z.string()),
  files: z.array(gitFileChangeSchema),
});

export const updatePullRequestBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("vote"),
    project: z.string().trim().min(1, "Indica el proyecto."),
    repository: z.string().trim().optional(),
    vote: z.number().int(),
  }),
  z.object({
    action: z.literal("abandon"),
    project: z.string().trim().min(1, "Indica el proyecto."),
    repository: z.string().trim().optional(),
  }),
  z.object({
    action: z.literal("reactivate"),
    project: z.string().trim().min(1, "Indica el proyecto."),
    repository: z.string().trim().optional(),
  }),
  z.object({
    action: z.literal("cancelAutoComplete"),
    project: z.string().trim().min(1, "Indica el proyecto."),
    repository: z.string().trim().optional(),
  }),
]);

export type UpdatePullRequestBody = z.infer<typeof updatePullRequestBodySchema>;
