import { z } from "zod";

import { PULL_REQUEST_THREAD_STATUSES } from "@/lib/pull-requests/thread-types";

export const pullRequestThreadsQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().optional(),
});

const threadCommentSchema = z.object({
  id: z.number().int().positive(),
  author: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const pullRequestThreadSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(PULL_REQUEST_THREAD_STATUSES),
  filePath: z.string().nullable(),
  line: z.number().int().positive().nullable(),
  lineSide: z.enum(["left", "right"]).nullable(),
  comments: z.array(threadCommentSchema),
});

export const pullRequestThreadsResponseSchema = z.object({
  threads: z.array(pullRequestThreadSchema),
});

export const createPullRequestThreadBodySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().optional(),
  content: z.string().trim().min(1, "Escribe un comentario."),
  filePath: z.string().trim().min(1).optional(),
  line: z.number().int().positive().optional(),
  lineSide: z.enum(["left", "right"]).optional(),
});

export const replyPullRequestThreadBodySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().optional(),
  content: z.string().trim().min(1, "Escribe una respuesta."),
  parentCommentId: z.number().int().positive().optional(),
});

export const patchPullRequestThreadBodySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  repository: z.string().trim().optional(),
  status: z.enum(PULL_REQUEST_THREAD_STATUSES),
});
