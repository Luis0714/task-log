import { z } from "zod";

import { RELEASE_STAGE_STATUSES } from "@/lib/releases/types";

export const listReleasesQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  definitionId: z.coerce.number().int().positive().optional(),
});

const releaseStageSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  shortName: z.string(),
  status: z.enum(RELEASE_STAGE_STATUSES),
  approvalId: z.number().int().positive().nullable(),
  canApprove: z.boolean(),
  assignedToMe: z.boolean(),
});

export const releaseListItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  definitionName: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  branch: z.string(),
  pendingCount: z.number().int().nonnegative(),
  stages: z.array(releaseStageSchema),
});

export const releaseDefinitionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

export const releaseListResponseSchema = z.object({
  definitions: z.array(releaseDefinitionSchema),
  items: z.array(releaseListItemSchema),
  pendingCount: z.number().int().nonnegative(),
  definitionId: z.number().int().positive().nullable(),
});

export const approveReleaseBodySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  approvalId: z.number().int().positive(),
});
